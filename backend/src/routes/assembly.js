const express = require('express');
const router = express.Router();
const assemblyController = require('../controllers/assemblyController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/tasks', authorize('Admin', 'Technician', 'Inspector'), assemblyController.getTasks);
router.get('/queue', authorize('Admin', 'Technician', 'Inspector'), assemblyController.getQueue);

router.get('/:orderId', authorize('Admin', 'Technician', 'Inspector'), assemblyController.getTaskDetails);

router.route('/:orderId/assign')
  .put(authorize('Admin', 'Technician'), assemblyController.assignOrder)
  .post(authorize('Admin', 'Technician'), assemblyController.assignOrder);

router.post('/:orderId/progress', authorize('Admin', 'Technician'), assemblyController.recordProgress);
router.put('/:orderId/milestone', authorize('Admin', 'Technician'), assemblyController.updateMilestone);
router.put('/:orderId/checklist', authorize('Admin', 'Technician'), assemblyController.updateChecklist);
router.put('/:orderId/bios', authorize('Admin', 'Technician'), assemblyController.updateBios);
router.put('/:orderId/complete', authorize('Admin', 'Technician'), assemblyController.completeAssembly);

module.exports = router;
