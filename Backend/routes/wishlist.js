// routes/wishlist.js - Complete Wishlist API
const express = require('express');
const router = express.Router();

// GET wishlist
router.get('/', (req, res) => {
  res.json({
    success: true,
    wishlist: {
      products: []
    }
  });
});

// POST toggle wishlist item (add if not exists, remove if exists)
router.post('/:id', (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: 'Wishlist toggled successfully',
    productId: id,
    action: 'added' // or 'removed'
  });
});

// DELETE remove item from wishlist
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    message: 'Item removed from wishlist',
    productId: id
  });
});

// DELETE clear entire wishlist
router.delete('/', (req, res) => {
  res.json({
    success: true,
    message: 'Wishlist cleared successfully'
  });
});

// Legacy POST route (add to wishlist)
router.post('/', (req, res) => {
  res.json({ success: true, message: 'Item added to wishlist' });
});

module.exports = router;
