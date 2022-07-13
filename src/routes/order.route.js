const express = require('express');
const router = express.Router();

const OrderController = require('../controller/order.controller');
const { verifyToken, verifyPermission } = require('../middleware/authenticate');

router.get(
  '/customer',
  verifyToken,
  verifyPermission(['customer']),
  OrderController.getListByCustomer
);
router.get(
  '/manager',
  verifyToken,
  verifyPermission(['admin', 'staff']),
  OrderController.getListByManager
);
router.get('/:id', verifyToken, OrderController.getById);
router.post('/', verifyToken, OrderController.create);

module.exports = router;
