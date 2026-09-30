const mongoose = require('mongoose');
const { autoSeedDatabase } = require('./autoSeed');

const connectDB = async () => {
  const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/buildflow';

  mongoose.set('bufferCommands', false); // fail fast if offline, don't hang

  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 2500,
    socketTimeoutMS: 10000,
  };

  try {
    const conn = await mongoose.connect(connUri, options);
    console.log(`[BuildFlow] MongoDB Connected: ${conn.connection.host}`);
    // Check and populate database if clean / first-time connection
    await autoSeedDatabase();
  } catch (error) {
    console.warn(`[BuildFlow] MongoDB not connected (${error.message}) — resilient in-memory fallback active`);
  }
};

module.exports = connectDB;
