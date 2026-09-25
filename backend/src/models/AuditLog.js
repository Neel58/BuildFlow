const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetId: {
    type: mongoose.Schema.Types.Mixed
  },
  targetEntity: {
    type: mongoose.Schema.Types.Mixed
  },
  entityType: {
    type: String
  },
  changes: mongoose.Schema.Types.Mixed,
  previousValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  description: String,
  ipAddress: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware pre-save to mirror actor and performedBy, targetId and targetEntity
auditLogSchema.pre('save', function() {
  if (this.actor && !this.performedBy) this.performedBy = this.actor;
  if (this.performedBy && !this.actor) this.actor = this.performedBy;
  if (this.targetId && !this.targetEntity) this.targetEntity = this.targetId;
  if (this.targetEntity && !this.targetId) this.targetId = this.targetEntity;
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
