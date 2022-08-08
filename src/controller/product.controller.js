const Product = require('../models/product.model');

const ProductController = {
  // [GET] /api/products
  getList: (req, res) => {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 5;

    let searchOptions = {
      type: req.query.type || undefined,
    };

    if (req.query.name_like) {
      searchOptions.$text = { $search: req.query.name_like };
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;

    Product.find(searchOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('type')
      .exec((err, products) => {
        if (err) return res.status(500).json({ err });

        Product.countDocuments(searchOptions).exec((err, count) => {
          if (err) return res.status(500).json({ err });

          res.json({
            status: 'success',
            data: products,
            pagination: { _page: page, _limit: limit, _totalRecords: count },
          });
        });
      });
  },

  // [GET] /api/products/deleted
  getListDeleted: (req, res) => {
    const page = parseInt(req.query._page) || 1;
    const limit = parseInt(req.query._limit) || 5;

    let searchOptions = {};

    if (req.query.name_like) {
      searchOptions.$text = { $search: req.query.name_like };
    }

    if (page < 1) page = 1;
    if (limit < 1) limit = 5;

    Product.findDeleted(searchOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('type')
      .exec((err, products) => {
        if (err) return res.status(500).json({ err });

        Product.countDocumentsDeleted(searchOptions).exec((err, count) => {
          if (err) return res.status(500).json({ err });

          res.json({
            data: products,
            pagination: { _page: page, _limit: limit, _totalRecords: count },
          });
        });
      });
  },

  // [GET] /api/products/:slug
  getBySlug: (req, res) => {
    try {
      Product.findOne({ slug: req.params.slug })
        .populate('type')
        .exec((err, product) => {
          if (err) return res.status(500).json({ err });

          res.json({ status: 'success', data: product });
        });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [GET] /api/products/:id/edit
  getById: (req, res) => {
    try {
      Product.findOne({ _id: req.params.id })
        .populate('type')
        .exec((err, product) => {
          if (err) return res.status(500).json({ err });

          res.json(product);
        });
      // if (!product) {
      //   return res.status(401).json({ success: false, message: 'Product not found' });
      // }

      // res.json(product);
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/products
  create: async (req, res) => {
    const { name, price, priceDiscount, status, type, image } = req.body;

    if (!name || price <= 0 || !type) {
      return res.status(400).json({ status: 'error', message: 'Invalid product info' });
    }

    if (priceDiscount > price) {
      return res.status(400).json({ status: 'error', message: 'Invalid product price' });
    }

    try {
      let newProduct = new Product({
        name,
        price,
        priceDiscount,
        status,
        type,
        image: image || '',
      });
      await newProduct.save();

      res.json(newProduct);
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [PUT] /api/products/:id
  update: async (req, res) => {
    const { name, price, priceDiscount, status, type, image, slug } = req.body;

    if (!name || !price || !slug) {
      return res.status(400).json({ status: 'error', message: 'Invalid product information' });
    }

    try {
      let updatedProduct = {
        name,
        slug,
        price,
        priceDiscount: priceDiscount || 0,
        status: status || 'Hot',
        image: image || '',
        type,
      };

      updatedProduct = await Product.updateOne({ _id: req.params.id }, updatedProduct, {
        new: true,
      });

      if (!updatedProduct) {
        return res.status(401).json({ status: 'success', message: 'Product not found' });
      }

      res.json(updatedProduct);
    } catch (error) {
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [DELETE] /api/products/:id
  delete: async (req, res) => {
    try {
      const deletedProduct = await Product.delete({ _id: req.params.id });

      if (!deletedProduct) {
        return res.status(400).json({ status: 'error', message: 'Product not found' });
      }

      res.json({ status: 'success', message: 'Product deleted' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [PATCH] /api/products/:id/restore
  restore: async (req, res) => {
    try {
      const restoredProduct = await Product.restore({ _id: req.params.id });

      if (!restoredProduct) {
        return res.status(400).json({ status: 'error', message: 'Product not found' });
      }

      res.json({ status: 'success', message: 'Product restored' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};

module.exports = ProductController;
