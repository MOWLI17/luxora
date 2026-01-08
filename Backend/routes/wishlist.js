// ============================================
// routes/wishlist.js - WISHLIST
// ============================================
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');

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

router.get('/', authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.userId }).populate(
      'products'
    );
    res.json({ success: true, wishlist: wishlist || { products: [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:productId', authMiddleware, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.userId, products: [] });
    }

    const productId = req.params.productId;
    const index = wishlist.products.indexOf(productId);

    if (index > -1) {
      wishlist.products.splice(index, 1);
    } else {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.userId });
    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== req.params.productId
    );
    await wishlist.save();
    res.json({ success: true, wishlist });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ user: req.userId });
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
