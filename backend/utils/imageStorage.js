const crypto = require('crypto');

// Penyimpanan gambar unggahan.
// - CLOUDINARY_URL diisi  -> file dikirim ke Cloudinary, yang disimpan adalah URL https penuh dari Cloudinary
// - CLOUDINARY_URL kosong -> file disimpan di folder uploads lokal (hanya untuk development),
//                            yang disimpan adalah path relatif "/uploads/<nama-file>"
const USE_CLOUD = Boolean(process.env.CLOUDINARY_URL);
const FOLDER = process.env.CLOUDINARY_FOLDER || 'himafor';

let cloudinary = null;
if (USE_CLOUD) {
  if (!process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
    throw new Error('CLOUDINARY_URL harus berformat cloudinary://API_KEY:API_SECRET@CLOUD_NAME');
  }
  cloudinary = require('cloudinary').v2; // membaca CLOUDINARY_URL otomatis
  cloudinary.config({ secure: true });
}

function saveToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        // nama acak: tidak bisa ditebak dan tidak menimpa file lain
        public_id: `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`,
        resource_type: 'image',
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
  });
}

// Mengembalikan nilai yang disimpan ke cover_url / thumbnail_url / photo_url
async function saveImage(file) {
  return USE_CLOUD ? saveToCloudinary(file) : `/uploads/${file.filename}`;
}

module.exports = { USE_CLOUD, saveImage };