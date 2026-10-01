const express = require('express');
const router = express.Router();
const c = require('../controllers/heroController');
const { verifyToken } = require('../middleware/auth');

router.get('/', c.getActive);
router.get('/admin/all', verifyToken, c.listAll);
router.post('/', verifyToken, c.create);
router.put('/:id', verifyToken, c.update);
router.delete('/:id', verifyToken, c.remove);

module.exports = router;
