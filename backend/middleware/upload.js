const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { USE_CLOUD } = require('../utils/imageStorage');

// Ekstensi ditentukan SERVER dari tipe yang diizinkan, bukan dari nama file kiriman klien
// jpg dan jpeg adalah format yang sama (image/jpeg): file .jpg maupun .jpeg diterima, disimpan dengan ekstensi .jpg
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

let storage;
if (USE_CLOUD) {
  // Cloudinary: file ditahan di memori (maks 2 MB), tidak ditulis ke disk server
  storage = multer.memoryStorage();
} else {
  // Lokal: simpan di folder uploads
  const dir = path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  storage = multer.diskStorage({
    destination: dir,
    // nama acak: tidak bisa ditebak dan tidak bisa menimpa file lain
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${EXT[file.mimetype]}`),
  });
}

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(new Error('INVALID_FILE'))),
});
