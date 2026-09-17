const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

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

// In a real application, this route would be protected by an 'admin' role middleware
router.route('/:id/status')
  .put(orderController.updateOrderStatus);

module.exports = router;
