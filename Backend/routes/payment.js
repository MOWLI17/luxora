// routes/payment.js - FIXED with Database Connection Checks
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const { protect } = require('../middleware/auth');

console.log('[ROUTES] Payment routes loaded');

// ✅ Lazy load models
let Order, Cart, Product;
const getModels = () => {
  if (!Order) Order = require('../models/Order');
  if (!Cart) Cart = require('../models/Cart');
  if (!Product) Product = require('../models/Product');
  return { Order, Cart, Product };
};

// ✅ Helper to check DB connection
const checkDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again.'
    });
    return false;
  }
  return true;
};

// ✅ @route   POST /api/payment/create-payment-intent
// ✅ @desc    Create Stripe payment intent
// ✅ @access  Private (User)
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    console.log('[PAYMENT] Creating payment intent');
    
    if (!checkDB(res)) return;

    const { amount, currency = 'inr' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount' 
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata: {
        userId: req.userId.toString(),
        userName: req.user?.name || 'Unknown',
        userEmail: req.user?.email || 'unknown@email.com'
      }
    });

    console.log('[PAYMENT] Payment intent created:', paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('[PAYMENT] Create payment intent failed:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ✅ @route   POST /api/payment/create-order
// ✅ @desc    Create order with payment
// ✅ @access  Private (User)
router.post('/create-order', protect, async (req, res) => {
  try {
    console.log('[PAYMENT] Creating order for user:', req.userId);

    if (!checkDB(res)) return;

    const { 
      cartItems, 
      shippingAddress, 
      paymentMethod, 
      paymentIntentId 
    } = req.body;

    const { Order: OrderModel, Product: ProductModel, Cart: CartModel } = getModels();

    console.log('[PAYMENT] Received payment method:', paymentMethod);

    // Validate required fields
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart items are required' 
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complete shipping address is required' 
      });
    }

    // Verify products and calculate total
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cartItems) {
      const product = await ProductModel.findById(item.productId).maxTimeMS(10000);
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: `Product not found: ${item.productId}` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
        title: product.name
      });

      totalAmount += product.price * item.quantity;
    }

    // Reduce stock
    for (const item of orderItems) {
      await ProductModel.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { maxTimeMS: 10000 }
      );
    }

    // ✅ Accept payment method as-is
    const finalPaymentMethod = paymentMethod || 'cod';

    console.log('[PAYMENT] Final payment method:', finalPaymentMethod);

    // Determine payment status based on payment method
    let paymentStatus = 'pending';
    let orderStatus = 'pending';

    if (finalPaymentMethod === 'cash on delivery' || finalPaymentMethod === 'cod') {
      paymentStatus = 'pending';
      orderStatus = 'pending';
    } else if (paymentIntentId) {
      paymentStatus = 'completed';
      orderStatus = 'confirmed';
    }

    // Create order
    const order = await OrderModel.create({
      userId: req.userId,
      sellerId: null,
      items: orderItems,
      totalAmount,
      paymentMethod: finalPaymentMethod,
      paymentStatus,
      orderStatus,
      transactionId: paymentIntentId || null,
      shippingAddress
    });

    console.log('[PAYMENT] Order created:', order._id);

    // Clear user's cart if exists
    await CartModel.findOneAndUpdate(
      { user: req.userId },
      { items: [] },
      { maxTimeMS: 10000 }
    );

    await order.populate('userId', 'name email');
    await order.populate('items.productId', 'name price');

    res.status(201).json({ 
      success: true, 
      message: 'Order created successfully',
      data: { order }
    });

  } catch (error) {
    console.error('[PAYMENT] Create order failed:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create order'
    });
  }
});

// ✅ @route   POST /api/payment/confirm-payment
// ✅ @desc    Confirm payment for an order
// ✅ @access  Private (User)
router.post('/confirm-payment', protect, async (req, res) => {
  try {
    console.log('[PAYMENT] Confirming payment');

    if (!checkDB(res)) return;

    const { orderId, paymentIntentId } = req.body;
    const { Order: OrderModel } = getModels();

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    // Find order
    const order = await OrderModel.findById(orderId).maxTimeMS(10000);

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check if order belongs to current user
    if (order.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to confirm this order' 
      });
    }

    // Update order payment status
    order.paymentStatus = 'completed';
    order.orderStatus = 'confirmed';

    if (paymentIntentId) {
      order.transactionId = paymentIntentId;
    }

    await order.save();

    console.log('[PAYMENT] Payment confirmed for order:', orderId);

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: { order }
    });

  } catch (error) {
    console.error('[PAYMENT] Confirm payment failed:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to confirm payment'
    });
  }
});

// ✅ @route   GET /api/payment/config
// ✅ @desc    Get Stripe publishable key
// ✅ @access  Public
router.get('/config', (req, res) => {
  res.json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy'
  });
});

module.exports = router;
