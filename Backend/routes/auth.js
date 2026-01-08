// ============================================
// routes/auth.js - USER AUTHENTICATION
// ============================================
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, mobile } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    const user = new User({ email, password, name, mobile });
    await user.save();

    const token = user.generateToken();
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      },
      token
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/mobile and password are required'
      });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }]
    });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = user.generateToken();
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile
      },
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

module.exports = router;
