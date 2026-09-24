const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/log/:orderId', notificationController.getOrderNotificationLogs);
router.get('/:userId', notificationController.getUserNotifications);
router.post('/', notificationController.sendNotification);

module.exports = router;
