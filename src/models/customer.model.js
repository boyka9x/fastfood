const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Customer = new Schema(
  {
    username: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    image: { type: String },
    coin: { type: Number, default: 0 },
    type: { type: String, required: true },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
  }
);

Customer.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: 'all',
});

module.exports = mongoose.model('customers', Customer);
