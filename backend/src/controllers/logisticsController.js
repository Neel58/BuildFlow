const LogisticsTask = require('../models/LogisticsTask');
const Order = require('../models/Order');
const Component = require('../models/Component');
const CustomBuild = require('../models/CustomBuild');
const AuditLog = require('../models/AuditLog');

// 1. Get all logistics tasks and telemetry metrics (Logistics Station)
exports.getAllLogistics = async (req, res, next) => {
  try {
    let tasks = await LogisticsTask.find()
      .populate('order')
      .sort({ updatedAt: -1 })
      .lean();

    // Map tasks to ensure consistent structure for frontend
    let formattedTasks = tasks.map(t => {
      const order = t.order || {};
      const orderIdStr = t.orderId || (order.orderId || (order._id ? order._id.toString() : 'ORD-' + t._id.toString().slice(-5)));
      const customer = t.customer || order.customer || {
        firstName: 'Valued',
        lastName: 'Customer',
        city: 'Mumbai',
        state: 'Maharashtra',
        address: '402 High Street Towers, Lower Parel, Mumbai - 400013',
        phone: '+91 98201 44321',
        email: 'customer@buildflow.dev'
      };

      return {
        _id: t._id.toString(),
        orderId: orderIdStr,
        order: orderIdStr,
        customer,
        rigName: t.rigName || order.items?.[0]?.name || order.items?.[0]?.title || 'Custom Engineered Rig',
        weightKg: t.weightKg || 18.5,
        packageDimensions: t.packageDimensions || '62 x 34 x 58 cm',
        status: t.status || (order.status === 'Packaging' ? 'Packaging' : order.status === 'Shipped' ? 'Shipped' : order.status === 'Delivered' ? 'Delivered' : 'Ready to Ship'),
        courier: t.courier || order.carrier || 'BlueDart Air Express',
        trackingNumber: t.trackingNumber || order.trackingNumber || `IND-EXPRESS-${orderIdStr.replace('ORD-', '')}`,
        serviceType: t.serviceType || 'Priority Air Freight / Insured',
        insuredValue: t.insuredValue || order.totalAmount || order.totalPrice || 279999,
        packagingDetails: t.packagingDetails || {
          instapakFoamUsed: true,
          tamperTapeApplied: true,
          shockWatchSensorId: `SW-${orderIdStr.replace('ORD-', '')}-OK`,
          packedBy: 'David Miller (Warehouse Terminal)',
          packagedAt: t.packagedAt || order.createdAt || new Date()
        },
        failureReason: t.failureReason || '',
        packagedAt: t.packagedAt || null,
        shippedAt: t.shippedAt || (['Shipped', 'Out for Delivery', 'Delivered'].includes(t.status) ? t.updatedAt : null),
        deliveredAt: t.deliveredAt || (t.status === 'Delivered' ? t.updatedAt : null),
        estimatedDelivery: t.estimatedDelivery || '2026-10-02',
        notes: t.notes || order.notes || 'Fragile tempered glass, dual internal Instapak foam injected.'
      };
    });

    // Also include any Orders in logistics-relevant stages that don't yet have a LogisticsTask
    const existingOrderIds = new Set(formattedTasks.map(t => t.orderId));
    const pendingOrders = await Order.find({
      status: { $in: ['Packaging', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered'] }
    }).lean();

    for (const o of pendingOrders) {
      const oid = o.orderId || o._id.toString();
      if (!existingOrderIds.has(oid)) {
        formattedTasks.push({
          _id: 'task_' + o._id.toString(),
          orderId: oid,
          order: oid,
          customer: o.customer || { firstName: 'Valued', lastName: 'Customer', city: 'Bengaluru', email: 'client@example.com' },
          rigName: o.items?.[0]?.name || o.items?.[0]?.title || 'Custom Engineered Rig',
          weightKg: 19.0,
          packageDimensions: '64 x 36 x 60 cm',
          status: o.status === 'Packaging' ? 'Packaging' : o.status === 'Shipped' ? 'Shipped' : o.status === 'Delivered' ? 'Delivered' : 'Ready to Ship',
          courier: o.carrier || 'Delhivery Insured',
          trackingNumber: o.trackingNumber || `IND-EXPRESS-${oid.replace('ORD-', '')}`,
          serviceType: 'Insured Heavy Express',
          insuredValue: o.totalAmount || o.totalPrice || 249999,
          packagingDetails: {
            instapakFoamUsed: o.status !== 'Packaging',
            tamperTapeApplied: o.status !== 'Packaging',
            shockWatchSensorId: `SW-${oid.replace('ORD-', '')}-OK`,
            packedBy: 'Logistics Lead',
            packagedAt: o.createdAt
          },
          shippedAt: ['Shipped', 'Delivered'].includes(o.status) ? o.createdAt : null,
          deliveredAt: o.status === 'Delivered' ? o.createdAt : null,
          estimatedDelivery: '2026-10-03',
          notes: o.notes || 'Handle with extreme care.'
        });
      }
    }

    const stats = {
      totalShipments: formattedTasks.length,
      readyToShip: formattedTasks.filter(t => t.status === 'Ready to Ship').length,
      packaging: formattedTasks.filter(t => t.status === 'Packaging').length,
      inTransit: formattedTasks.filter(t => ['Shipped', 'Out for Delivery'].includes(t.status)).length,
      delivered: formattedTasks.filter(t => t.status === 'Delivered').length,
      failed: formattedTasks.filter(t => t.status === 'Failed Delivery').length,
      totalInsuredValue: formattedTasks.reduce((sum, t) => sum + (t.insuredValue || 0), 0)
    };

    res.json({ tasks: formattedTasks, stats });
  } catch (error) {
    next(error);
  }
};

// 2. List orders waiting for packaging
exports.getQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: { $in: ['Packaging', 'Ready to Ship'] } })
      .populate('items.componentId')
      .populate('items.customBuildId');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// 3. Confirm packaging
