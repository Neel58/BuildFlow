const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Tracking endpoint is open / customer viewable
router.get('/:orderId/tracking', logisticsController.getTracking);

router.use(protect);

router.get('/all', authorize('Admin', 'Logistics', 'Warehouse'), logisticsController.getAllLogistics);
router.get('/queue', authorize('Admin', 'Logistics', 'Warehouse'), logisticsController.getQueue);

router.post('/:orderId/package', authorize('Admin', 'Logistics', 'Warehouse'), logisticsController.confirmPackaging);
router.post('/:orderId/shipment', authorize('Admin', 'Logistics'), logisticsController.shipOrder);
router.post('/:orderId/ship', authorize('Admin', 'Logistics'), logisticsController.shipOrder);

router.put('/:orderId/failed-delivery', authorize('Admin', 'Logistics'), logisticsController.failedDelivery);
router.put('/:orderId/delivery-status', authorize('Admin', 'Logistics'), logisticsController.updateDeliveryStatus);

module.exports = router;
