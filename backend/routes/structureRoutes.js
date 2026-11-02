const express = require('express');
const router = express.Router();
const { getStructure } = require('../controllers/structureController');

router.get('/', getStructure); // publik

module.exports = router;
