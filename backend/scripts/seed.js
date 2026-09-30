const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { autoSeedDatabase } = require('../src/config/autoSeed');
const Component = require('../src/models/Component');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const AssemblyTask = require('../src/models/AssemblyTask');
const QATask = require('../src/models/QATask');
const LogisticsTask = require('../src/models/LogisticsTask');
const AuditLog = require('../src/models/AuditLog');

dotenv.config();

const seedDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buildflow';
    await mongoose.connect(connUri);
    console.log('[BuildFlow Seed] MongoDB Connected for Seeding');

    console.log('[BuildFlow Seed] Clearing existing collections...');
    await Promise.all([
      Component.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({}),
      AssemblyTask.deleteMany({}),
      QATask.deleteMany({}),
      LogisticsTask.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[BuildFlow Seed] Populating complete BuildFlow database...');
    await autoSeedDatabase();

    console.log('[BuildFlow Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`[BuildFlow Seed] Error: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
