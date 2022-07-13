const ProductCategory = require('../models/pro-category.model');

const ProductCategoryController = {
  // [GET] /api/product-category
  getList: async (req, res) => {
    try {
      const productCategory = await ProductCategory.find();
      res.json({ status: 'success', data: productCategory });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [GET] /api/product-category/:id
  getById: async (req, res) => {
    try {
      const productCategory = await ProductCategory.findById(req.params.id);

      if (!productCategory) {
        return res.status(401).json({ status: 'error', message: 'Product category not found' });
      }

      res.json({ data: productCategory });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [POST] /api/product-category
  create: async (req, res) => {
    const { name, image } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Invalid name' });
    }

    try {
      const newProductCategory = new ProductCategory({ name, image });
      await newProductCategory.save();
      res.json({ status: 'success', message: 'Happy!', data: newProductCategory });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [PUT] /api/product-category/:id
  update: async (req, res) => {
    const { name, image } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Invalid name' });
    }

    try {
      const updated = await ProductCategory.findByIdAndUpdate(
        req.params.id,
        { name, image },
        { new: true }
      );

      if (!updated) {
        return res.status(401).json({ status: 'error', message: 'Product category not found' });
      }

      res.json({ status: 'success', message: 'Excellent progress!', data: updated });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // [DELETE] /api/product-category/:id
  delete: async (req, res) => {
    try {
      const deleted = await ProductCategory.findByIdAndDelete(req.params.id);

      if (!deleted) {
        return res.status(401).json({ status: 'error', message: 'Product category not found' });
      }

      res.json({ status: 'success', message: 'Success!', data: deleted });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
};

module.exports = ProductCategoryController;
