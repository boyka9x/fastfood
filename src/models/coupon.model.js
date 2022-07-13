const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Coupon = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true, min: 1, max: 100 },
    count: { type: Number, required: true, min: 0 },
    expireDate: { type: Date, required: true },
    status: { type: String, required: true },
    customers: [{ type: Schema.Types.ObjectId, ref: 'customers' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('coupons', Coupon);
