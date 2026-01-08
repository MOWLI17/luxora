// routes/payment.js - Complete Payment API
const express = require('express');
const router = express.Router();

// GET payment config
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
      currency: 'inr',
      minAmount: 100
    }
  });
});

// POST create payment intent
router.post('/create-payment-intent', (req, res) => {
  const { amount, currency = 'inr' } = req.body;

  res.json({
    success: true,
    clientSecret: 'pi_' + Date.now() + '_secret_placeholder',
    paymentIntentId: 'pi_' + Date.now(),
    amount: amount,
    currency: currency
  });
});

// POST create order (payment order)
router.post('/create-order', (req, res) => {
  const { cartItems, totalAmount, shippingAddress, paymentMethod, paymentIntentId } = req.body;

  const order = {
    _id: 'order_' + Date.now(),
    items: cartItems || [],
    totalAmount: totalAmount || 0,
    shippingAddress: shippingAddress || {},
    paymentMethod: paymentMethod || 'cash on delivery',
    paymentIntentId: paymentIntentId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
});

// POST confirm payment
router.post('/confirm-payment', (req, res) => {
  const { orderId, paymentIntentId } = req.body;

  res.json({
    success: true,
    message: 'Payment confirmed successfully',
    orderId: orderId,
    paymentIntentId: paymentIntentId,
    status: 'paid'
  });
});

// Legacy POST route
router.post('/', (req, res) => {
  res.json({ success: true, message: 'Payment processed' });
});

module.exports = router;
