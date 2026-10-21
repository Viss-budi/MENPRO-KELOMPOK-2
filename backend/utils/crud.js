const db = require('../config/db');
const slugify = require('slugify');
const { hasColumn } = require('./schema');

const clamp = (v, def, max) => Math.min(Math.max(parseInt(v) || def, 1), max);
const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');
const isPrimitive = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);

// Ambil hanya field yang diizinkan; nilai objek/array ditolak (cegah SQL aneh & mass-assignment)
const cleanBody = (body = {}, fields) => {
  const data = {};
  for (const f of fields) {
    if (body[f] === undefined) continue;
    if (!isPrimitive(body[f])) return { invalid: f };
    data[f] = typeof body[f] === 'string' ? body[f].trim() : body[f];
  }
  return { data };
};

const bad = (res, message) => res.status(400).json({ success: false, message });
const notFound = (res) => res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

// Pabrik CRUD admin: dipakai hero_slides, events, news, members
const makeCrud = ({
  table, fields, required = [], slugFrom, ownerField,
  searchFields = [], filterFields = [], orderBy = 'id DESC',
}) => ({
  // GET /admin/all?page=1&per_page=10&q=kata&category=...
  listAll: async (req, res) => {
    const page = clamp(req.query.page, 1, 100000);
    const perPage = clamp(req.query.per_page, 10, 100);
    const where = [];
    const params = [];

    const q = String(req.query.q ?? '').trim().slice(0, 100);
    if (q && searchFields.length) {
      where.push('(' + searchFields.map((f) => `${f} LIKE ?`).join(' OR ') + ')');
      searchFields.forEach(() => params.push(`%${escapeLike(q)}%`));
    }
    for (const f of filterFields) {
      const v = req.query[f];
      if (v !== undefined && v !== '') { where.push(`${f} = ?`); params.push(String(v)); }
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM ${table} ${whereSql}`, params);
    const [rows] = await db.query(
      `SELECT * FROM ${table} ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, perPage, (page - 1) * perPage]
    );
    res.json({
      success: true,
      data: rows,
      meta: { page, per_page: perPage, total, total_pages: Math.ceil(total / perPage) },
    });
  },

  // GET /admin/:id (untuk mengisi form edit, termasuk data yang belum dipublikasikan)
  getById: async (req, res) => {
    const [[row]] = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!row) return notFound(res);
    res.json({ success: true, data: row });
  },

  create: async (req, res) => {
    const { data, invalid } = cleanBody(req.body, fields);
    if (invalid) return bad(res, `Tipe data tidak valid pada field: ${invalid}`);
    const missing = required.filter((f) => data[f] === undefined || data[f] === '' || data[f] === null);
    if (missing.length) return bad(res, `Field wajib diisi: ${missing.join(', ')}`);

    if (slugFrom) {
      data.slug = `${slugify(String(data[slugFrom]), { lower: true, strict: true })}-${Date.now().toString(36)}`;
    }
    if (ownerField && hasColumn(table, ownerField)) data[ownerField] = req.user.id; // dicatat dari sesi login, bukan dari input client

    const [r] = await db.query(`INSERT INTO ${table} SET ?`, [data]);
    res.status(201).json({ success: true, message: 'Berhasil ditambahkan', data: { id: r.insertId, slug: data.slug } });
  },

  update: async (req, res) => {
    const { data, invalid } = cleanBody(req.body, fields);
    if (invalid) return bad(res, `Tipe data tidak valid pada field: ${invalid}`);
    if (!Object.keys(data).length) return bad(res, 'Tidak ada field yang diubah');
    for (const f of required) {
      if (f in data && (data[f] === '' || data[f] === null)) return bad(res, `Field tidak boleh kosong: ${f}`);
    }

    const [r] = await db.query(`UPDATE ${table} SET ? WHERE id = ?`, [data, req.params.id]);
    if (!r.affectedRows) return notFound(res);
    res.json({ success: true, message: 'Berhasil diperbarui' });
  },

  remove: async (req, res) => {
    const [r] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!r.affectedRows) return notFound(res);
    res.json({ success: true, message: 'Berhasil dihapus' });
  },
});

module.exports = { makeCrud };
