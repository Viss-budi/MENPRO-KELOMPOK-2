const db = require('../config/db');
const { makeCrud } = require('../utils/crud');
const validateNews = require('../utils/validators/news');

const clamp = (v, def, max) => Math.min(Math.max(parseInt(v) || def, 1), max);
const PUBLIC = 'is_published = 1 AND published_at <= NOW()';

const crud = makeCrud({
  table: 'news',
  fields: ['title', 'category', 'excerpt', 'content', 'cover_url', 'published_at', 'is_published'],
  required: ['title'],
  slugFrom: 'title',
  slugMax: 100,
  ownerField: 'author_id',
  imageFields: ['cover_url'],
  textImageFields: ['content'], // gambar yang disisipkan di isi (Markdown)
  validate: validateNews,
  searchFields: ['title', 'excerpt'],
  filterFields: ['category', 'is_published'],
});

// id DESC = pemutus urutan saat published_at sama, supaya paginasi tidak menggandakan atau melewatkan berita
// Landing: ?per_page=3 | Halaman "Lihat Semua": ?page=1&per_page=9
const getNews = async (req, res) => {
  const page = clamp(req.query.page, 1, 100000);
  const perPage = clamp(req.query.per_page, 9, 50);

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM news WHERE ${PUBLIC}`);
  const [rows] = await db.query(
    `SELECT id, title, slug, category, excerpt, cover_url, published_at
     FROM news WHERE ${PUBLIC} ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`,
    [perPage, (page - 1) * perPage]
  );
  res.json({ success: true, data: rows, meta: { page, per_page: perPage, total } });
};

const getNewsBySlug = async (req, res) => {
  const [[row]] = await db.query(
    `SELECT * FROM news WHERE slug = ? AND ${PUBLIC}`, [req.params.slug]);
  if (!row) return res.status(404).json({ success: false, message: 'Berita tidak ditemukan' });
  res.json({ success: true, data: row });
};

module.exports = { getNews, getNewsBySlug, ...crud };
