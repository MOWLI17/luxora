// routes/password.js - Complete Password Management API
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
    req.user = await User.findById(decoded.id).select('+password');
    if (!req.user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

/* ============================
   POST /password/forgot - Request password reset
============================ */
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: 'If email exists, a reset link will be sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and save to user
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    console.log('[PASSWORD] Reset token generated for:', email);

    // In production, send email with reset link
    // For now, return success message
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      // Only for development - remove in production
      devToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('[PASSWORD] Forgot password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

/* ============================
   POST /password/reset/:token - Reset password with token
============================ */
router.post('/reset/:token', async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password and confirmation'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the provided token and find user
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    console.log('[PASSWORD] Password reset for:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with new password.'
    });
  } catch (error) {
    console.error('[PASSWORD] Reset password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

/* ============================
   POST /password/change - Change password (logged in)
============================ */
router.post('/change', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new passwords are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Verify current password
    const isMatch = await req.user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    console.log('[PASSWORD] Password changed for:', req.user.email);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('[PASSWORD] Change password error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

module.exports = router;
