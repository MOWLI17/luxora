
// ============================================
// routes/user.js - USER PROFILE
// ============================================
const express = require('express');
const router = express.Router();
const User = require('../models/User');

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
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, mobile, avatar, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, mobile, avatar, address },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
