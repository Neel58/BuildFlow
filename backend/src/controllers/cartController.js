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

// Get target userId helper
const getTargetUserId = (req) => {
  return req.params.userId || (req.user && req.user._id);
};

exports.getCart = async (req, res, next) => {
  try {
    const userId = getTargetUserId(req);
    let cart = await Cart.findOne({ user: userId })
      .populate('items.componentId')
      .populate('items.customBuildId');

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    } else {
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
    const userId = getTargetUserId(req);
    const { itemType, itemId, quantity = 1, componentId, customBuildId } = req.body;
    const effectiveItemType = itemType || (componentId ? 'Component' : (customBuildId ? 'CustomBuild' : null));
    const effectiveItemId = itemId || componentId || customBuildId;

    if (!['Component', 'CustomBuild'].includes(effectiveItemType) || !effectiveItemId) {
      return res.status(400).json({ message: 'Invalid itemType or itemId' });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => {
      if (effectiveItemType === 'Component') return item.componentId && item.componentId.toString() === effectiveItemId;
      if (effectiveItemType === 'CustomBuild') return item.customBuildId && item.customBuildId.toString() === effectiveItemId;
      return false;
    });

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      const newItem = { itemType: effectiveItemType, quantity };
      if (effectiveItemType === 'Component') newItem.componentId = effectiveItemId;
      else newItem.customBuildId = effectiveItemId;
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
    const userId = getTargetUserId(req);
    const { itemId } = req.params; // _id of cart item or componentId/customBuildId
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    let item = cart.items.id(itemId);
    if (!item) {
      item = cart.items.find(i => 
        (i.componentId && i.componentId.toString() === itemId) || 
        (i.customBuildId && i.customBuildId.toString() === itemId)
      );
    }

    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    if (quantity <= 0) {
      cart.items.pull(item._id);
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
    const userId = getTargetUserId(req);
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    let item = cart.items.id(itemId);
    if (!item) {
      item = cart.items.find(i => 
        (i.componentId && i.componentId.toString() === itemId) || 
        (i.customBuildId && i.customBuildId.toString() === itemId)
      );
    }

    if (item) {
      cart.items.pull(item._id);
      cart.totalPrice = await calculateTotalPrice(cart);
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = getTargetUserId(req);
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};
