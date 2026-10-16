// Anti-CSRF: semua request yang MENGUBAH data wajib membawa header X-Requested-With.
// Form/situs lain tidak bisa menambahkan header kustom tanpa izin CORS, sedangkan frontend kita selalu mengirimnya.
const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

module.exports = (req, res, next) => {
  if (SAFE.has(req.method)) return next();
  if (!req.get('x-requested-with')) {
    return res.status(403).json({ success: false, message: 'Permintaan ditolak (header keamanan tidak ada)' });
  }
  next();
};
