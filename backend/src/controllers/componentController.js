const Component = require('../models/Component');
const AuditLog = require('../models/AuditLog');

exports.getComponents = async (req, res, next) => {
  try {
    const { category, brand, search, minPrice, maxPrice, socket, chipset, ramType } = req.query;

    let query = {};

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (search) query.name = { $regex: search, $options: 'i' };
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (socket) query['specifications.socket'] = socket;
    if (chipset) query['specifications.chipset'] = chipset;
    if (ramType) query['specifications.ramType'] = ramType;

    const components = await Component.find(query);
    res.json(components);
  } catch (error) {
    next(error);
  }
};

exports.getComponentById = async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) return res.status(404).json({ message: 'Component not found' });
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
        targetId: savedComponent._id,
        entityType: 'Component',
        newValue: savedComponent,
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
      { returnDocument: 'after', runValidators: true }
    );

    if (req.user) {
      await AuditLog.create({
        action: 'COMPONENT_UPDATED',
        actor: req.user._id,
        targetId: updatedComponent._id,
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
