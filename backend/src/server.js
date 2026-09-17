const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
require('dotenv').config();

const app = express();

// Connect to Database
connectDB();
const PORT = process.env.PORT || 5000;

// Security and Logging Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Routes
const authRoutes = require('./routes/auth');
const componentRoutes = require('./routes/components');
const compatibilityRoutes = require('./routes/compatibility');
const customBuildRoutes = require('./routes/customBuilds');
const orderRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/builds', customBuildRoutes);
app.use('/api/orders', orderRoutes);

// Centralized Error Handler Middleware
app.use(errorHandler);

// App Listener
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
