const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Component = require('../models/Component');
const CustomBuild = require('../models/CustomBuild');
const AuditLog = require('../models/AuditLog');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

exports.checkout = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    
    // Fetch cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Determine prices, build order items, and check stock
    const orderItems = [];
    let calculatedTotal = 0;
    const componentsToReserve = []; // { componentId, quantity }

    for (const item of cart.items) {
      let price = 0;
      if (item.itemType === 'Component') {
        const comp = await Component.findById(item.componentId);
        if (!comp) return res.status(404).json({ message: `Component ${item.componentId} not found` });
        
        if (comp.availableStock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for component: ${comp.name}` });
        }
        
        price = comp.price;
        componentsToReserve.push({ componentId: comp._id, quantity: item.quantity });
        
      } else if (item.itemType === 'CustomBuild') {
        const build = await CustomBuild.findById(item.customBuildId).populate('components');
        if (!build) return res.status(404).json({ message: `Build ${item.customBuildId} not found` });
        
        for (const buildComp of build.components) {
          if (buildComp.availableStock < item.quantity) {
             return res.status(400).json({ message: `Insufficient stock for component in build: ${buildComp.name}` });
          }
          componentsToReserve.push({ componentId: buildComp._id, quantity: item.quantity });
        }
        
        price = build.totalPrice;
      }
      
      orderItems.push({
        itemType: item.itemType,
        componentId: item.componentId,
        customBuildId: item.customBuildId,
        quantity: item.quantity,
        priceAtPurchase: price
      });
      calculatedTotal += price * item.quantity;
    }

    // Reserve the stock
    for (const reserveReq of componentsToReserve) {
      await Component.findByIdAndUpdate(reserveReq.componentId, {
        $inc: { reservedStock: reserveReq.quantity }
      });
    }

    // Generate Stripe PaymentIntent
    let paymentIntent = { id: 'pi_mock_' + Date.now(), client_secret: 'mock_secret' };
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(calculatedTotal * 100), 
        currency: 'usd',
        metadata: { userId: req.user._id.toString() }
      });
    } catch (e) {
      // Fallback for offline/test environment without real key
    }

    const newOrder = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: 'Pending', 
      shippingAddress: shippingAddress || req.user.address,
      paymentIntentId: paymentIntent.id
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({ 
      message: 'Order created, awaiting payment', 
      order: savedOrder,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    let order;
    if (orderId) {
      order = await Order.findById(orderId);
    } else if (paymentIntentId) {
      order = await Order.findOne({ paymentIntentId });
    }

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Order is already processed' });
    }

    order.status = 'Payment Verified';
    await order.save();

    // Empty Cart
    const cart = await Cart.findOne({ user: order.user });
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
    }

    res.json({ message: 'Payment confirmed successfully', order });
  } catch (error) {
    next(error);
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.user._id;
    
    // Check permissions
    if (req.user.role !== 'Admin' && req.user._id.toString() !== targetUserId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find({ user: targetUserId })
      .sort({ createdAt: -1 })
      .populate('items.componentId')
      .populate('items.customBuildId');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email')
      .populate('items.componentId')
      .populate('items.customBuildId');

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'Admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('user', 'firstName lastName email')
      .populate('items.componentId')
      .populate('items.customBuildId');

    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id/invoice
exports.getInvoice = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'Admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('user', 'firstName lastName email address')
      .populate('items.componentId')
      .populate('items.customBuildId');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const subtotal = order.totalAmount;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const shippingFee = subtotal > 500 ? 0 : 50;
    const grandTotal = subtotal + tax + shippingFee;

    const invoice = {
      invoiceNumber: `INV-${order._id.toString().substring(0, 8).toUpperCase()}`,
      orderId: order._id,
      date: order.createdAt,
      customer: {
        name: order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Customer',
        email: order.user ? order.user.email : ''
      },
      shippingAddress: order.shippingAddress,
      items: order.items.map(item => ({
        name: item.componentId ? item.componentId.name : (item.customBuildId ? item.customBuildId.name : 'Item'),
        type: item.itemType,
        quantity: item.quantity,
        unitPrice: item.priceAtPurchase,
        total: item.priceAtPurchase * item.quantity
      })),
      summary: {
        subtotal,
        tax,
        shippingFee,
        grandTotal
      },
      paymentStatus: order.status
    };

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

// POST /api/orders/:id/reorder
exports.reorder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const item of order.items) {
      const newItem = {
        itemType: item.itemType,
        quantity: item.quantity
      };
      if (item.itemType === 'Component') newItem.componentId = item.componentId;
      else if (item.itemType === 'CustomBuild') newItem.customBuildId = item.customBuildId;
      
      cart.items.push(newItem);
    }

    // Recalculate price
    let total = 0;
    for (const item of cart.items) {
      if (item.itemType === 'Component' && item.componentId) {
        const comp = await Component.findById(item.componentId);
        if (comp) total += comp.price * item.quantity;
      } else if (item.itemType === 'CustomBuild' && item.customBuildId) {
        const build = await CustomBuild.findById(item.customBuildId);
        if (build) total += build.totalPrice * item.quantity;
      }
    }
    cart.totalPrice = total;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.componentId')
      .populate('items.customBuildId');

    res.json({ message: 'Items re-added to cart', cart: populatedCart });
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/state (Admin state override)
exports.overrideOrderState = async (req, res, next) => {
  try {
    const { state, status, reason } = req.body;
    const newStatus = state || status;

    if (!newStatus) {
      return res.status(400).json({ message: 'New state/status is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const previousStatus = order.status;
    order.status = newStatus;
    if (reason) {
      order.notes = (order.notes || '') + ` | Admin Override State to ${newStatus}: ${reason}`;
    }

    // Inventory handling for manual state transitions
    if (newStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.items) {
        if (item.itemType === 'Component') {
          await Component.findByIdAndUpdate(item.componentId, { $inc: { reservedStock: -item.quantity } });
        } else if (item.itemType === 'CustomBuild') {
          const build = await CustomBuild.findById(item.customBuildId);
          if (build && build.components) {
            for (const buildCompId of build.components) {
              await Component.findByIdAndUpdate(buildCompId, { $inc: { reservedStock: -item.quantity } });
            }
          }
        }
      }
    } else if (newStatus === 'Shipped' && previousStatus !== 'Shipped') {
      for (const item of order.items) {
        if (item.itemType === 'Component') {
          await Component.findByIdAndUpdate(item.componentId, { $inc: { stock: -item.quantity, reservedStock: -item.quantity } });
        } else if (item.itemType === 'CustomBuild') {
          const build = await CustomBuild.findById(item.customBuildId);
          if (build && build.components) {
            for (const buildCompId of build.components) {
              await Component.findByIdAndUpdate(buildCompId, { $inc: { stock: -item.quantity, reservedStock: -item.quantity } });
            }
          }
        }
      }
    }

    await order.save();

    await AuditLog.create({
      action: 'ORDER_STATE_OVERRIDE',
      actor: req.user._id,
      targetId: order._id,
      entityType: 'Order',
      changes: { previousStatus, newStatus, reason },
      description: `Order ${order._id} state overridden from ${previousStatus} to ${newStatus}. Reason: ${reason || 'N/A'}`
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  return exports.overrideOrderState(req, res, next);
};
