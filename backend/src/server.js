const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Connect to Database
connectDB();
const PORT = process.env.PORT || 3000;

// Security and Logging Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static asset serving for images and client files
const distDir = path.resolve(__dirname, '../../dist');
const publicDir = path.resolve(__dirname, '../../public');
const assetsDir = path.resolve(__dirname, '../../src/assets');

app.use('/src/assets', express.static(assetsDir));
app.use('/assets', express.static(path.join(distDir, 'assets')));
app.use(express.static(distDir));
app.use(express.static(publicDir));

// Root & Health Check Endpoints
const rootJsonHandler = (req, res) => {
  res.status(200).json({
    message: 'Welcome to BuildFlow API Server (MERN Stack)',
    health: '/api/health',
    frontend: 'React (Vite)',
    endpoints: {
      users: '/api/users',
      components: '/api/components',
      builds: '/api/builds',
      cart: '/api/cart',
      orders: '/api/orders',
      inventory: '/api/inventory',
      assembly: '/api/assembly',
      qa: '/api/qa',
      logistics: '/api/logistics',
      notifications: '/api/notifications',
      auditLogs: '/api/audit-logs',
      analytics: '/api/analytics/dashboard',
      reports: '/api/reports/export'
    }
  });
};

const spaHandler = (req, res) => {
  const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
  const distIndexPath = path.join(distDir, 'index.html');
  const publicIndexPath = path.join(publicDir, 'index.html');

  if (acceptsHtml) {
    if (fs.existsSync(distIndexPath)) {
      return res.sendFile(distIndexPath);
    }
    if (fs.existsSync(publicIndexPath)) {
      return res.sendFile(publicIndexPath);
    }
  }
  return rootJsonHandler(req, res);
};

app.get('/', spaHandler);
app.get(['/builder', '/custom-build', '/custom-builder', '/builder.html', '/custom-build.html'], spaHandler);
app.get('/api', rootJsonHandler);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const componentRoutes = require('./routes/components');
const compatibilityRoutes = require('./routes/compatibility');
const customBuildRoutes = require('./routes/customBuilds');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const assemblyRoutes = require('./routes/assembly');
const qaRoutes = require('./routes/qa');
const logisticsRoutes = require('./routes/logistics');
const notificationRoutes = require('./routes/notifications');
const auditLogRoutes = require('./routes/auditLogs');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/builds', customBuildRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/assembly', assemblyRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Fallback to React SPA for any client navigation paths
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return spaHandler(req, res);
  }
  next();
});

// Route-level database offline fallback
app.use((err, req, res, next) => {
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    (err.message && (err.message.includes('buffering timed out') || err.message.includes('ECONNREFUSED')))
  ) {
    console.warn('[AI Studio] Database offline — returning mock empty response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

// Centralized Error Handler Middleware
app.use(errorHandler);

// App Listener
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
