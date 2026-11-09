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

// Nama cloud diambil dari CLOUDINARY_URL (cloudinary://key:secret@NAMA_CLOUD)
const CLOUD_NAME = (/@([^/?#]+)$/.exec(process.env.CLOUDINARY_URL || '') || [])[1] || null;

// URL gambar Cloudinary milik kita -> public_id (contoh: himafor/prod/1790843132424-ef07).
// Mengembalikan null untuk apa pun yang BUKAN gambar kita: nama file, path /uploads, cloud lain,
// atau folder lain (dev tidak akan pernah menyentuh prod).
function publicIdFromUrl(value) {
  if (!USE_CLOUD || typeof value !== 'string') return null;
  let u;
  try { u = new URL(value); } catch { return null; }
  if (u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com') return null;
  const parts = u.pathname.split('/').filter(Boolean); // [cloud, 'image', 'upload', ...]
  if (parts[0] !== CLOUD_NAME || parts[1] !== 'image' || parts[2] !== 'upload') return null;
  const rest = parts.slice(3);
  const v = rest.findIndex((x) => /^v\d+$/.test(x));
  const idParts = v >= 0 ? rest.slice(v + 1) : rest;
  if (!idParts.length) return null;
  let id;
  try { id = decodeURIComponent(idParts.join('/')).replace(/\.[A-Za-z0-9]+$/, ''); } catch { return null; }
  if (id.includes('..') || !id.startsWith(`${FOLDER}/`)) return null;
  return id;
}

// Hapus satu gambar dari Cloudinary (invalidate = hapus juga salinan di cache CDN)
async function destroyImage(publicId) {
  if (!USE_CLOUD) return null;
  const r = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  return r.result; // 'ok' atau 'not found'
}

module.exports = { USE_CLOUD, FOLDER, saveImage, publicIdFromUrl, destroyImage };
