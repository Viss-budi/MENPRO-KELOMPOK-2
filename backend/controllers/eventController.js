const db = require('../config/db');
const { makeCrud } = require('../utils/crud');

const clamp = (v, def, max) => Math.min(Math.max(parseInt(v) || def, 1), max);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

const crud = makeCrud({
  table: 'events',
  fields: ['title', 'category', 'description', 'thumbnail_url', 'location',
           'start_at', 'end_at', 'is_featured', 'is_published'],
  required: ['title', 'start_at'],
  slugFrom: 'title',
});

// Kegiatan Terbaru (?limit=3) dan Agenda Hari Ini (?date=YYYY-MM-DD)
const getEvents = async (req, res) => {
  const { date } = req.query;
  if (date && !isDate(date)) {
    return res.status(400).json({ success: false, message: 'Format date: YYYY-MM-DD' });
  }
  const limit = clamp(req.query.limit, 3, 50);
  const where = ['is_published = 1'];
  const params = [];
  if (date) { where.push('DATE(start_at) = ?'); params.push(date); }

  const [rows] = await db.query(
    `SELECT id, title, slug, category, thumbnail_url, location, start_at, end_at
     FROM events WHERE ${where.join(' AND ')}
     ORDER BY start_at ${date ? 'ASC' : 'DESC'} LIMIT ?`,
    [...params, limit]
  );
  res.json({ success: true, data: rows });
};

const getEventBySlug = async (req, res) => {
  const [[row]] = await db.query(
    'SELECT * FROM events WHERE slug = ? AND is_published = 1', [req.params.slug]);
  if (!row) return res.status(404).json({ success: false, message: 'Event tidak ditemukan' });
  res.json({ success: true, data: row });
};

// Kalender: daftar tanggal yang punya event di bulan tertentu
const getCalendar = async (req, res) => {
  const year = parseInt(req.query.year);
  const month = parseInt(req.query.month);
  if (!year || !(month >= 1 && month <= 12)) {
    return res.status(400).json({ success: false, message: 'Wajib: year & month (1-12)' });
  }
  const pad = (n) => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;

  const [rows] = await db.query(
    `SELECT DATE_FORMAT(start_at, '%Y-%m-%d') AS event_date, COUNT(*) AS total
     FROM events WHERE is_published = 1 AND start_at >= ? AND start_at < ?
     GROUP BY event_date ORDER BY event_date`,
    [start, next]
  );
  res.json({ success: true, data: rows });
};

module.exports = { getEvents, getEventBySlug, getCalendar, ...crud };
