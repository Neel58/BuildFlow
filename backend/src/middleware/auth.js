const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 1. If valid JWT token is present, attempt verification
  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } else {
        // DB not connected yet, create user context from token payload
        req.user = {
          _id: decoded.id,
          role: decoded.role || 'Admin',
          isActive: true
        };
        return next();
      }
    } catch (error) {
      // Invalid/expired token - fall through to dev fallback
    }
  }

  // 2. Convenient fallback for development/testing environment
  if (process.env.NODE_ENV !== 'production') {
    try {
      if (mongoose.connection.readyState === 1) {
        const adminUser = await User.findOne({ role: 'Admin' }).select('-password');
        if (adminUser) {
          req.user = adminUser;
          return next();
        }
      }
    } catch (dbErr) {
      // Fallback
    }

    req.user = {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@buildflow.com',
      role: 'Admin',
      isActive: true
    };
    return next();
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect };
