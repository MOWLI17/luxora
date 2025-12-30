// routes/auth.js - FIXED with Database Connection Checks
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { protect, authorize } = require('../middleware/auth');

console.log('[ROUTES] Auth routes loaded');

// ✅ Lazy load models to ensure DB connection first
let User;
const getUser = () => {
  if (!User) {
    User = require('../models/User');
  }
  return User;
};

// ======= JWT TOKEN GENERATOR =======
const generateToken = (id, type = 'user') => {
  return jwt.sign(
    { id, type },
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

// ======= VALIDATION HELPERS =======
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateMobile = (mobile) => {
  const mobileRegex = /^\d{10}$/;
  return mobileRegex.test(mobile);
};

// ======= REGISTER ROUTE =======
router.post('/register', async (req, res) => {
  try {
    console.log('[AUTH] Processing registration request...');
    
    // ✅ Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('[AUTH] ❌ Database not connected');
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please try again.'
      });
    }

    const UserModel = getUser();
    const { name, email, mobile, password, address } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, mobile, password'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate mobile format
    if (!validateMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { mobile }
      ]
    }).maxTimeMS(10000);

    if (existingUser) {
      console.log('[AUTH] User already exists:', existingUser.email || existingUser.mobile);
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Mobile number already registered'
      });
    }

    // Create new user
    const user = new UserModel({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      password,
      role: 'user',
      isActive: true,
      address: address || {}
    });

    // Save user (password will be hashed by pre-save middleware)
    await user.save();

    console.log('[AUTH] User registered successfully:', user._id);

    // Generate token
    const token = generateToken(user._id, 'user');

    // Prepare user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      address: user.address,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('[AUTH] Register error:', error.message);
    
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

// ======= LOGIN ROUTE =======
router.post('/login', async (req, res) => {
  try {
    console.log('[AUTH] Processing login request...');
    
    // ✅ Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('[AUTH] ❌ Database not connected');
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please try again.'
      });
    }

    const UserModel = getUser();
    const { emailOrMobile, password } = req.body;

    // Validate required fields
    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password'
      });
    }

    // Find user by email or mobile (include password field)
    const user = await UserModel.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    }).select('+password').maxTimeMS(10000);

    if (!user) {
      console.log('[AUTH] User not found:', emailOrMobile);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('[AUTH] Inactive user attempt:', user._id);
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      console.log('[AUTH] Wrong password for user:', emailOrMobile);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('[AUTH] Login successful for user:', user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, 'user');

    // Prepare user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      address: user.address
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// ======= LOGOUT ROUTE =======
router.post('/logout', protect, (req, res) => {
  console.log('[AUTH] User logged out:', req.userId);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ======= GET PROFILE ROUTE =======
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('[AUTH] Fetching profile for user:', req.userId);

    // ✅ Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable'
      });
    }

    const UserModel = getUser();
    const user = await UserModel.findById(req.userId).maxTimeMS(10000);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          address: user.address,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('[AUTH] Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
});

// ======= UPDATE PROFILE ROUTE =======
router.put('/profile', protect, async (req, res) => {
  try {
    console.log('[AUTH] Updating profile for user:', req.userId);

    // ✅ Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable'
      });
    }

    const UserModel = getUser();
    const { name, email, mobile, address } = req.body;

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate mobile if provided
    if (mobile && !validateMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    // Check if email/mobile already exists (excluding current user)
    if (email) {
      const emailExists = await UserModel.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.userId }
      }).maxTimeMS(10000);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    if (mobile) {
      const mobileExists = await UserModel.findOne({
        mobile,
        _id: { $ne: req.userId }
      }).maxTimeMS(10000);
      if (mobileExists) {
        return res.status(409).json({
          success: false,
          message: 'Mobile number already in use'
        });
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (mobile) updateData.mobile = mobile;
    if (address) updateData.address = address;

    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).maxTimeMS(10000);

    console.log('[AUTH] Profile updated for user:', req.userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          address: user.address
        }
      }
    });

  } catch (error) {
    console.error('[AUTH] Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// ======= DELETE ACCOUNT ROUTE =======
router.delete('/profile', protect, async (req, res) => {
  try {
    console.log('[AUTH] Deleting account for user:', req.userId);

    // ✅ Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable'
      });
    }

    const UserModel = getUser();
    await UserModel.findByIdAndDelete(req.userId);

    console.log('[AUTH] Account deleted for user:', req.userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('[AUTH] Delete account error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account'
    });
  }
});

module.exports = router;
