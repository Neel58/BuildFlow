const mongoose = require('mongoose');

const customBuildSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Build name is required'],
    trim: true,
    default: 'My Custom Build'
  },
  components: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Component'
  }],
  totalPrice: {
    type: Number,
    default: 0
  },
  isCompatible: {
    type: Boolean,
    default: true
  },
  compatibilityIssues: [{
    type: String
  }],
  estimatedPowerDraw: {
    type: Number,
    default: 0
  },
  shareToken: {
    type: String,
    sparse: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CustomBuild', customBuildSchema);
