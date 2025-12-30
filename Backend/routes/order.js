// routes/order.js - FIXED Orders Routes
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

console.log('[ROUTES] Orders routes loaded');

// ======= GET ALL USER ORDERS =======
// @route   GET /api/orders
// @desc    Get all orders for logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('[ORDERS] Fetching orders for user:', req.user._id);
    
    const { status, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ FIXED: Populate 'items.productId' (matches the schema)
    const orders = await Order.find(query)
      .populate('items.productId', 'name description images price category brand')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    console.log(`[ORDERS] Found ${orders.length} orders for user`);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        pagination: {
          total: totalOrders,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalOrders / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('[ORDERS] Error fetching orders:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch orders'
    });
  }
});

// ======= GET SINGLE ORDER BY ID =======
// @route   GET /api/orders/:id
// @desc    Get single order details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    console.log('[ORDERS] Fetching order:', req.params.id);
    
    // ✅ FIXED: Populate 'items.productId'
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name description images price category brand');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    console.log('[ORDERS] Order retrieved:', order._id);

    res.json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('[ORDERS] Error fetching order:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order'
    });
  }
});

// ======= CANCEL ORDER =======
// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    console.log('[ORDERS] Cancelling order:', req.params.id);
    
    const { cancelReason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order belongs to user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'Delivered' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel delivered orders'
      });
    }

    if (order.status === 'Cancelled' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Update order status
    order.status = 'Cancelled';
    order.orderStatus = 'cancelled';
    order.cancelReason = cancelReason || 'Customer requested cancellation';
    order.cancelledAt = new Date();
    await order.save();

    console.log('[ORDERS] Order cancelled:', order._id);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('[ORDERS] Error cancelling order:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
});

// ======= GET ORDER STATISTICS =======
// @route   GET /api/orders/user/stats
// @desc    Get order statistics for user
// @access  Private
router.get('/user/stats', protect, async (req, res) => {
  try {
    console.log('[ORDERS] Fetching stats for user:', req.user._id);
    
    const stats = await Order.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const statusCounts = await Order.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('[ORDERS] Stats retrieved');

    res.json({
      success: true,
      message: 'Order statistics retrieved successfully',
      data: {
        stats: stats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 },
        statusCounts
      }
    });

  } catch (error) {
    console.error('[ORDERS] Error fetching stats:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order statistics'
    });
  }
});

module.exports = router;