const mongoose = require('mongoose');

const logisticsTaskSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  handler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Packaging', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered', 'Failed Delivery', 'Returned'],
    default: 'Packaging'
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  courier: {
    type: String,
    default: ''
  },
  failureReason: {
    type: String,
    default: ''
  },
  packagedAt: {
    type: Date
  },
  shippedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('LogisticsTask', logisticsTaskSchema);
