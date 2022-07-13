const mongoose = require('mongoose');
const Order = require('../models/order.model');

const OrderController = {
  // [GET] /api/orders/customer
  getListByCustomer: async (req, res) => {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 5;
    let searchOptions = {
      customerId: req.userId,
    };

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;

    try {
      const orders = await Order.find(searchOptions)
        .skip((page - 1) * limit)
        .limit(limit);
      const count = await Order.countDocuments(searchOptions);

      res.json({ data: orders, pagination: { _page: page, _limit: limit, _totalRecords: count } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // [GET] /api/orders/manager
  getListByManager: async (req, res) => {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 5;
    let searchOptions = {};

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;

    try {
      const orders = await Order.find(searchOptions)
        .skip((page - 1) * limit)
        .limit(limit);
      const count = await Order.countDocuments(searchOptions);

      res.json({ data: orders, pagination: { _page: page, _limit: limit, _totalRecords: count } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // [GET] /api/orders/:id
  getById: async (req, res, next) => {
    try {
      let filterOptions = {
        _id: req.params.id,
      };
      const order = await Order.findOne(filterOptions);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  // [POST] /api/orders
  create: async (req, res) => {
    const { comments, products } = req.body;
    const customerId = req.userId;
    const status = 'order';

    try {
      const totalPrice = products.reduce((total, product) => {
        return (
          total +
          (product.priceDiscount !== 0 ? product.priceDiscount : product.price) * product.quantity
        );
      }, 0);

      const newOrder = new Order({
        totalPrice,
        comments,
        customerId,
        products,
        status,
      });

      await newOrder.save();

      res.json({ status: 'success', message: 'Order saved successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
    // } finally {
    //   session.endSession();
    // }
  },

  // [PUT] /api/orders/:id
  update: async (req, res) => {
    const { comments, products } = req.body;
    const customerId = req.userId;
    const orderId = req.params.id;
    const status = 'order';

    if (!Array.isArray(products) || products.length < 1) {
      return res.status(404).json({ success: false, message: 'Invalid products' });
    }

    try {
      const totalPrice = products.reduce((total, product) => {
        return total + product.price * product.quantity;
      }, 0);

      let updateCondition = { _id: orderId, customerId, status };

      const updatedOrder = await Order.findOneAndUpdate(
        updateCondition,
        {
          totalPrice,
          comments,
          customerId,
          products,
          status,
        },
        { new: true }
      );

      if (!updatedOrder) {
        res.status(401).json({ success: false, message: 'Order not found' });
      }

      res.json({ success: true, message: 'Order saved successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },

  // [PATCH] /api/orders/:id/confirm
  confirm: async (req, res, next) => {
    try {
      let filterOptions = {
        _id: req.params.id,
        status: { $in: ['order', 'transaction'] },
      };

      const orderCondition = await Order.findOne(filterOptions);
      if (orderCondition.confirmDate !== undefined) {
        return res
          .status(400)
          .json({ success: false, message: 'Order has been confirmed or not found' });
      }

      let updateOptions = {
        confirmDate: new Date(),
        employeeId: req.userId,
        status: 'transaction',
      };

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, { new: true });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  // [PATCH] /api/orders/:id/shipping
  shipping: async (req, res, next) => {
    try {
      let filterOptions = {
        _id: req.params.id,
        employeeId: req.userId,
        status: 'transaction',
      };

      let updateOptions = {
        shippingDate: new Date(),
        status: 'shipping',
      };

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, { new: true });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  // [PATCH] /api/orders/:id/payment
  payment: async (req, res, next) => {
    try {
      let filterOptions = {
        _id: req.params.id,
        status: 'order',
      };

      let updateOptions = {
        paymentDate: new Date(),
        status: 'transaction',
      };

      if (req.userType === 'staff' || req.userType === 'admin') {
        filterOptions.employeeId = req.userId;
        filterOptions.status = 'shipping';
        delete updateOptions.status;
      }

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, { new: true });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  // [PATCH] /api/orders/:id/complete
  complete: async (req, res, next) => {
    try {
      let filterOptions = {
        _id: req.params.id,
        employeeId: req.userId,
        status: 'shipping',
      };

      let updateOptions = {
        status: 'complete',
      };

      const orderCondition = await Order.findOne(filterOptions);
      if (orderCondition.paymentDate === undefined) {
        return res.status(400).json({ success: false, message: 'Order not found or not payment' });
      }

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, { new: true });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  // [PATCH] /api/orders/:id/cancel
  cancel: async (req, res, next) => {
    try {
      let filterOption = {
        _id: req.params.id,
        status: { $in: ['order', 'transaction', 'shipping', 'complete'] },
      };
      if (req.userType === 'staff') {
        filterOption.employeeId = req.userId;
      }

      const order = await Order.findOneAndUpdate(
        filterOption,
        { cancelDate: new Date(), status: 'cancel' },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      next(error);
    }
  },

  // [DELETE] /api/orders/:id
  delete: async (req, res) => {
    try {
      const orderDeleteCondition = { _id: req.params.id, customer: req.userId, status: 'order' };
      const orderDeleted = await Order.findOneAndDelete(orderDeleteCondition);

      if (!orderDeleted) {
        return res.status(403).json({ success: false, message: 'Order not found' });
      }

      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};

module.exports = OrderController;
