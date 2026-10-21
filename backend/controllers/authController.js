const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { COOKIE_NAME, setSessionCookie, clearSessionCookie } = require('../middleware/auth');

const BCRYPT_COST = 12;
// Hash palsu: dipakai agar waktu respons sama saat email tidak terdaftar (anti user-enumeration)
const DUMMY_HASH = bcrypt.hashSync('password-palsu-untuk-timing', BCRYPT_COST);

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const normEmail = (v) => String(v ?? '').trim().toLowerCase();
const isEmail = (v) => v.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// bcrypt hanya membaca 72 byte pertama
const passwordProblem = (pw) => {
  if (typeof pw !== 'string' || pw.length < 10) return 'Password minimal 10 karakter';
  if (Buffer.byteLength(pw) > 72) return 'Password maksimal 72 karakter';
  return null;
};

const login = async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || typeof password !== 'string' || !password) {
    return fail(res, 400, 'Email dan password wajib diisi');
  }
  if (email.length > 150 || password.length > 128) {
    return fail(res, 401, 'Email atau password salah');
  }

  const [[user]] = await db.query(
    'SELECT id, name, email, password_hash, role, is_active, token_version FROM users WHERE email = ?',
    [email]
  );

  const match = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !match || !user.is_active) {
    return fail(res, 401, 'Email atau password salah'); // pesan sama untuk semua kegagalan
  }

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
  setSessionCookie(res, user);
  res.json({ success: true, message: 'Login berhasil', data: { user: publicUser(user) } });
};

// Selalu sukses & selalu menghapus cookie. Jika sesi masih valid, sesi dicabut di server (token_version + 1)
const logout = async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      await db.query('UPDATE users SET token_version = token_version + 1 WHERE id = ? AND token_version = ?', [payload.sub, payload.tv]);
    } catch { /* token tidak valid: cukup hapus cookie */ }
  }
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logout berhasil' });
};

const me = (req, res) => res.json({ success: true, data: { user: req.user } });

const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (typeof current_password !== 'string' || !current_password) {
    return fail(res, 400, 'Password saat ini wajib diisi');
  }
  const problem = passwordProblem(new_password);
  if (problem) return fail(res, 400, problem);
  if (new_password === current_password) return fail(res, 400, 'Password baru harus berbeda');

  const [[user]] = await db.query('SELECT id, password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(current_password, user.password_hash))) {
    return fail(res, 401, 'Password saat ini salah');
  }

  const hash = await bcrypt.hash(new_password, BCRYPT_COST);
  // token_version + 1 -> semua sesi lain otomatis keluar
  await db.query('UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE id = ?', [hash, user.id]);
  const [[fresh]] = await db.query('SELECT id, token_version FROM users WHERE id = ?', [user.id]);
  setSessionCookie(res, fresh); // sesi yang sedang dipakai tetap login
  res.json({ success: true, message: 'Password berhasil diubah' });
};

// Hanya admin (lihat routes/authRoutes.js)
const register = async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = normEmail(req.body?.email);
  const password = req.body?.password;
  const role = req.body?.role ?? 'editor';

  if (!name || name.length > 100) return fail(res, 400, 'Nama wajib diisi (maks 100 karakter)');
  if (!isEmail(email)) return fail(res, 400, 'Format email tidak valid');
  const problem = passwordProblem(password);
  if (problem) return fail(res, 400, problem);
  if (!['admin', 'editor'].includes(role)) return fail(res, 400, "Role harus 'admin' atau 'editor'");

  const hash = await bcrypt.hash(password, BCRYPT_COST);
  const [r] = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    [name, email, hash, role]
  );
  res.status(201).json({ success: true, message: 'Akun berhasil dibuat', data: { id: r.insertId, name, email, role } });
};

module.exports = { login, logout, me, changePassword, register };
