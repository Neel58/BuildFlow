const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose connection & buffering errors
  if (err.name === 'MongooseError' && err.message.includes('buffering timed out')) {
    statusCode = 503;
    message = 'MongoDB connection offline. Please start local MongoDB server (mongod) or update MONGO_URI in .env.';
  } else if (err.name === 'MongooseServerSelectionError' || err.name === 'MongoNetworkError') {
    statusCode = 503;
    message = 'Unable to connect to MongoDB server. Ensure MongoDB service is running.';
  }

  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode}`);
  if (process.env.NODE_ENV !== 'production' && statusCode !== 503) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
