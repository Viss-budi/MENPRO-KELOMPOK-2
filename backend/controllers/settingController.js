const db = require('../config/db');

const getSettings = async (req, res) => {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
  res.json({
    success: true,
    data: Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value])),
  });
};

// body: { "stat_members": "160", "contact_email": "..." }
const updateSettings = async (req, res) => {
  const entries = Object.entries(req.body || {});
  if (!entries.length) {
    return res.status(400).json({ success: false, message: 'Body kosong' });
  }
  await db.query(
    `INSERT INTO settings (setting_key, setting_value) VALUES ?
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [entries.map(([k, v]) => [k, String(v)])]
  );
  res.json({ success: true, message: 'Pengaturan diperbarui' });
};

module.exports = { getSettings, updateSettings };
