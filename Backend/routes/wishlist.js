// routes/wishlist.js - Complete Wishlist API with Database Operations
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load models
let User, Product;
if (mongoose.models.User) User = mongoose.models.User;
else User = require('../models/User');
if (mongoose.models.Product) Product = mongoose.models.Product;
else Product = require('../models/Product');

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
   GET /wishlist - Get user's wishlist
============================ */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'wishlist',
        select: 'name price originalPrice images stock brand category rating'
      });

    const products = user.wishlist || [];

    res.status(200).json({
      success: true,
      wishlist: { products },
      count: products.length
    });
  } catch (error) {
    console.error('[WISHLIST] Get error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get wishlist' });
  }
});

/* ============================
   POST /wishlist/:id - Toggle wishlist (add/remove)
============================ */
router.post('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user._id);
    const wishlistIndex = user.wishlist.findIndex(
      item => item.toString() === id
    );

    let action;
    if (wishlistIndex > -1) {
      // Remove from wishlist
      user.wishlist.splice(wishlistIndex, 1);
      action = 'removed';
    } else {
      // Add to wishlist
      user.wishlist.push(id);
      action = 'added';
    }

    await user.save();

    console.log('[WISHLIST] Toggle:', id, action);

    res.status(200).json({
      success: true,
      message: `Product ${action} ${action === 'added' ? 'to' : 'from'} wishlist`,
      action,
      productId: id
    });
  } catch (error) {
    console.error('[WISHLIST] Toggle error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update wishlist' });
  }
});

/* ============================
   DELETE /wishlist/:id - Remove from wishlist
============================ */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter(item => item.toString() !== id);
    await user.save();

    console.log('[WISHLIST] Removed:', id);

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      productId: id
    });
  } catch (error) {
    console.error('[WISHLIST] Remove error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

/* ============================
   DELETE /wishlist - Clear wishlist
============================ */
router.delete('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = [];
    await user.save();

    console.log('[WISHLIST] Cleared for user:', req.user._id);

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully'
    });
  } catch (error) {
    console.error('[WISHLIST] Clear error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to clear wishlist' });
  }
});

module.exports = router;
