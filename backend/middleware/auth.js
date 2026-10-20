const jwt = require('jsonwebtoken');
const db = require('../config/db');

const COOKIE_NAME = 'himafor_token';
const SESSION_MS = 2 * 60 * 60 * 1000; // 2 jam

const cookieOptions = () => ({
  httpOnly: true,                       // tidak bisa dibaca JavaScript (kebal XSS pencuri token)
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production', // hanya lewat HTTPS
  sameSite: 'lax',                      // tidak dikirim dari situs lain (anti-CSRF lapis 1)
  path: '/',
});

const signToken = (user) =>
  jwt.sign({ sub: user.id, tv: user.token_version }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '2h',
  });

const setSessionCookie = (res, user) =>
  res.cookie(COOKIE_NAME, signToken(user), { ...cookieOptions(), maxAge: SESSION_MS });

const clearSessionCookie = (res) => res.clearCookie(COOKIE_NAME, cookieOptions());

const unauthorized = (res, message = 'Sesi tidak valid atau kedaluwarsa, silakan login lagi') =>
  res.status(401).json({ success: false, message });

// Memeriksa cookie + memastikan akun MASIH aktif dan sesi belum dicabut (token_version).
// Role selalu dibaca dari database, jadi perubahan role/penonaktifan berlaku seketika.
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return unauthorized(res, 'Silakan login terlebih dahulu');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return unauthorized(res);
  }

  const [[user]] = await db.query(
    'SELECT id, name, email, role, is_active, token_version FROM users WHERE id = ?',
    [payload.sub]
  );
  if (!user || !user.is_active || user.token_version !== payload.tv) return unauthorized(res);

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
};

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ success: false, message: 'Akses ditolak' });

const requireAdmin = requireRole('admin');

module.exports = {
  COOKIE_NAME, verifyToken, requireRole, requireAdmin,
  setSessionCookie, clearSessionCookie,
};
