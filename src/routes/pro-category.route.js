const express = require('express');
const router = express.Router();

const ProCategoryController = require('../controller/pro-category.controller');
const { verifyToken, verifyPermission } = require('../middleware/authenticate');

router.post('/', verifyToken, verifyPermission(['admin']), ProCategoryController.create);
router.put('/:id', verifyToken, verifyPermission(['admin']), ProCategoryController.update);
router.delete('/:id', verifyToken, verifyPermission(['admin']), ProCategoryController.delete);
router.get('/:id', ProCategoryController.getById);
router.get('/', ProCategoryController.getList);

module.exports = router;
