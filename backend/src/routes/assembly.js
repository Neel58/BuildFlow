const express = require('express');
const router = express.Router();
const assemblyController = require('../controllers/assemblyController');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all assembly routes
// In a real application, you would also add role-based access control here (e.g. restrict to 'technician' and 'admin')
router.use(protect);

router.route('/queue')
  .get(assemblyController.getQueue);

router.route('/:orderId/assign')
  .put(assemblyController.assignOrder);

router.route('/:orderId/progress')
  .post(assemblyController.recordProgress);

router.route('/:orderId/complete')
  .put(assemblyController.completeAssembly);

module.exports = router;
