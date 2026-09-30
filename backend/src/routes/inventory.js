const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// All inventory routes require authentication
router.use(protect);

// Cleanroom pick lists
router.get('/picks', authorize('Admin', 'Warehouse', 'Technician'), inventoryController.getPicks);
router.post('/pick-item', authorize('Admin', 'Warehouse', 'Technician'), inventoryController.pickItem);
router.post('/intake', authorize('Admin', 'Warehouse'), inventoryController.intakeStock);

// Low stock alerts (Admin and Warehouse only)
router.get('/low-stock', authorize('Admin', 'Warehouse'), inventoryController.getLowStock);

// General inventory read (Admin, Warehouse, Technician can read)
router.get('/', authorize('Admin', 'Warehouse', 'Technician'), inventoryController.getInventory);
router.get('/:componentId', authorize('Admin', 'Warehouse', 'Technician'), inventoryController.getComponentInventory);

// Stock management write operations
router.put('/:componentId/adjust', authorize('Admin', 'Warehouse'), inventoryController.adjustStock);
router.post('/reserve', authorize('Admin', 'Warehouse'), inventoryController.reserveStock);
router.post('/allocate', authorize('Admin', 'Warehouse'), inventoryController.allocateStock);
router.post('/release', authorize('Admin', 'Warehouse'), inventoryController.releaseStock);

module.exports = router;
