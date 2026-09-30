const Component = require('../models/Component');
const User = require('../models/User');
const Order = require('../models/Order');
const AssemblyTask = require('../models/AssemblyTask');
const QATask = require('../models/QATask');
const LogisticsTask = require('../models/LogisticsTask');
const AuditLog = require('../models/AuditLog');

const {
  initialComponents,
  inMemoryUsers,
  inMemoryOrders,
  inMemoryAssemblyTasks,
  inMemoryQATasks,
  inMemoryLogisticsTasks,
  inMemoryAuditLogs
} = require('./mockStore');

async function autoSeedDatabase() {
  try {
    const compCount = await Component.countDocuments();
    if (compCount > 0) {
      console.log(`[BuildFlow DB] Database already contains ${compCount} components. Auto-seed skipped.`);
      return;
    }

    console.log('[BuildFlow DB] First-time connection detected: populating complete database...');

    // 1. Seed Components
    const cleanComponents = initialComponents.map(c => {
      const copy = { ...c };
      delete copy._id; // Let Mongoose assign real ObjectId or keep if needed
      return copy;
    });
    const insertedComponents = await Component.insertMany(cleanComponents);
    console.log(`[BuildFlow DB] Seeded ${insertedComponents.length} components.`);

    // 2. Seed Users
    const usersToInsert = inMemoryUsers.map(u => ({
      email: u.email,
      password: 'Password123!', // Hashed automatically by User pre-save hook
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isActive: u.isActive !== false
    }));
    const insertedUsers = await User.insertMany(usersToInsert);
    console.log(`[BuildFlow DB] Seeded ${insertedUsers.length} system users.`);

    // Map user email to user ObjectId
    const userMap = {};
    insertedUsers.forEach(u => {
      userMap[u.email] = u._id;
    });

    // 3. Seed Orders
    const ordersToInsert = inMemoryOrders.map(o => {
      const assignedUserId = userMap[o.customer?.email] || userMap['customer@buildflow.dev'] || insertedUsers[0]._id;
      return {
        orderId: o._id,
        user: assignedUserId,
        customer: o.customer,
        items: o.items.map(i => ({
          itemType: 'Component',
          name: i.name || i.title,
          title: i.title || i.name,
          quantity: i.quantity || 1,
          priceAtPurchase: i.price || 0,
          price: i.price || 0
        })),
        totalAmount: o.totalAmount || o.totalPrice,
        totalPrice: o.totalPrice || o.totalAmount,
        status: o.status === 'InAssembly' ? 'In Assembly' : (o.status === 'QualityInspection' ? 'QA Inspection' : o.status),
        paymentStatus: o.paymentStatus || 'Completed',
        trackingNumber: o.trackingNumber,
        carrier: o.carrier,
        notes: o.notes,
        createdAt: o.createdAt ? new Date(o.createdAt) : new Date()
      };
    });
    const insertedOrders = await Order.insertMany(ordersToInsert);
    console.log(`[BuildFlow DB] Seeded ${insertedOrders.length} production orders.`);

    // Map orderId to order ObjectId
    const orderMap = {};
    insertedOrders.forEach(o => {
      orderMap[o.orderId] = o._id;
    });

    // 4. Seed Assembly Tasks
    const asmToInsert = inMemoryAssemblyTasks.map(t => ({
      order: orderMap[t.orderId] || null,
      orderId: t.orderId,
      bayNumber: t.bayNumber,
      technician: t.technician,
      status: t.status,
      priority: t.priority,
      rigName: t.rigName,
      customer: t.customer,
      startedAt: t.startedAt ? new Date(t.startedAt) : new Date(),
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
      estimatedMinutes: t.estimatedMinutes,
      elapsedMinutes: t.elapsedMinutes,
      componentsChecklist: t.componentsChecklist,
      milestones: t.milestones,
      biosConfig: t.biosConfig,
      benchDiagnostics: t.benchDiagnostics,
      progressLogs: t.progressLogs,
      notes: t.notes
    }));
    await AssemblyTask.insertMany(asmToInsert);
    console.log(`[BuildFlow DB] Seeded ${asmToInsert.length} assembly workstation tasks.`);

    // 5. Seed QA Tasks
    const qaToInsert = inMemoryQATasks.map(q => ({
      order: orderMap[q.orderId] || null,
      orderId: q.orderId,
      rigName: q.rigName,
      customer: q.customer,
      inspector: q.inspector,
      status: q.status,
      decision: q.decision,
      priority: q.priority,
      technicianName: q.technicianName,
      chamberNumber: q.chamberNumber,
      components: q.components,
      checks: q.checks,
      report: q.report,
      createdAt: q.createdAt ? new Date(q.createdAt) : new Date()
    }));
    await QATask.insertMany(qaToInsert);
    console.log(`[BuildFlow DB] Seeded ${qaToInsert.length} QA inspection chamber tasks.`);

    // 6. Seed Logistics Tasks
    const logToInsert = inMemoryLogisticsTasks.map(l => ({
      order: orderMap[l.orderId] || null,
      orderId: l.orderId,
      customer: l.customer,
      rigName: l.rigName,
      weightKg: l.weightKg,
      packageDimensions: l.packageDimensions,
      status: l.status,
      courier: l.courier,
      trackingNumber: l.trackingNumber,
      serviceType: l.serviceType,
      insuredValue: l.insuredValue,
      packagingDetails: l.packagingDetails,
      shippedAt: l.shippedAt ? new Date(l.shippedAt) : null,
      deliveredAt: l.deliveredAt ? new Date(l.deliveredAt) : null,
      estimatedDelivery: l.estimatedDelivery,
      notes: l.notes
    }));
    await LogisticsTask.insertMany(logToInsert);
    console.log(`[BuildFlow DB] Seeded ${logToInsert.length} logistics and shipment tasks.`);

    // 7. Seed Audit Logs
    const auditToInsert = inMemoryAuditLogs.map(a => ({
      action: a.action,
      actor: a.actor,
      entityType: a.entityType,
      targetId: a.targetId,
      changes: a.changes,
      description: a.description,
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date()
    }));
    await AuditLog.insertMany(auditToInsert);
    console.log(`[BuildFlow DB] Seeded ${auditToInsert.length} security and operations audit logs.`);

    console.log('[BuildFlow DB] Full database auto-seeding completed successfully!');
  } catch (err) {
    console.error('[BuildFlow DB] Auto-seed error:', err.message);
  }
}

module.exports = { autoSeedDatabase };
