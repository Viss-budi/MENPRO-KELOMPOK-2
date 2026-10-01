const express = require('express');
const router = express.Router();
const { getCalendar } = require('../controllers/eventController');

router.get('/', getCalendar);

module.exports = router;
