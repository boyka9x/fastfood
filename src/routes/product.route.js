const express = require('express');
const router = express.Router();

const ProductController = require('../controller/product.controller');
const { verifyToken, verifyPermission } = require('../middleware/authenticate');

router.get('/', ProductController.getList);
router.get('/:id/edit', ProductController.getById);
router.get('/deleted', ProductController.getListDeleted);
router.get('/:slug', ProductController.getBySlug);
router.post('/', verifyToken, verifyPermission(['admin']), ProductController.create);
router.put('/:id', verifyToken, verifyPermission(['admin']), ProductController.update);
router.patch('/:id/restore', verifyToken, verifyPermission(['admin']), ProductController.restore);
router.delete('/:id', verifyToken, verifyPermission(['admin']), ProductController.delete);

module.exports = router;
