// routes/seller.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sellerProtect } = require('../middleware/auth');

console.log('[ROUTES] Seller routes loaded');

// ========== GET SELLER ORDERS ==========
router.get('/orders', sellerProtect, async (req, res) => {
  try {
    console.log('[SELLER] Fetching orders for seller:', req.sellerId);

    // Find all products for this seller
    const sellerProducts = await Product.find({ seller: req.sellerId }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    // Find all orders that contain these products
    const orders = await Order.find({
      'items.productId': { $in: productIds }
    })
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name price')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`[SELLER] Found ${orders.length} orders`);

    res.json({
      success: true,
      count: orders.length,
      orders: orders.map(order => ({
        _id: order._id,
        customerName: order.userId?.name || 'Unknown',
        customerEmail: order.userId?.email,
        totalAmount: order.totalAmount,
        status: order.status || 'pending',
        orderStatus: order.orderStatus || 'pending',
        items: order.items,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    });

  } catch (error) {
    console.error('[SELLER] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// ========== UPDATE ORDER STATUS (Seller Only) ==========
router.put('/orders/:orderId/status', sellerProtect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get seller's products
    const sellerProducts = await Product.find({ seller: req.sellerId }).select('_id');
    const productIds = sellerProducts.map(p => p._id);

    // Find order and verify seller owns it
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if this order contains seller's products
    const hasSellerProducts = order.items.some(item =>
      productIds.some(pid => pid.equals(item.productId))
    );

    if (!hasSellerProducts) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    // Update status
    order.status = status;
    order.orderStatus = status.toLowerCase();
    if (status === 'Delivered' || status === 'delivered') {
      order.deliveredAt = new Date();
    }
    await order.save();

    console.log('[SELLER] Order status updated:', order._id, status);

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });

  } catch (error) {
    console.error('[SELLER] Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

module.exports = router;