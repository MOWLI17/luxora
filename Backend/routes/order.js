const express = require('express');
const router = express.Router();

// GET all orders
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    orders: [],
    message: 'Orders retrieved successfully'
  });
});

// GET single order by ID
router.get('/:id', (req, res) => {
  res.json({ 
    success: true, 
    order: { id: req.params.id },
    message: 'Order retrieved successfully'
  });
});

// POST create new order
router.post('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Order created successfully',
    order: req.body
  });
});

// PUT update order
router.put('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Order updated successfully',
    orderId: req.params.id
  });
});

// DELETE order
router.delete('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Order deleted successfully',
    orderId: req.params.id
  });
});

module.exports = router;