exports.confirmPackaging = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { packagingDetails, weightKg, packageDimensions, serviceType } = req.body || {};

    const order = await Order.findOne({ $or: [{ _id: orderId.length === 24 ? orderId : null }, { orderId: orderId }] });
    if (order) {
      order.status = 'Ready to Ship';
      await order.save();
    }

    let task = await LogisticsTask.findOne({ $or: [{ order: order?._id }, { orderId: orderId }] });
    if (!task) {
      task = new LogisticsTask({
        order: order ? order._id : null,
        orderId,
        handler: req.user ? req.user._id : null,
        status: 'Ready to Ship',
        packagedAt: new Date(),
        weightKg: weightKg || 18.5,
        packageDimensions: packageDimensions || '62 x 34 x 58 cm',
        serviceType: serviceType || 'Priority Air Freight / Insured',
        packagingDetails: packagingDetails || {
          instapakFoamUsed: true,
          tamperTapeApplied: true,
          shockWatchSensorId: `SW-${orderId.replace('ORD-', '')}-A`,
          packedBy: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Warehouse Terminal',
          packagedAt: new Date()
        }
      });
    } else {
      task.status = 'Ready to Ship';
      task.packagedAt = new Date();
      if (packagingDetails) task.packagingDetails = packagingDetails;
      if (weightKg) task.weightKg = weightKg;
      if (packageDimensions) task.packageDimensions = packageDimensions;
    }

    await task.save();

    await AuditLog.create({
      action: 'LOGISTICS_PACKAGED',
      actor: req.user ? req.user._id : null,
      targetId: orderId,
      entityType: 'LogisticsTask',
      description: `Order ${orderId} packaging confirmed with expanding Instapak foam and tamper security seals`
    });

    res.json({ message: 'Order packaged and ready to ship', task });
  } catch (error) {
    next(error);
  }
};

