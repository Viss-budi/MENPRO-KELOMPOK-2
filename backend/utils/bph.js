// Posisi utama BPH (Badan Pengurus Harian). Slot-nya dibuat sekali lewat SQL (database/sprint4_hapus_periode.sql)
// dan hanya boleh diubah nama, foto, dan statusnya (is_core = 1).
const PLACEHOLDER_NAME = '(Belum diisi)';

const CORE_SLOTS = [
  { position: 'Ketua Umum', group_name: null, sort_order: 1 },
  { position: 'Wakil Ketua', group_name: null, sort_order: 2 },
  { position: 'Sekretaris', group_name: 'Sekretaris', sort_order: 3 },
  { position: 'Sekretaris II', group_name: 'Sekretaris', sort_order: 4 },
  { position: 'Bendahara', group_name: 'Bendahara', sort_order: 5 },
  { position: 'Bendahara II', group_name: 'Bendahara', sort_order: 6 },
];

module.exports = { PLACEHOLDER_NAME, CORE_SLOTS };
