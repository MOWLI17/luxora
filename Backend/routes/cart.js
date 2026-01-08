// ============================================
// routes/cart.js - SHOPPING CART
// ============================================
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

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
    const cart = await Cart.findOne({ user: req.userId }).populate(
      'items.product'
    );
    res.json({
      success: true,
      cart: cart || { user: req.userId, items: [], total: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:productId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.userId });

    const item = cart.items.find(
      (i) => i.product.toString() === req.params.productId
    );
    if (item) {
      item.quantity = Math.max(1, quantity);
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    cart.items = cart.items.filter(
      (i) => i.product.toString() !== req.params.productId
    );
    await cart.save();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Cart.findOneAndDelete({ user: req.userId });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

