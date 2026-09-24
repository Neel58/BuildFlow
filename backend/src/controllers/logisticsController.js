const LogisticsTask = require('../models/LogisticsTask');
const Order = require('../models/Order');
const Component = require('../models/Component');
const CustomBuild = require('../models/CustomBuild');

// 1. List orders waiting for packaging
exports.getQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'Packaging' })
      .populate('items.componentId')
      .populate('items.customBuildId');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// 2. Confirm packaging
exports.confirmPackaging = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'Packaging') {
      return res.status(400).json({ message: 'Order is not in Packaging state' });
    }

    const QATask = require('../models/QATask');
    const qa = await QATask.findOne({ order: orderId });
    if (!qa || qa.decision !== 'Passed') {
      return res.status(400).json({ message: 'Order has not passed QA' });
    }

    let task = await LogisticsTask.findOne({ order: orderId });
    if (!task) {
      task = new LogisticsTask({
        order: orderId,
        handler: req.user._id,
        status: 'Ready to Ship',
        packagedAt: Date.now()
      });
    } else {
      task.status = 'Ready to Ship';
      task.packagedAt = Date.now();
      task.handler = req.user._id;
    }

    await task.save();

    // Order status remains 'Packaging' until it is physically shipped
    // await order.save(); // Not needed if we don't modify the order here

    res.json({ message: 'Order packaged and ready to ship', task });
  } catch (error) {
    next(error);
  }
};

// 3. Ship order
exports.shipOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, courier } = req.body;

    if (!trackingNumber || !courier) {
      return res.status(400).json({ message: 'Tracking number and courier are required' });
    }

    const task = await LogisticsTask.findOne({ order: orderId });
    if (!task) return res.status(404).json({ message: 'Logistics task not found (needs to be packaged first)' });

    task.status = 'Shipped';
    task.trackingNumber = trackingNumber;
    task.courier = courier;
    task.shippedAt = Date.now();
    await task.save();

    const order = await Order.findById(orderId).populate('items.customBuildId');
    order.status = 'Shipped';
    order.trackingNumber = trackingNumber;
    
    // Inventory Fulfillment Logic
    // We deduct from actual stock and release the reservation since the item has physically left.
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

    await order.save();

    res.json({ message: 'Order shipped', task, orderStatus: order.status });
  } catch (error) {
    next(error);
  }
};

// 4. Get Tracking Info
exports.getTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const task = await LogisticsTask.findOne({ order: orderId });
    if (!task) return res.status(404).json({ message: 'Tracking info not found for this order' });

    res.json({
      status: task.status,
      trackingNumber: task.trackingNumber,
      courier: task.courier,
      failureReason: task.failureReason,
      packagedAt: task.packagedAt,
      shippedAt: task.shippedAt,
      deliveredAt: task.deliveredAt
    });
  } catch (error) {
    next(error);
  }
};

// 5. Failed Delivery
exports.failedDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason, returnToWarehouse } = req.body;

    const task = await LogisticsTask.findOne({ order: orderId });
    if (!task) return res.status(404).json({ message: 'Logistics task not found' });

    task.status = returnToWarehouse ? 'Returned' : 'Failed Delivery';
    task.failureReason = reason || 'Unknown';
    await task.save();

    const order = await Order.findById(orderId);
    // You could map this back to Order status, but keeping Order as 'Shipped' and relying on logistics task is fine
    // Or set Order status to 'Delivery Failed' if added to valid order statuses.
    // For now we just track it in the LogisticsTask.

    res.json({ message: 'Delivery failure recorded', task });
  } catch (error) {
    next(error);
  }
};

// 6. Update Delivery Status (Webhook Stub)
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, timestamp } = req.body; // e.g. status: 'Delivered', 'Out for Delivery'

    const validStatuses = ['Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status update' });
    }

    const task = await LogisticsTask.findOne({ order: orderId });
    if (!task) return res.status(404).json({ message: 'Logistics task not found' });

    task.status = status;
    if (status === 'Delivered') {
      task.deliveredAt = timestamp || Date.now();
      
      // Optionally update the main Order status
      const order = await Order.findById(orderId);
      if (order) {
        order.status = 'Delivered';
        await order.save();
      }
    }

    await task.save();

    res.json({ message: 'Delivery status updated', task });
  } catch (error) {
    next(error);
  }
};
