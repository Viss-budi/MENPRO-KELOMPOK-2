const express = require('express');
const router = express.Router();
const { getPeriods, createPeriod } = require('../controllers/structureController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', getPeriods);                                 // publik
router.post('/', verifyToken, requireAdmin, createPeriod);   // admin

module.exports = router;
