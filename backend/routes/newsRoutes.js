const express = require('express');
const router = express.Router();
const c = require('../controllers/newsController');
const { verifyToken } = require('../middleware/auth');

router.get('/', c.getNews);
router.get('/admin/all', verifyToken, c.listAll);
router.get('/:slug', c.getNewsBySlug);
router.post('/', verifyToken, c.create);
router.put('/:id', verifyToken, c.update);
router.delete('/:id', verifyToken, c.remove);

module.exports = router;
