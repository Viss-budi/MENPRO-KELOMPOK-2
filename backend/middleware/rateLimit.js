const rateLimit = require('express-rate-limit');

// Maks 10 login GAGAL per 15 menit per IP (login yang berhasil tidak dihitung)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
});

module.exports = { loginLimiter };
