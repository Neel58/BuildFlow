const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const collections = [
  'assembly',
  'assemblytasks',
  'audit_logs',
  'auditlogs',
  'builds',
  'carts',
  'components',
  'custombuilds',
  'inventory',
  'notifications',
  'orders',
  'qa_reports',
  'qatasks',
  'users'
];

const initializeDatabase = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/buildflow'
    );

    const existingCollections = new Set(
      (await connection.connection.db.listCollections().toArray()).map(({ name }) => name)
    );

    for (const collection of collections) {
      if (!existingCollections.has(collection)) {
        await connection.connection.db.createCollection(collection);
        console.log(`Created collection: ${collection}`);
      }
    }

    console.log(`MongoDB initialized: ${connection.connection.name}`);
  } catch (error) {
    console.error(`Database initialization failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

initializeDatabase();