const fs = require('fs');
const path = require('path');

// Tanda tangan (byte awal) setiap format gambar yang diizinkan
const SIGNATURES = {
  '.jpg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  '.png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  '.webp': (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
};

// Dipasang setelah multer: memastikan ISI file benar-benar gambar sesuai tipenya.
// File yang tidak cocok langsung dihapus dari disk.
module.exports = async (req, res, next) => {
  if (!req.file) return next();
  const ext = path.extname(req.file.filename);
  const buf = Buffer.alloc(12);
  const fh = await fs.promises.open(req.file.path, 'r');
  try { await fh.read(buf, 0, 12, 0); } finally { await fh.close(); }

  if (!SIGNATURES[ext] || !SIGNATURES[ext](buf)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ success: false, message: 'File harus jpg/png/webp, maks 5MB' });
  }
  next();
};
