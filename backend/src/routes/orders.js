const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Protect all routes
router.use(protect);

router.route('/checkout')
  .post(orderController.checkout);

router.route('/confirm-payment')
  .post(orderController.confirmPayment);

router.route('/')
  .get(orderController.getUserOrders);

router.route('/:id')
  .get(orderController.getOrderById);

// Admin only route for updating status
router.route('/:id/status')
  .put(authorize('Admin'), orderController.updateOrderStatus);

module.exports = router;
