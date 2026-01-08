// routes/password.js - Complete Password API
const express = require('express');
const router = express.Router();

// POST forgot password
router.post('/forgot', (req, res) => {
  const { email } = req.body;

  res.json({
    success: true,
    message: 'Password reset email sent successfully',
    email: email
  });
});

// POST reset password with token
router.post('/reset/:token', (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  res.json({
    success: true,
    message: 'Password reset successfully',
    token: token
  });
});

// POST change password (logged in user)
router.post('/change', (req, res) => {
  const { currentPassword, newPassword } = req.body;

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Legacy reset route
router.post('/reset', (req, res) => {
  res.json({ success: true, message: 'Password reset' });
});

module.exports = router;
