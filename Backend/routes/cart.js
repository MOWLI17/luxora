// routes/cart.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

console.log('[ROUTES] Cart routes loaded');

// ======= GET CART =======
// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('[CART] Fetching cart for user:', req.userId);

    let cart = await Cart.findOne({ user: req.userId })
      .populate('items.product', 'name price images stock category brand');

    if (!cart) {
      console.log('[CART] No cart found, creating empty cart');
      cart = await Cart.create({
        user: req.userId,
        items: []
      });
    }

    console.log('[CART] Cart retrieved with', cart.items.length, 'items');

    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('[CART] Get error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cart'
    });
  }
});

// ======= ADD TO CART =======
// @route   POST /api/cart
// @desc    Add product to cart or update quantity
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    console.log('[CART] Adding to cart - User:', req.userId, 'Product:', productId, 'Qty:', quantity);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      console.log('[CART] Creating new cart for user');
      cart = new Cart({
        user: req.userId,
        items: []
      });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Product exists, update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check stock for new quantity
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock} items available`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      console.log('[CART] Updated existing item, new quantity:', newQuantity);
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity: quantity
      });
      console.log('[CART] Added new item to cart');
    }

    await cart.save();
    
    // Populate cart items before sending response
    await cart.populate('items.product', 'name price images stock category brand');

    console.log('[CART] Cart updated successfully');

    res.json({
      success: true,
      message: 'Product added to cart successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('[CART] Add error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add to cart'
    });
  }
});

// ======= UPDATE CART ITEM QUANTITY =======
// @route   PUT /api/cart/:productId
// @desc    Update quantity of a cart item
// @access  Private
router.put('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    console.log('[CART] Updating cart item - Product:', productId, 'New Qty:', quantity);

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    // Find cart
    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Populate cart items
    await cart.populate('items.product', 'name price images stock category brand');

    console.log('[CART] Item quantity updated successfully');

    res.json({
      success: true,
      message: 'Cart updated successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('[CART] Update error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cart'
    });
  }
});

// ======= REMOVE FROM CART =======
// @route   DELETE /api/cart/:productId
// @desc    Remove product from cart
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    console.log('[CART] Removing item - Product:', productId);

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Populate remaining items
    await cart.populate('items.product', 'name price images stock category brand');

    console.log('[CART] Item removed successfully');

    res.json({
      success: true,
      message: 'Product removed from cart',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('[CART] Remove error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove from cart'
    });
  }
});

// ======= CLEAR CART =======
// @route   DELETE /api/cart
// @desc    Clear all items from cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    console.log('[CART] Clearing cart for user:', req.userId);

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = [];
    await cart.save();

    console.log('[CART] Cart cleared successfully');

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart
      }
    });
  } catch (error) {
    console.error('[CART] Clear error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear cart'
    });
  }
});

module.exports = router;