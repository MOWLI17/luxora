
// ============================================
// routes/sellerauth.js - SELLER AUTHENTICATION
// ============================================
const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');

router.post('/register', async (req, res) => {
  try {
    const { email, password, businessName, businessType, mobile } = req.body;

    if (!email || !password || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and business name are required'
      });
    }

    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(409).json({
        success: false,
        message: 'Seller already exists'
      });
    }

    const seller = new Seller({
      email,
      password,
      businessName,
      businessType,
      mobile
    });
    await seller.save();

    const token = seller.generateToken();
    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email
      },
      token
    });
  } catch (error) {
    console.error('❌ Seller register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const seller = await Seller.findOne({ email });

    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = seller.generateToken();
    res.json({
      success: true,
      message: 'Login successful',
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        email: seller.email
      },
      token
    });
  } catch (error) {
    console.error('❌ Seller login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findById(req.sellerId).select('-password');
    res.json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.sellerId,
      req.body,
      { new: true }
    ).select('-password');
    res.json({ success: true, seller });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token' });
  }
  try {
    const decoded = require('jsonwebtoken').verify(
      token,
      process.env.JWT_SECRET
    );
    req.sellerId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = router;