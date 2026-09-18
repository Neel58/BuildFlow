const express = require('express');
const router = express.Router();
const customBuildController = require('../controllers/customBuildController');
const { protect } = require('../middleware/auth');

// Optional protect wrapper for GET /:id so public builds can be viewed without token
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/compare', optionalProtect, customBuildController.compareBuilds);
router.get('/user/:userId', protect, customBuildController.getUserBuilds);

router.route('/')
  .post(protect, customBuildController.saveBuild)
  .get(protect, customBuildController.getUserBuilds);

router.route('/:id')
  .get(optionalProtect, customBuildController.getBuildById)
  .put(protect, customBuildController.updateBuild)
  .delete(protect, customBuildController.deleteBuild);

router.route('/:id/share')
  .post(protect, customBuildController.shareBuild);

module.exports = router;
