const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/tasks', authorize('Admin', 'Inspector', 'Technician'), qaController.getTasks);
router.get('/queue', authorize('Admin', 'Inspector', 'Technician'), qaController.getQueue);
router.get('/:orderId', authorize('Admin', 'Inspector', 'Technician'), qaController.getTaskDetails);

router.put('/:orderId/check', authorize('Admin', 'Inspector'), qaController.updateCheck);
router.post('/:orderId/report', authorize('Admin', 'Inspector'), qaController.recordReport);
router.put('/:orderId/decision', authorize('Admin', 'Inspector'), qaController.recordDecision);

module.exports = router;
