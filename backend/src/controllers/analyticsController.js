const Order = require('../models/Order');
const Component = require('../models/Component');
const User = require('../models/User');

// GET /api/analytics/dashboard
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Total revenue from completed / verified orders
    const revenueAggregation = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0;

    // 2. Orders count by status
    const statusAggregation = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const ordersByStatus = {};
    let activeOrdersCount = 0;
    let completedOrdersCount = 0;

    statusAggregation.forEach(item => {
      ordersByStatus[item._id] = item.count;
      if (item._id === 'Delivered') {
        completedOrdersCount += item.count;
      } else if (item._id !== 'Cancelled') {
        activeOrdersCount += item.count;
      }
    });

    // 3. User counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // 4. Inventory metrics
    const totalComponents = await Component.countDocuments();
    const lowStockComponents = await Component.countDocuments({ stock: { $lt: 10 } });

    res.json({
      totalRevenue,
      activeOrdersCount,
      completedOrdersCount,
      ordersByStatus,
      users: { totalUsers, activeUsers },
      inventory: { totalComponents, lowStockComponents }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/export?type=&format=
exports.exportReport = async (req, res, next) => {
  try {
    const { type = 'orders', format = 'json' } = req.query;

    let data = [];
    let fields = [];

    if (type === 'orders') {
      const orders = await Order.find().populate('user', 'email firstName lastName').lean();
      data = orders.map(o => ({
        id: o._id.toString(),
        userEmail: o.user ? o.user.email : 'N/A',
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt
      }));
      fields = ['id', 'userEmail', 'totalAmount', 'status', 'createdAt'];

    } else if (type === 'inventory') {
      const components = await Component.find().lean();
      data = components.map(c => ({
        id: c._id.toString(),
        name: c.name,
        category: c.category,
        brand: c.brand,
        price: c.price,
        stock: c.stock,
        reservedStock: c.reservedStock,
        availableStock: c.stock - c.reservedStock
      }));
      fields = ['id', 'name', 'category', 'brand', 'price', 'stock', 'reservedStock', 'availableStock'];

    } else if (type === 'users') {
      const users = await User.find().select('-password').lean();
      data = users.map(u => ({
        id: u._id.toString(),
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive
      }));
      fields = ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'];
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);

      // Simple CSV string generator
      const headerRow = fields.join(',');
      const bodyRows = data.map(row => 
        fields.map(field => {
          let val = row[field];
          if (val === undefined || val === null) val = '';
          val = String(val).replace(/"/g, '""');
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val}"`;
          }
          return val;
        }).join(',')
      );

      const csvString = [headerRow, ...bodyRows].join('\n');
      return res.send(csvString);
    }

    res.json({ type, count: data.length, data });
  } catch (error) {
    next(error);
  }
};
