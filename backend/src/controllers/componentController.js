const Component = require('../models/Component');

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
