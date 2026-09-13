const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'STOCK_ADJUSTMENT',
      'ORDER_STATUS_UPDATE',
      'QA_REPORT',
      'USER_ROLE_CHANGE',
      'COMPONENT_CREATED'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetEntity: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // ID of the component, order, or user affected
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Component', 'Order', 'User']
  },
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  description: String,
  ipAddress: String
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
