const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Hanya admin yang boleh membuat akun baru (lihat routes/authRoutes.js)
const register = async (req, res) => {
  const { name, email, password, role = 'editor' } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Semua field (name, email, password) wajib diisi!',
    });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
  }
  if (!['admin', 'editor'].includes(role)) {
    return res.status(400).json({ success: false, message: "Role harus 'admin' atau 'editor'" });
  }

  const hash = await bcrypt.hash(password, 10);
  const [r] = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    [name, email, hash, role]
  );

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: { id: r.insertId, name, email, role },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi!' });
  }

  const [[user]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Email atau password salah' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({
    success: true,
    message: 'Login berhasil',
    data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
  });
};

module.exports = { register, login };
