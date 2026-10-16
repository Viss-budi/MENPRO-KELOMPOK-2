const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');

router.get('/summary', verifyToken, getSummary);

module.exports = router;
