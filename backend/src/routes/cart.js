const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all cart routes
router.use(protect);

router.route('/')
  .get(cartController.getCart);

router.route('/add')
  .post(cartController.addToCart);

router.route('/update/:itemId')
  .put(cartController.updateCartItem);

router.route('/remove/:itemId')
  .delete(cartController.removeFromCart);

router.route('/clear')
  .delete(cartController.clearCart);

module.exports = router;
