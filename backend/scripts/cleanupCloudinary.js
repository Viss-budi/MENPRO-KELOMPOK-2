// Membersihkan gambar "yatim" di Cloudinary: gambar yang sudah diunggah tetapi tidak dipakai baris mana pun
// (misalnya admin mengunggah foto lalu membatalkan form).
//
// Pemakaian:
//   node scripts/cleanupCloudinary.js                 -> hanya menampilkan daftar (aman, tidak menghapus)
//   node scripts/cleanupCloudinary.js --delete        -> benar-benar menghapus
//   node scripts/cleanupCloudinary.js --min-age=48    -> hanya gambar yang lebih tua dari 48 jam (default 24)
//
// Hanya menyentuh folder CLOUDINARY_FOLDER milik environment ini (dev tidak menyentuh prod).
const db = require('../config/db'); // memuat .env lebih dulu
const { USE_CLOUD, FOLDER, publicIdFromUrl } = require('../utils/imageStorage');
const { IMAGE_COLUMNS, TEXT_COLUMNS, extractCloudUrls } = require('../utils/imageCleanup');

(async () => {
  if (!USE_CLOUD) {
    console.error('CLOUDINARY_URL belum diisi: tidak ada yang dibersihkan.');
    process.exit(1);
  }
  const cloudinary = require('cloudinary').v2;
  const doDelete = process.argv.includes('--delete');
  const minAge = Number((process.argv.find((a) => a.startsWith('--min-age=')) || '--min-age=24').split('=')[1]) || 24;

  // 1) gambar yang masih dipakai di database
  const used = new Set();
  for (const [table, col] of IMAGE_COLUMNS) {
    try {
      const [rows] = await db.query(`SELECT ${col} AS u FROM ${table} WHERE ${col} IS NOT NULL`);
      for (const r of rows) { const id = publicIdFromUrl(r.u); if (id) used.add(id); }
    } catch (err) {
      if (err.errno !== 1146 && err.errno !== 1054) throw err;
    }
  }

  // gambar yang disisipkan di dalam isi (Markdown) juga dihitung dipakai
  for (const [table, col] of TEXT_COLUMNS) {
    try {
      const [rows] = await db.query(`SELECT ${col} AS t FROM ${table} WHERE ${col} IS NOT NULL`);
      for (const r of rows) for (const u of extractCloudUrls(r.t)) { const id = publicIdFromUrl(u); if (id) used.add(id); }
    } catch (err) {
      if (err.errno !== 1146 && err.errno !== 1054) throw err;
    }
  }

  // 2) semua gambar di folder ini di Cloudinary
  const all = [];
  let cursor;
  do {
    const res = await cloudinary.api.resources({ type: 'upload', resource_type: 'image', prefix: `${FOLDER}/`, max_results: 500, next_cursor: cursor });
    all.push(...res.resources);
    cursor = res.next_cursor;
  } while (cursor);

  // 3) yatim = tidak dipakai DAN cukup lama (agar unggahan yang baru dan belum disimpan tidak ikut terhapus)
  const batas = Date.now() - minAge * 3600 * 1000;
  const yatim = all.filter((r) => !used.has(r.public_id) && new Date(r.created_at).getTime() < batas);
  const bytes = yatim.reduce((t, r) => t + (r.bytes || 0), 0);

  console.log(`Folder ${FOLDER}/: ${all.length} gambar, dipakai database: ${used.size}, yatim (> ${minAge} jam): ${yatim.length} (${(bytes / 1024).toFixed(0)} KB)`);
  yatim.forEach((r) => console.log(`  ${r.public_id}  ${r.created_at}  ${r.bytes} byte`));

  if (!yatim.length) process.exit(0);
  if (!doDelete) { console.log('Mode lihat saja. Tambahkan --delete untuk menghapus.'); process.exit(0); }
  for (let i = 0; i < yatim.length; i += 100) {
    await cloudinary.api.delete_resources(yatim.slice(i, i + 100).map((r) => r.public_id), { resource_type: 'image', invalidate: true });
  }
  console.log(`Selesai: ${yatim.length} gambar dihapus.`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
