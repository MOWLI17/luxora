
// ============================================
// routes/orders.js - ORDERS
// ============================================
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

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
    const { status = 'all', limit = 50, page = 1 } = req.query;
    const filter = { user: req.userId };
    if (status !== 'all') filter.status = status;

    const orders = await Order.find(filter)
      .populate('items.product')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: require('mongoose').Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalPrice' }
        }
      }
    ]);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shippingAddress, totalPrice } = req.body;
    const order = new Order({
      user: req.userId,
      items,
      shippingAddress,
      totalPrice,
      status: 'pending'
    });
    await order.save();
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { cancelReason } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelReason },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

