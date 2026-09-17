const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Component = require('../models/Component');
const CustomBuild = require('../models/CustomBuild');
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
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(calculatedTotal * 100), 
      currency: 'usd',
      metadata: { userId: req.user._id.toString() }
    });

    const newOrder = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: 'Pending', 
      shippingAddress,
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
    const { paymentIntentId } = req.body;

    const order = await Order.findOne({ paymentIntentId, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Order is already processed' });
    }

    // Verify PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not succeeded' });
    }

    order.status = 'Payment Verified';
    await order.save();

    // Empty Cart
    const cart = await Cart.findOne({ user: req.user._id });
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
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.componentId')
      .populate('items.customBuildId');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.componentId')
      .populate('items.customBuildId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, assemblyNotes, qaNotes, trackingNumber } = req.body;
    
    const validStatuses = [
      'Pending', 'Payment Verified', 'Warehouse Allocating', 'Assembly Queue', 
      'In Assembly', 'QA Inspection', 'QA Failed', 'Packaging', 
      'Shipped', 'Delivered', 'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id).populate('items.customBuildId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    const previousStatus = order.status;
    order.status = status;
    if (assemblyNotes) order.assemblyNotes = assemblyNotes;
    if (qaNotes) order.qaNotes = qaNotes;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    // Handle inventory logic based on status changes
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      // Release reservation
      const componentsToRelease = [];
      for (const item of order.items) {
        if (item.itemType === 'Component') {
          componentsToRelease.push({ componentId: item.componentId, quantity: item.quantity });
        } else if (item.itemType === 'CustomBuild') {
          const build = await CustomBuild.findById(item.customBuildId);
          if (build && build.components) {
            for (const buildCompId of build.components) {
              componentsToRelease.push({ componentId: buildCompId, quantity: item.quantity });
            }
          }
        }
      }
      for (const releaseReq of componentsToRelease) {
        await Component.findByIdAndUpdate(releaseReq.componentId, {
          $inc: { reservedStock: -releaseReq.quantity }
        });
      }
    } else if (status === 'Shipped' && previousStatus !== 'Shipped') {
      // Fulfill stock (decrement total stock and reserved stock)
      const componentsToFulfill = [];
      for (const item of order.items) {
        if (item.itemType === 'Component') {
          componentsToFulfill.push({ componentId: item.componentId, quantity: item.quantity });
        } else if (item.itemType === 'CustomBuild') {
          const build = await CustomBuild.findById(item.customBuildId);
          if (build && build.components) {
            for (const buildCompId of build.components) {
              componentsToFulfill.push({ componentId: buildCompId, quantity: item.quantity });
            }
          }
        }
      }
      for (const fulfillReq of componentsToFulfill) {
        await Component.findByIdAndUpdate(fulfillReq.componentId, {
          $inc: { stock: -fulfillReq.quantity, reservedStock: -fulfillReq.quantity }
        });
      }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};
