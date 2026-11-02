const fs = require('fs');

// Tanda tangan (byte awal) setiap format gambar yang diizinkan
const SIGNATURES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
};

// Dipasang setelah multer: memastikan ISI file benar-benar gambar sesuai tipenya.
// Mode Cloudinary: file ada di memori (req.file.buffer), tidak ada yang perlu dihapus.
// Mode lokal: file ada di disk (req.file.path); yang tidak cocok langsung dihapus.
module.exports = async (req, res, next) => {
  if (!req.file) return next();

  let head;
  if (req.file.buffer) {
    head = req.file.buffer.subarray(0, 12);
  } else {
    head = Buffer.alloc(12);
    const fh = await fs.promises.open(req.file.path, 'r');
    try { await fh.read(head, 0, 12, 0); } finally { await fh.close(); }
  }

  const cek = SIGNATURES[req.file.mimetype];
  if (!cek || !cek(head)) {
    if (req.file.path) await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ success: false, message: 'File harus jpg/png/webp, maks 5MB' });
  }
  next();
};