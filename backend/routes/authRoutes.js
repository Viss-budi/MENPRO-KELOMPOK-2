const express = require('express');
const router = express.Router();
const { login, logout, me, changePassword, register } = require('../controllers/authController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);
router.post('/change-password', verifyToken, changePassword);
router.post('/register', verifyToken, requireAdmin, register); // hanya admin

module.exports = router;
