const db = require('../config/db');

// GET /structure  (publik)
// Pengurus inti (BPH, tanpa departemen) dikelompokkan per kotak, lalu daftar departemen aktif.
const getStructure = async (req, res) => {
  const [core] = await db.query(
    `SELECT id, name, position, group_name, photo_url FROM members
     WHERE department_id IS NULL AND is_active = 1 ORDER BY sort_order, id`
  );
  const [departments] = await db.query(
    `SELECT id, name, slug, description, logo_url FROM departments
     WHERE is_active = 1 ORDER BY sort_order, id`
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
  res.json({ success: true, data: { inti, departments } });
};

module.exports = { getStructure };
