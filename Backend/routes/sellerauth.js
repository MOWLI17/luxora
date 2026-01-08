// routes/sellerauth.js - Complete Seller Authentication
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load models
let Seller, Product;
if (mongoose.models.Seller) {
  Seller = mongoose.models.Seller;
} else {
  Seller = require('../models/Seller');
}
if (mongoose.models.Product) {
  Product = mongoose.models.Product;
} else {
  Product = require('../models/Product');
}

const JWT_SECRET = process.env.JWT_SECRET || 'luxora_jwt_secret_key_2024';
const JWT_EXPIRE = '7d';

// Generate JWT Token for Seller
const generateToken = (id) => {
  return jwt.sign({ id, isSeller: true }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Auth middleware for seller routes
const authenticateSeller = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isSeller) {
      return res.status(403).json({ success: false, message: 'Seller access required' });
    }

    req.seller = await Seller.findById(decoded.id);
    if (!req.seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

/* ============================
   POST /seller/auth/register
============================ */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, businessName } = req.body;

    // Validation
    if (!name || !email || !password || !phone || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, phone, businessName'
      });
    }

    // Check if seller exists
    const existingSeller = await Seller.findOne({ email: email.toLowerCase() });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'Seller with this email already exists'
      });
    }

    // Create seller
    const seller = await Seller.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      businessName: businessName.trim()
    });

    const token = generateToken(seller._id);

    const sellerResponse = {
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      businessName: seller.businessName,
      avatar: seller.avatar,
      isVerified: seller.isVerified,
      createdAt: seller.createdAt
    };

    console.log('[SELLER AUTH] Registered:', seller.email);

    res.status(201).json({
      success: true,
      message: 'Seller registration successful',
      token,
      seller: sellerResponse
    });

  } catch (error) {
    console.error('[SELLER AUTH] Register error:', error.message);

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }

    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
});

/* ============================
   POST /seller/auth/login
============================ */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const seller = await Seller.findOne({ email: email.toLowerCase() }).select('+password');

    if (!seller) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await seller.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!seller.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken(seller._id);

    const sellerResponse = {
      _id: seller._id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      businessName: seller.businessName,
      avatar: seller.avatar,
      isVerified: seller.isVerified
    };

    console.log('[SELLER AUTH] Login:', seller.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      seller: sellerResponse
    });

  } catch (error) {
    console.error('[SELLER AUTH] Login error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed', error: error.message });
  }
});

/* ============================
   GET /seller/auth/profile
============================ */
router.get('/profile', authenticateSeller, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id);

    res.status(200).json({
      success: true,
      seller: {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        businessName: seller.businessName,
        businessAddress: seller.businessAddress,
        gstin: seller.gstin,
        avatar: seller.avatar,
        isVerified: seller.isVerified,
        rating: seller.rating,
        totalSales: seller.totalSales
      }
    });
  } catch (error) {
    console.error('[SELLER AUTH] Profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

/* ============================
   PUT /seller/auth/profile
============================ */
router.put('/profile', authenticateSeller, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'businessName', 'businessAddress', 'gstin', 'avatar', 'bankDetails'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const seller = await Seller.findByIdAndUpdate(
      req.seller._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      seller
    });
  } catch (error) {
    console.error('[SELLER AUTH] Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

/* ============================
   GET /seller/auth/products
============================ */
router.get('/products', authenticateSeller, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.seller._id })
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('[SELLER AUTH] Get products error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

/* ============================
   GET /seller/auth/orders
============================ */
router.get('/orders', authenticateSeller, async (req, res) => {
  try {
    // Get orders that contain products from this seller
    const Order = mongoose.models.Order || require('../models/Order');

    const orders = await Order.find({
      'items.seller': req.seller._id
    })
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images')
      .sort('-createdAt')
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('[SELLER AUTH] Get orders error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get orders', orders: [] });
  }
});

/* ============================
   PUT /seller/auth/orders/:orderId/status
============================ */
router.put('/orders/:orderId/status', authenticateSeller, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const Order = mongoose.models.Order || require('../models/Order');

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error('[SELLER AUTH] Update order status error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

module.exports = router;
