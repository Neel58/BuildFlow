const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

// Analytics dashboard: Admin-only (contains revenue, order volumes, user counts)
router.get('/dashboard', authorize('Admin'), analyticsController.getDashboardMetrics);

module.exports = router;
