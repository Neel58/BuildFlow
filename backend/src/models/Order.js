const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['Component', 'CustomBuild'],
    required: true
  },
  componentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component'
  },
  customBuildId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomBuild'
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

// Ensure either component or custom build is provided based on itemType
orderItemSchema.pre('validate', function() {
  if (this.itemType === 'Component' && !this.componentId) {
    throw new Error('Component ID is required when itemType is Component');
  }
  if (this.itemType === 'CustomBuild' && !this.customBuildId) {
    throw new Error('CustomBuild ID is required when itemType is CustomBuild');
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