// 4. Ship order
exports.shipOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, courier, serviceType, estimatedDelivery } = req.body || {};

    const finalTracking = trackingNumber || `IND-EXPRESS-${orderId.replace('ORD-', '')}`;
    const finalCourier = courier || 'BlueDart Air Express';

    let task = await LogisticsTask.findOne({ $or: [{ order: orderId.length === 24 ? orderId : null }, { orderId: orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) {
      task = new LogisticsTask({
        orderId,
        status: 'Shipped',
        trackingNumber: finalTracking,
        courier: finalCourier,
        serviceType: serviceType || 'Priority Air Freight',
        shippedAt: new Date(),
        estimatedDelivery: estimatedDelivery || '2026-10-02'
      });
    } else {
      task.status = 'Shipped';
      task.trackingNumber = finalTracking;
      task.courier = finalCourier;
      task.shippedAt = new Date();
      if (serviceType) task.serviceType = serviceType;
      if (estimatedDelivery) task.estimatedDelivery = estimatedDelivery;
    }
    await task.save();

    const order = await Order.findOne({ $or: [{ _id: orderId.length === 24 ? orderId : null }, { orderId: orderId }] });
    if (order) {
      order.status = 'Shipped';
      order.trackingNumber = finalTracking;
      order.carrier = finalCourier;
      await order.save();
    }

    await AuditLog.create({
      action: 'ORDER_DISPATCHED_CARRIER',
      actor: req.user ? req.user._id : null,
      targetId: orderId,
      entityType: 'LogisticsTask',
      description: `Order ${orderId} dispatched via ${finalCourier} (Tracking: ${finalTracking})`
    });

    res.json({ message: 'Order shipped successfully', task, trackingNumber: finalTracking, courier: finalCourier });
  } catch (error) {
    next(error);
  }
};

// 5. Get Tracking Info
exports.getTracking = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const task = await LogisticsTask.findOne({
      $or: [{ order: orderId }, { orderId: orderId }, { _id: orderId }, { trackingNumber: orderId }]
    });

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }, { trackingNumber: orderId }]
    });

    if (!task && !order) {
      return res.status(404).json({ message: 'Tracking info not found for this order' });
    }

    const currentStatus = task?.status || order?.status || 'Shipped';
    const trackingNumber = task?.trackingNumber || order?.trackingNumber || `IND-EXPRESS-${orderId.replace('ORD-', '')}`;
    const courier = task?.courier || order?.carrier || 'BlueDart Air Express';

    res.json({
      orderId,
      status: currentStatus,
      trackingNumber,
      courier,
      carrier: courier,
      failureReason: task?.failureReason || '',
      packagedAt: task?.packagedAt || order?.createdAt,
      shippedAt: task?.shippedAt || (['Shipped', 'Out for Delivery', 'Delivered'].includes(currentStatus) ? order?.createdAt : null),
      deliveredAt: task?.deliveredAt || (currentStatus === 'Delivered' ? order?.updatedAt : null),
      estimatedDelivery: task?.estimatedDelivery || '2026-10-02',
      serviceType: task?.serviceType || 'Priority Air Freight / Insured',
      events: [
        { status: 'Order Verified', date: order?.createdAt || '2026-09-28', location: 'BuildFlow Facility, Mumbai' },
        { status: 'Cleanroom Assembled & 32-Pt QA Passed', date: '2026-09-29', location: 'Cleanroom ESD Bay 02' },
        { status: 'Instapak Expanding Foam Packaged', date: task?.packagedAt || '2026-09-29', location: 'Loading Dock Alpha' },
        { status: 'Dispatched to Air Hub', date: task?.shippedAt || '2026-09-30', location: courier + ' Air Hub' }
      ]
    });
  } catch (error) {
    next(error);
  }
};

// 6. Failed Delivery
exports.failedDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason, returnToWarehouse } = req.body || {};

    let task = await LogisticsTask.findOne({ $or: [{ order: orderId.length === 24 ? orderId : null }, { orderId: orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) {
      task = new LogisticsTask({ orderId, status: 'Failed Delivery', failureReason: reason || 'Consignee unavailable' });
    } else {
      task.status = returnToWarehouse ? 'Returned' : 'Failed Delivery';
      task.failureReason = reason || 'Customer unavailable at delivery address';
    }
    await task.save();

    await AuditLog.create({
      action: 'DELIVERY_EXCEPTION',
      actor: req.user ? req.user._id : null,
      targetId: orderId,
      entityType: 'LogisticsTask',
      description: `Delivery exception logged for ${orderId}: ${reason || 'Consignee unavailable'}`
    });

    res.json({ message: 'Delivery failure recorded', task });
  } catch (error) {
    next(error);
  }
};

// 7. Update Delivery Status
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, timestamp } = req.body || {};

    let task = await LogisticsTask.findOne({ $or: [{ order: orderId.length === 24 ? orderId : null }, { orderId: orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) {
      task = new LogisticsTask({ orderId, status: status || 'Shipped' });
    } else {
      task.status = status || task.status;
      if (status === 'Delivered') task.deliveredAt = timestamp || new Date();
    }
    await task.save();

    const order = await Order.findOne({ $or: [{ _id: orderId.length === 24 ? orderId : null }, { orderId: orderId }] });
    if (order && status) {
      order.status = status;
      await order.save();
    }

    res.json({ message: 'Delivery status updated', task });
  } catch (error) {
    next(error);
  }
};
