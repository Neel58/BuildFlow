const mongoose = require('mongoose');

const qaTaskSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  inspector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  report: {
    type: String,
    default: ''
  },
  decision: {
    type: String,
    enum: ['Pending', 'Passed', 'Failed'],
    default: 'Pending'
  },
  testedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('QATask', qaTaskSchema);
