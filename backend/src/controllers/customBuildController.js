const CustomBuild = require('../models/CustomBuild');
const Component = require('../models/Component');
const crypto = require('crypto');
const { checkCompatibility } = require('../utils/compatibilityCheck');

// Save a new custom build
exports.saveBuild = async (req, res, next) => {
  try {
    const { name, componentIds } = req.body;
    
    let totalPrice = 0;
    let isCompatible = true;
    let compatibilityIssues = [];
    let estimatedPowerDraw = 0;

    if (componentIds && componentIds.length > 0) {
      const components = await Component.find({ _id: { $in: componentIds } });
      totalPrice = components.reduce((sum, comp) => sum + comp.price, 0);
      
      const compCheck = checkCompatibility(components);
      isCompatible = compCheck.isCompatible;
      compatibilityIssues = compCheck.issues;
      estimatedPowerDraw = compCheck.estimatedPowerDraw;
    }

    const newBuild = new CustomBuild({
      user: req.user._id,
      name: name || 'My Custom Build',
      components: componentIds || [],
      totalPrice,
      isCompatible,
      compatibilityIssues,
      estimatedPowerDraw
    });

    const savedBuild = await newBuild.save();
    res.status(201).json(savedBuild);
  } catch (error) {
    next(error);
  }
};

// Get all saved builds for current user
exports.getUserBuilds = async (req, res, next) => {
  try {
    const userId = req.params.userId || (req.user && req.user._id);
    const builds = await CustomBuild.find({ user: userId }).populate('components');
    res.json(builds);
  } catch (error) {
    next(error);
  }
};

// Get a specific build by ID
exports.getBuildById = async (req, res, next) => {
  try {
    const build = await CustomBuild.findById(req.params.id).populate('components');
    if (!build) return res.status(404).json({ message: 'Build not found' });

    // Check ownership or public accessibility
    const isOwner = req.user && build.user.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'Admin';
    if (!build.isPublic && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied to this private build' });
    }

    res.json(build);
  } catch (error) {
    next(error);
  }
};

// Update a build
exports.updateBuild = async (req, res, next) => {
  try {
    const { name, componentIds } = req.body;
    
    let totalPrice = 0;
    let isCompatible = true;
    let compatibilityIssues = [];
    let estimatedPowerDraw = 0;

    if (componentIds && componentIds.length > 0) {
      const components = await Component.find({ _id: { $in: componentIds } });
      totalPrice = components.reduce((sum, comp) => sum + comp.price, 0);
      
      const compCheck = checkCompatibility(components);
      isCompatible = compCheck.isCompatible;
      compatibilityIssues = compCheck.issues;
      estimatedPowerDraw = compCheck.estimatedPowerDraw;
    }

    const build = await CustomBuild.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, components: componentIds, totalPrice, isCompatible, compatibilityIssues, estimatedPowerDraw, updatedAt: Date.now() },
      { returnDocument: 'after', runValidators: true }
    ).populate('components');

    if (!build) return res.status(404).json({ message: 'Build not found' });
    res.json(build);
  } catch (error) {
    next(error);
  }
};

// Delete a build
exports.deleteBuild = async (req, res, next) => {
  try {
    const build = await CustomBuild.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!build) return res.status(404).json({ message: 'Build not found' });
    res.json({ message: 'Build deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Compare multiple builds
exports.compareBuilds = async (req, res, next) => {
  try {
    const ids = req.query.ids ? req.query.ids.split(',') : [];
    if (ids.length < 2) {
      return res.status(400).json({ message: 'Please provide at least two build IDs to compare' });
    }

    const query = { _id: { $in: ids } };
    if (req.user && req.user.role !== 'Admin') {
      query.$or = [{ user: req.user._id }, { isPublic: true }];
    }

    const builds = await CustomBuild.find(query).populate('components');
    res.json(builds);
  } catch (error) {
    next(error);
  }
};

// Generate a shareable link
exports.shareBuild = async (req, res, next) => {
  try {
    const build = await CustomBuild.findOne({ _id: req.params.id, user: req.user._id });
    if (!build) return res.status(404).json({ message: 'Build not found' });

    if (!build.shareToken) {
      build.shareToken = crypto.randomBytes(16).toString('hex');
    }
    build.isPublic = true;
    await build.save();

    res.json({
      shareToken: build.shareToken,
      shareUrl: `/shared/build/${build._id}`,
      isPublic: build.isPublic,
      message: 'Shareable build link generated'
    });
  } catch (error) {
    next(error);
  }
};
