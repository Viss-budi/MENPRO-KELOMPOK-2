const db = require('../config/db');
const { makeCrud } = require('../utils/crud');

const crud = makeCrud({
  table: 'members',
  fields: ['name', 'position', 'division', 'photo_url', 'period', 'sort_order', 'is_active'],
  required: ['name', 'position'],
  searchFields: ['name', 'position', 'division'],
  filterFields: ['period', 'division', 'is_active'],
  orderBy: 'sort_order ASC, id ASC',
});

// Publik: struktur pengurus yang aktif. ?period=2026/2027&division=Akademik
const getPublic = async (req, res) => {
  const where = ['is_active = 1'];
  const params = [];
  if (req.query.period) { where.push('period = ?'); params.push(String(req.query.period)); }
  if (req.query.division) { where.push('division = ?'); params.push(String(req.query.division)); }

  const [rows] = await db.query(
    `SELECT id, name, position, division, photo_url, period
     FROM members WHERE ${where.join(' AND ')} ORDER BY sort_order, id`,
    params
  );
  res.json({ success: true, data: rows });
};

module.exports = { getPublic, ...crud };
