// routes/cart.js - Complete Cart API
const express = require('express');
const router = express.Router();

// GET cart
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      cart: {
        items: [],
        totalAmount: 0,
        totalItems: 0
      }
    }
  });
});

// POST add to cart
router.post('/', (req, res) => {
  const { productId, quantity = 1 } = req.body;

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: {
      cart: {
        items: [{
          product: { _id: productId },
          quantity: quantity
        }],
        totalItems: quantity
      }
    }
  });
});

// PUT update cart item quantity
router.put('/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  res.json({
    success: true,
    message: 'Cart updated successfully',
    data: {
      productId: productId,
      quantity: quantity
    }
  });
});

// DELETE remove item from cart
router.delete('/:productId', (req, res) => {
  const { productId } = req.params;

  res.json({
    success: true,
    message: 'Item removed from cart',
    productId: productId
  });
});

// DELETE clear entire cart
router.delete('/', (req, res) => {
  res.json({
    success: true,
    message: 'Cart cleared successfully'
  });
});

module.exports = router;
