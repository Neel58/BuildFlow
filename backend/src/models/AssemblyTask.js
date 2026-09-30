const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema({
  id: String,
  log: {
    type: String,
    required: true
  },
  tech: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const componentChecklistSchema = new mongoose.Schema({
  slot: String,
  name: String,
  bin: String,
  serialNumber: String,
  verified: { type: Boolean, default: false },
  scanned: { type: Boolean, default: false }
}, { _id: false });

const milestoneSchema = new mongoose.Schema({
  id: String,
  stepNumber: Number,
  title: String,
  description: String,
  done: { type: Boolean, default: false },
  completedAt: Date
}, { _id: false });

const assemblyTaskSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderId: {
    type: String,
    index: true
  },
  technician: {
    type: mongoose.Schema.Types.Mixed
  },
  bayNumber: {
    type: String,
    default: 'Bay 02 - Clean ESD Bench'
  },
  priority: {
    type: String,
    default: 'STANDARD'
  },
  rigName: {
    type: String,
    default: 'Custom Engineered Rig'
  },
  customer: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  componentsChecklist: [componentChecklistSchema],
  milestones: [milestoneSchema],
  biosConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  benchDiagnostics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  progressLogs: [progressLogSchema],
  startedAt: Date,
  assignedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  estimatedMinutes: { type: Number, default: 120 },
  elapsedMinutes: { type: Number, default: 0 },
  notes: String
}, { timestamps: true, strict: false });

module.exports = mongoose.model('AssemblyTask', assemblyTaskSchema);
