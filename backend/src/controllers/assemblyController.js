const AssemblyTask = require('../models/AssemblyTask');
const Order = require('../models/Order');

// List orders waiting for assembly
exports.getQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'Assembly Queue' })
      .populate('items.componentId')
      .populate('items.customBuildId');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Assign order to technician
exports.assignOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const technicianId = req.user._id; // Assuming the authenticated user is the technician

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.status !== 'Assembly Queue') {
      return res.status(400).json({ message: 'Order is not in Assembly Queue' });
    }

    // Check if task already exists
    let task = await AssemblyTask.findOne({ order: orderId });
    if (task) {
      return res.status(400).json({ message: 'Assembly task already exists for this order' });
    }

    task = new AssemblyTask({
      order: orderId,
      technician: technicianId,
      status: 'In Progress',
      progressLogs: [{ log: 'Assigned to technician and started assembly' }]
    });

    await task.save();

    // Update order status
    order.status = 'In Assembly';
    await order.save();

    res.status(201).json({ message: 'Order assigned successfully', task });
  } catch (error) {
    next(error);
  }
};

// Record assembly progress
exports.recordProgress = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { log } = req.body;

    if (!log) return res.status(400).json({ message: 'Log message is required' });

    const task = await AssemblyTask.findOne({ order: orderId });
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    if (task.technician.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    if (task.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot record progress on completed task' });
    }

    task.progressLogs.push({ log });
    await task.save();

    res.json({ message: 'Progress recorded', task });
  } catch (error) {
    next(error);
  }
};

// Mark assembly complete and notify QA
exports.completeAssembly = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { assemblyNotes } = req.body;

    const task = await AssemblyTask.findOne({ order: orderId });
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    if (task.technician.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to complete this task' });
    }

    if (task.status === 'Completed') {
      return res.status(400).json({ message: 'Task already completed' });
    }

    task.status = 'Completed';
    task.completedAt = Date.now();
    task.progressLogs.push({ log: 'Assembly completed and sent to QA' });
    await task.save();

    const order = await Order.findById(orderId);
    order.status = 'QA Inspection';
    if (assemblyNotes) order.assemblyNotes = assemblyNotes;
    await order.save();

    res.json({ message: 'Assembly marked as complete', task, orderStatus: order.status });
  } catch (error) {
    next(error);
  }
};
