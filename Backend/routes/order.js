const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, orders: [] });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Order created' });
});

module.exports = router;
