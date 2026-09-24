const express = require('express');
const {
  getComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent
} = require('../controllers/componentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

router.get('/', getComponents);
router.get('/:id', getComponentById);

// Admin routes
router.post('/', protect, authorize('Admin'), createComponent);
router.put('/:id', protect, authorize('Admin'), updateComponent);
router.delete('/:id', protect, authorize('Admin'), deleteComponent);

module.exports = router;
