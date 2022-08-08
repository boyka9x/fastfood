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
router.delete('/:id', verifyToken, OrderController.delete);
router.patch(
  '/:id/confirm',
  verifyToken,
  verifyPermission(['admin', 'staff']),
  OrderController.confirm
);
router.patch(
  '/:id/shipping',
  verifyToken,
  verifyPermission(['admin', 'staff']),
  OrderController.shipping
);
router.patch('/:id/payment', verifyToken, OrderController.payment);
router.patch(
  '/:id/cancel',
  verifyToken,
  verifyPermission(['admin', 'staff']),
  OrderController.cancel
);
router.patch(
  '/:id/complete',
  verifyToken,
  verifyPermission(['admin', 'staff']),
  OrderController.complete
);
router.post('/', verifyToken, OrderController.create);

module.exports = router;
