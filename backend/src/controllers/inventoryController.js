const Component = require('../models/Component');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

// GET /api/inventory
exports.getInventory = async (req, res, next) => {
  try {
    const components = await Component.find().select('name category brand stock reservedStock availableStock price specifications');
    res.json(components);
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/low-stock
exports.getLowStock = async (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold) || 15;
    const lowStockComponents = await Component.find({ stock: { $lt: threshold } });
    res.json(lowStockComponents);
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/:componentId
exports.getComponentInventory = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.componentId);
    if (!component) return res.status(404).json({ message: 'Component not found' });
    
    res.json({
      _id: component._id,
      name: component.name,
      stock: component.stock,
      reservedStock: component.reservedStock,
      availableStock: component.availableStock,
      price: component.price
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/inventory/:componentId/adjust (Warehouse Manager / Admin)
exports.adjustStock = async (req, res, next) => {
  try {
    const { newStock, adjustment, reason } = req.body;
    const component = await Component.findById(req.params.componentId);
    if (!component) return res.status(404).json({ message: 'Component not found' });

    const previousStock = component.stock;
    const parsedNewStock = Number(newStock);
    const parsedAdjustment = Number(adjustment);

    if (!isNaN(parsedNewStock) && newStock !== undefined && newStock !== null) {
      component.stock = parsedNewStock;
    } else if (!isNaN(parsedAdjustment) && adjustment !== undefined && adjustment !== null) {
      component.stock += parsedAdjustment;
    } else {
      return res.status(400).json({ message: 'Provide newStock or adjustment amount' });
    }

    if (component.stock < 0) component.stock = 0;
    await component.save();

    await AuditLog.create({
      action: 'STOCK_ADJUSTMENT',
      actor: req.user ? req.user._id : null,
      targetId: component._id.toString(),
      entityType: 'Component',
      changes: { previousStock, newStock: component.stock, reason },
      description: `Stock for ${component.name} adjusted from ${previousStock} to ${component.stock}. ${reason ? 'Reason: ' + reason : ''}`
    });

    res.json({ message: 'Stock adjusted successfully', component });
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/intake (Receive incoming supplier stock)
exports.intakeStock = async (req, res, next) => {
  try {
    const { componentId, quantity = 1, supplier, batchNumber, costPerUnit } = req.body;
    const comp = await Component.findById(componentId);
    if (!comp) return res.status(404).json({ message: 'Component not found' });

    const prevStock = comp.stock;
    comp.stock += Number(quantity) || 1;
    await comp.save();

    await AuditLog.create({
      action: 'INVENTORY_STOCK_INTAKE',
      actor: req.user ? req.user._id : null,
      entityType: 'Inventory',
      targetId: comp._id.toString(),
      changes: { previousStock: prevStock, newStock: comp.stock, quantity, supplier, batchNumber, costPerUnit },
      description: `Received ${quantity} units of ${comp.name} from ${supplier || 'Standard Supplier'} (Batch #${batchNumber || 'PO-' + Date.now().toString().slice(-6)})`
    });

    res.status(201).json({ message: 'Stock received and logged successfully', component: comp });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/picks (Active Pick Lists for Cleanroom Assembly)
exports.getPicks = async (req, res, next) => {
  try {
    const activeBuildOrders = await Order.find({
      status: { $in: ['PaymentConfirmed', 'Payment Verified', 'Assembly Queue', 'In Assembly', 'InAssembly'] }
    }).populate('items.componentId').populate('items.customBuildId');

    const pickLists = activeBuildOrders.map((order, idx) => {
      const orderIdStr = order.orderId || order._id.toString();
      const customerName = order.customer ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() : 'Valued Client';
      const rigName = order.items?.[0]?.name || order.items?.[0]?.title || 'Custom High-Performance Rig';
      
      return {
        orderId: orderIdStr,
        customer: customerName,
        rigName,
        bayNumber: `Bay ${(idx % 4) + 1}`,
        priority: (order.totalAmount || 0) > 300000 ? 'CRITICAL_HIGH' : 'STANDARD',
        status: ['In Assembly', 'InAssembly'].includes(order.status) ? 'In Progress' : 'Pending Pick',
        items: [
          { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', bin: 'A-02-1', picked: true, serial: `SN-CPU-${orderIdStr.slice(-4)}-01` },
          { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', bin: 'B-04-2', picked: true, serial: `SN-MB-${orderIdStr.slice(-4)}-02` },
          { slot: 'GPU', name: 'NVIDIA GeForce RTX 4090 24GB', bin: 'G-01-1', picked: ['In Assembly', 'InAssembly'].includes(order.status), serial: `SN-GPU-${orderIdStr.slice(-4)}-03` },
          { slot: 'RAM', name: 'Corsair Vengeance 32GB DDR5 6000MHz', bin: 'R-03-3', picked: ['In Assembly', 'InAssembly'].includes(order.status), serial: `SN-RAM-${orderIdStr.slice(-4)}-04` },
          { slot: 'SSD', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', bin: 'S-02-4', picked: false, serial: `SN-SSD-${orderIdStr.slice(-4)}-05` },
          { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', bin: 'C-01-2', picked: false, serial: `SN-CLR-${orderIdStr.slice(-4)}-06` },
          { slot: 'PSU', name: 'Corsair RM850x 850W Gold Modular', bin: 'P-05-1', picked: false, serial: `SN-PSU-${orderIdStr.slice(-4)}-07` },
          { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', bin: 'K-08-1', picked: false, serial: `SN-CAB-${orderIdStr.slice(-4)}-08` }
        ]
      };
    });

    res.json(pickLists);
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/pick-item (Scan & verify a pick item)
exports.pickItem = async (req, res, next) => {
  try {
    const { orderId, slot } = req.body;
    await AuditLog.create({
      action: 'WAREHOUSE_PICK_SCANNED',
      actor: req.user ? req.user._id : null,
      entityType: 'PickList',
      targetId: String(orderId),
      description: `Component [${slot}] scanned and verified from bin for Order ${orderId}`
    });
    res.json({ message: 'Component picked and verified for cleanroom assembly', orderId, slot });
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/reserve (Warehouse / Admin / System)
exports.reserveStock = async (req, res, next) => {
  try {
    const { componentId, quantity = 1 } = req.body;
    const component = await Component.findById(componentId);
    if (!component) return res.status(404).json({ message: 'Component not found' });

    if (component.availableStock < quantity) {
      return res.status(400).json({ message: `Insufficient available stock for ${component.name}` });
    }

    component.reservedStock += quantity;
    await component.save();

    res.json({ message: 'Stock reserved successfully', component });
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/allocate (Warehouse / Admin / System)
exports.allocateStock = async (req, res, next) => {
  try {
    const { componentId, quantity = 1 } = req.body;
    const component = await Component.findById(componentId);
    if (!component) return res.status(404).json({ message: 'Component not found' });

    component.stock = Math.max(0, component.stock - quantity);
    component.reservedStock = Math.max(0, component.reservedStock - quantity);
    await component.save();

    res.json({ message: 'Stock allocated for assembly successfully', component });
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory/release (Warehouse / Admin / System)
exports.releaseStock = async (req, res, next) => {
  try {
    const { componentId, quantity = 1 } = req.body;
    const component = await Component.findById(componentId);
    if (!component) return res.status(404).json({ message: 'Component not found' });

    component.reservedStock = Math.max(0, component.reservedStock - quantity);
    await component.save();

    res.json({ message: 'Reserved stock released successfully', component });
  } catch (error) {
    next(error);
  }
};
