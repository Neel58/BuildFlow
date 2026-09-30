const mongoose = require('mongoose');

const logisticsTaskSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderId: {
    type: String,
    index: true
  },
  customer: mongoose.Schema.Types.Mixed,
  rigName: String,
  weightKg: { type: Number, default: 18.5 },
  packageDimensions: { type: String, default: '62 x 34 x 58 cm' },
  handler: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['Packaging', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered', 'Failed Delivery', 'Returned'],
    default: 'Packaging'
  },
  courier: {
    type: String,
    default: 'BlueDart Air Express'
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  serviceType: {
    type: String,
    default: 'Priority Air Freight / Insured'
  },
  insuredValue: {
    type: Number,
    default: 0
  },
  packagingDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  failureReason: {
    type: String,
    default: ''
  },
  packagedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  estimatedDelivery: String,
  notes: String
}, { timestamps: true, strict: false });

module.exports = mongoose.model('LogisticsTask', logisticsTaskSchema);
