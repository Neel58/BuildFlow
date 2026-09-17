const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Component = require('../models/Component');
const CustomBuild = require('../models/CustomBuild');

// Helper to simulate payment gateway delay
const simulatePayment = () => new Promise(resolve => setTimeout(() => resolve('mock_tx_' + Date.now()), 1000));

exports.checkout = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    
    // Fetch cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Determine prices and build order items
    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of cart.items) {
      let price = 0;
      if (item.itemType === 'Component') {
        const comp = await Component.findById(item.componentId);
        if (comp) price = comp.price;
      } else if (item.itemType === 'CustomBuild') {
        const build = await CustomBuild.findById(item.customBuildId);
        if (build) price = build.totalPrice;
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

    // Mock Charge
    const transactionId = await simulatePayment();

    const newOrder = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: calculatedTotal,
      status: 'Payment Verified', // Skip Pending
      shippingAddress,
      paymentIntentId: transactionId
    });

    const savedOrder = await newOrder.save();

    // Empty Cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({ message: 'Order placed successfully', order: savedOrder });
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

// Update order status (simulated admin or automated workflow)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, assemblyNotes, qaNotes, trackingNumber } = req.body;
    
    // In a real system, this would be admin-only
    const validStatuses = [
      'Pending', 'Payment Verified', 'Warehouse Allocating', 'Assembly Queue', 
      'In Assembly', 'QA Inspection', 'QA Failed', 'Packaging', 
      'Shipped', 'Delivered', 'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    if (assemblyNotes) order.assemblyNotes = assemblyNotes;
    if (qaNotes) order.qaNotes = qaNotes;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};
