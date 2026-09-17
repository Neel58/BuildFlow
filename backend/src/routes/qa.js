const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/queue')
  .get(qaController.getQueue);

router.route('/:orderId/report')
  .post(qaController.recordReport);

router.route('/:orderId/decision')
  .put(qaController.recordDecision);

module.exports = router;
