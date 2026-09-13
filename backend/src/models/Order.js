const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  component: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtPurchase: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'Pending', 
      'Payment Verified', 
      'Warehouse Allocating', 
      'Assembly Queue', 
      'In Assembly',
      'QA Inspection', 
      'QA Failed', 
      'Packaging', 
      'Shipped', 
      'Delivered',
      'Cancelled'
    ],
    default: 'Pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  paymentIntentId: String,
  trackingNumber: String,
  assemblyNotes: String,
  qaNotes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
