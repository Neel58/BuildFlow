const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
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
    min: 1,
    default: 1
  }
});

// Ensure either component or custom build is provided based on itemType
cartItemSchema.pre('validate', function(next) {
  if (this.itemType === 'Component' && !this.componentId) {
    return next(new Error('Component ID is required when itemType is Component'));
  }
  if (this.itemType === 'CustomBuild' && !this.customBuildId) {
    return next(new Error('CustomBuild ID is required when itemType is CustomBuild'));
  }
  next();
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One active cart per user
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
