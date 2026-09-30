const mongoose = require('mongoose');
const {
  initialComponents,
  inMemoryCart,
  inMemoryOrders,
  inMemoryUsers,
  inMemoryAuditLogs,
  inMemoryAssemblyTasks,
  inMemoryQATasks,
  inMemoryLogisticsTasks,
  generateTokens
} = require('../config/mockStore');

module.exports = function offlineFallback(req, res, next) {
  // If MongoDB is connected and alive, delegate to MongoDB controllers
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return next();
  }

  const { method, path: reqPath } = req;

  // 1. Components Catalog (Public & Admin)
  if (reqPath === '/api/components' || reqPath === '/api/components/') {
    if (method === 'GET') {
      const { category, brand, search } = req.query;
      let result = [...initialComponents];
      if (category && category !== 'ALL') {
        result = result.filter(c => c.category.toLowerCase() === category.toLowerCase());
      }
      if (brand) {
        result = result.filter(c => c.brand.toLowerCase() === brand.toLowerCase());
      }
      if (search) {
        result = result.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
      }
      return res.json(result);
    }

    if (method === 'POST') {
      // Admin: Create new component
      const { name, category, brand, price, stock = 10, specifications = {} } = req.body || {};
      const newComp = {
        _id: 'comp_' + Date.now(),
        name: name || 'Custom Component',
        category: category || 'Component',
        brand: brand || 'Generic',
        price: Number(price) || 9999,
        stock: Number(stock) || 10,
        reservedStock: 0,
        availableStock: Number(stock) || 10,
        specifications
      };
      initialComponents.unshift(newComp);
      
      inMemoryAuditLogs.unshift({
        _id: 'log_' + Date.now(),
        action: 'COMPONENT_CREATE',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: 'Component',
        targetId: newComp._id,
        description: `Admin created component: ${newComp.name} (${newComp.category}) at ₹${newComp.price}`,
        createdAt: new Date().toISOString()
      });

      return res.status(201).json(newComp);
    }
  }

  if (reqPath.startsWith('/api/components/')) {
    const id = reqPath.split('/')[3];
    const compIndex = initialComponents.findIndex(c => c._id === id || c.id === id);

    if (method === 'GET') {
      if (compIndex !== -1) return res.json(initialComponents[compIndex]);
      return res.status(404).json({ message: 'Component not found' });
    }

    if (method === 'PUT') {
      // Admin: Update component
      if (compIndex === -1) return res.status(404).json({ message: 'Component not found' });
      const current = initialComponents[compIndex];
      const { name, price, stock, brand, category, specifications } = req.body || {};
      
      const oldPrice = current.price;
      const oldStock = current.stock;

      if (name) current.name = name;
      if (price !== undefined) current.price = Number(price);
      if (stock !== undefined) {
        current.stock = Number(stock);
        current.availableStock = Math.max(0, current.stock - (current.reservedStock || 0));
      }
      if (brand) current.brand = brand;
      if (category) current.category = category;
      if (specifications) current.specifications = { ...current.specifications, ...specifications };

      inMemoryAuditLogs.unshift({
        _id: 'log_' + Date.now(),
        action: 'COMPONENT_UPDATE',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: 'Component',
        targetId: current._id,
        changes: { oldPrice, newPrice: current.price, oldStock, newStock: current.stock },
        description: `Updated component ${current.name}`,
        createdAt: new Date().toISOString()
      });

      return res.json(current);
    }

    if (method === 'DELETE') {
      // Admin: Delete component
      if (compIndex === -1) return res.status(404).json({ message: 'Component not found' });
      const removed = initialComponents.splice(compIndex, 1)[0];

      inMemoryAuditLogs.unshift({
        _id: 'log_' + Date.now(),
        action: 'COMPONENT_DELETE',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: 'Component',
        targetId: id,
        description: `Deleted component: ${removed.name}`,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'Component removed successfully' });
    }
  }

  // 2. Analytics Dashboard & Reports (Admin)
  if (reqPath === '/api/analytics/dashboard' && method === 'GET') {
    const totalRevenue = inMemoryOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
    
    const ordersByStatus = {
      PaymentConfirmed: inMemoryOrders.filter(o => o.status === 'PaymentConfirmed' || o.status === 'Pending').length,
      InAssembly: inMemoryOrders.filter(o => o.status === 'InAssembly').length,
      QualityInspection: inMemoryOrders.filter(o => o.status === 'QualityInspection').length,
      Packaging: inMemoryOrders.filter(o => o.status === 'Packaging').length,
      Shipped: inMemoryOrders.filter(o => o.status === 'Shipped').length,
      Delivered: inMemoryOrders.filter(o => o.status === 'Delivered').length,
      Cancelled: inMemoryOrders.filter(o => o.status === 'Cancelled').length
    };

    const activeOrdersCount = inMemoryOrders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
    const completedOrdersCount = inMemoryOrders.filter(o => o.status === 'Delivered').length;

    const totalUsers = inMemoryUsers.length;
    const activeUsers = inMemoryUsers.filter(u => u.isActive !== false).length;

    const totalComponents = initialComponents.length;
    const lowStockComponents = initialComponents.filter(c => (c.availableStock ?? c.stock) < 15).length;
    const inventoryValuation = initialComponents.reduce((sum, c) => sum + (c.price * c.stock), 0);

    const revenueHistory = [
      { date: 'Sep 24', revenue: 215000, orders: 1 },
      { date: 'Sep 25', revenue: 412000, orders: 1 },
      { date: 'Sep 26', revenue: 180000, orders: 2 },
      { date: 'Sep 27', revenue: 320000, orders: 2 },
      { date: 'Sep 28', revenue: 279999, orders: 1 },
      { date: 'Sep 29', revenue: 499998, orders: 2 },
      { date: 'Sep 30', revenue: 145000, orders: 1 }
    ];

    return res.json({
      totalRevenue,
      activeOrdersCount,
      completedOrdersCount,
      ordersByStatus,
      users: { totalUsers, activeUsers },
      inventory: { totalComponents, lowStockComponents, inventoryValuation },
      revenueHistory
    });
  }

  if (reqPath === '/api/reports/export' && method === 'GET') {
    const { type = 'orders', format = 'json' } = req.query;
    let data = [];
    let fields = [];

    if (type === 'orders') {
      data = inMemoryOrders.map(o => ({
        id: o._id,
        customerEmail: o.customer?.email || o.user?.email || 'N/A',
        totalAmount: o.totalAmount || o.totalPrice,
        status: o.status,
        paymentStatus: o.paymentStatus || 'Completed',
        trackingNumber: o.trackingNumber || 'Pending',
        createdAt: o.createdAt
      }));
      fields = ['id', 'customerEmail', 'totalAmount', 'status', 'paymentStatus', 'trackingNumber', 'createdAt'];
    } else if (type === 'inventory') {
      data = initialComponents.map(c => ({
        id: c._id,
        name: c.name,
        category: c.category,
        brand: c.brand,
        price: c.price,
        stock: c.stock,
        reservedStock: c.reservedStock || 0,
        availableStock: c.availableStock ?? c.stock
      }));
      fields = ['id', 'name', 'category', 'brand', 'price', 'stock', 'reservedStock', 'availableStock'];
    } else if (type === 'users') {
      data = inMemoryUsers.map(u => ({
        id: u._id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: u.isActive !== false,
        createdAt: u.createdAt
      }));
      fields = ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'];
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
      const headerRow = fields.join(',');
      const bodyRows = data.map(row =>
        fields.map(f => {
          let val = row[f] === undefined || row[f] === null ? '' : String(row[f]);
          if (val.includes(',') || val.includes('\n') || val.includes('"')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      );
      return res.send([headerRow, ...bodyRows].join('\n'));
    }

    return res.json({ type, count: data.length, data });
  }

  // 3. User Management (Admin)
  if (reqPath === '/api/users' || reqPath === '/api/users/') {
    if (method === 'GET') {
      const { role } = req.query;
      let users = [...inMemoryUsers];
      if (role && role !== 'ALL') {
        users = users.filter(u => u.role.toLowerCase() === role.toLowerCase());
      }
      return res.json(users);
    }
  }

  if (reqPath.startsWith('/api/users/')) {
    const segments = reqPath.split('/');
    const userId = segments[3];
    const subRoute = segments[4];
    const userIndex = inMemoryUsers.findIndex(u => u._id === userId);

    if (subRoute === 'role' && method === 'PUT') {
      if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
      const { role } = req.body || {};
      const oldRole = inMemoryUsers[userIndex].role;
      inMemoryUsers[userIndex].role = role || 'Customer';

      inMemoryAuditLogs.unshift({
        _id: 'log_' + Date.now(),
        action: 'USER_ROLE_CHANGE',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: 'User',
        targetId: userId,
        changes: { oldRole, newRole: inMemoryUsers[userIndex].role },
        description: `Updated role for ${inMemoryUsers[userIndex].email} from ${oldRole} to ${inMemoryUsers[userIndex].role}`,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'User role updated successfully', user: inMemoryUsers[userIndex] });
    }

    if (subRoute === 'deactivate' && method === 'PUT') {
      if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
      const currentStatus = inMemoryUsers[userIndex].isActive !== false;
      inMemoryUsers[userIndex].isActive = !currentStatus;

      inMemoryAuditLogs.unshift({
        _id: 'log_' + Date.now(),
        action: currentStatus ? 'USER_DEACTIVATE' : 'USER_ACTIVATE',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: 'User',
        targetId: userId,
        description: `${currentStatus ? 'Deactivated' : 'Re-activated'} user ${inMemoryUsers[userIndex].email}`,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'User status updated', user: inMemoryUsers[userIndex] });
    }

    if (method === 'DELETE') {
      if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
      const deleted = inMemoryUsers.splice(userIndex, 1)[0];

      inMemoryAuditLogs.unshift({
        _id: 'log_' + Date.now(),
        action: 'USER_DELETE',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: 'User',
        targetId: userId,
        description: `Deleted account for user ${deleted.email}`,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'User deleted successfully' });
    }

    if (method === 'GET') {
      if (userIndex !== -1) return res.json(inMemoryUsers[userIndex]);
      return res.status(404).json({ message: 'User not found' });
    }
  }

  // 4. Order Management & Invoices (Admin)
  if (reqPath === '/api/orders' || reqPath === '/api/orders/') {
    if (method === 'GET') {
      const { status, search } = req.query;
      let orders = [...inMemoryOrders];
      if (status && status !== 'ALL') {
        orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
      }
      if (search) {
        orders = orders.filter(o => 
          o._id.toLowerCase().includes(search.toLowerCase()) ||
          o.customer?.email?.toLowerCase().includes(search.toLowerCase()) ||
          o.customer?.firstName?.toLowerCase().includes(search.toLowerCase())
        );
      }
      return res.json(orders);
    }
  }

  if (reqPath.startsWith('/api/orders/')) {
    const segments = reqPath.split('/');
    const orderId = segments[3];
    const subRoute = segments[4];
    const order = inMemoryOrders.find(o => o._id === orderId);

    if (subRoute === 'invoice' && method === 'GET') {
      if (!order) return res.status(404).json({ message: 'Order not found' });
      const subtotal = order.totalAmount || order.totalPrice || 199999;
      const gstAmount = Math.round(subtotal * 0.18);
      return res.json({
        invoiceNumber: `INV-${order._id.replace('ORD-', '')}-2026`,
        orderId: order._id,
        invoiceDate: order.createdAt || new Date().toISOString(),
        paymentStatus: order.paymentStatus || 'Completed',
        customer: order.customer || { firstName: 'Valued', lastName: 'Customer', email: 'client@example.com' },
        lineItems: order.items || [{ name: 'Custom BuildFlow Workstation', price: subtotal, quantity: 1 }],
        subtotal,
        gstRate: '18% IGST',
        gstAmount,
        totalWithTax: subtotal + gstAmount,
        hsnCode: '8471.49',
        cleanroomLabSignoff: 'ISO-9001 Bench Verified'
      });
    }

    if ((subRoute === 'state' || subRoute === 'status') && method === 'PUT') {
      if (!order) return res.status(404).json({ message: 'Order not found' });
      const { state, status: newStatus, trackingNumber, carrier, notes } = req.body || {};
      const targetState = state || newStatus;
      const oldState = order.status;
      
      if (targetState) order.status = targetState;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (carrier) order.carrier = carrier;
      if (notes) order.notes = notes;

      inMemoryAuditLogs.unshift({
        _id: 'log_' + Date.now(),
        action: 'ORDER_STATE_OVERRIDE',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: 'Order',
        targetId: orderId,
        changes: { oldState, newState: order.status },
        description: `Overrode order ${orderId} state to "${order.status}"`,
        createdAt: new Date().toISOString()
      });

      return res.json({ message: 'Order state updated', order });
    }
  }

  // 5. Inventory Management (Admin & Warehouse)
  if (reqPath === '/api/inventory' || reqPath === '/api/inventory/') {
    if (method === 'GET') {
      return res.json({
        totalComponents: initialComponents.length,
        components: initialComponents,
        totalStock: initialComponents.reduce((sum, c) => sum + c.stock, 0),
        reservedTotal: initialComponents.reduce((sum, c) => sum + (c.reservedStock || 0), 0)
      });
    }
  }

  if (reqPath.startsWith('/api/inventory/') && reqPath.includes('/adjust') && method === 'PUT') {
    const compId = reqPath.split('/')[3];
    const comp = initialComponents.find(c => c._id === compId || c.id === compId);
    if (!comp) return res.status(404).json({ message: 'Component not found' });

    const { stockAdjustment, newStock, reservedAdjustment } = req.body || {};
    const oldStock = comp.stock;

    if (newStock !== undefined) {
      comp.stock = Math.max(0, Number(newStock));
    } else if (stockAdjustment !== undefined) {
      comp.stock = Math.max(0, comp.stock + Number(stockAdjustment));
    }
    if (reservedAdjustment !== undefined) {
      comp.reservedStock = Math.max(0, (comp.reservedStock || 0) + Number(reservedAdjustment));
    }
    comp.availableStock = Math.max(0, comp.stock - (comp.reservedStock || 0));

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'INVENTORY_STOCK_ADJUST',
      actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
      entityType: 'Inventory',
      targetId: compId,
      changes: { previousStock: oldStock, newStock: comp.stock },
      description: `Stock adjusted for ${comp.name} from ${oldStock} to ${comp.stock}`,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: 'Inventory adjusted successfully', component: comp });
  }

  if (reqPath === '/api/inventory/intake' && method === 'POST') {
    const { componentId, quantity, poNumber, supplier, invoiceNumber, batchSerial, binLocation } = req.body || {};
    const comp = initialComponents.find(c => c._id === componentId || c.id === componentId);
    if (!comp) return res.status(404).json({ message: 'Component not found' });

    const qty = Number(quantity) || 1;
    const previousStock = comp.stock;
    comp.stock += qty;
    comp.availableStock = Math.max(0, comp.stock - (comp.reservedStock || 0));
    if (binLocation) comp.binLocation = binLocation;

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'INVENTORY_PO_INTAKE',
      actor: { firstName: 'Warehouse', lastName: 'Lead', email: 'warehouse@buildflow.dev', role: 'Warehouse' },
      entityType: 'Inventory',
      targetId: comp._id,
      changes: { previousStock, newStock: comp.stock, receivedQty: qty, poNumber, supplier },
      description: `Inbound PO #${poNumber || 'PO-2026-X'} received: +${qty} units of ${comp.name} from ${supplier || 'National Distributor'}. Stored in Bin ${binLocation || 'A-01'}.`,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ message: 'Stock received and logged successfully', component: comp });
  }

  // Active Pick Lists for Cleanroom Assembly
  if (reqPath === '/api/inventory/picks' && method === 'GET') {
    const activeBuildOrders = inMemoryOrders.filter(o => ['PaymentConfirmed', 'InAssembly'].includes(o.status));
    const pickLists = activeBuildOrders.map(order => ({
      orderId: order._id,
      customer: order.customer?.firstName + ' ' + (order.customer?.lastName || ''),
      rigName: order.items?.[0]?.name || 'Custom Precision Rig',
      bayNumber: `Bay ${(order._id.replace(/[^0-9]/g, '') || 3) % 6 + 1}`,
      priority: (order.totalAmount || 0) > 300000 ? 'CRITICAL_HIGH' : 'STANDARD',
      status: order.status === 'InAssembly' ? 'In Progress' : 'Pending Pick',
      items: [
        { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', bin: 'A-02-1', picked: true, serial: 'SN-CPU-7800X-9481' },
        { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', bin: 'B-04-2', picked: true, serial: 'SN-MB-B650-2049' },
        { slot: 'GPU', name: 'NVIDIA GeForce RTX 4090 24GB', bin: 'G-01-1', picked: order.status === 'InAssembly', serial: 'SN-GPU-4090-8812' },
        { slot: 'RAM', name: 'Corsair Vengeance 32GB DDR5 6000MHz', bin: 'R-03-3', picked: order.status === 'InAssembly', serial: 'SN-RAM-6000-4491' },
        { slot: 'SSD', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', bin: 'S-02-4', picked: false, serial: 'SN-SSD-990P-7714' },
        { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', bin: 'C-01-2', picked: false, serial: 'SN-CLR-AK620-3301' },
        { slot: 'PSU', name: 'Corsair RM850x 850W Gold Modular', bin: 'P-05-1', picked: false, serial: 'SN-PSU-850X-1129' },
        { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', bin: 'K-08-1', picked: false, serial: 'SN-CAB-H7F-5582' }
      ]
    }));
    return res.json(pickLists);
  }

  if (reqPath === '/api/inventory/pick-item' && method === 'POST') {
    const { orderId, slot } = req.body || {};
    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'WAREHOUSE_PICK_SCANNED',
      actor: { firstName: 'Warehouse', lastName: 'Technician', email: 'warehouse@buildflow.dev', role: 'Warehouse' },
      entityType: 'PickList',
      targetId: orderId,
      description: `Component [${slot}] scanned and verified from bin for Order ${orderId}`,
      createdAt: new Date().toISOString()
    });
    return res.json({ message: 'Component picked and verified for cleanroom assembly', orderId, slot });
  }

  // 6. Audit Logs (Admin)
  if (reqPath === '/api/audit-logs' || reqPath === '/api/audit-logs/') {
    if (method === 'GET') {
      const { action, actor, search } = req.query;
      let logs = [...inMemoryAuditLogs];
      if (action) {
        logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
      }
      if (search) {
        logs = logs.filter(l => 
          l.description.toLowerCase().includes(search.toLowerCase()) ||
          l.action.toLowerCase().includes(search.toLowerCase())
        );
      }
      return res.json(logs);
    }

    if (method === 'POST') {
      const newLog = {
        _id: 'log_' + Date.now(),
        action: req.body.action || 'ADMIN_ACTION',
        actor: { firstName: 'Admin', lastName: 'Operator', email: 'admin@buildflow.dev', role: 'Admin' },
        entityType: req.body.entityType || 'System',
        targetId: req.body.targetId || 'N/A',
        description: req.body.description || 'Admin operations logged',
        changes: req.body.changes || {},
        createdAt: new Date().toISOString()
      };
      inMemoryAuditLogs.unshift(newLog);
      return res.status(201).json(newLog);
    }
  }

  // 7. Operations Queues & Technician Workstation (Assembly)
  if (reqPath === '/api/assembly/tasks' && method === 'GET') {
    const activeTasks = inMemoryAssemblyTasks.filter(t => t.status === 'In Progress');
    const completedTasks = inMemoryAssemblyTasks.filter(t => t.status === 'Completed');
    const waitingOrders = inMemoryOrders.filter(o => ['PaymentConfirmed', 'Assembly Queue'].includes(o.status));

    const stats = {
      activeBenches: activeTasks.length,
      waitingQueue: waitingOrders.length,
      completedToday: completedTasks.length,
      cleanroomBaysAvailable: Math.max(0, 6 - activeTasks.length),
      cleanroomStatus: 'Class 10,000 ESD Active (0.04 MΩ Resistance)',
      avgAssemblyMinutes: 110
    };

    return res.json({ stats, tasks: inMemoryAssemblyTasks });
  }

  if (reqPath === '/api/assembly/queue' && method === 'GET') {
    const queueOrders = inMemoryOrders
      .filter(o => ['PaymentConfirmed', 'Assembly Queue'].includes(o.status))
      .map(o => {
        const existingTask = inMemoryAssemblyTasks.find(t => t.orderId === o._id || t.order === o._id);
        return {
          orderId: o._id,
          rigName: o.items?.[0]?.name || 'Custom High-Performance Rig',
          customer: o.customer || { firstName: 'Valued', lastName: 'Customer', email: 'customer@buildflow.dev' },
          totalAmount: o.totalAmount || o.totalPrice || 145000,
          status: o.status,
          priority: (o.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
          targetBay: 'Bay 03 (Pending)',
          readyForAssembly: true,
          componentsCount: 8,
          createdAt: o.createdAt || new Date().toISOString(),
          assignedTask: existingTask ? existingTask._id : null
        };
      });
    return res.json(queueOrders);
  }

  if (reqPath === '/api/assembly' && method === 'GET') {
    return res.json(inMemoryAssemblyTasks);
  }

  if (reqPath.startsWith('/api/assembly/') && method === 'GET' && !reqPath.includes('/assign') && !reqPath.includes('/progress') && !reqPath.includes('/milestone') && !reqPath.includes('/complete') && !reqPath.includes('/checklist') && !reqPath.includes('/bios')) {
    const segments = reqPath.split('/');
    const orderId = segments[3] === 'task' ? segments[4] : segments[3];
    const task = inMemoryAssemblyTasks.find(t => t.orderId === orderId || t.order === orderId || t._id === orderId);
    if (task) return res.json(task);

    const order = inMemoryOrders.find(o => o._id === orderId);
    if (!order) return res.status(404).json({ message: 'Assembly task or order not found' });

    // Generate on-the-fly task representation for this order
    const autoTask = {
      _id: 'task_asm_' + orderId.replace('ORD-', ''),
      orderId: order._id,
      order: order._id,
      bayNumber: 'Bay 03 - Precision Bench',
      technician: { _id: 'usr_tech', name: 'Marcus Chen', role: 'Technician', badgeId: 'TECH-409' },
      status: order.status === 'InAssembly' ? 'In Progress' : 'Pending',
      priority: (order.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
      rigName: order.items?.[0]?.name || 'Custom Workstation',
      customer: order.customer || { firstName: 'Valued', lastName: 'Customer', email: 'client@example.com' },
      startedAt: order.status === 'InAssembly' ? order.createdAt : null,
      completedAt: null,
      estimatedMinutes: 140,
      elapsedMinutes: 30,
      componentsChecklist: [
        { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', bin: 'A-02-1', serialNumber: 'SN-CPU-7800X-5120', verified: true, scanned: true },
        { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', bin: 'B-04-2', serialNumber: 'SN-MB-B650-8812', verified: true, scanned: true },
        { slot: 'GPU', name: 'NVIDIA GeForce RTX 4080 SUPER 16GB', bin: 'G-02-1', serialNumber: 'SN-GPU-4080S-4190', verified: true, scanned: true },
        { slot: 'RAM', name: 'Corsair Vengeance RGB 32GB DDR5 6000MHz', bin: 'R-03-3', serialNumber: 'SN-RAM-6000-2219', verified: true, scanned: true },
        { slot: 'SSD', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', bin: 'S-02-4', serialNumber: 'SN-SSD-990P-7714', verified: true, scanned: true },
        { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', bin: 'C-01-2', serialNumber: 'SN-CLR-AK620-3301', verified: true, scanned: true },
        { slot: 'PSU', name: 'Corsair RM850x 850W Gold Modular', bin: 'P-05-1', serialNumber: 'SN-PSU-850X-1129', verified: true, scanned: true },
        { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', bin: 'K-08-1', serialNumber: 'SN-CAB-H7F-5582', verified: true, scanned: true }
      ],
      milestones: [
        { id: 'm1', stepNumber: 1, title: 'Cleanroom ESD Grounding & Mat Calibration', description: 'Wrist strap test passed', done: true, completedAt: '2026-09-30T08:00:00.000Z' },
        { id: 'm2', stepNumber: 2, title: 'CPU Socket Pin Scan & Zero-Force Seating', description: 'Pins inspected and seated', done: true, completedAt: '2026-09-30T08:15:00.000Z' },
        { id: 'm3', stepNumber: 3, title: 'DDR5 Dual-Channel Seating in Slots A2/B2', description: 'Dual clicks verified', done: false, completedAt: null },
        { id: 'm4', stepNumber: 4, title: 'NVMe Gen5 Heatsink Thermal Pad Peel & Torquing', description: 'Pad film removed', done: false, completedAt: null },
        { id: 'm5', stepNumber: 5, title: 'Motherboard Insertion & Standoff Alignment', description: 'Standoffs aligned', done: false, completedAt: null },
        { id: 'm6', stepNumber: 6, title: 'Cooler Mounting & Thermal Interface Spread', description: 'Thermal paste spread', done: false, completedAt: null },
        { id: 'm7', stepNumber: 7, title: 'GPU Seating & Anti-Sag PCIe Bracket', description: 'PCIe slot locked', done: false, completedAt: null },
        { id: 'm8', stepNumber: 8, title: 'Clean Cable Routing & Rear Tie-Downs', description: 'Cable velcro channels tied', done: false, completedAt: null },
        { id: 'm9', stepNumber: 9, title: 'First Cold POST & UEFI BIOS Configuration', description: 'BIOS profile enabled', done: false, completedAt: null },
        { id: 'm10', stepNumber: 10, title: 'Pre-QA Bench Handover Checklist', description: 'Staged for QA', done: false, completedAt: null }
      ],
      biosConfig: {
        biosVersion: 'Latest Stable UEFI v2.10',
        expoProfile: 'AMD EXPO I',
        resizableBar: 'Enabled',
        secureBoot: 'Enabled',
        curveOptimizer: '-20 All Cores',
        fanProfile: 'Optimized Silent Curve'
      },
      benchDiagnostics: {
        cleanroomTemp: '21.4°C',
        cpuIdleTemp: '33.5°C',
        gpuIdleTemp: '28.5°C',
        voltage12v: '12.08 V',
        voltage5v: '5.02 V',
        voltage33v: '3.31 V',
        esdGroundResistance: '0.04 MΩ'
      },
      progressLogs: [
        { id: 'pl_0', log: `Assembly task initialized for order ${orderId}`, timestamp: new Date().toISOString(), tech: 'Marcus Chen' }
      ],
      notes: order.notes || 'Precision cleanroom assembly required.'
    };
    inMemoryAssemblyTasks.unshift(autoTask);
    return res.json(autoTask);
  }

  // Assign Order to Technician Bay
  if (reqPath.startsWith('/api/assembly/') && reqPath.includes('/assign') && (method === 'PUT' || method === 'POST')) {
    const orderId = reqPath.split('/')[3];
    const { bayNumber = 'Bay 02 - Clean ESD Bench', technicianName = 'Marcus Chen', notes } = req.body || {};

    const order = inMemoryOrders.find(o => o._id === orderId);
    if (order) {
      order.status = 'InAssembly';
      if (notes) order.notes = notes;
    }

    let task = inMemoryAssemblyTasks.find(t => t.orderId === orderId || t.order === orderId);
    if (!task) {
      task = {
        _id: 'task_asm_' + orderId.replace('ORD-', ''),
        orderId,
        order: orderId,
        bayNumber,
        technician: { _id: 'usr_tech', name: technicianName, role: 'Technician', badgeId: 'TECH-409' },
        status: 'In Progress',
        priority: order && (order.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
        rigName: order?.items?.[0]?.name || 'Custom Precision Rig',
        customer: order?.customer || { firstName: 'Client', lastName: 'Customer', email: 'customer@buildflow.dev' },
        startedAt: new Date().toISOString(),
        completedAt: null,
        estimatedMinutes: 150,
        elapsedMinutes: 5,
        componentsChecklist: [
          { slot: 'CPU', name: 'AMD Ryzen 7 7800X3D', bin: 'A-02-1', serialNumber: 'SN-CPU-7800X-9481', verified: true, scanned: true },
          { slot: 'Motherboard', name: 'MSI MAG B650 TOMAHAWK WIFI', bin: 'B-04-2', serialNumber: 'SN-MB-B650-2049', verified: true, scanned: true },
          { slot: 'GPU', name: 'NVIDIA GeForce RTX 4080 SUPER 16GB', bin: 'G-01-1', serialNumber: 'SN-GPU-4080-8812', verified: true, scanned: true },
          { slot: 'RAM', name: 'Corsair Vengeance 32GB DDR5 6000MHz', bin: 'R-03-3', serialNumber: 'SN-RAM-6000-4491', verified: true, scanned: true },
          { slot: 'SSD', name: 'Samsung 990 PRO 2TB PCIe 4.0 NVMe', bin: 'S-02-4', serialNumber: 'SN-SSD-990P-7714', verified: true, scanned: true },
          { slot: 'Cooler', name: 'DeepCool AK620 Digital Twin Tower', bin: 'C-01-2', serialNumber: 'SN-CLR-AK620-3301', verified: true, scanned: true },
          { slot: 'PSU', name: 'Corsair RM850x 850W Gold Modular', bin: 'P-05-1', serialNumber: 'SN-PSU-850X-1129', verified: true, scanned: true },
          { slot: 'Cabinet', name: 'NZXT H7 Flow Tempered Glass White', bin: 'K-08-1', serialNumber: 'SN-CAB-H7F-5582', verified: true, scanned: true }
        ],
        milestones: [
          { id: 'm1', stepNumber: 1, title: 'Cleanroom ESD Grounding & Mat Calibration', description: 'Wrist strap tested and grounded', done: true, completedAt: new Date().toISOString() },
          { id: 'm2', stepNumber: 2, title: 'CPU Socket Pin Scan & Zero-Force Seating', description: 'Optical inspection completed', done: false, completedAt: null },
          { id: 'm3', stepNumber: 3, title: 'DDR5 Dual-Channel Seating in Slots A2/B2', description: 'Dual clicks verified', done: false, completedAt: null },
          { id: 'm4', stepNumber: 4, title: 'NVMe Gen5 Heatsink Thermal Pad Peel & Torquing', description: 'Film peeled and torqued', done: false, completedAt: null },
          { id: 'm5', stepNumber: 5, title: 'Motherboard Insertion & Standoff Alignment', description: 'Standoffs aligned', done: false, completedAt: null },
          { id: 'm6', stepNumber: 6, title: 'Cooler Mounting & Thermal Interface Spread', description: 'Thermal interface applied', done: false, completedAt: null },
          { id: 'm7', stepNumber: 7, title: 'GPU Seating & Anti-Sag PCIe Bracket', description: 'PCIe slot locked', done: false, completedAt: null },
          { id: 'm8', stepNumber: 8, title: 'Clean Cable Routing & Rear Tie-Downs', description: 'Cable channels tied with velcro', done: false, completedAt: null },
          { id: 'm9', stepNumber: 9, title: 'First Cold POST & UEFI BIOS Configuration', description: 'BIOS profile updated', done: false, completedAt: null },
          { id: 'm10', stepNumber: 10, title: 'Pre-QA Bench Handover Checklist', description: 'Cleaned and ready for QA stage', done: false, completedAt: null }
        ],
        biosConfig: {
          biosVersion: 'Latest Production UEFI',
          expoProfile: 'AMD EXPO I',
          resizableBar: 'Enabled',
          secureBoot: 'Enabled',
          curveOptimizer: '-20 All Cores',
          fanProfile: 'Quiet Silent Curve'
        },
        benchDiagnostics: {
          cleanroomTemp: '21.4°C',
          cpuIdleTemp: '33.2°C',
          gpuIdleTemp: '28.1°C',
          voltage12v: '12.06 V',
          voltage5v: '5.01 V',
          voltage33v: '3.31 V',
          esdGroundResistance: '0.04 MΩ'
        },
        progressLogs: [
          { id: 'pl_' + Date.now(), log: `Order claimed and started at ${bayNumber} by ${technicianName}`, timestamp: new Date().toISOString(), tech: technicianName }
        ],
        notes: notes || 'Standard precision assembly initiated.'
      };
      inMemoryAssemblyTasks.unshift(task);
    } else {
      task.status = 'In Progress';
      task.bayNumber = bayNumber;
      task.technician.name = technicianName;
      if (!task.startedAt) task.startedAt = new Date().toISOString();
      task.progressLogs.push({
        id: 'pl_' + Date.now(),
        log: `Technician ${technicianName} resumed build at ${bayNumber}`,
        timestamp: new Date().toISOString(),
        tech: technicianName
      });
    }

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'ASSEMBLY_ORDER_ASSIGNED',
      actor: { firstName: 'Marcus', lastName: 'Chen', email: 'technician@buildflow.dev', role: 'Technician' },
      entityType: 'AssemblyTask',
      targetId: orderId,
      description: `Assigned Order ${orderId} to Cleanroom ${bayNumber}`,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: 'Order successfully assigned to cleanroom bench', task, orderStatus: 'InAssembly' });
  }

  // Record Assembly Progress Log
  if (reqPath.startsWith('/api/assembly/') && (reqPath.includes('/progress') || reqPath.includes('/log')) && method === 'POST') {
    const orderId = reqPath.split('/')[3];
    const { log, technicianName = 'Marcus Chen' } = req.body || {};
    if (!log) return res.status(400).json({ message: 'Log content is required' });

    let task = inMemoryAssemblyTasks.find(t => t.orderId === orderId || t.order === orderId);
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    const newLogEntry = {
      id: 'pl_' + Date.now(),
      log,
      timestamp: new Date().toISOString(),
      tech: technicianName
    };
    task.progressLogs.push(newLogEntry);

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'ASSEMBLY_PROGRESS_LOG',
      actor: { firstName: 'Marcus', lastName: 'Chen', email: 'technician@buildflow.dev', role: 'Technician' },
      entityType: 'AssemblyTask',
      targetId: orderId,
      description: `[Order ${orderId}] Logged: "${log}"`,
      createdAt: new Date().toISOString()
    });

    return res.status(201).json({ message: 'Progress log recorded', log: newLogEntry, task });
  }

  // Toggle or Update Milestone
  if (reqPath.startsWith('/api/assembly/') && reqPath.includes('/milestone') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const { milestoneId, done, technicianName = 'Marcus Chen' } = req.body || {};

    let task = inMemoryAssemblyTasks.find(t => t.orderId === orderId || t.order === orderId);
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    const milestone = task.milestones.find(m => m.id === milestoneId || m.stepNumber === Number(milestoneId));
    if (milestone) {
      milestone.done = done !== undefined ? Boolean(done) : !milestone.done;
      milestone.completedAt = milestone.done ? new Date().toISOString() : null;

      task.progressLogs.push({
        id: 'pl_' + Date.now(),
        log: `Milestone "${milestone.title}" marked as ${milestone.done ? 'COMPLETED' : 'PENDING'}`,
        timestamp: new Date().toISOString(),
        tech: technicianName
      });
    }

    return res.json({ message: 'Milestone updated', task, milestone });
  }

  // Toggle Component Verification
  if (reqPath.startsWith('/api/assembly/') && reqPath.includes('/checklist') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const { slot, verified, serialNumber } = req.body || {};

    let task = inMemoryAssemblyTasks.find(t => t.orderId === orderId || t.order === orderId);
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    const item = task.componentsChecklist.find(c => c.slot.toLowerCase() === (slot || '').toLowerCase());
    if (item) {
      if (verified !== undefined) item.verified = Boolean(verified);
      if (serialNumber) item.serialNumber = serialNumber;
      item.scanned = true;
    }

    return res.json({ message: 'Component checklist item updated', task, item });
  }

  // Update BIOS Configuration
  if (reqPath.startsWith('/api/assembly/') && reqPath.includes('/bios') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const biosData = req.body || {};

    let task = inMemoryAssemblyTasks.find(t => t.orderId === orderId || t.order === orderId);
    if (!task) return res.status(404).json({ message: 'Assembly task not found' });

    task.biosConfig = { ...task.biosConfig, ...biosData };
    task.progressLogs.push({
      id: 'pl_' + Date.now(),
      log: `UEFI BIOS configuration updated: EXPO=${task.biosConfig.expoProfile}, ReBAR=${task.biosConfig.resizableBar}`,
      timestamp: new Date().toISOString(),
      tech: 'Marcus Chen'
    });

    return res.json({ message: 'BIOS settings saved', task });
  }

  // Complete Assembly and Handover to QA
  if (reqPath.startsWith('/api/assembly/') && reqPath.includes('/complete') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const { assemblyNotes, technicianName = 'Marcus Chen', targetQaChamber = 'QA Chamber 01 - Thermal Loop' } = req.body || {};

    let task = inMemoryAssemblyTasks.find(t => t.orderId === orderId || t.order === orderId);
    const order = inMemoryOrders.find(o => o._id === orderId);

    if (task) {
      task.status = 'Completed';
      task.completedAt = new Date().toISOString();
      task.milestones.forEach(m => { m.done = true; if (!m.completedAt) m.completedAt = new Date().toISOString(); });
      task.progressLogs.push({
        id: 'pl_' + Date.now(),
        log: `Assembly certified complete by ${technicianName}. Transferred to ${targetQaChamber}.`,
        timestamp: new Date().toISOString(),
        tech: technicianName
      });
      if (assemblyNotes) task.notes = assemblyNotes;
    }

    if (order) {
      order.status = 'QualityInspection';
      order.notes = assemblyNotes || `Cleanroom assembly completed by ${technicianName}. Dispatched to QA Inspection Chamber.`;
    }

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'ASSEMBLY_COMPLETED_SIGNOFF',
      actor: { firstName: 'Marcus', lastName: 'Chen', email: 'technician@buildflow.dev', role: 'Technician' },
      entityType: 'AssemblyTask',
      targetId: orderId,
      description: `Assembly certified for ${orderId}. Transferred to QA Chamber for 32-Pt stress testing.`,
      createdAt: new Date().toISOString()
    });

    return res.json({
      message: 'Assembly successfully completed and dispatched to QA Inspection',
      task,
      orderStatus: 'QualityInspection'
    });
  }

  // 7b. Quality Assurance (QA Inspector Station)
  if ((reqPath === '/api/qa/tasks' || reqPath === '/api/qa/queue' || reqPath === '/api/qa') && method === 'GET') {
    // Sync any orders in QualityInspection into inMemoryQATasks if not present
    const qiOrders = inMemoryOrders.filter(o => ['QualityInspection', 'QA Inspection'].includes(o.status));
    qiOrders.forEach(o => {
      let existing = inMemoryQATasks.find(t => t.orderId === o._id || t.order === o._id);
      if (!existing) {
        existing = {
          _id: 'qa_task_' + o._id.replace('ORD-', ''),
          orderId: o._id,
          order: o._id,
          rigName: o.items?.[0]?.name || 'Custom High-Performance Rig',
          customer: o.customer || { firstName: 'Valued', lastName: 'Customer', email: 'customer@buildflow.dev' },
          inspector: { _id: 'usr_inspect', firstName: 'Priya', lastName: 'Sharma', email: 'inspector@buildflow.dev', role: 'Inspector' },
          status: 'Ready For Inspection',
          decision: 'Pending',
          priority: (o.totalAmount || 0) > 300000 ? 'CRITICAL' : 'STANDARD',
          technicianName: 'Marcus Chen',
          chamberNumber: 'QA Chamber 02',
          components: [
            { slot: 'CPU', name: 'High-Performance Processor', serialNumber: 'SN-CPU-' + o._id, status: 'Verified' },
            { slot: 'Motherboard', name: 'ATX Flagship Motherboard', serialNumber: 'SN-MB-' + o._id, status: 'Verified' },
            { slot: 'GPU', name: 'GeForce RTX Graphics Engine', serialNumber: 'SN-GPU-' + o._id, status: 'Verified' },
            { slot: 'RAM', name: 'DDR5 High-Speed Dual Channel', serialNumber: 'SN-RAM-' + o._id, status: 'Verified' },
            { slot: 'SSD', name: 'PCIe 4.0 NVMe Solid State Drive', serialNumber: 'SN-SSD-' + o._id, status: 'Verified' },
            { slot: 'Cooler', name: 'High-Efficiency Cooling System', serialNumber: 'SN-CLR-' + o._id, status: 'Verified' },
            { slot: 'PSU', name: 'Gold Certified Power Supply', serialNumber: 'SN-PSU-' + o._id, status: 'Verified' },
            { slot: 'Cabinet', name: 'Airflow Enclosure Tempered Glass', serialNumber: 'SN-CAB-' + o._id, status: 'Verified' }
          ],
          checks: [
            { id: 'c1', label: 'POST & Cold Boot', description: 'UEFI initialization under 14s, BIOS verified', passed: true },
            { id: 'c2', label: 'Thermals & Stress Test', description: 'CPU under 72°C and GPU under 64°C in 30-min sustained loop', passed: false },
            { id: 'c3', label: 'Memory & EXPO Stability', description: 'DDR5 MemTest86 0 errors detected', passed: false },
            { id: 'c4', label: 'I/O Ports & Networking', description: 'Front USB-C, rear HDMI/DP, Wi-Fi 6E & 2.5GbE tested', passed: false },
            { id: 'c5', label: 'Chassis & Cosmetic Finish', description: 'No glass scratches, cable routing snug, peel ready', passed: false }
          ],
          report: o.notes || 'Assembled in cleanroom. Staged for QA verification.',
          testedAt: null,
          createdAt: o.createdAt || new Date().toISOString()
        };
        inMemoryQATasks.unshift(existing);
      }
    });

    const pendingCount = inMemoryQATasks.filter(t => t.decision === 'Pending').length;
    const passedToday = inMemoryQATasks.filter(t => t.decision === 'Passed').length;
    const failedToday = inMemoryQATasks.filter(t => t.decision === 'Failed').length;

    return res.json({
      stats: {
        pendingInspection: pendingCount,
        passedToday,
        failedToday,
        activeChamber: 'QA Chamber 01 - Thermal Stress',
        avgPassRate: '98.4%'
      },
      tasks: inMemoryQATasks
    });
  }

  // Single QA Task
  if (reqPath.startsWith('/api/qa/') && method === 'GET' && !reqPath.includes('/report') && !reqPath.includes('/decision') && !reqPath.includes('/check')) {
    const orderId = reqPath.split('/')[3];
    const task = inMemoryQATasks.find(t => t.orderId === orderId || t.order === orderId || t._id === orderId);
    if (task) return res.json(task);

    const order = inMemoryOrders.find(o => o._id === orderId);
    if (!order) return res.status(404).json({ message: 'QA task or order not found' });

    return res.json({
      orderId: order._id,
      rigName: order.items?.[0]?.name || 'High Performance Rig',
      status: 'Ready For Inspection',
      decision: 'Pending',
      components: [],
      checks: []
    });
  }

  // Toggle QA Check
  if (reqPath.startsWith('/api/qa/') && reqPath.includes('/check') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const { checkId, passed } = req.body || {};

    let task = inMemoryQATasks.find(t => t.orderId === orderId || t.order === orderId);
    if (!task) return res.status(404).json({ message: 'QA task not found' });

    const check = task.checks.find(c => c.id === checkId);
    if (check) {
      check.passed = passed !== undefined ? Boolean(passed) : !check.passed;
    }

    return res.json({ message: 'QA check updated', task, check });
  }

  // Record QA Report
  if (reqPath.startsWith('/api/qa/') && reqPath.includes('/report') && method === 'POST') {
    const orderId = reqPath.split('/')[3];
    const { report } = req.body || {};

    let task = inMemoryQATasks.find(t => t.orderId === orderId || t.order === orderId);
    if (!task) return res.status(404).json({ message: 'QA task not found' });

    task.report = report || task.report;
    return res.json({ message: 'QA report recorded', task });
  }

  // Record QA Decision (Passed / Failed)
  if (reqPath.startsWith('/api/qa/') && reqPath.includes('/decision') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const { decision, report, inspectorName = 'Priya Sharma' } = req.body || {};

    if (!['Passed', 'Failed'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be Passed or Failed' });
    }

    let task = inMemoryQATasks.find(t => t.orderId === orderId || t.order === orderId);
    const order = inMemoryOrders.find(o => o._id === orderId);

    if (task) {
      task.decision = decision;
      task.status = decision === 'Passed' ? 'Passed' : 'QA Failed';
      task.testedAt = new Date().toISOString();
      if (report) task.report = report;
      if (decision === 'Passed') {
        task.checks.forEach(c => { c.passed = true; });
      }
    }

    if (order) {
      order.status = decision === 'Passed' ? 'Packaging' : 'QA Failed';
      order.notes = `QA Inspection ${decision} by ${inspectorName}. ${report || ''}`.trim();
    }

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: decision === 'Passed' ? 'QA_INSPECTION_PASSED' : 'QA_INSPECTION_FAILED',
      actor: { firstName: 'Priya', lastName: 'Sharma', email: 'inspector@buildflow.dev', role: 'Inspector' },
      entityType: 'QATask',
      targetId: orderId,
      description: `QA decision for ${orderId}: ${decision}. ${report || ''}`,
      createdAt: new Date().toISOString()
    });

    return res.json({
      message: `QA marked as ${decision}`,
      task,
      orderStatus: order?.status || (decision === 'Passed' ? 'Packaging' : 'QA Failed')
    });
  }

  // 8. Auth Endpoints
  if (reqPath === '/api/auth/login' && method === 'POST') {
    const { email, role: requestedRole } = req.body || {};
    const role = requestedRole || (
      email?.toLowerCase().includes('admin') ? 'Admin' :
      email?.toLowerCase().includes('tech') ? 'Technician' :
      email?.toLowerCase().includes('inspect') ? 'Inspector' :
      email?.toLowerCase().includes('ware') ? 'Warehouse' :
      email?.toLowerCase().includes('logis') ? 'Logistics' : 'Customer'
    );
    const userId = 'usr_' + (role.toLowerCase());
    const tokens = generateTokens(userId, role);
    return res.json({
      _id: userId,
      firstName: email ? email.split('@')[0] : 'BuildFlow',
      lastName: role,
      email: email || 'demo@buildflow.dev',
      role,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  }

  if (reqPath === '/api/auth/register' && method === 'POST') {
    const { firstName, lastName, email, role = 'Customer' } = req.body || {};
    const userId = 'usr_' + Date.now();
    const tokens = generateTokens(userId, role);
    const newUser = {
      _id: userId,
      firstName: firstName || 'User',
      lastName: lastName || '',
      email: email || 'user@buildflow.dev',
      role,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    inMemoryUsers.push(newUser);
    return res.status(201).json({
      ...newUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  }

  // 9. Cart
  if (reqPath === '/api/cart' && method === 'GET') {
    return res.json({ items: inMemoryCart });
  }

  if (reqPath === '/api/cart/add' && method === 'POST') {
    const { itemType, itemId, quantity = 1 } = req.body || {};
    let itemData = null;
    if (itemType === 'Component') {
      const comp = initialComponents.find(c => c._id === itemId || c.id === itemId);
      if (comp) {
        itemData = {
          _id: 'cart_' + Date.now(),
          componentId: comp,
          itemType: 'Component',
          quantity
        };
      }
    } else {
      itemData = {
        _id: 'cart_' + Date.now(),
        customBuildId: { _id: itemId, name: 'Custom Studio Rig', totalPrice: 249999 },
        itemType: 'CustomBuild',
        quantity
      };
    }
    if (itemData) inMemoryCart.push(itemData);
    return res.json({ items: inMemoryCart });
  }

  if (reqPath.startsWith('/api/cart/remove/') && method === 'DELETE') {
    const removeId = reqPath.split('/')[4];
    const index = inMemoryCart.findIndex(i => i._id === removeId || i.id === removeId);
    if (index !== -1) inMemoryCart.splice(index, 1);
    return res.json({ items: inMemoryCart });
  }

  // 10. Orders Checkout & Confirm
  if (reqPath === '/api/orders/checkout' && method === 'POST') {
    const newOrder = {
      _id: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
      customer: { firstName: 'BuildFlow', lastName: 'Customer', email: 'customer@buildflow.dev' },
      user: { _id: 'usr_cust1', email: 'customer@buildflow.dev', firstName: 'BuildFlow' },
      status: 'Pending',
      paymentStatus: 'Pending',
      totalAmount: inMemoryCart.reduce((sum, item) => sum + (item.componentId?.price || item.customBuildId?.totalPrice || 24999), 0),
      totalPrice: inMemoryCart.reduce((sum, item) => sum + (item.componentId?.price || item.customBuildId?.totalPrice || 24999), 0),
      items: [...inMemoryCart],
      createdAt: new Date().toISOString()
    };
    inMemoryOrders.unshift(newOrder);
    return res.status(201).json({ order: newOrder, clientSecret: 'mock_stripe_secret' });
  }

  if (reqPath === '/api/orders/confirm-payment' && method === 'POST') {
    const { orderId } = req.body || {};
    const order = inMemoryOrders.find(o => o._id === orderId) || inMemoryOrders[0];
    if (order) {
      order.paymentStatus = 'Completed';
      order.status = 'PaymentConfirmed';
      order.trackingNumber = 'IND-EXP-' + order._id;
    }
    inMemoryCart.length = 0;
    return res.json({ message: 'Payment confirmed', order: order || inMemoryOrders[0] });
  }

  // 11. Logistics & Dispatch Terminal API
  if (reqPath === '/api/logistics/queue' && method === 'GET') {
    const packagingOrders = inMemoryOrders.filter(o => o.status === 'Packaging' || o.status === 'QualityInspection');
    return res.json(packagingOrders);
  }

  if (reqPath === '/api/logistics/all' || (reqPath === '/api/logistics' && method === 'GET')) {
    const stats = {
      totalShipments: inMemoryLogisticsTasks.length,
      readyToShip: inMemoryLogisticsTasks.filter(t => t.status === 'Ready to Ship').length,
      packaging: inMemoryLogisticsTasks.filter(t => t.status === 'Packaging').length,
      inTransit: inMemoryLogisticsTasks.filter(t => t.status === 'Shipped' || t.status === 'Out for Delivery').length,
      delivered: inMemoryLogisticsTasks.filter(t => t.status === 'Delivered').length,
      failed: inMemoryLogisticsTasks.filter(t => t.status === 'Failed Delivery' || t.status === 'Returned').length,
      totalInsuredValue: inMemoryLogisticsTasks.reduce((sum, t) => sum + (t.insuredValue || 0), 0)
    };
    return res.json({ stats, tasks: inMemoryLogisticsTasks });
  }

  if (reqPath.startsWith('/api/logistics/') && reqPath.includes('/package') && method === 'POST') {
    const orderId = reqPath.split('/')[3];
    const { packedBy, shockSensorId, notes } = req.body || {};
    let task = inMemoryLogisticsTasks.find(t => t.orderId === orderId || t.order === orderId);
    const order = inMemoryOrders.find(o => o._id === orderId);

    if (!task) {
      task = {
        _id: 'task_' + orderId.replace('ORD-', ''),
        orderId,
        order: orderId,
        customer: order?.customer || { firstName: 'Client', lastName: 'Customer', email: 'client@example.com', city: 'Mumbai', state: 'Maharashtra', address: 'Express Delivery Address' },
        rigName: order?.items?.[0]?.name || 'BuildFlow Precision Rig',
        weightKg: 19.0,
        packageDimensions: '64 x 36 x 60 cm',
        status: 'Ready to Ship',
        courier: order?.carrier || 'BlueDart Air Express',
        trackingNumber: order?.trackingNumber || ('IND-EXPRESS-' + orderId),
        insuredValue: order?.totalAmount || order?.totalPrice || 249999,
        packagingDetails: {
          instapakFoamUsed: true,
          tamperTapeApplied: true,
          shockWatchSensorId: shockSensorId || `SW-${orderId.replace('ORD-', '')}-OK`,
          packedBy: packedBy || 'Logistics Tech Lead',
          packagedAt: new Date().toISOString()
        },
        shippedAt: null,
        deliveredAt: null,
        estimatedDelivery: '2026-10-03',
        notes: notes || 'Instapak foam injected and chassis double sealed.'
      };
      inMemoryLogisticsTasks.unshift(task);
    } else {
      task.status = 'Ready to Ship';
      task.packagingDetails = {
        instapakFoamUsed: true,
        tamperTapeApplied: true,
        shockWatchSensorId: shockSensorId || task.packagingDetails?.shockWatchSensorId || `SW-${orderId}-OK`,
        packedBy: packedBy || 'Logistics Tech Lead',
        packagedAt: new Date().toISOString()
      };
      if (notes) task.notes = notes;
    }

    if (order) {
      order.status = 'Packaging';
      order.notes = `Packaged with Instapak foam. Staged at loading dock.`;
    }

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'LOGISTICS_PACKAGE_CONFIRMED',
      actor: { firstName: 'David', lastName: 'Miller', email: 'logistics@buildflow.dev', role: 'Logistics' },
      entityType: 'LogisticsTask',
      targetId: orderId,
      description: `Order ${orderId} confirmed packaged with Instapak foam and staged at loading dock`,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: 'Order packaged and ready to ship', task });
  }

  if (reqPath.startsWith('/api/logistics/') && (reqPath.includes('/shipment') || reqPath.includes('/ship')) && method === 'POST') {
    const orderId = reqPath.split('/')[3];
    const { courier, trackingNumber, serviceType, notes } = req.body || {};
    let task = inMemoryLogisticsTasks.find(t => t.orderId === orderId || t.order === orderId);
    const order = inMemoryOrders.find(o => o._id === orderId);

    const waybill = trackingNumber || `IND-EXPRESS-${orderId.replace('ORD-', '')}`;
    const carrierName = courier || 'BlueDart Air Express';

    if (!task) {
      task = {
        _id: 'task_' + orderId.replace('ORD-', ''),
        orderId,
        order: orderId,
        customer: order?.customer || { firstName: 'Client', lastName: 'Customer', email: 'client@example.com', city: 'Mumbai', state: 'Maharashtra', address: 'Delivery Address' },
        rigName: order?.items?.[0]?.name || 'BuildFlow Precision Rig',
        weightKg: 19.5,
        status: 'Shipped',
        courier: carrierName,
        trackingNumber: waybill,
        serviceType: serviceType || 'Air Freight Express',
        insuredValue: order?.totalAmount || order?.totalPrice || 249999,
        shippedAt: new Date().toISOString(),
        deliveredAt: null,
        estimatedDelivery: '2026-10-02'
      };
      inMemoryLogisticsTasks.unshift(task);
    } else {
      task.status = 'Shipped';
      task.courier = carrierName;
      task.trackingNumber = waybill;
      if (serviceType) task.serviceType = serviceType;
      task.shippedAt = new Date().toISOString();
      if (notes) task.notes = notes;
    }

    if (order) {
      order.status = 'Shipped';
      order.carrier = carrierName;
      order.trackingNumber = waybill;
    }

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'LOGISTICS_DISPATCH_SHIPPED',
      actor: { firstName: 'Rohan', lastName: 'Verma', email: 'logistics@buildflow.dev', role: 'Logistics' },
      entityType: 'LogisticsTask',
      targetId: orderId,
      description: `Dispatched ${orderId} via ${carrierName} (Waybill: ${waybill})`,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: 'Order shipped successfully', task, orderStatus: 'Shipped' });
  }

  if (reqPath.startsWith('/api/logistics/') && reqPath.includes('/delivery-status') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const { status, timestamp } = req.body || {};
    const task = inMemoryLogisticsTasks.find(t => t.orderId === orderId || t.order === orderId);
    const order = inMemoryOrders.find(o => o._id === orderId);

    if (task) {
      task.status = status || 'Delivered';
      if (task.status === 'Delivered') {
        task.deliveredAt = timestamp || new Date().toISOString();
      }
    }

    if (order && status === 'Delivered') {
      order.status = 'Delivered';
    }

    inMemoryAuditLogs.unshift({
      _id: 'log_' + Date.now(),
      action: 'LOGISTICS_DELIVERY_UPDATE',
      actor: { firstName: 'Carrier', lastName: 'Webhook', email: 'courier@logistics.com', role: 'Logistics' },
      entityType: 'LogisticsTask',
      targetId: orderId,
      description: `Delivery status for ${orderId} updated to "${status}"`,
      createdAt: new Date().toISOString()
    });

    return res.json({ message: 'Delivery status updated', task });
  }

  if (reqPath.startsWith('/api/logistics/') && reqPath.includes('/failed-delivery') && method === 'PUT') {
    const orderId = reqPath.split('/')[3];
    const { reason, returnToWarehouse } = req.body || {};
    const task = inMemoryLogisticsTasks.find(t => t.orderId === orderId || t.order === orderId);

    if (task) {
      task.status = returnToWarehouse ? 'Returned' : 'Failed Delivery';
      task.failureReason = reason || 'Delivery address unavailable';
    }

    return res.json({ message: 'Delivery failure recorded', task });
  }

  if (reqPath.includes('/tracking') && method === 'GET') {
    const segments = reqPath.split('/');
    const orderId = segments[3] || 'ORD-98214';
    const task = inMemoryLogisticsTasks.find(t => t.orderId === orderId || t.order === orderId);
    const foundOrder = inMemoryOrders.find(o => o._id === orderId);

    const currentStatus = task?.status || foundOrder?.status || 'Packaging';
    return res.json({
      orderId,
      status: currentStatus,
      trackingNumber: task?.trackingNumber || foundOrder?.trackingNumber || ('IND-EXPRESS-' + orderId),
      carrier: task?.courier || foundOrder?.carrier || 'BlueDart Air Express / Insured Freight',
      serviceType: task?.serviceType || 'Insured Heavy Express',
      insuredValue: task?.insuredValue || foundOrder?.totalAmount || 279999,
      packagedAt: task?.packagingDetails?.packagedAt || '2026-09-29T17:30:00.000Z',
      shippedAt: task?.shippedAt || null,
      deliveredAt: task?.deliveredAt || null,
      estimatedDelivery: task?.estimatedDelivery || '2026-10-02',
      customer: task?.customer || foundOrder?.customer || { firstName: 'Valued', lastName: 'Customer', city: 'Mumbai', address: 'High Street Towers' },
      steps: [
        { label: 'Component Pick & Serial Scan', done: true },
        { label: 'Cleanroom ESD Assembly', done: true },
        { label: 'Stress QA & 32-Pt Thermal Bench', done: ['Packaging', 'Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered'].includes(currentStatus) },
        { label: 'Instapak Foam Injected & Sealed', done: ['Ready to Ship', 'Shipped', 'Out for Delivery', 'Delivered'].includes(currentStatus) },
        { label: 'Express Carrier Dispatch & Transit', done: ['Shipped', 'Out for Delivery', 'Delivered'].includes(currentStatus) },
        { label: 'Zero-Defect Delivered & Signed', done: currentStatus === 'Delivered' }
      ]
    });
  }

  // Pass-through for any unmatched route
  next();
};
