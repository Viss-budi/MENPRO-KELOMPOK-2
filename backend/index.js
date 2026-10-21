require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const csrfGuard = require('./middleware/csrf');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET belum diisi di .env');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  const msg = 'JWT_SECRET terlalu pendek (minimal 32 karakter)';
  if (process.env.NODE_ENV === 'production') { console.error(msg); process.exit(1); }
  console.warn('PERINGATAN:', msg);
}

const app = express();

// Jika berada di belakang proxy/ngrok/hosting, isi TRUST_PROXY=1 agar IP pengunjung terbaca benar (rate limit)
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);

// Header keamanan. img-src https: diizinkan karena gambar kegiatan/berita bisa dari URL luar
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'https:'],
    },
  },
}));

// Cookie login hanya dikirim dari origin yang diizinkan. Frontend & API sebaiknya satu origin (proxy Vite / satu server).
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Opsional: sajikan hasil build frontend (frontend/dist) dari server yang sama -> cukup 1 port / 1 tunnel ngrok
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  app.use(express.static(distPath));
  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.get('/', (req, res) => {
  res.send('Server Backend HIMAFOR berjalan!');
});

app.use('/api/v1', csrfGuard); // semua POST/PUT/DELETE wajib header X-Requested-With

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/hero-slides', require('./routes/heroRoutes'));
app.use('/api/v1/events', require('./routes/eventRoutes'));
app.use('/api/v1/calendar', require('./routes/calendarRoutes'));
app.use('/api/v1/news', require('./routes/newsRoutes'));
app.use('/api/v1/members', require('./routes/memberRoutes'));
app.use('/api/v1/settings', require('./routes/settingRoutes'));
app.use('/api/v1/upload', require('./routes/uploadRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Express 5 otomatis meneruskan error async ke sini
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ success: false, message: 'JSON tidak valid' });
  if (err.type === 'entity.too.large')
    return res.status(413).json({ success: false, message: 'Data terlalu besar' });
  if (err.code === 'ER_DUP_ENTRY')
    return res.status(409).json({ success: false, message: 'Data sudah ada (duplikat)' });
  if ([1048, 1264, 1265, 1292, 1366, 1406].includes(err.errno))
    return res.status(400).json({ success: false, message: 'Data tidak valid' });
  if (err.name === 'MulterError' || err.message === 'INVALID_FILE')
    return res.status(400).json({ success: false, message: 'File harus jpg/png/webp, maks 5MB' });

  console.error(err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
