const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

// Ekstensi ditentukan SERVER dari tipe yang diizinkan, bukan dari nama file kiriman klien
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

module.exports = multer({
  storage: multer.diskStorage({
    destination: dir,
    // nama acak: tidak bisa ditebak dan tidak bisa menimpa file lain
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(new Error('INVALID_FILE'))),
});
