const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, cart: [] });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Item added to cart' });
});

module.exports = router;
