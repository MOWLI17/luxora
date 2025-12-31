const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Seller = require('../models/Seller');

// User Protection Middleware
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

    req.userId = decoded.id;
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    console.error('[AUTH] Protect error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

// Seller Protection Middleware
exports.sellerProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - Seller token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

    if (!decoded.isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can access this route'
      });
    }

    req.sellerId = decoded.id;
    req.seller = await Seller.findById(decoded.id);

    if (!req.seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    next();
  } catch (error) {
    console.error('[SELLER AUTH] Protect error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }
};

// Optional Authorization Middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized for this action`
      });
    }
    next();
  };
};
