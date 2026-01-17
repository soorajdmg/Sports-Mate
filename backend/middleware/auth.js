const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Protect routes - User authentication
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      req.admin = await Admin.findById(decoded.id);
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin not found'
        });
      }
    } else {
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      // Update user activity on every authenticated request
      req.user.lastActive = new Date();
      req.user.isActive = true;
      await req.user.save();
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Admin only middleware
const adminOnly = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only route.'
      });
    }

    req.admin = await Admin.findById(decoded.id);
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

module.exports = { protect, adminOnly };
