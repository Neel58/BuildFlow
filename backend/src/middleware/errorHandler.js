const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  console.error(`[Error] ${req.method} ${req.url} - Status: ${statusCode}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
