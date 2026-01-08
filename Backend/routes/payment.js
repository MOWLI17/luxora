// routes/payment.js - Complete Payment API
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load models
let User, Order;
if (mongoose.models.User) User = mongoose.models.User;
else User = require('../models/User');
if (mongoose.models.Order) Order = mongoose.models.Order;
else Order = require('../models/Order');

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
   GET /payment/config - Get payment config
============================ */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      currency: 'INR',
      minAmount: 100
    }
  });
});

/* ============================
   POST /payment/create-payment-intent
============================ */
router.post('/create-payment-intent', authenticate, async (req, res) => {
  try {
    const { amount, currency = 'inr' } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least ₹1 (100 paise)'
      });
    }

    // In production, integrate with Stripe/Razorpay
    // For now, return mock payment intent
    const paymentIntentId = 'pi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    console.log('[PAYMENT] Created payment intent:', paymentIntentId, amount);

    res.status(200).json({
      success: true,
      clientSecret: paymentIntentId + '_secret_' + Math.random().toString(36).substr(2, 15),
      paymentIntentId,
      amount,
      currency: currency.toUpperCase()
    });
  } catch (error) {
    console.error('[PAYMENT] Create intent error:', error.message);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

/* ============================
   POST /payment/create-order - Create order with payment
============================ */
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { cartItems, totalAmount, shippingAddress, paymentMethod, paymentIntentId } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address required' });
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      product: item.product?._id || item.productId,
      name: item.product?.name || item.name,
      price: item.product?.price || item.price,
      quantity: item.quantity || 1
    }));

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'ONLINE',
      paymentIntentId,
      totalAmount,
      status: paymentMethod === 'COD' ? 'pending' : 'processing',
      isPaid: paymentMethod !== 'COD'
    });

    // Clear cart
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    console.log('[PAYMENT] Order created:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order }
    });
  } catch (error) {
    console.error('[PAYMENT] Create order error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

/* ============================
   POST /payment/confirm-payment
============================ */
router.post('/confirm-payment', authenticate, async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID required' });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentIntentId = paymentIntentId;
    order.status = 'processing';
    await order.save();

    console.log('[PAYMENT] Payment confirmed for order:', orderId);

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      orderId,
      status: 'paid'
    });
  } catch (error) {
    console.error('[PAYMENT] Confirm payment error:', error.message);
    res.status(500).json({ success: false, message: 'Payment confirmation failed' });
  }
});

/* ============================
   POST /payment - Legacy endpoint
============================ */
router.post('/', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Payment endpoint active. Use /create-payment-intent or /create-order'
  });
});

module.exports = router;
