// routes/wishlist.js - FIXED with Database Connection Checks
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');

console.log('[ROUTES] Wishlist routes loaded');

// ✅ Lazy load models
let Wishlist, Product;
const getModels = () => {
  if (!Wishlist) Wishlist = require('../models/Wishlist');
  if (!Product) Product = require('../models/Product');
  return { Wishlist, Product };
};

// ✅ Helper to check DB connection
const checkDB = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please try again.'
    });
    return false;
  }
  return true;
};

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('[WISHLIST] Getting wishlist for user:', req.userId);
    
    if (!checkDB(res)) return;

    const { Wishlist: WishlistModel } = getModels();
    
    let wishlist = await WishlistModel.findOne({ user: req.userId })
      .populate('products')
      .maxTimeMS(10000)
      .exec();

    if (!wishlist) {
      console.log('[WISHLIST] Wishlist not found, creating new wishlist');
      wishlist = await WishlistModel.create({ user: req.userId, products: [] });
    }

    res.json({
      success: true,
      wishlist
    });
  } catch (error) {
    console.error('[WISHLIST] Error getting wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/wishlist/:productId
// @desc    Toggle product in wishlist
// @access  Private
router.post('/:productId', protect, async (req, res) => {
  try {
    console.log('[WISHLIST] Toggling product in wishlist:', req.params.productId);
    
    if (!checkDB(res)) return;

    const productId = req.params.productId;
    const { Wishlist: WishlistModel, Product: ProductModel } = getModels();

    // Check if product exists
    const product = await ProductModel.findById(productId).maxTimeMS(10000);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let wishlist = await WishlistModel.findOne({ user: req.userId }).maxTimeMS(10000);

    if (!wishlist) {
      wishlist = await WishlistModel.create({
        user: req.userId,
        products: [productId]
      });
      await wishlist.populate('products');

      console.log('[WISHLIST] Product added to new wishlist');
      return res.json({
        success: true,
        message: 'Product added to wishlist',
        wishlist
      });
    }

    const productIndex = wishlist.products.findIndex(
      p => p.toString() === productId
    );

    if (productIndex > -1) {
      // Remove from wishlist
      wishlist.products.splice(productIndex, 1);
      await wishlist.save();
      await wishlist.populate('products');

      console.log('[WISHLIST] Product removed from wishlist');
      return res.json({
        success: true,
        message: 'Product removed from wishlist',
        wishlist
      });
    } else {
      // Add to wishlist
      wishlist.products.push(productId);
      await wishlist.save();
      await wishlist.populate('products');

      console.log('[WISHLIST] Product added to wishlist');
      return res.json({
        success: true,
        message: 'Product added to wishlist',
        wishlist
      });
    }
  } catch (error) {
    console.error('[WISHLIST] Error toggling wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    console.log('[WISHLIST] Removing product from wishlist:', req.params.productId);
    
    if (!checkDB(res)) return;

    const { Wishlist: WishlistModel } = getModels();

    const wishlist = await WishlistModel.findOne({ user: req.userId }).maxTimeMS(10000);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    const initialLength = wishlist.products.length;
    wishlist.products = wishlist.products.filter(
      p => p.toString() !== req.params.productId
    );

    if (wishlist.products.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    await wishlist.save();
    await wishlist.populate('products');

    console.log('[WISHLIST] Product removed successfully');
    res.json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist
    });
  } catch (error) {
    console.error('[WISHLIST] Error removing from wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/wishlist
// @desc    Clear entire wishlist
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    console.log('[WISHLIST] Clearing wishlist for user:', req.userId);
    
    if (!checkDB(res)) return;

    const { Wishlist: WishlistModel } = getModels();

    const wishlist = await WishlistModel.findOne({ user: req.userId }).maxTimeMS(10000);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.products = [];
    await wishlist.save();

    console.log('[WISHLIST] Wishlist cleared successfully');
    res.json({
      success: true,
      message: 'Wishlist cleared',
      wishlist
    });
  } catch (error) {
    console.error('[WISHLIST] Error clearing wishlist:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
