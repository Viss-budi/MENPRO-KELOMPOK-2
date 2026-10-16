const express = require('express');
const router = express.Router();
const c = require('../controllers/memberController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', c.getPublic);                                   // publik
router.get('/admin/all', verifyToken, requireAdmin, c.listAll); // admin
router.get('/admin/:id', verifyToken, requireAdmin, c.getById);
router.post('/', verifyToken, requireAdmin, c.create);
router.put('/:id', verifyToken, requireAdmin, c.update);
router.delete('/:id', verifyToken, requireAdmin, c.remove);

module.exports = router;
