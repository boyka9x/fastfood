const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/order.model');

const OrderController = {
  // [GET] /api/orders/customer
  getListByCustomer: async (req, res) => {
    const { order_date } = req.query;
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 5;
    const sortCreatedAt = order_date ? 1 : -1;

    let searchOptions = {
      customerId: req.userId,
      status: req.query.status || undefined,
    };

    if (req.query.id) {
      searchOptions._id = req.query.id;
    }

    if (order_date) {
      let orderDate = order_date.split('T')[0];
      searchOptions.createdAt = {
        $gte: `${orderDate}T00:00:00.000Z`,
        $lte: `${orderDate}T23:59:59.999Z`,
      };
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;

    try {
      const orders = await Order.find(searchOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: sortCreatedAt })
        .populate({
          path: 'products',
          populate: {
            path: 'productId',
            model: 'products',
          },
        });
      const count = await Order.countDocuments(searchOptions);

      res.json({
        status: 'success',
        data: orders,
        pagination: { _page: page, _limit: limit, _totalRecords: count },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [GET] /api/orders/manager
  getListByManager: async (req, res) => {
    const { order_date, update_date, is_confirmed } = req.query;
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 5;
    const sortCreatedAt = req.query.order_date ? 1 : -1;
    let searchOptions = {
      status: req.query.status || undefined,
      employeeId: req.query.employeeId || undefined,
      customerId: req.query.customerId || undefined,
    };

    if (order_date) {
      let orderDate = order_date.split('T')[0];
      searchOptions.createdAt = {
        $gte: `${orderDate}T00:00:00.000Z`,
        $lte: `${orderDate}T23:59:59.999Z`,
      };
    }

    if (update_date) {
      let orderDate = update_date.split('T')[0];
      searchOptions.updatedAt = {
        $gte: `${orderDate}T00:00:00.000Z`,
        $lte: `${orderDate}T23:59:59.999Z`,
      };
    }

    if (is_confirmed === false) {
      searchOptions.confirmDate = { $exists: false };
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;

    try {
      const orders = await Order.find(searchOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: sortCreatedAt })
        .populate({
          path: 'products',
          populate: {
            path: 'productId',
            model: 'products',
          },
        });
      // .exists('confirmDate', is_confirmed || true);
      const count = await Order.countDocuments(searchOptions);

      res.json({
        status: 'success',
        data: orders,
        pagination: { _page: page, _limit: limit, _totalRecords: count },
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [GET] /api/orders/:id
  getById: async (req, res, next) => {
    try {
      let filterOptions = {
        _id: req.params.id,
      };

      if (req.userType === 'customer') {
        filterOptions.customerId = req.userId;
      }

      const order = await Order.findOne(filterOptions).populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'products',
        },
      });
      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }

      res.json({ status: 'success', data: order });
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

      const newProducts = products.map((product) => ({
        productId: product._id,
        quantity: product.quantity,
        price: product.priceDiscount !== 0 ? product.priceDiscount : product.price,
        name: product.name,
      }));

      const newOrder = new Order({
        totalPrice,
        comments,
        customerId,
        products: newProducts,
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
      return res.status(404).json({ status: 'error', message: 'Invalid products' });
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
        res.status(401).json({ status: 'error', message: 'Order not found' });
      }

      res.json({ status: 'success', message: 'Order saved successfully' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
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
          .json({ status: 'error', message: 'Order has been confirmed or not found' });
      }

      let updateOptions = {
        confirmDate: new Date(),
        employeeId: req.userId,
        status: 'transaction',
      };

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, {
        new: true,
      }).populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'products',
        },
      });

      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }
      res.json({ status: 'success', message: 'Order confirmed successfully', data: order });
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
        shipmentDate: new Date(),
        status: 'shipping',
      };

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, {
        new: true,
      }).populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'products',
        },
      });

      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }
      res.json({ status: 'success', message: 'Order shipping successfully', data: order });
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

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, {
        new: true,
      }).populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'products',
        },
      });

      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }
      res.json({ status: 'success', message: 'Order payment successfully', data: order });
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
        return res.status(400).json({ status: 'error', message: 'Order not found or not payment' });
      }

      const order = await Order.findOneAndUpdate(filterOptions, updateOptions, {
        new: true,
      }).populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'products',
        },
      });

      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }
      res.json({ status: 'success', message: 'Order complete successfully', data: order });
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
      ).populate({
        path: 'products',
        populate: {
          path: 'productId',
          model: 'products',
        },
      });

      if (!order) {
        return res.status(404).json({ status: 'error', message: 'Order not found' });
      }

      res.json({ status: 'success', message: 'Order cancel successfully', data: order });
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
        return res.status(403).json({ status: 'error', message: 'Order not found' });
      }

      res.json({ status: 'success', message: 'Order deleted successfully' });
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};

module.exports = OrderController;
