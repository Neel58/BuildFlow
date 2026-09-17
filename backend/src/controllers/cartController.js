const Cart = require('../models/Cart');
const Component = require('../models/Component');
const CustomBuild = require('../models/CustomBuild');

// Helper function to calculate total price
const calculateTotalPrice = async (cart) => {
  let total = 0;
  for (const item of cart.items) {
    if (item.itemType === 'Component') {
      const comp = await Component.findById(item.componentId);
      if (comp) total += comp.price * item.quantity;
    } else if (item.itemType === 'CustomBuild') {
      const build = await CustomBuild.findById(item.customBuildId);
      if (build) total += build.totalPrice * item.quantity;
    }
  }
  return total;
};

exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.componentId')
      .populate('items.customBuildId');

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    } else {
      // Recalculate price in case component prices changed
      cart.totalPrice = await calculateTotalPrice(cart);
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { itemType, itemId, quantity = 1 } = req.body;

    if (!['Component', 'CustomBuild'].includes(itemType)) {
      return res.status(400).json({ message: 'Invalid itemType' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => {
      if (itemType === 'Component') return item.componentId && item.componentId.toString() === itemId;
      if (itemType === 'CustomBuild') return item.customBuildId && item.customBuildId.toString() === itemId;
      return false;
    });

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      const newItem = { itemType, quantity };
      if (itemType === 'Component') newItem.componentId = itemId;
      else newItem.customBuildId = itemId;
      cart.items.push(newItem);
    }

    cart.totalPrice = await calculateTotalPrice(cart);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.componentId')
      .populate('items.customBuildId');

    res.json(populatedCart);
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params; // This is the _id of the cartItem subdocument
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    if (quantity <= 0) {
      cart.items.pull(itemId);
    } else {
      item.quantity = quantity;
    }

    cart.totalPrice = await calculateTotalPrice(cart);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.componentId')
      .populate('items.customBuildId');

    res.json(populatedCart);
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items.pull(itemId);
    cart.totalPrice = await calculateTotalPrice(cart);
    await cart.save();

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};
