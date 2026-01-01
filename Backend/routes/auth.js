// routes/auth.js
const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ success: true, message: 'Auth - login' });
});

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'Auth - register' });
});

module.exports = router;
