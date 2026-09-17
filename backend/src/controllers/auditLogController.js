const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs (Admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { actor, action, entityType } = req.query;
    let query = {};

    if (actor) {
      query.$or = [{ actor }, { performedBy: actor }];
    }
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }
    if (entityType) {
      query.entityType = entityType;
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .populate('actor', 'firstName lastName email role')
      .populate('performedBy', 'firstName lastName email role');

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// GET /api/audit-logs/:id (Admin)
exports.getAuditLogById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('actor', 'firstName lastName email role')
      .populate('performedBy', 'firstName lastName email role');

    if (!log) return res.status(404).json({ message: 'Audit log not found' });
    res.json(log);
  } catch (error) {
    next(error);
  }
};

// POST /api/audit-logs (System / Admin)
exports.createAuditLog = async (req, res, next) => {
  try {
    const { action, actor, performedBy, targetId, targetEntity, entityType, changes, previousValue, newValue, description } = req.body;

    const log = new AuditLog({
      action,
      actor: actor || performedBy || req.user._id,
      performedBy: performedBy || actor || req.user._id,
      targetId: targetId || targetEntity,
      targetEntity: targetEntity || targetId,
      entityType: entityType || 'System',
      changes,
      previousValue,
      newValue,
      description,
      ipAddress: req.ip
    });

    const savedLog = await log.save();
    res.status(201).json(savedLog);
  } catch (error) {
    next(error);
  }
};
