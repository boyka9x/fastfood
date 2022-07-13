const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Payment = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'customers' },
    cardType: { type: String, required: true },
    cardNo: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('payments', Payment);
