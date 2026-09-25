const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.post('/checkout', orderController.checkout);
router.post('/confirm-payment', orderController.confirmPayment);

router.get('/user/:userId', orderController.getUserOrders);
router.get('/:id/invoice', orderController.getInvoice);
router.post('/:id/reorder', orderController.reorder);

// Admin state override & status updates
router.put('/:id/state', authorize('Admin'), orderController.overrideOrderState);
router.put('/:id/status', authorize('Admin'), orderController.updateOrderStatus);

router.route('/')
  .post(orderController.checkout)
  .get((req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
      return orderController.getAllOrders(req, res, next);
    }
    return orderController.getUserOrders(req, res, next);
  });

router.get('/:id', orderController.getOrderById);

module.exports = router;
