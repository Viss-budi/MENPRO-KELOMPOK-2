const slugify = require('slugify');
const db = require('../config/db');
const { cleanBody, clamp, escapeLike } = require('../utils/crud');
const validateDepartment = require('../utils/validators/department');
const { scheduleCleanup } = require('../utils/imageCleanup');

const FIELDS = ['name', 'description', 'logo_url', 'sort_order', 'is_active']; // slug tidak bisa dikirim: dibuat dari nama
const HAS_MEMBERS = 'Departemen masih punya anggota. Pindahkan atau hapus anggotanya, atau nonaktifkan departemen.';

const bad = (res, message) => res.status(400).json({ success: false, message });
const badFields = (res, errors) => res.status(400).json({ success: false, message: errors[0].message, errors });
const notFound = (res, message = 'Data tidak ditemukan') => res.status(404).json({ success: false, message });
const conflict = (res, message) => res.status(409).json({ success: false, message });

const normalize = (data) => {
  for (const f of ['description', 'logo_url']) if (data[f] === '') data[f] = null;
  for (const f of ['sort_order', 'is_active']) {
    if (typeof data[f] === 'string' && /^-?\d+$/.test(data[f])) data[f] = Number(data[f]);
  }
  return data;
};

const COLS = `d.id, d.name, d.slug, d.description, d.logo_url, d.sort_order, d.is_active,
  (SELECT COUNT(*) FROM members m WHERE m.department_id = d.id) AS member_count, d.created_at, d.updated_at`;

// ---------- publik ----------
// GET /departments/:slug
const getBySlug = async (req, res) => {
  const [[department]] = await db.query(
    'SELECT id, name, slug, description, logo_url FROM departments WHERE slug = ? AND is_active = 1',
    [req.params.slug]
  );
  if (!department) return notFound(res, 'Departemen tidak ditemukan');

  const [members] = await db.query(
    `SELECT id, name, position, photo_url FROM members
     WHERE department_id = ? AND is_active = 1 ORDER BY sort_order, id`,
    [department.id]
  );
  res.json({ success: true, data: { department, members } });
};

