const AssemblyTask = require('../models/AssemblyTask');
const Order = require('../models/Order');
const QATask = require('../models/QATask');
const AuditLog = require('../models/AuditLog');

const DEFAULT_CHECKLIST = [
  { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', bin: 'A-02-1', serialNumber: 'SN-CPU-7800X-9481', verified: true, scanned: true },
  { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', bin: 'B-04-2', serialNumber: 'SN-MB-B650-2049', verified: true, scanned: true },
  { slot: 'GPU', name: 'NVIDIA GeForce RTX 4080 SUPER 16GB', bin: 'G-01-1', serialNumber: 'SN-GPU-4080-8812', verified: true, scanned: true },
  { slot: 'RAM', name: 'Corsair Vengeance 32GB DDR5 6000MHz', bin: 'R-03-3', serialNumber: 'SN-RAM-6000-4491', verified: true, scanned: true },
  { slot: 'SSD', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', bin: 'S-02-4', serialNumber: 'SN-SSD-990P-7714', verified: true, scanned: true },
  { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', bin: 'C-01-2', serialNumber: 'SN-CLR-AK620-3301', verified: true, scanned: true },
  { slot: 'PSU', name: 'Corsair RM850x 850W Gold Modular', bin: 'P-05-1', serialNumber: 'SN-PSU-850X-1129', verified: true, scanned: true },
  { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', bin: 'K-08-1', serialNumber: 'SN-CAB-H7F-5582', verified: true, scanned: true }
];

const DEFAULT_MILESTONES = [
  { id: 'm1', stepNumber: 1, title: 'Cleanroom ESD Grounding & Mat Calibration', description: 'Wrist strap test (<0.1 MΩ resistance) & antistatic ionization blower active', done: true, completedAt: new Date() },
  { id: 'm2', stepNumber: 2, title: 'CPU Socket Pin Scan & Zero-Force Seating', description: 'Optical inspection for LGA pins under magnification; latched at 1.5 N·m', done: true, completedAt: new Date() },
  { id: 'm3', stepNumber: 3, title: 'DDR5 Dual-Channel Seating in Slots A2/B2', description: 'Gold fingers cleaned with 99.9% IPA; audible latch lock verified', done: true, completedAt: new Date() },
  { id: 'm4', stepNumber: 4, title: 'NVMe Gen5 Heatsink Thermal Pad Peel & Torquing', description: 'Blue film removed, pad contact verified, M.2 screw torqued to 0.4 N·m', done: true, completedAt: new Date() },
  { id: 'm5', stepNumber: 5, title: 'Motherboard Insertion & Standoff Alignment', description: 'All standoffs engaged with non-conductive washers in chassis', done: true, completedAt: new Date() },
  { id: 'm6', stepNumber: 6, title: 'Radiator / Cooler Mounting & Thermal Paste Spread', description: 'Compound applied in cross matrix, thumb-screws star-pattern torqued', done: true, completedAt: new Date() },
  { id: 'm7', stepNumber: 7, title: 'GPU Insertion & Anti-Sag PCIe Support Bracket', description: 'Rigid bracket installed. Dedicated 12V-2x6 cable seated with 0 gap', done: false, completedAt: null },
  { id: 'm8', stepNumber: 8, title: 'Clean Cable Management & Rear Channel Tie-Downs', description: 'Velcro channels secured; zero pinched EPS or SATA cables', done: false, completedAt: null },
  { id: 'm9', stepNumber: 9, title: 'First Cold POST & UEFI BIOS Configuration', description: 'EXPO enabled, Resizable BAR on, custom PWM fan curves set', done: false, completedAt: null },
  { id: 'm10', stepNumber: 10, title: 'Pre-QA Dust Blow & Handover Checklist', description: 'Internal glass cleaned, staged for 32-Pt Thermal QA Chamber', done: false, completedAt: null }
];

// Helper to format task
const formatTask = (t) => {
  const orderIdStr = t.orderId || (t.order ? (t.order.orderId || t.order._id?.toString() || t.order.toString()) : 'ORD-' + t._id.toString().slice(-4));
  return {
    _id: t._id.toString(),
    orderId: orderIdStr,
    order: orderIdStr,
    bayNumber: t.bayNumber || 'Bay 02 - Clean ESD Bench',
    technician: t.technician || { name: 'Marcus Chen', role: 'Technician', badgeId: 'TECH-409' },
    status: t.status || 'In Progress',
    priority: t.priority || 'STANDARD',
    rigName: t.rigName || 'Custom Precision Battlestation',
    customer: t.customer || { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.j@techcorp.io' },
    startedAt: t.startedAt || t.createdAt,
    completedAt: t.completedAt,
    estimatedMinutes: t.estimatedMinutes || 150,
    elapsedMinutes: t.elapsedMinutes || 45,
    componentsChecklist: t.componentsChecklist && t.componentsChecklist.length ? t.componentsChecklist : DEFAULT_CHECKLIST,
    milestones: t.milestones && t.milestones.length ? t.milestones : DEFAULT_MILESTONES,
    biosConfig: t.biosConfig || {
      biosVersion: 'Latest Production UEFI',
      expoProfile: 'AMD EXPO I',
      resizableBar: 'Enabled',
      secureBoot: 'Enabled',
      curveOptimizer: '-20 All Cores',
      fanProfile: 'Quiet Studio Ramp'
    },
    benchDiagnostics: t.benchDiagnostics || {
      cleanroomTemp: '21.2°C',
      cpuIdleTemp: '33.8°C',
      gpuIdleTemp: '28.4°C',
      voltage12v: '12.06 V',
      voltage5v: '5.01 V',
      voltage33v: '3.31 V',
      esdGroundResistance: '0.04 MΩ (Nominal)'
    },
    progressLogs: t.progressLogs || [],
    notes: t.notes || ''
  };
};

// GET /api/assembly/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const dbTasks = await AssemblyTask.find().populate('order').sort({ updatedAt: -1 }).lean();
    const formatted = dbTasks.map(formatTask);

    const activeTasks = formatted.filter(t => t.status === 'In Progress');
    const waitingOrders = await Order.find({ status: { $in: ['Assembly Queue', 'PaymentConfirmed', 'Payment Verified'] } });

    const stats = {
      activeBenches: activeTasks.length,
      waitingQueue: waitingOrders.length,
      completedToday: formatted.filter(t => t.status === 'Completed').length,
      cleanroomBaysAvailable: Math.max(0, 6 - activeTasks.length),
      cleanroomStatus: 'Class 10,000 ESD Active (0.04 MΩ Resistance)',
      avgAssemblyMinutes: 110
    };

    res.json({ stats, tasks: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/assembly/queue
exports.getQueue = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['Assembly Queue', 'PaymentConfirmed', 'Payment Verified', 'Warehouse Allocating'] }
    }).populate('items.componentId').populate('items.customBuildId').lean();

    const queue = orders.map((o, idx) => ({
      orderId: o.orderId || o._id.toString(),
      rigName: o.items?.[0]?.name || o.items?.[0]?.title || 'Custom High-Performance Rig',
      customer: o.customer || { firstName: 'Valued', lastName: 'Customer', email: 'customer@buildflow.dev' },
      totalAmount: o.totalAmount || o.totalPrice || 145000,
      status: o.status,
      priority: (o.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
      targetBay: `Bay 0${(idx % 4) + 1}`,
      readyForAssembly: true,
      componentsCount: 8,
      createdAt: o.createdAt
    }));

    res.json(queue);
  } catch (error) {
    next(error);
  }
};

// GET /api/assembly/:orderId
exports.getTaskDetails = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let task = await AssemblyTask.findOne({
      $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }]
    }).populate('order').lean();

    if (!task) {
      // Find order to generate task representation
      const order = await Order.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] }).lean();
      if (!order) return res.status(404).json({ message: 'Task or order not found' });
      task = {
        orderId: order.orderId || order._id.toString(),
        rigName: order.items?.[0]?.name || 'Custom Battlestation',
        customer: order.customer,
        status: ['In Assembly', 'InAssembly'].includes(order.status) ? 'In Progress' : 'Pending',
        componentsChecklist: DEFAULT_CHECKLIST,
        milestones: DEFAULT_MILESTONES
      };
    }

    res.json(formatTask(task));
  } catch (error) {
    next(error);
  }
};

