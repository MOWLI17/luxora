// ============================================
// routes/payment.js - PAYMENTS
// ============================================
const express = require('express');
const router = express.Router();

router.get('/config', (req, res) => {
  res.json({
    success: true,
    stripeKey: process.env.STRIPE_PUBLIC_KEY
  });
});

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    res.json({
      success: true,
      clientSecret: 'test_secret',
      amount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body;
    res.json({
      success: true,
      orderId: 'order_' + Date.now(),
      amount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-payment', async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;
    res.json({
      success: true,
      message: 'Payment confirmed',
      orderId,
      paymentIntentId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

