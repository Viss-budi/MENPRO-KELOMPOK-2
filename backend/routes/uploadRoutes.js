const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const verifyImage = require('../middleware/verifyImage');
const { verifyToken } = require('../middleware/auth');
const { saveImage } = require('../utils/imageStorage');

router.post('/', verifyToken, upload.single('image'), verifyImage, async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File 'image' wajib diisi" });
  }
  try {
    const url = await saveImage(req.file);
    res.status(201).json({ success: true, data: { url } });
  } catch (err) {
    next(err); // gagal ke Cloudinary -> 500 "Terjadi kesalahan server", detail ada di log server
  }
});

module.exports = router;