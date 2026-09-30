const QATask = require('../models/QATask');
const Order = require('../models/Order');
const LogisticsTask = require('../models/LogisticsTask');
const AuditLog = require('../models/AuditLog');

const DEFAULT_QA_CHECKS = [
  { id: 'c1', label: 'POST & Cold Boot', description: 'UEFI initialization under 14s, BIOS version verified', passed: true },
  { id: 'c2', label: 'Thermals & Stress Test', description: 'CPU under 72°C and GPU under 64°C in 30-min sustained loop', passed: true },
  { id: 'c3', label: 'Memory & EXPO Stability', description: 'DDR5 6000MT/s MemTest86 0 errors detected', passed: false },
  { id: 'c4', label: 'I/O Ports & Networking', description: 'Front USB-C, rear HDMI/DP, Wi-Fi 6E & 2.5GbE tested', passed: false },
  { id: 'c5', label: 'Chassis & Cosmetic Finish', description: 'No glass scratches, cable routing snug, peel ready', passed: false }
];

const formatQaTask = (t) => {
  const orderIdStr = t.orderId || (t.order ? (t.order.orderId || t.order._id?.toString() || t.order.toString()) : 'ORD-' + t._id.toString().slice(-4));
  return {
    _id: t._id.toString(),
    orderId: orderIdStr,
    order: orderIdStr,
    rigName: t.rigName || 'Custom Performance Rig',
    customer: t.customer || { firstName: 'Valued', lastName: 'Customer', email: 'customer@buildflow.dev' },
    inspector: t.inspector || { name: 'Priya Sharma', role: 'Inspector' },
    status: t.status || 'Ready For Inspection',
    decision: t.decision || 'Pending',
    priority: t.priority || 'STANDARD',
    technicianName: t.technicianName || 'Marcus Chen',
    chamberNumber: t.chamberNumber || 'QA Chamber 01 - Thermal Loop',
    components: t.components && t.components.length ? t.components : [
      { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', serialNumber: 'SN-CPU-7800X-4412', status: 'Verified' },
      { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', serialNumber: 'SN-MB-B650-3301', status: 'Verified' },
      { slot: 'GPU', name: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', serialNumber: 'SN-GPU-4070TIS-1982', status: 'Verified' },
      { slot: 'RAM', name: 'Corsair Vengeance RGB 32GB DDR5 6000MHz', serialNumber: 'SN-RAM-32GB-7712', status: 'Verified' },
      { slot: 'SSD', name: 'Kingston KC3000 2TB PCIe 4.0 NVMe', serialNumber: 'SN-SSD-KC3000-8841', status: 'Verified' },
      { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', serialNumber: 'SN-CLR-AK620-5521', status: 'Verified' },
      { slot: 'PSU', name: 'Corsair RM850x 850W 80+ Gold Modular', serialNumber: 'SN-PSU-850X-2201', status: 'Verified' },
      { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', serialNumber: 'SN-CAB-H7F-9921', status: 'Verified' }
    ],
    checks: t.checks && t.checks.length ? t.checks : DEFAULT_QA_CHECKS,
    report: t.report || '',
    testedAt: t.testedAt,
    createdAt: t.createdAt
  };
};

// GET /api/qa/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await QATask.find().populate('order').sort({ updatedAt: -1 }).lean();
    res.json({ tasks: tasks.map(formatQaTask) });
  } catch (error) {
    next(error);
  }
};

// GET /api/qa/queue
exports.getQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['QA Inspection', 'QualityInspection'] }
    }).populate('items.componentId').populate('items.customBuildId').lean();

    const queue = orders.map(o => ({
      orderId: o.orderId || o._id.toString(),
      rigName: o.items?.[0]?.name || o.items?.[0]?.title || 'Custom Cleanroom Battlestation',
      customer: o.customer || { firstName: 'Valued', lastName: 'Customer', email: 'customer@buildflow.dev' },
      totalAmount: o.totalAmount || o.totalPrice || 119999,
      status: o.status,
      priority: (o.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
      targetChamber: 'QA Chamber 01 - Thermal Stress',
      readyForTesting: true,
      createdAt: o.createdAt
    }));

    res.json(queue);
  } catch (error) {
    next(error);
  }
};

