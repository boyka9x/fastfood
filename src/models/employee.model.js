const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const Schema = mongoose.Schema;

const Employee = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String },
    address: { type: String, required: true },
    type: { type: String, required: true },
    refreshToken: { type: String },
  },
  {
    timestamps: true,
  }
);

Employee.index({ username: 'text' });

Employee.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: 'all',
});

module.exports = mongoose.model('employees', Employee);
