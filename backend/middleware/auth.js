const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const Staff = require('../models/Staff');

// Verify JWT token and attach user to request
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    let user = null;
    
    // Find user based on role
    switch (decoded.role) {
      case 'admin':
        user = await Admin.findById(decoded.userId).select('-password');
        break;
      case 'manager':
        user = await Manager.findOne({ _id: decoded.userId, isDeleted: { $ne: true } }).select('-password');
        break;
      case 'parent':
        user = await Parent.findById(decoded.userId).select('-password');
        break;
      case 'driver':
        user = await Driver.findById(decoded.userId).select('-password');
        break;
      case 'teacher':
        user = await Staff.findById(decoded.userId).select('-password');
        if (!user || user.role !== 'teacher' || user.isdelete) {
          return res.status(401).json({ message: 'Invalid token.' });
        }
        break;
      default:
        return res.status(401).json({ message: 'Invalid token.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.', error: error.message });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Verify parent authentication and active status
// Note: This middleware should be used AFTER authenticate middleware
const verifyParent = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in again.'
      });
    }
    
    // Verify user is a parent
    if (req.userRole !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This endpoint is only for parents.'
      });
    }
    
    // Check if parent account is active
    const parent = await Parent.findById(req.user._id);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }
    
    if (parent.status && parent.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Parent account is ${parent.status}. Please contact administrator to activate your account.`
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = { authenticate, authorize, verifyParent };

