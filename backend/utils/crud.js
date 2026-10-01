const db = require('../config/db');
const slugify = require('slugify');

const pick = (body = {}, fields) =>
  Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// Pabrik CRUD admin: dipakai hero_slides, events, news
const makeCrud = ({ table, fields, required = [], slugFrom }) => ({
  listAll: async (req, res) => {
    const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY id DESC`);
    res.json({ success: true, data: rows });
  },

  create: async (req, res) => {
    const data = pick(req.body, fields);
    const missing = required.filter((f) => !data[f]);
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Field wajib diisi: ${missing.join(', ')}` });
    }
    if (slugFrom) {
      data.slug = `${slugify(String(data[slugFrom]), { lower: true, strict: true })}-${Date.now().toString(36)}`;
    }
    const [r] = await db.query(`INSERT INTO ${table} SET ?`, [data]);
    res.status(201).json({ success: true, message: 'Berhasil ditambahkan', data: { id: r.insertId, slug: data.slug } });
  },

  update: async (req, res) => {
    const data = pick(req.body, fields);
    if (!Object.keys(data).length) {
      return res.status(400).json({ success: false, message: 'Tidak ada field yang diubah' });
    }
    const [r] = await db.query(`UPDATE ${table} SET ? WHERE id=?`, [data, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Berhasil diperbarui' });
  },

  remove: async (req, res) => {
    const [r] = await db.query(`DELETE FROM ${table} WHERE id=?`, [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    res.json({ success: true, message: 'Berhasil dihapus' });
  },
});

module.exports = { makeCrud };
