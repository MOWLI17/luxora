// routes/sellerauth.js - Complete Seller Auth API
const express = require('express');
const router = express.Router();

// POST login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Mock successful login response
  res.json({
    success: true,
    message: 'Seller login successful',
    token: 'seller_token_' + Date.now(),
    seller: {
      _id: 'seller_' + Date.now(),
      email: email,
      name: 'Seller User',
      businessName: 'My Business',
      phone: '',
      createdAt: new Date().toISOString()
    }
  });
});

// POST register
router.post('/register', (req, res) => {
  const { email, password, name, businessName, phone } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and name are required'
    });
  }

  // Mock successful registration response
  res.status(201).json({
    success: true,
    message: 'Seller registration successful',
    token: 'seller_token_' + Date.now(),
    seller: {
      _id: 'seller_' + Date.now(),
      email: email,
      name: name,
      businessName: businessName || '',
      phone: phone || '',
      createdAt: new Date().toISOString()
    }
  });
});

// GET profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    seller: {
      _id: 'seller_placeholder',
      email: 'seller@example.com',
      name: 'Seller User',
      businessName: 'My Business',
      phone: '',
      createdAt: new Date().toISOString()
    }
  });
});

// PUT update profile
router.put('/profile', (req, res) => {
  const { name, businessName, phone, address } = req.body;

  res.json({
    success: true,
    message: 'Profile updated successfully',
    seller: {
      name: name,
      businessName: businessName,
      phone: phone,
      address: address
    }
  });
});

// GET seller products
router.get('/products', (req, res) => {
  res.json({
    success: true,
    products: [],
    count: 0
  });
});

// GET seller orders
router.get('/orders', (req, res) => {
  res.json({
    success: true,
    orders: [],
    count: 0
  });
});

// PUT update order status
router.put('/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  res.json({
    success: true,
    message: 'Order status updated',
    orderId: orderId,
    status: status
  });
});

module.exports = router;
