const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File 'image' wajib diisi" });
  }
  res.status(201).json({
    success: true,
    data: { url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` },
  });
});

module.exports = router;
