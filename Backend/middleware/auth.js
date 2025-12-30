// middleware/auth.js - COMPLETE FIXED VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Seller = require('../models/Seller');

// ======= USER PROTECT MIDDLEWARE =======
// Protects routes by verifying JWT token and setting req.user
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

      console.log('[AUTH] Token decoded:', { id: decoded.id, isSeller: decoded.isSeller });

      // Check if it's a seller token (should not be used with protect)
      if (decoded.isSeller) {
        console.log('[AUTH] Seller token used on user route');
        return res.status(403).json({
          success: false,
          message: 'Invalid token type. User token required.'
        });
      }

      // Get user from database
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log('[AUTH] User not found:', decoded.id);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // ✅ Set req.user for all protected routes
      req.user = user;
      req.userId = user._id;

      console.log('[AUTH] Protected route accessed by user:', user.email);

      next();
    } catch (error) {
      console.error('[AUTH] Token verification error:', error.message);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('[AUTH] Middleware error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// ======= SELLER PROTECT MIDDLEWARE =======
// Protects seller routes by verifying JWT token with isSeller flag
const sellerProtect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      console.log('[SELLER AUTH] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

      console.log('[SELLER AUTH] Token decoded:', { id: decoded.id, isSeller: decoded.isSeller });

      // ✅ CRITICAL: Check if it's a seller token
      if (!decoded.isSeller) {
        console.log('[SELLER AUTH] User token used on seller route');
        return res.status(403).json({
          success: false,
          message: 'Invalid token type. Seller token required.'
        });
      }

      // Get seller from database
      const seller = await Seller.findById(decoded.id);

      if (!seller) {
        console.log('[SELLER AUTH] Seller not found:', decoded.id);
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      // Check if seller account is active
      if (!seller.isActive) {
        console.log('[SELLER AUTH] Seller account inactive:', seller._id);
        return res.status(403).json({
          success: false,
          message: 'Your seller account is inactive. Please contact support.'
        });
      }

      // ✅ Set req.seller for all seller protected routes
      req.seller = seller;
      req.sellerId = seller._id;

      console.log('[SELLER AUTH] Protected route accessed by seller:', seller.email);

      next();
    } catch (error) {
      console.error('[SELLER AUTH] Token verification error:', error.message);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('[SELLER AUTH] Middleware error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// ======= AUTHORIZE MIDDLEWARE =======
// Check user role for specific routes
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Not authorized. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// ======= OPTIONAL AUTH MIDDLEWARE =======
// Attaches user if token exists, but doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        
        if (!decoded.isSeller) {
          const user = await User.findById(decoded.id);
          if (user) {
            req.user = user;
            req.userId = user._id;
          }
        }
      } catch (error) {
        // Token invalid, but we don't fail - just continue without user
        console.log('[AUTH] Optional auth: Invalid token, continuing without user');
      }
    }
    
    next();
  } catch (error) {
    console.error('[AUTH] Optional auth error:', error.message);
    next();
  }
};

module.exports = {
  protect,
  sellerProtect,
  authorize,
  optionalAuth
};