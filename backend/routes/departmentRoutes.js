const express = require('express');
const router = express.Router();
const c = require('../controllers/departmentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/admin/all', verifyToken, requireAdmin, c.listAll);   // admin (harus sebelum /:slug)
router.get('/admin/:id', verifyToken, requireAdmin, c.getById);
router.get('/:slug', c.getBySlug);                                  // publik
router.post('/', verifyToken, requireAdmin, c.create);
router.put('/:id', verifyToken, requireAdmin, c.update);
router.patch('/:id', verifyToken, requireAdmin, c.update);          // alias PUT (keduanya parsial)
router.delete('/:id', verifyToken, requireAdmin, c.remove);

module.exports = router;
