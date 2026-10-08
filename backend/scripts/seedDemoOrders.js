const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('../src/models/Order');
const User = require('../src/models/User');
const Component = require('../src/models/Component');
const AssemblyTask = require('../src/models/AssemblyTask');
const QATask = require('../src/models/QATask');
const LogisticsTask = require('../src/models/LogisticsTask');

dotenv.config();

const seedDemoOrders = async () => {
  try {
    const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buildflow';
    await mongoose.connect(connUri);
    console.log('[seedDemoOrders] MongoDB connected.');

    // 1. Get the seeded Customer and Technician users
    const customer = await User.findOne({ email: 'customer@buildflow.dev' });
    const technician = await User.findOne({ email: 'technician@buildflow.dev' });
    const inspector = await User.findOne({ email: 'inspector@buildflow.dev' });
    const warehouse = await User.findOne({ email: 'warehouse@buildflow.dev' });
    const logistics = await User.findOne({ email: 'logistics@buildflow.dev' });

    if (!customer) {
      throw new Error('Customer user not found. Please run seedUsers.js first.');
    }

    // 2. Get some components for realistic orders
    const cpus = await Component.find({ category: 'CPU' }).limit(2);
    const gpus = await Component.find({ category: 'GPU' }).limit(2);
    const motherboards = await Component.find({ category: 'Motherboard' }).limit(2);
    const rams = await Component.find({ category: 'RAM' }).limit(2);
    const ssds = await Component.find({ category: 'SSD' }).limit(2);
    const psus = await Component.find({ category: 'PSU' }).limit(2);
    const cases = await Component.find({ category: 'Cabinet' }).limit(2);
    const coolers = await Component.find({ category: 'Cooler' }).limit(2);
    
    if (cpus.length === 0) {
        throw new Error('No components found. Please ensure database is seeded.');
    }

    const buildItems = (tier) => {
        let idx = tier === 'high' ? 0 : 1;
        // Make sure we have enough components to pick from, otherwise fallback to index 0
        const getComp = (arr, i) => arr.length > i ? arr[i] : arr[0];
        
        const comps = [
            getComp(cpus, idx), getComp(motherboards, idx), getComp(gpus, idx),
            getComp(rams, idx), getComp(ssds, idx), getComp(psus, idx),
            getComp(cases, idx), getComp(coolers, idx)
        ].filter(Boolean); // Filter out any undefined just in case

        return comps.map(c => ({
            itemType: 'Component',
            componentId: c._id,
            name: c.name,
            title: c.name,
            quantity: 1,
            priceAtPurchase: c.price,
            price: c.price
        }));
    };

    const calcTotal = (items) => items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    
    const baseCustomerInfo = {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: '+91 9876543210'
    };

    const shippingAddresses = [
        { street: '101 Cyber City, DLF Phase 2', city: 'Gurugram', state: 'Haryana', zipCode: '122002', country: 'India' },
        { street: '402 High Street Towers, Senapati Bapat Marg', city: 'Mumbai', state: 'Maharashtra', zipCode: '400013', country: 'India' },
        { street: 'Villa 14, Palm Meadows', city: 'Bengaluru', state: 'Karnataka', zipCode: '560066', country: 'India' },
        { street: 'A-21, Sector 62', city: 'Noida', state: 'UP', zipCode: '201309', country: 'India' },
        { street: 'Flat 5B, Marina Heights, OMR', city: 'Chennai', state: 'Tamil Nadu', zipCode: '600119', country: 'India' },
        { street: 'Bungalow 7, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', zipCode: '500033', country: 'India' }
    ];

    // Clear existing tasks & orders to have a clean slate for demo
    console.log('[seedDemoOrders] Clearing existing demo orders and tasks...');
    await Order.deleteMany({});
    await AssemblyTask.deleteMany({});
    await QATask.deleteMany({});
    await LogisticsTask.deleteMany({});

    // Order 1: Warehouse Allocating (Shows in Warehouse)
    let items1 = buildItems('high');
    const order1 = await Order.create({
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        user: customer._id,
        customer: baseCustomerInfo,
        items: items1,
        totalAmount: calcTotal(items1),
        totalPrice: calcTotal(items1),
        status: 'Warehouse Allocating',
        shippingAddress: shippingAddresses[0]
    });
    console.log(`Created Order 1 (Warehouse Allocating): ${order1.orderId}`);

    // Order 2: Assembly Queue (Shows in Technician queue, unassigned)
    let items2 = buildItems('mid');
    const order2 = await Order.create({
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        user: customer._id,
        customer: baseCustomerInfo,
        items: items2,
        totalAmount: calcTotal(items2),
        totalPrice: calcTotal(items2),
        status: 'Assembly Queue',
        shippingAddress: shippingAddresses[1]
    });
    // For Assembly Queue, we might optionally create a pending AssemblyTask
    await AssemblyTask.create({
        order: order2._id,
        orderId: order2.orderId,
        customer: baseCustomerInfo,
        status: 'Pending',
        rigName: 'Mid-Tier Gaming Rig',
        componentsChecklist: items2.map(item => ({
            slot: 'Component',
            name: item.name,
            verified: false
        }))
    });
    console.log(`Created Order 2 (Assembly Queue): ${order2.orderId}`);

    // Order 3: In Assembly (Assigned to Technician, 5/8 assembled)
    let items3 = buildItems('high');
    const order3 = await Order.create({
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        user: customer._id,
        customer: baseCustomerInfo,
        items: items3,
        totalAmount: calcTotal(items3),
        totalPrice: calcTotal(items3),
        status: 'In Assembly',
        shippingAddress: shippingAddresses[2]
    });
    const checklist3 = items3.map((item, index) => ({
        slot: 'Component',
        name: item.name,
        verified: index < 5 // First 5 marked as assembled
    }));
    await AssemblyTask.create({
        order: order3._id,
        orderId: order3.orderId,
        technician: { firstName: technician.firstName, lastName: technician.lastName, email: technician.email },
        customer: baseCustomerInfo,
        status: 'In Progress',
        rigName: 'Enthusiast 4K Build',
        componentsChecklist: checklist3,
        startedAt: new Date(Date.now() - 3600000) // started 1 hour ago
    });
    console.log(`Created Order 3 (In Assembly): ${order3.orderId}`);

    // Order 4: QA Inspection (Shows in Inspector's QA Queue)
    let items4 = buildItems('mid');
    const order4 = await Order.create({
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        user: customer._id,
        customer: baseCustomerInfo,
        items: items4,
        totalAmount: calcTotal(items4),
        totalPrice: calcTotal(items4),
        status: 'QA Inspection',
        shippingAddress: shippingAddresses[3]
    });
    await QATask.create({
        order: order4._id,
        orderId: order4.orderId,
        customer: baseCustomerInfo,
        status: 'Ready For Inspection',
        decision: 'Pending',
        rigName: 'Creator Workstation',
        technicianName: 'Marcus Chen',
        checks: [
            { id: 'POST', label: 'System POST Test', passed: false },
            { id: 'BIOS', label: 'BIOS Configured & XMP Enabled', passed: false },
            { id: 'OS', label: 'OS Boot Test', passed: false },
            { id: 'THERMAL', label: 'Thermal Stress Test', passed: false }
        ]
    });
    console.log(`Created Order 4 (QA Inspection): ${order4.orderId}`);

    // Order 5: Packaging (Logistics queue, QA Passed)
    let items5 = buildItems('high');
    const order5 = await Order.create({
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        user: customer._id,
        customer: baseCustomerInfo,
        items: items5,
        totalAmount: calcTotal(items5),
        totalPrice: calcTotal(items5),
        status: 'Packaging',
        shippingAddress: shippingAddresses[4]
    });
    // Needs LogisticsTask for packaging
    await LogisticsTask.create({
        order: order5._id,
        orderId: order5.orderId,
        customer: baseCustomerInfo,
        rigName: 'Ultimate Gaming PC',
        status: 'Packaging',
        weightKg: 18.5,
        packageDimensions: '62 x 34 x 58 cm',
        courier: 'BlueDart Air Express',
        serviceType: 'Insured Heavy Express',
        insuredValue: calcTotal(items5)
    });
    console.log(`Created Order 5 (Packaging): ${order5.orderId}`);

    // Order 6: Shipped (Logistics 'In Transit', has tracking number)
    let items6 = buildItems('mid');
    const order6 = await Order.create({
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        user: customer._id,
        customer: baseCustomerInfo,
        items: items6,
        totalAmount: calcTotal(items6),
        totalPrice: calcTotal(items6),
        status: 'Shipped',
        shippingAddress: shippingAddresses[5],
        trackingNumber: 'IND-EXPRESS-123456789',
        carrier: 'Delhivery Insured Freight'
    });
    await LogisticsTask.create({
        order: order6._id,
        orderId: order6.orderId,
        customer: baseCustomerInfo,
        rigName: 'Esports Standard PC',
        status: 'Shipped',
        weightKg: 15.2,
        packageDimensions: '50 x 25 x 45 cm',
        courier: 'Delhivery Insured Freight',
        trackingNumber: 'IND-EXPRESS-123456789',
        serviceType: '2-Day Express',
        insuredValue: calcTotal(items6),
        shippedAt: new Date(Date.now() - 86400000) // shipped 1 day ago
    });
    console.log(`Created Order 6 (Shipped): ${order6.orderId}`);

    console.log('[seedDemoOrders] Successfully seeded 6 realistic demo orders!');
    process.exit(0);

  } catch (error) {
    console.error('[seedDemoOrders] Error:', error);
    process.exit(1);
  }
};

seedDemoOrders();
