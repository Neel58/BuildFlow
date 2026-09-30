const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['Component', 'CustomBuild'],
    default: 'Component'
  },
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component'
  },
  customBuildId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomBuild'
  },
  name: String,
  title: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  priceAtPurchase: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customer: {
    type: mongoose.Schema.Types.Mixed
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number
  },
  status: {
    type: String,
    enum: [
      'Pending', 
      'Payment Verified', 
      'PaymentConfirmed',
      'Warehouse Allocating', 
      'Assembly Queue', 
      'In Assembly',
      'InAssembly',
      'QA Inspection', 
      'QualityInspection',
      'QA Failed', 
      'Packaging', 
      'Ready to Ship',
      'Shipped', 
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    default: 'Completed'
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
  carrier: String,
  assemblyNotes: String,
  qaNotes: String,
  notes: String
}, {
  timestamps: true,
  strict: false
});

module.exports = mongoose.model('Order', orderSchema);
