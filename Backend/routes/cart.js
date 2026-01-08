// routes/cart.js - Complete Cart API with Database Operations
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
      return res.status(401).json({ success: false, message: 'Please login to access cart' });
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
   GET /cart - Get user's cart
============================ */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'cart.product',
        select: 'name price originalPrice images stock brand category'
      });

    const cartItems = user.cart || [];
    const validItems = cartItems.filter(item => item.product);

    let totalAmount = 0;
    validItems.forEach(item => {
      totalAmount += (item.product.price || 0) * (item.quantity || 1);
    });

    res.status(200).json({
      success: true,
      data: {
        cart: {
          items: validItems,
          totalAmount,
          totalItems: validItems.reduce((sum, item) => sum + item.quantity, 0)
        }
      }
    });
  } catch (error) {
    console.error('[CART] Get cart error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get cart' });
  }
});

/* ============================
   POST /cart - Add item to cart
============================ */
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    const user = await User.findById(req.user._id);

    // Check if product already in cart
    const existingIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      // Update quantity
      user.cart[existingIndex].quantity += quantity;
    } else {
      // Add new item
      user.cart.push({ product: productId, quantity });
    }

    await user.save();

    // Populate and return updated cart
    await user.populate({
      path: 'cart.product',
      select: 'name price originalPrice images stock'
    });

    console.log('[CART] Item added:', productId);

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: { cart: { items: user.cart } }
    });
  } catch (error) {
    console.error('[CART] Add to cart error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

/* ============================
   PUT /cart/:productId - Update quantity
============================ */
router.put('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Valid quantity required' });
    }

    const user = await User.findById(req.user._id);
    const itemIndex = user.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    // Check stock
    const product = await Product.findById(productId);
    if (product && quantity > product.stock) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    user.cart[itemIndex].quantity = quantity;
    await user.save();

    console.log('[CART] Quantity updated:', productId, quantity);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: { productId, quantity }
    });
  } catch (error) {
    console.error('[CART] Update cart error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

/* ============================
   DELETE /cart/:productId - Remove item
============================ */
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(item => item.product.toString() !== productId);
    await user.save();

    console.log('[CART] Item removed:', productId);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      productId
    });
  } catch (error) {
    console.error('[CART] Remove from cart error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

/* ============================
   DELETE /cart - Clear cart
============================ */
router.delete('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();

    console.log('[CART] Cart cleared for user:', req.user._id);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('[CART] Clear cart error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

module.exports = router;
