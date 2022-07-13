const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductCategory = new Schema(
  {
    name: { type: String, required: true },
  },
  { timestamp: true }
);

module.exports = mongoose.model('product_categories', ProductCategory);
