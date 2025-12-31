const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ success: true, message: 'Auth route - login' });
});

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'Auth route - register' });
});

module.exports = router;
