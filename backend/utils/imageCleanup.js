const db = require('../config/db');
const { USE_CLOUD, publicIdFromUrl, destroyImage } = require('./imageStorage');

// Semua kolom yang menyimpan alamat gambar
const IMAGE_COLUMNS = [['news', 'cover_url'], ['events', 'thumbnail_url'], ['members', 'photo_url'], ['departments', 'logo_url']];

// Kolom teks (Markdown) yang bisa menyisipkan gambar di dalam isinya, mis. ![alt](url) di isi berita
const TEXT_COLUMNS = [['news', 'content']];

// Semua alamat gambar Cloudinary yang tertulis di dalam sebuah teks
function extractCloudUrls(text) {
  if (typeof text !== 'string') return [];
  return [...new Set(text.match(/https:\/\/res\.cloudinary\.com\/[^\s)"'<>\]]+/g) || [])];
}

// Apakah gambar ini masih dipakai baris lain? (contoh: gambar yang sama dipakai dua baris, atau tertulis di isi berita)
async function stillUsed(url) {
  for (const [table, col] of IMAGE_COLUMNS) {
    try {
      const [[row]] = await db.query(`SELECT 1 AS x FROM ${table} WHERE ${col} = ? LIMIT 1`, [url]);
      if (row) return true;
    } catch (err) {
      if (err.errno === 1146 || err.errno === 1054) continue; // tabel atau kolom belum ada
      throw err;
    }
  }
  for (const [table, col] of TEXT_COLUMNS) { // masih tertulis di isi berita lain?
    try {
      const [[row]] = await db.query(`SELECT 1 AS x FROM ${table} WHERE LOCATE(?, ${col}) > 0 LIMIT 1`, [url]);
      if (row) return true;
    } catch (err) {
      if (err.errno === 1146 || err.errno === 1054) continue;
      throw err;
    }
  }
  return false;
}

// Hapus gambar yang sudah tidak dipakai dari Cloudinary. Panggil SETELAH data di database diubah atau dihapus.
// Hanya menyentuh gambar Cloudinary milik kita; gagal satu tidak menggagalkan yang lain.
async function cleanupImages(urls) {
  if (!USE_CLOUD) return [];
  const removed = [];
  for (const url of [...new Set((urls || []).filter(Boolean))]) {
    try {
      const id = publicIdFromUrl(url);
      if (!id || (await stillUsed(url))) continue;
      const result = await destroyImage(id);
      removed.push({ id, result });
    } catch (err) {
      console.error('[CLOUDINARY] gagal menghapus gambar:', url, '-', err.message);
    }
  }
  return removed;
}

// Dijalankan di latar belakang agar respons ke admin tidak menunggu Cloudinary
function scheduleCleanup(urls) {
  if (!USE_CLOUD || !urls || !urls.some(Boolean)) return;
  setImmediate(() => { cleanupImages(urls).catch((e) => console.error('[CLOUDINARY]', e.message)); });
}

module.exports = { cleanupImages, scheduleCleanup, extractCloudUrls, IMAGE_COLUMNS, TEXT_COLUMNS };