// GET /api/qa/:orderId
exports.getTaskDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let task = await QATask.findOne({
      $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }]
    }).populate('order').lean();

    if (!task) {
      const order = await Order.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] }).lean();
      if (!order) return res.status(404).json({ message: 'QA task or order not found' });
      task = {
        orderId: order.orderId || order._id.toString(),
        rigName: order.items?.[0]?.name || 'Custom Battlestation',
        customer: order.customer,
        status: 'Ready For Inspection',
        decision: 'Pending',
        checks: DEFAULT_QA_CHECKS
      };
    }

    res.json(formatQaTask(task));
  } catch (error) {
    next(error);
  }
};

// PUT /api/qa/:orderId/check
exports.updateCheck = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { checkId, passed } = req.body || {};

    let task = await QATask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) return res.status(404).json({ message: 'QA task not found' });

    if (!task.checks || !task.checks.length) {
      task.checks = DEFAULT_QA_CHECKS;
    }

    const check = task.checks.find(c => c.id === checkId);
    if (check) {
      check.passed = Boolean(passed);
    }

    await task.save();
    res.json({ message: 'QA check updated', task: formatQaTask(task) });
  } catch (error) {
    next(error);
  }
};

// POST /api/qa/:orderId/report
exports.recordReport = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { report } = req.body || {};

    let task = await QATask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) return res.status(404).json({ message: 'QA task not found' });

    task.report = report || task.report;
    await task.save();

    res.json({ message: 'QA report recorded', task: formatQaTask(task) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/qa/:orderId/decision
exports.recordDecision = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { decision, report, inspectorName = 'Priya Sharma' } = req.body || {};

    if (!['Passed', 'Failed'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Passed or Failed' });
    }

    let task = await QATask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    const order = await Order.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });

    if (task) {
      task.decision = decision;
      task.status = decision === 'Passed' ? 'Certified QA Passed' : 'Inspection Failed';
      if (report) task.report = report;
      task.testedAt = new Date();
      await task.save();
    }

    if (order) {
      order.status = decision === 'Passed' ? 'Packaging' : 'QA Failed';
      if (report) order.qaNotes = report;
      await order.save();
    }

    // If passed, automatically create / stage LogisticsTask in MongoDB
    if (decision === 'Passed') {
      let logisticsTask = await LogisticsTask.findOne({ $or: [{ orderId }, { order: order?._id }] });
      if (!logisticsTask) {
        logisticsTask = new LogisticsTask({
          order: order?._id,
          orderId,
          customer: order?.customer || task?.customer,
          rigName: order?.items?.[0]?.name || task?.rigName || 'Custom Engineered Rig',
          weightKg: 18.5,
          packageDimensions: '62 x 34 x 58 cm',
          status: 'Packaging',
          courier: 'BlueDart Air Express',
          trackingNumber: `IND-EXPRESS-${orderId.replace('ORD-', '')}`,
          serviceType: 'Priority Air Freight / Insured',
          insuredValue: order?.totalAmount || order?.totalPrice || 279999,
          packagingDetails: {
            instapakFoamUsed: false,
            tamperTapeApplied: false,
            shockWatchSensorId: 'PENDING',
            packedBy: null,
            packagedAt: null
          },
          notes: 'QA Certified. Ready for Instapak expanding foam packaging.'
        });
        await logisticsTask.save();
      }
    }

    await AuditLog.create({
      action: decision === 'Passed' ? 'QA_CERTIFICATION_PASSED' : 'QA_CERTIFICATION_FAILED',
      actor: req.user ? req.user._id : null,
      targetId: orderId,
      entityType: 'QATask',
      description: `QA Inspection for Order ${orderId} marked as ${decision} by ${inspectorName}. ${report ? 'Report: ' + report : ''}`
    });

    res.json({
      message: `QA marked as ${decision}`,
      task: formatQaTask(task || {}),
      orderStatus: decision === 'Passed' ? 'Packaging' : 'QA Failed'
    });
  } catch (error) {
    next(error);
  }
};
