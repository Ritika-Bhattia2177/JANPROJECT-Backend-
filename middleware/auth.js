const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { 
  sendErrorResponse, 
  STATUS_CODES, 
  ERROR_MESSAGES 
} = require('../utils/apiResponse');

// Protect routes - verify JWT token from Authorization header
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header (format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token using JWT_SECRET from environment
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach decoded payload to req.user
      // Get full user details from database (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return sendErrorResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          'User not found. Token is valid but user no longer exists.'
        );
      }

      // Token is valid and user exists, proceed to next middleware
      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      
      // Handle different JWT errors
      let message = 'Not authorized, token failed';
      
      if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please login again.';
      } else if (error.name === 'TokenExpiredError') {
        message = 'Token expired. Please login again.';
      }

      return sendErrorResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        message
      );
    }
  } else {
    // No token provided in Authorization header
    return sendErrorResponse(
      res,
      STATUS_CODES.UNAUTHORIZED,
      'Not authorized. No token provided. Please include Bearer token in Authorization header.'
    );
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    if (!roles.includes(req.user.role)) {
      return sendErrorResponse(
        res,
        STATUS_CODES.FORBIDDEN,
        `User role '${req.user.role}' is not authorized to access this route. Required roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};

// Admin only access
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return sendErrorResponse(
      res,
      STATUS_CODES.UNAUTHORIZED,
      'Authentication required. Please login first.'
    );
  }

  if (req.user.role !== 'admin') {
    return sendErrorResponse(
      res,
      STATUS_CODES.FORBIDDEN,
      'Access denied. Admin privileges required.'
    );
  }

  next();
};

// Student only access
const studentOnly = (req, res, next) => {
  if (!req.user) {
    return sendErrorResponse(
      res,
      STATUS_CODES.UNAUTHORIZED,
      'Authentication required. Please login first.'
    );
  }

  if (req.user.role !== 'student') {
    return sendErrorResponse(
      res,
      STATUS_CODES.FORBIDDEN,
      'Access denied. Student privileges required.'
    );
  }

  next();
};

// Check if user owns the resource (for student accessing their own data)
const checkResourceOwnership = (resourceKey = 'studentId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return sendErrorResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        'Authentication required. Please login first.'
      );
    }

    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Get resource ID from params or body
    const resourceId = req.params.id || req.params[resourceKey] || req.body[resourceKey];

    // Check if student is accessing their own resource
    if (req.user._id.toString() !== resourceId?.toString() && req.user.role === 'student') {
      return sendErrorResponse(
        res,
        STATUS_CODES.FORBIDDEN,
        'Access denied. You can only access your own resources.'
      );
    }

    next();
  };
};

module.exports = { 
  protect, 
  authorize, 
  adminOnly, 
  studentOnly, 
  checkResourceOwnership 
};
