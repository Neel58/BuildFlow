const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.route('/queue')
  .get(logisticsController.getQueue);

router.route('/:orderId/package')
  .post(authorize('Admin'), logisticsController.confirmPackaging);

// Support both /shipment (as in api's.md) and /ship
router.route('/:orderId/shipment')
  .post(authorize('Admin'), logisticsController.shipOrder);

router.route('/:orderId/ship')
  .post(authorize('Admin'), logisticsController.shipOrder);

router.route('/:orderId/tracking')
  .get(logisticsController.getTracking);

router.route('/:orderId/failed-delivery')
  .put(authorize('Admin'), logisticsController.failedDelivery);

router.route('/:orderId/delivery-status')
  .put(logisticsController.updateDeliveryStatus);

module.exports = router;
