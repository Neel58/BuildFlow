const Component = require('../models/Component');
const AuditLog = require('../models/AuditLog');

exports.getComponents = async (req, res, next) => {
  try {
    const { category, brand, search, minPrice, maxPrice, socket, chipset, ramType } = req.query;

    let query = {};

    if (category && category !== 'ALL') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }
    if (brand && brand !== 'ALL') {
      query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (socket) query['specifications.socket'] = socket;
    if (chipset) query['specifications.chipset'] = chipset;
    if (ramType) query['specifications.ramType'] = ramType;

    const components = await Component.find(query).lean();
    const formatted = components.map(c => ({
      ...c,
      availableStock: Math.max(0, (c.stock || 0) - (c.reservedStock || 0))
    }));

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

exports.getComponentById = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id).lean();
    if (!component) return res.status(404).json({ message: 'Component not found' });
    component.availableStock = Math.max(0, (component.stock || 0) - (component.reservedStock || 0));
    res.json(component);
  } catch (error) {
    next(error);
  }
};

// Admin: Create component
exports.createComponent = async (req, res, next) => {
  try {
    const component = new Component(req.body);
    const savedComponent = await component.save();

    if (req.user) {
      await AuditLog.create({
        action: 'COMPONENT_CREATED',
        actor: req.user._id,
        targetId: savedComponent._id.toString(),
        entityType: 'Component',
        description: `Created component ${savedComponent.name}`
      });
    }

    res.status(201).json(savedComponent);
  } catch (error) {
    next(error);
  }
};

// Admin: Update component details
exports.updateComponent = async (req, res, next) => {
  try {
    const oldComponent = await Component.findById(req.params.id);
    if (!oldComponent) return res.status(404).json({ message: 'Component not found' });

    const updatedComponent = await Component.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (req.user) {
      await AuditLog.create({
        action: 'COMPONENT_UPDATED',
        actor: req.user._id,
        targetId: updatedComponent._id.toString(),
        entityType: 'Component',
        changes: { previous: oldComponent, updated: updatedComponent },
        description: `Updated component ${updatedComponent.name}`
      });
    }

    res.json(updatedComponent);
  } catch (error) {
    next(error);
  }
};

// Admin: Delete component
exports.deleteComponent = async (req, res, next) => {
  try {
    const component = await Component.findByIdAndDelete(req.params.id);
    if (!component) return res.status(404).json({ message: 'Component not found' });

    if (req.user) {
      await AuditLog.create({
        action: 'COMPONENT_DELETED',
        actor: req.user._id,
        targetId: req.params.id,
        entityType: 'Component',
        description: `Deleted component ${component.name}`
      });
    }

    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    next(error);
  }
};
