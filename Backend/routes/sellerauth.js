const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ success: true, message: 'Seller auth - login' });
});

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'Seller auth - register' });
});

module.exports = router;
