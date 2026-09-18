const Component = require('../models/Component');
const AuditLog = require('../models/AuditLog');

// GET /api/inventory
exports.getInventory = async (req, res, next) => {
  try {
    const components = await Component.find().select('name category brand stock reservedStock availableStock price');
    res.json(components);
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/low-stock
exports.getLowStock = async (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold) || 10;
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
      availableStock: component.availableStock
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/inventory/:componentId/adjust (Warehouse Manager / Admin)
exports.adjustStock = async (req, res, next) => {
  try {
    const { newStock, adjustment } = req.body;
    const component = await Component.findById(req.params.componentId);
    if (!component) return res.status(404).json({ message: 'Component not found' });

    const previousStock = component.stock;
    if (typeof newStock === 'number') {
      component.stock = newStock;
    } else if (typeof adjustment === 'number') {
      component.stock += adjustment;
    } else {
      return res.status(400).json({ message: 'Provide newStock or adjustment amount' });
    }

    if (component.stock < 0) component.stock = 0;
    await component.save();

    await AuditLog.create({
      action: 'STOCK_ADJUSTMENT',
      actor: req.user._id,
      targetId: component._id,
      entityType: 'Component',
      changes: { previousStock, newStock: component.stock },
      description: `Stock for ${component.name} adjusted from ${previousStock} to ${component.stock}`
    });

    res.json({ message: 'Stock adjusted successfully', component });
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
