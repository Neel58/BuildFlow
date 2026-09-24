const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['Email', 'SMS', 'In-App'],
    default: 'In-App'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Sent', 'Failed'],
    default: 'Sent'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
