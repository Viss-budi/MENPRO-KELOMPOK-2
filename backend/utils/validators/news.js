// Validasi eksplisit untuk berita. Mengembalikan daftar masalah per field: [{ field, message }]
const CATEGORIES = ['Berita', 'Kegiatan', 'Prestasi', 'Pengumuman'];

// "YYYY-MM-DD HH:mm:ss" dan benar-benar tanggal yang ada (menolak 2026-02-31, jam 25, dst.)
const isDateTime = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d, h, mi, se] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, se));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d && h < 24 && mi < 60 && se < 60;
};

// cover_url: nama file gambar, URL http(s), atau path berawalan "/"
const isCoverUrl = (s) =>
  /^https?:\/\/\S+$/i.test(s) || /^\/[^\s]*$/.test(s) || /^[\w.\-]+\.(webp|png|jpe?g|gif|svg)$/i.test(s);

module.exports = function validateNews(data) {
  const errors = [];
  const add = (field, message) => errors.push({ field, message });
  const has = (f) => data[f] !== undefined;

  if (has('title')) {
    if (typeof data.title !== 'string') add('title', 'Judul harus berupa teks');
    else if (data.title.length > 250) add('title', 'Judul maksimal 250 karakter');
  }
  if (has('category') && !CATEGORIES.includes(data.category)) {
    add('category', `Kategori harus salah satu dari: ${CATEGORIES.join(', ')}`);
  }
  if (has('excerpt') && data.excerpt !== null) {
    if (typeof data.excerpt !== 'string') add('excerpt', 'Ringkasan harus berupa teks');
    else if (data.excerpt.length > 300) add('excerpt', 'Ringkasan maksimal 300 karakter');
  }
  if (has('content') && data.content !== null && typeof data.content !== 'string') {
    add('content', 'Isi berita harus berupa teks');
  }
  if (has('cover_url') && data.cover_url !== null && data.cover_url !== '') {
    if (typeof data.cover_url !== 'string') add('cover_url', 'cover_url harus berupa teks');
    else if (data.cover_url.length > 500) add('cover_url', 'cover_url maksimal 500 karakter');
    else if (!isCoverUrl(data.cover_url)) add('cover_url', 'cover_url harus berupa nama file gambar, URL http(s), atau path berawalan "/"');
  }
  if (has('published_at') && !(typeof data.published_at === 'string' && isDateTime(data.published_at))) {
    add('published_at', 'published_at harus berformat YYYY-MM-DD HH:mm:ss dan berupa tanggal yang valid');
  }
  if (has('is_published') && ![0, 1, true, false].includes(data.is_published)) {
    add('is_published', 'is_published harus 0 atau 1');
  }
  return errors;
};
