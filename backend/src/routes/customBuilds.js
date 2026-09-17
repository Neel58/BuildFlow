const express = require('express');
const router = express.Router();
const customBuildController = require('../controllers/customBuildController');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(customBuildController.saveBuild)
  .get(customBuildController.getUserBuilds);

router.route('/compare')
  .get(customBuildController.compareBuilds);

router.route('/:id')
  .get(customBuildController.getBuildById)
  .put(customBuildController.updateBuild)
  .delete(customBuildController.deleteBuild);

router.route('/:id/share')
  .post(customBuildController.shareBuild);

module.exports = router;