// PUT /api/assembly/:orderId/assign
exports.assignOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { bayNumber = 'Bay 02 - Clean ESD Bench', technicianName = 'Marcus Chen', notes } = req.body || {};

    const order = await Order.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (order) {
      order.status = 'In Assembly';
      if (notes) order.notes = notes;
      await order.save();
    }

    let task = await AssemblyTask.findOne({ $or: [{ orderId }, { order: order?._id }] });
    if (!task) {
      task = new AssemblyTask({
        order: order?._id,
        orderId,
        bayNumber,
        technician: { name: technicianName, role: 'Technician', badgeId: 'TECH-409' },
        status: 'In Progress',
        priority: order && (order.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
        rigName: order?.items?.[0]?.name || 'Custom Precision Rig',
        customer: order?.customer,
        startedAt: new Date(),
        componentsChecklist: DEFAULT_CHECKLIST,
        milestones: DEFAULT_MILESTONES,
        progressLogs: [
          { id: 'pl_' + Date.now(), log: `Order claimed at ${bayNumber} by ${technicianName}`, timestamp: new Date(), tech: technicianName }
        ],
        notes: notes || 'Standard precision assembly initiated.'
      });
    } else {
      task.status = 'In Progress';
      task.bayNumber = bayNumber;
      task.technician = { name: technicianName, role: 'Technician', badgeId: 'TECH-409' };
      task.progressLogs.push({
        id: 'pl_' + Date.now(),
        log: `Technician ${technicianName} resumed build at ${bayNumber}`,
        timestamp: new Date(),
        tech: technicianName
      });
    }

    await task.save();

    await AuditLog.create({
      action: 'ASSEMBLY_ORDER_ASSIGNED',
      actor: req.user ? req.user._id : null,
      targetId: orderId,
      entityType: 'AssemblyTask',
      description: `Assigned Order ${orderId} to Cleanroom ${bayNumber}`
    });

    res.json({ message: 'Order successfully assigned to cleanroom bench', task: formatTask(task), orderStatus: 'In Assembly' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/assembly/:orderId/checklist
exports.updateChecklist = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { slot, verified, serialNumber } = req.body || {};

    let task = await AssemblyTask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    if (!task.componentsChecklist || !task.componentsChecklist.length) {
      task.componentsChecklist = DEFAULT_CHECKLIST;
    }

    const item = task.componentsChecklist.find(c => (c.slot || '').toLowerCase() === (slot || '').toLowerCase());
    if (item) {
      if (verified !== undefined) item.verified = Boolean(verified);
      if (serialNumber) item.serialNumber = serialNumber;
      item.scanned = true;
    }

    await task.save();
    res.json({ message: 'Component checklist item updated', task: formatTask(task), item });
  } catch (error) {
    next(error);
  }
};

// PUT /api/assembly/:orderId/milestone
exports.updateMilestone = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { milestoneId, done } = req.body || {};

    let task = await AssemblyTask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    if (!task.milestones || !task.milestones.length) {
      task.milestones = DEFAULT_MILESTONES;
    }

    const m = task.milestones.find(ms => ms.id === milestoneId || String(ms.stepNumber) === String(milestoneId));
    if (m) {
      m.done = Boolean(done);
      m.completedAt = done ? new Date() : null;
    }

    await task.save();
    res.json({ message: 'Milestone updated', task: formatTask(task) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/assembly/:orderId/bios
exports.updateBios = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const biosData = req.body || {};

    let task = await AssemblyTask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    task.biosConfig = { ...(task.biosConfig || {}), ...biosData };
    await task.save();

    res.json({ message: 'BIOS settings saved', task: formatTask(task) });
  } catch (error) {
    next(error);
  }
};

// POST /api/assembly/:orderId/progress
exports.recordProgress = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { log, technicianName = 'Marcus Chen' } = req.body || {};

    let task = await AssemblyTask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    task.progressLogs.push({
      id: 'pl_' + Date.now(),
      log: log || 'Progress milestone logged',
      timestamp: new Date(),
      tech: technicianName
    });

    await task.save();
    res.json({ message: 'Progress recorded', task: formatTask(task) });
  } catch (error) {
    next(error);
  }
};

