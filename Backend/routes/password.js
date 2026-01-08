// ============================================
// routes/password.js - PASSWORD MANAGEMENT
// ============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token (simplified)
    const resetToken = require('crypto').randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    res.json({
      success: true,
      message: 'Reset link sent to email',
      resetToken // In production, send via email
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reset/:token', async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/change', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const decoded = require('jsonwebtoken').verify(
      token,
      process.env.JWT_SECRET
    );
    const user = await User.findById(decoded.id);

    if (!(await user.matchPassword(oldPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;