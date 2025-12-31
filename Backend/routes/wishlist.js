const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, wishlist: [] });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'Item added to wishlist' });
});

module.exports = router;