// PUT /api/assembly/:orderId/complete
exports.completeAssembly = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { assemblyNotes, technicianName = 'Marcus Chen', targetQaChamber = 'QA Chamber 01 - Thermal Loop' } = req.body || {};

    let task = await AssemblyTask.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });
    const order = await Order.findOne({ $or: [{ orderId }, { _id: orderId.length === 24 ? orderId : null }] });

    if (task) {
      task.status = 'Completed';
      task.completedAt = new Date();
      if (task.milestones) {
        task.milestones.forEach(m => { m.done = true; if (!m.completedAt) m.completedAt = new Date(); });
      }
      task.progressLogs.push({
        id: 'pl_' + Date.now(),
        log: `Assembly certified complete by ${technicianName}. Transferred to ${targetQaChamber}.`,
        timestamp: new Date(),
        tech: technicianName
      });
      if (assemblyNotes) task.notes = assemblyNotes;
      await task.save();
    }

    if (order) {
      order.status = 'QA Inspection';
      if (assemblyNotes) order.assemblyNotes = assemblyNotes;
      await order.save();
    }

    // Automatically stage / create QATask in MongoDB
    let qaTask = await QATask.findOne({ $or: [{ orderId }, { order: order?._id }] });
    if (!qaTask) {
      qaTask = new QATask({
        order: order?._id,
        orderId,
        rigName: order?.items?.[0]?.name || task?.rigName || 'Custom Battlestation',
        customer: order?.customer || task?.customer,
        inspector: { name: 'Priya Sharma', role: 'Inspector' },
        status: 'Ready For Inspection',
        decision: 'Pending',
        priority: (order?.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
        technicianName,
        chamberNumber: targetQaChamber,
        components: [
          { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', serialNumber: 'SN-CPU-7800X-4412', status: 'Verified' },
          { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', serialNumber: 'SN-MB-B650-3301', status: 'Verified' },
          { slot: 'GPU', name: 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', serialNumber: 'SN-GPU-4070TIS-1982', status: 'Verified' },
          { slot: 'RAM', name: 'Corsair Vengeance RGB 32GB DDR5 6000MHz', serialNumber: 'SN-RAM-32GB-7712', status: 'Verified' },
          { slot: 'SSD', name: 'Kingston KC3000 2TB PCIe 4.0 NVMe', serialNumber: 'SN-SSD-KC3000-8841', status: 'Verified' },
          { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', serialNumber: 'SN-CLR-AK620-5521', status: 'Verified' },
          { slot: 'PSU', name: 'Corsair RM850x 850W 80+ Gold Modular', serialNumber: 'SN-PSU-850X-2201', status: 'Verified' },
          { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', serialNumber: 'SN-CAB-H7F-9921', status: 'Verified' }
        ],
        checks: [
          { id: 'c1', label: 'POST & Cold Boot', description: 'UEFI initialization under 14s, BIOS verified', passed: true },
          { id: 'c2', label: 'Thermals & Stress Test', description: 'CPU under 72°C and GPU under 64°C in 30-min sustained loop', passed: false },
          { id: 'c3', label: 'Memory & EXPO Stability', description: 'DDR5 6000MT/s MemTest86 0 errors detected', passed: false },
          { id: 'c4', label: 'I/O Ports & Networking', description: 'Front USB-C, rear HDMI/DP, Wi-Fi 6E & 2.5GbE tested', passed: false },
          { id: 'c5', label: 'Chassis & Cosmetic Finish', description: 'No glass scratches, cable routing snug, peel ready', passed: false }
        ],
        report: 'Assembly completed with all hardware verified. Staged for 32-point thermal stress test.'
      });
      await qaTask.save();
    }

    await AuditLog.create({
      action: 'ASSEMBLY_ORDER_COMPLETED',
      actor: req.user ? req.user._id : null,
      targetId: orderId,
      entityType: 'AssemblyTask',
      description: `Assembly completed for Order ${orderId} by ${technicianName}; transferred to QA Chamber`
    });

    res.json({ message: 'Assembly marked as complete', task: formatTask(task || {}), orderStatus: 'QA Inspection' });
  } catch (error) {
    next(error);
  }
};
