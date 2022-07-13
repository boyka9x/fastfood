const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Order = new Schema(
  {
    totalPrice: { type: Number, default: 0 },
    comments: { type: String },
    confirmDate: { type: Date },
    paymentDate: { type: Date },
    shipmentDate: { type: Date },
    cancelDate: { type: Date },
    couponId: { type: Schema.Types.ObjectId, ref: 'coupons' },
    customerId: { type: Schema.Types.ObjectId, ref: 'customers' },
    employeeId: { type: Schema.Types.ObjectId, ref: 'employees' },
    products: {
      type: Array,
      default: [
        {
          productId: { type: Schema.Types.ObjectId, ref: 'products' },
          quantity: { type: Number, min: 1, required: true },
          price: { type: Number, min: 0, required: true },
        },
      ],
    },
    status: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

Order.index({ customerId: 'text' });

module.exports = mongoose.model('orders', Order);
