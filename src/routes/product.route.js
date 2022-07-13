const express = require('express');
const router = express.Router();

const ProductController = require('../controller/product.controller');

router.get('/', ProductController.getList);
router.get('/:id/edit', ProductController.getById);
router.get('/deleted', ProductController.getListDeleted);
router.get('/:slug', ProductController.getBySlug);
router.post('/', ProductController.create);
router.put('/:id', ProductController.update);
router.patch('/:id/restore', ProductController.restore);
router.delete('/:id', ProductController.delete);

module.exports = router;
