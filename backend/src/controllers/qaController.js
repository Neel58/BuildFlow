const QATask = require('../models/QATask');
const Order = require('../models/Order');

// List orders waiting for QA
exports.getQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'QA Inspection' })
      .populate('items.componentId')
      .populate('items.customBuildId');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// Record QA report
exports.recordReport = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { report } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'QA Inspection') {
      return res.status(400).json({ message: 'Order is not in QA Inspection' });
    }

    let task = await QATask.findOne({ order: orderId });
    if (!task) {
      task = new QATask({
        order: orderId,
        inspector: req.user._id,
        report
      });
    } else {
      task.report = report;
      task.inspector = req.user._id; // Update inspector if someone else takes over
    }

    await task.save();

    res.json({ message: 'QA report recorded', task });
  } catch (error) {
    next(error);
  }
};

// Mark QA decision (Passed/Failed)
exports.recordDecision = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { decision } = req.body;

    if (!['Passed', 'Failed'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Passed or Failed' });
    }

    const task = await QATask.findOne({ order: orderId });
    if (!task) return res.status(404).json({ message: 'QA task not found. Please record a report first.' });

    task.decision = decision;
    task.testedAt = Date.now();
    await task.save();

    const order = await Order.findById(orderId);
    if (decision === 'Passed') {
      order.status = 'Packaging';
    } else {
      order.status = 'QA Failed';
    }
    
    await order.save();

    res.json({ message: `QA marked as ${decision}`, task, orderStatus: order.status });
  } catch (error) {
    next(error);
  }
};
