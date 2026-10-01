require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET belum diisi di .env');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Server Backend HIMAFOR berjalan!');
});

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/hero-slides', require('./routes/heroRoutes'));
app.use('/api/v1/events', require('./routes/eventRoutes'));
app.use('/api/v1/calendar', require('./routes/calendarRoutes'));
app.use('/api/v1/news', require('./routes/newsRoutes'));
app.use('/api/v1/settings', require('./routes/settingRoutes'));
app.use('/api/v1/upload', require('./routes/uploadRoutes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Express 5 otomatis meneruskan error async ke sini
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ success: false, message: 'JSON tidak valid' });
  if (err.code === 'ER_DUP_ENTRY')
    return res.status(409).json({ success: false, message: 'Data sudah ada (duplikat)' });
  if ([1048, 1265, 1292, 1366].includes(err.errno))
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
