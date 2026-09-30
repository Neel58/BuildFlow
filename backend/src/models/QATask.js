const mongoose = require('mongoose');

const checkItemSchema = new mongoose.Schema({
  id: String,
  label: String,
  description: String,
  passed: { type: Boolean, default: false }
}, { _id: false });

const qaTaskSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderId: {
    type: String,
    index: true
  },
  rigName: String,
  customer: mongoose.Schema.Types.Mixed,
  inspector: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    default: 'Ready For Inspection'
  },
  decision: {
    type: String,
    enum: ['Pending', 'Passed', 'Failed'],
    default: 'Pending'
  },
  priority: {
    type: String,
    default: 'STANDARD'
  },
  technicianName: String,
  chamberNumber: {
    type: String,
    default: 'QA Chamber 01 - Thermal Loop'
  },
  components: [mongoose.Schema.Types.Mixed],
  checks: [checkItemSchema],
  report: {
    type: String,
    default: ''
  },
  testedAt: Date
}, { timestamps: true, strict: false });

module.exports = mongoose.model('QATask', qaTaskSchema);
