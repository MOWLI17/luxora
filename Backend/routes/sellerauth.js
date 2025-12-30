// routes/sellerAuth.js - FIXED with Database Connection Checks
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { sellerProtect } = require('../middleware/auth');

console.log('[SELLER AUTH] Seller auth routes loaded');

// ✅ Lazy load models
let Seller, Product, Order;
const getModels = () => {
  if (!Seller) Seller = require('../models/Seller');
  if (!Product) Product = require('../models/Product');
  if (!Order) Order = require('../models/Order');
  return { Seller, Product, Order };
};

// ✅ Helper to check DB connection
const checkDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again.'
    });
    return false;
  }
  return true;
};

// ======= JWT TOKEN GENERATOR =======
const generateToken = (id) => {
  return jwt.sign(
    { id, isSeller: true },
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
router.post('/register', async (req, res) => {
  try {
    console.log('[SELLER] Processing registration request...');
    
    if (!checkDB(res)) return;

    const { Seller: SellerModel } = getModels();
    
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
    const existingSeller = await SellerModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phoneDigits.slice(-10) }
      ]
    }).maxTimeMS(10000);

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
    const seller = new SellerModel({
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
router.post('/login', async (req, res) => {
  try {
    console.log('[SELLER] Processing login request...');
    
    if (!checkDB(res)) return;

    const { Seller: SellerModel } = getModels();
    
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find seller by email (include password field for comparison)
    const seller = await SellerModel.findOne({
      email: email.toLowerCase()
    }).select('+password').maxTimeMS(10000);

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
router.get('/profile', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Fetching profile for seller:', req.sellerId);

    if (!checkDB(res)) return;

    const { Seller: SellerModel } = getModels();

    const seller = await SellerModel.findById(req.sellerId).maxTimeMS(10000);

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

// ======= GET SELLER PRODUCTS =======
router.get('/products', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Fetching products for seller:', req.sellerId);

    if (!checkDB(res)) return;

    const { Product: ProductModel } = getModels();

    const products = await ProductModel.find({ seller: req.sellerId })
      .sort({ createdAt: -1 })
      .maxTimeMS(15000)
      .exec();

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
router.get('/orders', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Fetching orders for seller:', req.sellerId);

    if (!checkDB(res)) return;

    const { Product: ProductModel, Order: OrderModel } = getModels();

    // Find all products for this seller
    const sellerProducts = await ProductModel.find({ seller: req.sellerId })
      .select('_id')
      .maxTimeMS(10000);
    
    const productIds = sellerProducts.map(p => p._id);

    // Find all orders containing these products
    const orders = await OrderModel.find({
      'items.productId': { $in: productIds }
    })
      .populate('userId', 'name email mobile')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .limit(100)
      .maxTimeMS(15000)
      .exec();

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
router.put('/orders/:orderId/status', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Updating order status:', req.params.orderId);

    if (!checkDB(res)) return;

    const { status } = req.body;
    const validStatuses = ['pending', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const { Product: ProductModel, Order: OrderModel } = getModels();

    // Get seller's products
    const sellerProducts = await ProductModel.find({ seller: req.sellerId })
      .select('_id')
      .maxTimeMS(10000);
    
    const productIds = sellerProducts.map(p => p._id);

    // Find order
    const order = await OrderModel.findById(req.params.orderId).maxTimeMS(10000);

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
router.post('/logout', sellerProtect, (req, res) => {
  console.log('[SELLER] Seller logged out:', req.sellerId);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
