const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slugify = require('slugify');

const mongooseDelete = require('mongoose-delete');

const Product = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    price: { type: Number, required: true, min: 0 },
    priceDiscount: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String },
    status: { type: String },
    type: { type: Schema.Types.ObjectId, ref: 'product_categories' },
  },
  {
    timestamps: true,
  }
);

Product.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true, trim: true });
  next();
});

Product.index({ name: 'text' });

Product.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: 'all',
});

module.exports = mongoose.model('products', Product);