// ---------- admin ----------
const listAll = async (req, res) => {
  const page = clamp(req.query.page, 1, 100000);
  const perPage = clamp(req.query.per_page, 10, 100);
  const where = [];
  const params = [];
  const q = String(req.query.q ?? '').trim().slice(0, 100);
  if (q) { where.push('d.name LIKE ?'); params.push(`%${escapeLike(q)}%`); }
  for (const f of ['is_active']) {
    const v = req.query[f];
    if (v !== undefined && v !== '') { where.push(`d.${f} = ?`); params.push(String(v)); }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM departments d ${whereSql}`, params);
  const [rows] = await db.query(
    `SELECT ${COLS} FROM departments d ${whereSql} ORDER BY d.sort_order ASC, d.id ASC LIMIT ? OFFSET ?`,
    [...params, perPage, (page - 1) * perPage]
  );
  res.json({ success: true, data: rows, meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } });
};

const getById = async (req, res) => {
  const [[row]] = await db.query(`SELECT ${COLS} FROM departments d WHERE d.id = ?`, [req.params.id]);
  if (!row) return notFound(res);
  res.json({ success: true, data: row });
};

const create = async (req, res) => {
  const { data, invalid } = cleanBody(req.body, FIELDS);
  if (invalid) return bad(res, `Tipe data tidak valid pada field: ${invalid}`);
  normalize(data);
  const missing = ['name'].filter((f) => data[f] === undefined || data[f] === '' || data[f] === null);
  if (missing.length) return bad(res, `Field wajib diisi: ${missing.join(', ')}`);
  const problems = validateDepartment(data);
  if (problems.length) return badFields(res, problems);

  data.slug = slugify(data.name, { lower: true, strict: true });
  if (!data.slug) return badFields(res, [{ field: 'name', message: 'Nama departemen harus memuat huruf atau angka' }]);

  // LOWER(): perbandingan nama tidak boleh bergantung pada collation database (TiDB case-sensitive, MariaDB tidak)
  const [[dup]] = await db.query('SELECT id FROM departments WHERE slug = ? OR LOWER(name) = LOWER(?) LIMIT 1', [data.slug, data.name]);
  if (dup) return conflict(res, 'Departemen dengan nama itu sudah ada');

  const [r] = await db.query('INSERT INTO departments SET ?', [data]);
  res.status(201).json({ success: true, message: 'Berhasil ditambahkan', data: { id: r.insertId, slug: data.slug } });
};

const update = async (req, res) => {
  const [[row]] = await db.query('SELECT id, logo_url FROM departments WHERE id = ?', [req.params.id]);
  if (!row) return notFound(res);

  const { data, invalid } = cleanBody(req.body, FIELDS);
  if (invalid) return bad(res, `Tipe data tidak valid pada field: ${invalid}`);
  normalize(data);
  if (!Object.keys(data).length) return bad(res, 'Tidak ada field yang diubah');
  if ('name' in data && (data.name === '' || data.name === null)) return bad(res, 'Field tidak boleh kosong: name');
  const problems = validateDepartment(data);
  if (problems.length) return badFields(res, problems);

  if ('name' in data) {
    // bentrok jika nama sama (tanpa membedakan huruf besar atau kecil) atau slug dari nama baru sama dengan slug departemen lain
    const newSlug = slugify(data.name, { lower: true, strict: true });
    if (!newSlug) return badFields(res, [{ field: 'name', message: 'Nama departemen harus memuat huruf atau angka' }]);
    const [[dup]] = await db.query(
      'SELECT id FROM departments WHERE id <> ? AND (LOWER(name) = LOWER(?) OR slug = ?) LIMIT 1',
      [row.id, data.name, newSlug]
    );
    if (dup) return conflict(res, 'Departemen dengan nama itu sudah ada');
    data.slug = newSlug; // slug mengikuti nama; FE selalu mengambil slug dari GET /structure
  }
  await db.query('UPDATE departments SET ? WHERE id = ?', [data, req.params.id]);
  if ('logo_url' in data && row.logo_url && row.logo_url !== data.logo_url) scheduleCleanup([row.logo_url]); // logo lama
  res.json({ success: true, message: 'Berhasil diperbarui' });
};

// DELETE /departments/:id            -> ditolak 409 jika masih punya anggota
// DELETE /departments/:id?with_members=1 -> departemen dan SEMUA anggotanya dihapus dalam satu transaksi
const remove = async (req, res) => {
  const withMembers = ['1', 'true'].includes(String(req.query.with_members ?? '').toLowerCase());
  const [[row]] = await db.query('SELECT id, logo_url FROM departments WHERE id = ?', [req.params.id]);
  if (!row) return notFound(res);
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM members WHERE department_id = ?', [row.id]);
  if (n > 0 && !withMembers) return conflict(res, HAS_MEMBERS);

  let membersDeleted = 0;
  const urls = [row.logo_url];
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    if (n > 0) {
      const [photos] = await conn.query('SELECT photo_url FROM members WHERE department_id = ?', [row.id]);
      const [d] = await conn.query('DELETE FROM members WHERE department_id = ?', [row.id]);
      membersDeleted = d.affectedRows;
      urls.push(...photos.map((p) => p.photo_url));
    }
    await conn.query('DELETE FROM departments WHERE id = ?', [row.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    if (err.errno === 1451) return conflict(res, HAS_MEMBERS); // ada anggota baru masuk di antara dua query
    throw err;
  } finally {
    conn.release();
  }
  scheduleCleanup(urls); // logo dan foto anggota dihapus dari Cloudinary (jika tidak dipakai baris lain)
  res.json({ success: true, message: 'Berhasil dihapus', data: { members_deleted: membersDeleted } });
};

module.exports = { getBySlug, listAll, getById, create, update, remove };
