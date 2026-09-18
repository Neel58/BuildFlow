const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Routes matching api's.md exact specification
router.route('/:userId/items/:itemId')
  .put(cartController.updateCartItem)
  .delete(cartController.removeFromCart);

router.route('/:userId/items')
  .post(cartController.addToCart);

router.route('/:userId')
  .get(cartController.getCart);

// Legacy convenience routes
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
