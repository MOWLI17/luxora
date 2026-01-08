// routes/user.js - Complete User API
const express = require('express');
const router = express.Router();

// GET user profile
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    user: {
      _id: 'user_placeholder',
      name: 'Guest User',
      email: 'guest@example.com',
      phone: '',
      address: {}
    }
  });
});

// PUT update user profile
router.put('/profile', (req, res) => {
  const { name, email, phone, address } = req.body;

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      name: name,
      email: email,
      phone: phone,
      address: address
    }
  });
});

// DELETE user account
router.delete('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = router;
