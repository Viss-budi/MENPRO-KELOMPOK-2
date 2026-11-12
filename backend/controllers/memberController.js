const db = require('../config/db');
const { cleanBody, clamp, escapeLike } = require('../utils/crud');
const validateMember = require('../utils/validators/member');
const { PLACEHOLDER_NAME } = require('../utils/bph');
const { scheduleCleanup } = require('../utils/imageCleanup');

const FIELDS = ['name', 'position', 'group_name', 'department_id', 'photo_url', 'sort_order', 'is_active'];
const REQUIRED = ['name', 'position'];
// Posisi utama BPH (is_core = 1): hanya ini yang boleh diubah
const CORE_EDITABLE = ['name', 'photo_url', 'is_active'];

const bad = (res, message) => res.status(400).json({ success: false, message });
const badFields = (res, errors) => res.status(400).json({ success: false, message: errors[0].message, errors });
const notFound = (res) => res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
const conflict = (res, message) => res.status(409).json({ success: false, message });

// Rapikan nilai: string kosong -> null, angka berbentuk teks -> angka
const normalize = (data) => {
  for (const f of ['group_name', 'photo_url']) if (data[f] === '') data[f] = null;
  if (data.department_id === '') data.department_id = null;
  for (const f of ['department_id', 'sort_order', 'is_active']) {
    if (typeof data[f] === 'string' && /^-?\d+$/.test(data[f])) data[f] = Number(data[f]);
  }
  return data;
};

// Aturan lintas field dan lintas tabel (butuh data lain / database)
const relationErrors = async (m) => {
  const errors = [];
  if (m.department_id != null) {
    const [[dept]] = await db.query('SELECT id FROM departments WHERE id = ?', [m.department_id]);
    if (!dept) errors.push({ field: 'department_id', message: 'Departemen tidak ditemukan' });
    if (m.group_name) errors.push({ field: 'group_name', message: 'group_name hanya untuk pengurus inti (tanpa departemen)' });
  }
  return errors;
};

// Publik: pengurus aktif. ?department_id=3
const getPublic = async (req, res) => {
  const where = ['is_active = 1'];
  const params = [];
  if (req.query.department_id) {
    if (!/^\d+$/.test(String(req.query.department_id))) return bad(res, 'department_id harus berupa angka');
    where.push('department_id = ?'); params.push(Number(req.query.department_id));
  }
  const [rows] = await db.query(
    `SELECT id, name, position, group_name, department_id, photo_url
     FROM members WHERE ${where.join(' AND ')} ORDER BY sort_order, id`,
    params
  );
  res.json({ success: true, data: rows });
};

const ADMIN_COLS = `m.id, m.name, m.position, m.group_name, m.department_id, d.name AS department_name,
  m.photo_url, m.sort_order, m.is_active, m.is_core, m.created_at, m.updated_at`;
const ADMIN_FROM = 'FROM members m LEFT JOIN departments d ON d.id = m.department_id';

// GET /admin/all?page=&per_page=&q=&department_id=&is_active=&is_core=&group_name=
const listAll = async (req, res) => {
  const page = clamp(req.query.page, 1, 100000);
  const perPage = clamp(req.query.per_page, 10, 100);
  const where = [];
  const params = [];

  const q = String(req.query.q ?? '').trim().slice(0, 100);
  if (q) {
    where.push('(m.name LIKE ? OR m.position LIKE ? OR d.name LIKE ?)');
    params.push(...Array(3).fill(`%${escapeLike(q)}%`));
  }
  for (const f of ['department_id', 'is_active', 'is_core', 'group_name']) {
    const v = req.query[f];
    if (v !== undefined && v !== '') { where.push(`m.${f} = ?`); params.push(String(v)); }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${ADMIN_FROM} ${whereSql}`, params);
  const [rows] = await db.query(
    `SELECT ${ADMIN_COLS} ${ADMIN_FROM} ${whereSql} ORDER BY m.sort_order ASC, m.id ASC LIMIT ? OFFSET ?`,
    [...params, perPage, (page - 1) * perPage]
  );
  res.json({ success: true, data: rows, meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) } });
};

const getById = async (req, res) => {
  const [[row]] = await db.query(`SELECT ${ADMIN_COLS} ${ADMIN_FROM} WHERE m.id = ?`, [req.params.id]);
  if (!row) return notFound(res);
  res.json({ success: true, data: row });
};

const create = async (req, res) => {
  const { data, invalid } = cleanBody(req.body, FIELDS);
  if (invalid) return bad(res, `Tipe data tidak valid pada field: ${invalid}`);
  normalize(data);
  const missing = REQUIRED.filter((f) => data[f] === undefined || data[f] === '' || data[f] === null);
  if (missing.length) return bad(res, `Field wajib diisi: ${missing.join(', ')}`);

  const problems = validateMember(data);
  if (!problems.length) problems.push(...(await relationErrors(data)));
  if (problems.length) return badFields(res, problems);

  const [r] = await db.query('INSERT INTO members SET ?', [data]);
  res.status(201).json({ success: true, message: 'Berhasil ditambahkan', data: { id: r.insertId } });
};

const update = async (req, res) => {
  const [[row]] = await db.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
  if (!row) return notFound(res);

  const { data, invalid } = cleanBody(req.body, FIELDS);
  if (invalid) return bad(res, `Tipe data tidak valid pada field: ${invalid}`);
  normalize(data);
  if (!Object.keys(data).length) return bad(res, 'Tidak ada field yang diubah');
  for (const f of REQUIRED) {
    if (f in data && (data[f] === '' || data[f] === null)) return bad(res, `Field tidak boleh kosong: ${f}`);
  }

  const problems = validateMember(data);
  if (problems.length) return badFields(res, problems);

  if (row.is_core) {
    const locked = Object.keys(data).filter((k) => !CORE_EDITABLE.includes(k) && String(data[k] ?? '') !== String(row[k] ?? ''));
    if (locked.length) return conflict(res, 'Posisi utama BPH hanya bisa diubah nama, foto, dan statusnya');
  } else if (['department_id', 'group_name'].some((k) => k in data)) {
    const rel = await relationErrors({ ...row, ...data });
    if (rel.length) return badFields(res, rel);
  }

  // Slot BPH baru dibuat nonaktif dengan nama placeholder. Begitu nama asli diisi, slot otomatis aktif
  // (kecuali admin mengirim is_active secara eksplisit).
  if (row.is_core && row.name === PLACEHOLDER_NAME && typeof data.name === 'string'
      && data.name !== PLACEHOLDER_NAME && data.is_active === undefined) {
    data.is_active = 1;
  }

  await db.query('UPDATE members SET ? WHERE id = ?', [data, req.params.id]);
  if ('photo_url' in data && row.photo_url && row.photo_url !== data.photo_url) scheduleCleanup([row.photo_url]); // foto lama
  res.json({ success: true, message: 'Berhasil diperbarui' });
};

const remove = async (req, res) => {
  const [[row]] = await db.query('SELECT id, is_core, photo_url FROM members WHERE id = ?', [req.params.id]);
  if (!row) return notFound(res);
  if (row.is_core) return conflict(res, 'Posisi utama BPH tidak bisa dihapus');
  await db.query('DELETE FROM members WHERE id = ?', [req.params.id]);
  scheduleCleanup([row.photo_url]);
  res.json({ success: true, message: 'Berhasil dihapus' });
};

module.exports = { getPublic, listAll, getById, create, update, remove };
