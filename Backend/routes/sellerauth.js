// routes/sellerAuth.js - COMPLETE SELLER AUTHENTICATION (FIXED)
const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { sellerProtect } = require('../middleware/auth');

console.log('[SELLER AUTH] Seller auth routes loaded');

// ======= JWT TOKEN GENERATOR =======
const generateToken = (id) => {
  return jwt.sign(
    { id, isSeller: true },  // ✅ FIXED: Added isSeller flag
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ======= EMAIL TRANSPORTER =======
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ======= SELLER REGISTER ROUTE =======
// @route   POST /api/seller/auth/register
// @desc    Register a new seller
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('[SELLER] Processing registration request...');
    
    const {
      fullName, email, phone, password, confirmPassword,
      businessName, businessType, businessAddress, city, state, zipCode,
      taxId, panNumber, gstNumber,
      bankName, accountNumber, confirmAccountNumber, ifscCode, accountHolderName,
      storeName, storeDescription, productCategory
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !password || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone must be at least 10 digits'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if seller already exists
    const existingSeller = await Seller.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phoneDigits.slice(-10) }
      ]
    });

    if (existingSeller) {
      console.log('[SELLER] Seller already exists:', existingSeller.email || existingSeller.phone);
      return res.status(409).json({
        success: false,
        message: existingSeller.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Create new seller
    const seller = new Seller({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phoneDigits.slice(-10),
      password,
      businessName: businessName.trim(),
      businessType: businessType || 'sole',
      businessAddress: businessAddress?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      zipCode: zipCode?.trim() || '',
      taxId: taxId || '',
      panNumber: panNumber || '',
      gstNumber: gstNumber || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      ifscCode: ifscCode || '',
      accountHolderName: accountHolderName || '',
      storeName: storeName?.trim() || businessName.trim(),
      storeDescription: storeDescription?.trim() || '',
      productCategory: productCategory || 'Electronics',
      role: 'seller',
      isActive: true,
      isApproved: false
    });

    // Save seller (password hashed by pre-save middleware)
    await seller.save();

    console.log('[SELLER] Seller registered successfully:', seller._id);

    // Generate token
    const token = generateToken(seller._id);

    // Get public data with masked sensitive info
    const sellerResponse = seller.getPublicData ? seller.getPublicData() : {
      _id: seller._id,
      fullName: seller.fullName,
      email: seller.email,
      businessName: seller.businessName,
      storeName: seller.storeName,
      isActive: seller.isActive,
      isApproved: seller.isApproved
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      seller: sellerResponse,
      token
    });

  } catch (error) {
    console.error('[SELLER] Register error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// ======= SELLER LOGIN ROUTE =======
// @route   POST /api/seller/auth/login
// @desc    Login seller with email and password
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log('[SELLER] Processing login request...');
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find seller by email (include password field for comparison)
    const seller = await Seller.findOne({
      email: email.toLowerCase()
    }).select('+password');

    if (!seller) {
      console.log('[SELLER] Seller not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if seller account is active
    if (!seller.isActive) {
      console.log('[SELLER] Inactive seller:', seller._id);
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Compare passwords
    const isPasswordCorrect = await seller.comparePassword(password);

    if (!isPasswordCorrect) {
      console.log('[SELLER] Wrong password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('[SELLER] Login successful:', seller._id);

    // Generate token
    const token = generateToken(seller._id);

    // Get public data with masked sensitive info
    const sellerResponse = seller.getPublicData ? seller.getPublicData() : {
      _id: seller._id,
      fullName: seller.fullName,
      email: seller.email,
      businessName: seller.businessName,
      storeName: seller.storeName,
      isActive: seller.isActive,
      isApproved: seller.isApproved
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      seller: sellerResponse,
      token
    });

  } catch (error) {
    console.error('[SELLER] Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// ======= GET SELLER PROFILE =======
// @route   GET /api/seller/auth/profile
// @desc    Get current seller profile
// @access  Private (Seller only)
router.get('/profile', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Fetching profile for seller:', req.sellerId);

    const seller = await Seller.findById(req.sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const sellerResponse = seller.getPublicData ? seller.getPublicData() : {
      _id: seller._id,
      fullName: seller.fullName,
      email: seller.email,
      phone: seller.phone,
      businessName: seller.businessName,
      storeName: seller.storeName,
      storeDescription: seller.storeDescription,
      isActive: seller.isActive,
      isApproved: seller.isApproved
    };

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      seller: sellerResponse
    });

  } catch (error) {
    console.error('[SELLER] Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
});

// ======= UPDATE SELLER PROFILE =======
// @route   PUT /api/seller/auth/profile
// @desc    Update seller profile
// @access  Private (Seller only)
router.put('/profile', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Updating profile for seller:', req.sellerId);

    const {
      fullName, phone, businessName, businessType, businessAddress,
      city, state, zipCode, storeName, storeDescription, productCategory,
      bankName, accountHolderName, ifscCode, taxId, gstNumber, panNumber
    } = req.body;

    // Find seller
    const seller = await Seller.findById(req.sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Update fields if provided
    if (fullName) seller.fullName = fullName.trim();
    if (phone) seller.phone = phone.trim();
    if (businessName) seller.businessName = businessName.trim();
    if (businessType) seller.businessType = businessType;
    if (businessAddress) seller.businessAddress = businessAddress.trim();
    if (city) seller.city = city.trim();
    if (state) seller.state = state.trim();
    if (zipCode) seller.zipCode = zipCode.trim();
    if (storeName) seller.storeName = storeName.trim();
    if (storeDescription) seller.storeDescription = storeDescription.trim();
    if (productCategory) seller.productCategory = productCategory;
    if (bankName) seller.bankName = bankName.trim();
    if (accountHolderName) seller.accountHolderName = accountHolderName.trim();
    if (ifscCode) seller.ifscCode = ifscCode.trim();
    if (taxId) seller.taxId = taxId;
    if (gstNumber) seller.gstNumber = gstNumber;
    if (panNumber) seller.panNumber = panNumber;

    // Save seller
    await seller.save();

    console.log('[SELLER] Profile updated for seller:', req.sellerId);

    const sellerResponse = seller.getPublicData ? seller.getPublicData() : seller;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      seller: sellerResponse
    });

  } catch (error) {
    console.error('[SELLER] Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// ======= GET SELLER PRODUCTS =======
// @route   GET /api/seller/auth/products
// @desc    Get all products for this seller
// @access  Private (Seller only)
router.get('/products', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Fetching products for seller:', req.sellerId);

    const Product = require('../models/Product');
    const products = await Product.find({ seller: req.sellerId }).sort({ createdAt: -1 });

    console.log(`[SELLER] Found ${products.length} products`);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error('[SELLER] Get products error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products'
    });
  }
});

// ======= GET SELLER ORDERS =======
// @route   GET /api/seller/auth/orders
// @desc    Get all orders for seller's products
// @access  Private (Seller only)
router.get('/orders', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Fetching orders for seller:', req.sellerId);

    const Product = require('../models/Product');
    const Order = require('../models/Order');

    // Find all products for this seller
    const sellerProducts = await Product.find({ seller: req.sellerId }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    // Find all orders containing these products
    const orders = await Order.find({
      'items.productId': { $in: productIds }
    })
      .populate('userId', 'name email mobile')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`[SELLER] Found ${orders.length} orders`);

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map(order => ({
        _id: order._id,
        customerName: order.userId?.name || 'Unknown',
        customerEmail: order.userId?.email,
        totalAmount: order.totalAmount,
        status: order.status || 'pending',
        orderStatus: order.orderStatus || 'pending',
        items: order.items,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    });

  } catch (error) {
    console.error('[SELLER] Get orders error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    });
  }
});

// ======= UPDATE ORDER STATUS =======
// @route   PUT /api/seller/auth/orders/:orderId/status
// @desc    Update order status
// @access  Private (Seller only)
router.put('/orders/:orderId/status', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Updating order status:', req.params.orderId);

    const { status } = req.body;
    const validStatuses = ['pending', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const Product = require('../models/Product');
    const Order = require('../models/Order');

    // Get seller's products
    const sellerProducts = await Product.find({ seller: req.sellerId }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    // Find order
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if this order contains seller's products
    const hasSellerProducts = order.items.some(item =>
      productIds.some(pid => pid.equals(item.productId))
    );

    if (!hasSellerProducts) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update status
    order.status = status;
    order.orderStatus = status.toLowerCase();
    if (status === 'Delivered' || status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();

    console.log('[SELLER] Order status updated:', order._id, status);

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      order
    });

  } catch (error) {
    console.error('[SELLER] Update order status error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
});

// ======= LOGOUT ROUTE =======
// @route   POST /api/seller/auth/logout
// @desc    Logout seller
// @access  Private (Seller only)
router.post('/logout', sellerProtect, (req, res) => {
  console.log('[SELLER] Seller logged out:', req.sellerId);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;