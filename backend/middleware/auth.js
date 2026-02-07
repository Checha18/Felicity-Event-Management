const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header and verifies it
 * Adds user info to req.user if valid
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    // Expected format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = decoded;
    
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has required role
 * Must be used AFTER verifyToken middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by verifyToken)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    // User has required role, continue
    next();
  };
};

module.exports = {
  verifyToken,
  checkRole
};
