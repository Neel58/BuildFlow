const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.use(authorize('Admin'));

router.get('/', auditLogController.getAuditLogs);
router.get('/:id', auditLogController.getAuditLogById);
router.post('/', auditLogController.createAuditLog);

module.exports = router;
