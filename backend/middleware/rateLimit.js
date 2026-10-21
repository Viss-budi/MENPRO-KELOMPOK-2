const rateLimit = require('express-rate-limit');

// Maks 10 login GAGAL per 15 menit per IP (login yang berhasil tidak dihitung)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_MAX_ATTEMPTS) || 10, // untuk uji lokal boleh dinaikkan lewat .env
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

module.exports = { loginLimiter };
