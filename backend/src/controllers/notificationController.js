const Notification = require('../models/Notification');

// GET /api/notifications/:userId
exports.getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (req.user.role !== 'Admin' && req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// POST /api/notifications
exports.sendNotification = async (req, res, next) => {
  try {
    const { userId, user, order, orderId, type = 'In-App', message } = req.body;
    const targetUser = userId || user || (req.user && req.user._id);
    const targetOrder = orderId || order;

    if (!targetUser || !message) {
      return res.status(400).json({ message: 'User and message are required' });
    }

    const notification = new Notification({
      user: targetUser,
      order: targetOrder,
      type,
      message,
      status: 'Sent'
    });

    const savedNotification = await notification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/log/:orderId
exports.getOrderNotificationLogs = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const notifications = await Notification.find({ order: orderId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};
