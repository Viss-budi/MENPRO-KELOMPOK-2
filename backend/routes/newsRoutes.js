const express = require('express');
const router = express.Router();
const c = require('../controllers/newsController');
const { verifyToken } = require('../middleware/auth');

router.get('/', c.getNews);
router.get('/admin/all', verifyToken, c.listAll);
router.get('/admin/:id', verifyToken, c.getById);
router.get('/:slug', c.getNewsBySlug);
router.post('/', verifyToken, c.create);
router.put('/:id', verifyToken, c.update);
router.patch('/:id', verifyToken, c.update); // alias PUT (keduanya parsial)
router.delete('/:id', verifyToken, c.remove);

module.exports = router;
