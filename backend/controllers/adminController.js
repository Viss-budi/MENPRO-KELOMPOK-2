const db = require('../config/db');

// Ringkasan untuk halaman awal dashboard
const getSummary = async (req, res) => {
  const count = async (table, flag) => {
    const [[r]] = await db.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(${flag} = 1), 0) AS active FROM ${table}`
    );
    return { total: Number(r.total), active: Number(r.active) };
  };
  const [events, news, members] = await Promise.all([
    count('events', 'is_published'),
    count('news', 'is_published'),
    count('members', 'is_active'),
  ]);
  res.json({ success: true, data: { events, news, members } });
};

module.exports = { getSummary };
