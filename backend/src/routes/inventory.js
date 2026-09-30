const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/picks', authorize('Admin', 'Warehouse', 'Technician'), inventoryController.getPicks);
router.post('/pick-item', authorize('Admin', 'Warehouse', 'Technician'), inventoryController.pickItem);
router.post('/intake', authorize('Admin', 'Warehouse'), inventoryController.intakeStock);

router.get('/low-stock', inventoryController.getLowStock);
router.get('/', inventoryController.getInventory);
router.get('/:componentId', inventoryController.getComponentInventory);

// Warehouse Manager / Admin stock adjustment & lifecycle overrides
router.put('/:componentId/adjust', authorize('Admin', 'Warehouse'), inventoryController.adjustStock);
router.post('/reserve', authorize('Admin', 'Warehouse'), inventoryController.reserveStock);
router.post('/allocate', authorize('Admin', 'Warehouse'), inventoryController.allocateStock);
router.post('/release', authorize('Admin', 'Warehouse'), inventoryController.releaseStock);

module.exports = router;
