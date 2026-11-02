const db = require('../config/db');
const { isPeriod, PERIOD_MSG } = require('../utils/validators/common');
const { CORE_SLOTS, PLACEHOLDER_NAME, listPeriods, periodExists, getActivePeriod } = require('../utils/period');

const bad = (res, message) => res.status(400).json({ success: false, message });
const notFound = (res, message) => res.status(404).json({ success: false, message });

// GET /structure?period=2026/2027  (tanpa period = periode aktif)
const getStructure = async (req, res) => {
  let period = req.query.period ? String(req.query.period) : null;
  if (period && !isPeriod(period)) return bad(res, PERIOD_MSG);
  if (!period) period = await getActivePeriod();
  if (!period || !(await periodExists(period))) return notFound(res, 'Periode tidak ditemukan');

  const [core] = await db.query(
    `SELECT id, name, position, group_name, photo_url FROM members
     WHERE period = ? AND department_id IS NULL AND is_active = 1 ORDER BY sort_order, id`,
    [period]
  );
  const [departments] = await db.query(
    `SELECT id, name, slug, description, logo_url FROM departments
     WHERE period = ? AND is_active = 1 ORDER BY sort_order, id`,
    [period]
  );

  // Kelompokkan pengurus inti: group_name sama = satu blok; tanpa group_name = satu blok per orang.
  // Urutan blok mengikuti anggota pertamanya (sudah terurut sort_order).
  const inti = [];
  const byGroup = new Map();
  for (const { group_name: group, ...m } of core) {
    if (group && byGroup.has(group)) { byGroup.get(group).members.push(m); continue; }
    const block = { group: group || null, members: [m] };
    inti.push(block);
    if (group) byGroup.set(group, block);
  }
  res.json({ success: true, data: { period, inti, departments } });
};

// GET /periods
const getPeriods = async (req, res) => {
  res.json({ success: true, data: { active: await getActivePeriod(), periods: await listPeriods() } });
};

// POST /periods  { period, copy_from? }  (admin)
const createPeriod = async (req, res) => {
  const { period, copy_from: copyFrom } = req.body || {};
  if (!isPeriod(period)) return bad(res, PERIOD_MSG);
  if (copyFrom !== undefined && copyFrom !== null && !isPeriod(copyFrom)) return bad(res, PERIOD_MSG.replace('period', 'copy_from'));
  if (await periodExists(period)) return res.status(409).json({ success: false, message: 'Periode sudah ada' });
  if (copyFrom && !(await periodExists(copyFrom))) return notFound(res, 'Periode asal tidak ditemukan');

  const conn = await db.getConnection();
  let departmentsCreated = 0;
  try {
    await conn.beginTransaction();
    await conn.query(
      'INSERT INTO members (name, position, group_name, period, sort_order, is_active, is_core) VALUES ?',
      [CORE_SLOTS.map((s) => [PLACEHOLDER_NAME, s.position, s.group_name, period, s.sort_order, 0, 1])]
    );
    if (copyFrom) {
      const [r] = await conn.query(
        `INSERT INTO departments (period, name, slug, description, logo_url, sort_order, is_active)
         SELECT ?, name, slug, description, logo_url, sort_order, is_active FROM departments WHERE period = ?`,
        [period, copyFrom]
      );
      departmentsCreated = r.affectedRows;
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  res.status(201).json({
    success: true,
    message: 'Periode dibuat',
    data: { period, members_created: CORE_SLOTS.length, departments_created: departmentsCreated },
  });
};

module.exports = { getStructure, getPeriods, createPeriod };
