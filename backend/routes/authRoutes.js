const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.post('/register', verifyToken, requireAdmin, register); // hanya admin
router.post('/login', login);

module.exports = router;
