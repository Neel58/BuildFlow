const mongoose = require('mongoose');

const connectDB = async () => {
  const connUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/buildflow';

  mongoose.set('bufferCommands', false); // CRITICAL: fail fast, don't hang

  const options = {
    autoIndex: true,
    serverSelectionTimeoutMS: 2500,
    socketTimeoutMS: 10000,
  };

  try {
    const conn = await mongoose.connect(connUri, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[AI Studio] MongoDB not connected (${error.message}) — offline fallback active`);
  }
};

module.exports = connectDB;
