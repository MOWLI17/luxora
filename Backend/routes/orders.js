// routes/orders.js - Complete Orders API
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load models
let User, Order, Product;
if (mongoose.models.User) User = mongoose.models.User;
else User = require('../models/User');
if (mongoose.models.Order) Order = mongoose.models.Order;
else Order = require('../models/Order');
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
   GET /orders/user/stats - Get user order stats
============================ */
router.get('/user/stats', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });

    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('[ORDERS] Stats error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

/* ============================
   GET /orders - Get user's orders
============================ */
router.get('/', authenticate, async (req, res) => {
  try {
    const { status = 'all', limit = 50, page = 1 } = req.query;

    const query = { user: req.user._id };
    if (status !== 'all') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name price images')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total
      }
    });
  } catch (error) {
    console.error('[ORDERS] Get orders error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

/* ============================
   GET /orders/:id - Get single order
============================ */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('items.product', 'name price images brand')
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('[ORDERS] Get order error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get order' });
  }
});

/* ============================
   POST /orders - Create order
============================ */
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'COD', totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address required' });
    }

    // Create order items with seller info
    const orderItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product || item.productId);
      if (!product) continue;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity || 1,
        seller: product.seller
      });

      calculatedTotal += product.price * (item.quantity || 1);
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount: totalAmount || calculatedTotal,
      status: 'pending'
    });

    // Clear user's cart after order
    await User.findByIdAndUpdate(req.user._id, { cart: [] });

    console.log('[ORDERS] Order created:', order._id);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: { order }
    });
  } catch (error) {
    console.error('[ORDERS] Create order error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

/* ============================
   PUT /orders/:id/cancel - Cancel order
============================ */
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { cancelReason } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${order.status} order`
      });
    }

    order.status = 'cancelled';
    order.cancelReason = cancelReason || 'User requested cancellation';
    order.cancelledAt = new Date();
    await order.save();

    console.log('[ORDERS] Order cancelled:', order._id);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('[ORDERS] Cancel order error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

/* ============================
   DELETE /orders/:id - Delete order
============================ */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
      status: 'cancelled'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or cannot be deleted'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('[ORDERS] Delete order error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
});

module.exports = router;