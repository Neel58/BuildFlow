const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.Mixed
  },
  performedBy: {
    type: mongoose.Schema.Types.Mixed
  },
  targetId: {
    type: mongoose.Schema.Types.Mixed
  },
  targetEntity: {
    type: mongoose.Schema.Types.Mixed
  },
  entityType: {
    type: String,
    default: 'System'
  },
  changes: mongoose.Schema.Types.Mixed,
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  description: String,
  ipAddress: String
}, {
  timestamps: true,
  strict: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

auditLogSchema.pre('save', function() {
  if (this.actor && !this.performedBy) this.performedBy = this.actor;
  if (this.performedBy && !this.actor) this.actor = this.performedBy;
  if (this.targetId && !this.targetEntity) this.targetEntity = this.targetId;
  if (this.targetEntity && !this.targetId) this.targetId = this.targetEntity;
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
