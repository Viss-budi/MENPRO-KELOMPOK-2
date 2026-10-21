const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const schema = require('../utils/schema');

router.get('/summary', verifyToken, getSummary);

// Detail kelengkapan tabel/kolom database (khusus admin)
router.get('/health', verifyToken, requireAdmin, async (req, res) => {
  await schema.check();
  res.json({ success: true, data: schema.status() });
});

module.exports = router;
