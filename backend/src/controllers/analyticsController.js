const Order = require('../models/Order');
const Component = require('../models/Component');
const User = require('../models/User');

// GET /api/analytics/dashboard
exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const orders = await Order.find().lean();
    const components = await Component.find().lean();
    const users = await User.find().lean();

    const totalRevenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);

    const ordersByStatus = {
      PaymentConfirmed: orders.filter(o => ['PaymentConfirmed', 'Payment Verified', 'Pending'].includes(o.status)).length,
      InAssembly: orders.filter(o => ['InAssembly', 'In Assembly'].includes(o.status)).length,
      QualityInspection: orders.filter(o => ['QualityInspection', 'QA Inspection'].includes(o.status)).length,
      Packaging: orders.filter(o => o.status === 'Packaging').length,
      Shipped: orders.filter(o => o.status === 'Shipped').length,
      Delivered: orders.filter(o => o.status === 'Delivered').length,
      Cancelled: orders.filter(o => o.status === 'Cancelled').length
    };

    const activeOrdersCount = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
    const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive !== false).length;

    const totalComponents = components.length;
    const lowStockComponents = components.filter(c => ((c.availableStock !== undefined ? c.availableStock : c.stock) < 15)).length;
    const inventoryValuation = components.reduce((sum, c) => sum + ((c.price || 0) * (c.stock || 0)), 0);

    const revenueHistory = [
      { date: 'Sep 24', revenue: 215000, orders: 1 },
      { date: 'Sep 25', revenue: 412000, orders: 1 },
      { date: 'Sep 26', revenue: 180000, orders: 2 },
      { date: 'Sep 27', revenue: 320000, orders: 2 },
      { date: 'Sep 28', revenue: 279999, orders: 1 },
      { date: 'Sep 29', revenue: 379999, orders: 2 },
      { date: 'Sep 30', revenue: 145000, orders: 1 }
    ];

    res.json({
      totalRevenue,
      activeOrdersCount,
      completedOrdersCount,
      ordersByStatus,
      totalUsers,
      activeUsers,
      totalComponents,
      lowStockComponents,
      inventoryValuation,
      revenueHistory,
      users: { totalUsers, activeUsers },
      inventory: { totalComponents, lowStockComponents, inventoryValuation }
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
        id: o.orderId || o._id.toString(),
        customer: o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : (o.user ? o.user.email : 'N/A'),
        totalAmount: o.totalAmount || o.totalPrice || 0,
        status: o.status,
        createdAt: o.createdAt
      }));
      fields = ['id', 'customer', 'totalAmount', 'status', 'createdAt'];

    } else if (type === 'inventory') {
      const components = await Component.find().lean();
      data = components.map(c => ({
        id: c._id.toString(),
        name: c.name,
        category: c.category,
        brand: c.brand,
        price: c.price,
        stock: c.stock,
        reservedStock: c.reservedStock || 0,
        availableStock: Math.max(0, (c.stock || 0) - (c.reservedStock || 0))
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
