// routes/user.js - Complete User Profile API
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load User model
let User;
if (mongoose.models.User) User = mongoose.models.User;
else User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'luxora_jwt_secret_key_2024';

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Please login' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

/* ============================
   GET /user/profile - Get user profile
============================ */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        addresses: user.addresses,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('[USER] Get profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

/* ============================
   PUT /user/profile - Update profile
============================ */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'avatar', 'addresses'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    console.log('[USER] Profile updated:', user._id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('[USER] Update profile error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

/* ============================
   POST /user/address - Add address
============================ */
router.post('/address', authenticate, async (req, res) => {
  try {
    const { name, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

    if (!addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Address line, city, state, and pincode are required'
      });
    }

    const user = await User.findById(req.user._id);

    // If setting as default, unset others
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      name: name || user.name,
      phone: phone || user.phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: isDefault || user.addresses.length === 0
    });

    await user.save();

    console.log('[USER] Address added for:', user._id);

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('[USER] Add address error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add address' });
  }
});

/* ============================
   DELETE /user/address/:id - Delete address
============================ */
router.delete('/address/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.id
    );
    await user.save();

    console.log('[USER] Address deleted:', req.params.id);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('[USER] Delete address error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
});

/* ============================
   DELETE /user/profile - Delete account
============================ */
router.delete('/profile', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });

    console.log('[USER] Account deactivated:', req.user._id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('[USER] Delete account error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

module.exports = router;
