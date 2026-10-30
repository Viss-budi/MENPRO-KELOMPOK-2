const express = require('express');
const router = express.Router();
const c = require('../controllers/eventController');
const { verifyToken } = require('../middleware/auth');

router.get('/', c.getEvents);
router.get('/admin/all', verifyToken, c.listAll);
router.get('/admin/:id', verifyToken, c.getById);
router.get('/:slug', c.getEventBySlug);
router.post('/', verifyToken, c.create);
router.put('/:id', verifyToken, c.update);
router.patch('/:id', verifyToken, c.update); // alias PUT (keduanya parsial)
router.delete('/:id', verifyToken, c.remove);

module.exports = router;
