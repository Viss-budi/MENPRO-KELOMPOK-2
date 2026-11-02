const db = require('../config/db');

const PLACEHOLDER_NAME = '(Belum diisi)';

// Slot posisi utama BPH yang dibuat otomatis untuk setiap periode baru
const CORE_SLOTS = [
  { position: 'Ketua Umum', group_name: null, sort_order: 1 },
  { position: 'Wakil Ketua', group_name: null, sort_order: 2 },
  { position: 'Sekretaris', group_name: 'Sekretaris', sort_order: 3 },
  { position: 'Sekretaris II', group_name: 'Sekretaris', sort_order: 4 },
  { position: 'Bendahara', group_name: 'Bendahara', sort_order: 5 },
  { position: 'Bendahara II', group_name: 'Bendahara', sort_order: 6 },
];

// Semua periode yang punya data (anggota atau departemen), terbaru dulu
const listPeriods = async () => {
  const [rows] = await db.query(
    `SELECT period FROM (
       SELECT period FROM members WHERE period IS NOT NULL
       UNION
       SELECT period FROM departments
     ) p ORDER BY period DESC`
  );
  return rows.map((r) => r.period);
};

const periodExists = async (period) => {
  const [[m]] = await db.query('SELECT 1 AS x FROM members WHERE period = ? LIMIT 1', [period]);
  if (m) return true;
  const [[d]] = await db.query('SELECT 1 AS x FROM departments WHERE period = ? LIMIT 1', [period]);
  return Boolean(d);
};

// Periode aktif dari settings; jika belum diatur, pakai periode terbaru yang ada
const getActivePeriod = async () => {
  const [[row]] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'active_period'");
  if (row && row.setting_value) return row.setting_value;
  const periods = await listPeriods();
  return periods[0] ?? null;
};

module.exports = { CORE_SLOTS, PLACEHOLDER_NAME, listPeriods, periodExists, getActivePeriod };
