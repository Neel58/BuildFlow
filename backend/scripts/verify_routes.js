const express = require('express');
const http = require('http');

process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/buildflow_test';

const authRoutes = require('../src/routes/auth');
const userRoutes = require('../src/routes/users');
const componentRoutes = require('../src/routes/components');
const compatibilityRoutes = require('../src/routes/compatibility');
const customBuildRoutes = require('../src/routes/customBuilds');
const cartRoutes = require('../src/routes/cart');
const orderRoutes = require('../src/routes/orders');
const inventoryRoutes = require('../src/routes/inventory');
const assemblyRoutes = require('../src/routes/assembly');
const qaRoutes = require('../src/routes/qa');
const logisticsRoutes = require('../src/routes/logistics');
const notificationRoutes = require('../src/routes/notifications');
const auditLogRoutes = require('../src/routes/auditLogs');
const analyticsRoutes = require('../src/routes/analytics');
const reportRoutes = require('../src/routes/reports');

const app = express();
app.use(express.json());

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

const mockId = '507f1f77bcf86cd799439011';

const requiredRoutes = [
  { method: 'POST', path: '/api/users/register' },
  { method: 'POST', path: '/api/users/login' },
  { method: 'POST', path: '/api/users/password-reset' },
  { method: 'PUT', path: '/api/users/password-reset/verify' },
  { method: 'GET', path: `/api/users/${mockId}` },
  { method: 'PUT', path: `/api/users/${mockId}` },
  { method: 'GET', path: '/api/users' },
  { method: 'PUT', path: `/api/users/${mockId}/role` },
  { method: 'PUT', path: `/api/users/${mockId}/deactivate` },
  { method: 'DELETE', path: `/api/users/${mockId}` },

  { method: 'GET', path: '/api/components' },
  { method: 'GET', path: `/api/components/${mockId}` },
  { method: 'POST', path: '/api/components' },
  { method: 'PUT', path: `/api/components/${mockId}` },
  { method: 'DELETE', path: `/api/components/${mockId}` },

  { method: 'POST', path: '/api/builds' },
  { method: 'GET', path: `/api/builds/${mockId}` },
  { method: 'GET', path: `/api/builds/user/${mockId}` },
  { method: 'PUT', path: `/api/builds/${mockId}` },
  { method: 'DELETE', path: `/api/builds/${mockId}` },
  { method: 'GET', path: '/api/builds/compare' },
  { method: 'POST', path: `/api/builds/${mockId}/share` },

  { method: 'GET', path: `/api/cart/${mockId}` },
  { method: 'POST', path: `/api/cart/${mockId}/items` },
  { method: 'PUT', path: `/api/cart/${mockId}/items/${mockId}` },
  { method: 'DELETE', path: `/api/cart/${mockId}/items/${mockId}` },

  { method: 'POST', path: '/api/orders/checkout' },
  { method: 'POST', path: '/api/orders' },
  { method: 'GET', path: `/api/orders/${mockId}` },
  { method: 'GET', path: `/api/orders/user/${mockId}` },
  { method: 'GET', path: `/api/orders/${mockId}/invoice` },
  { method: 'POST', path: `/api/orders/${mockId}/reorder` },
  { method: 'PUT', path: `/api/orders/${mockId}/state` },
  { method: 'GET', path: '/api/orders' },

  { method: 'GET', path: '/api/inventory' },
  { method: 'GET', path: `/api/inventory/${mockId}` },
  { method: 'PUT', path: `/api/inventory/${mockId}/adjust` },
  { method: 'POST', path: '/api/inventory/reserve' },
  { method: 'POST', path: '/api/inventory/allocate' },
  { method: 'POST', path: '/api/inventory/release' },
  { method: 'GET', path: '/api/inventory/low-stock' },

  { method: 'GET', path: '/api/assembly/queue' },
  { method: 'PUT', path: `/api/assembly/${mockId}/assign` },
  { method: 'POST', path: `/api/assembly/${mockId}/progress` },
  { method: 'PUT', path: `/api/assembly/${mockId}/complete` },

  { method: 'GET', path: '/api/qa/queue' },
  { method: 'POST', path: `/api/qa/${mockId}/report` },
  { method: 'PUT', path: `/api/qa/${mockId}/decision` },

  { method: 'POST', path: `/api/logistics/${mockId}/package` },
  { method: 'POST', path: `/api/logistics/${mockId}/shipment` },
  { method: 'GET', path: `/api/logistics/${mockId}/tracking` },
  { method: 'PUT', path: `/api/logistics/${mockId}/delivery-status` },
  { method: 'PUT', path: `/api/logistics/${mockId}/failed-delivery` },

  { method: 'GET', path: `/api/notifications/${mockId}` },
  { method: 'POST', path: '/api/notifications' },
  { method: 'GET', path: `/api/notifications/log/${mockId}` },

  { method: 'GET', path: '/api/audit-logs' },
  { method: 'GET', path: `/api/audit-logs/${mockId}` },
  { method: 'POST', path: '/api/audit-logs' },

  { method: 'GET', path: '/api/analytics/dashboard' },
  { method: 'GET', path: '/api/reports/export' }
];

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Server listening on test port ${port}`);
  console.log('--- Testing API Route Resolution ---');

  let passed = 0;
  let failed = 0;

  for (const route of requiredRoutes) {
    const is404 = await new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: route.path,
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        timeout: 300
      }, (res) => {
        resolve(res.statusCode === 404);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.on('error', () => resolve(false));
      req.end();
    });

    if (!is404) {
      console.log(`✅ [MOUNTED] ${route.method.padEnd(6)} ${route.path}`);
      passed++;
    } else {
      console.log(`❌ [NOT MOUNTED / 404] ${route.method.padEnd(6)} ${route.path}`);
      failed++;
    }
  }

  server.close(() => {
    if (failed === 0) {
      console.log(`\n🎉 SUCCESS: All ${passed} API routes from api's.md are correctly mounted and reachable!`);
      process.exit(0);
    } else {
      console.error(`\n❌ FAILURE: ${failed} routes returned 404 Not Found.`);
      process.exit(1);
    }
  });
});
