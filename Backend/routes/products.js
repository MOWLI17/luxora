// routes/products.js - FIXED FOR VERCEL

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ✅ CRITICAL: Lazy import models to ensure DB is connected first
let Product;
let Review;

// Ensure models are loaded
const getModels = () => {
  if (!Product) {
    try {
      Product = mongoose.model('Product') || require('../models/Product');
    } catch (error) {
      console.error('[PRODUCTS] Error loading Product model:', error.message);
      throw new Error('Product model not initialized');
    }
  }
  
  if (!Review) {
    try {
      Review = mongoose.model('Review') || require('../models/Review');
    } catch (error) {
      console.log('[PRODUCTS] Review model not found (optional)');
    }
  }
  
  return { Product, Review };
};

/* ========================
   GET ALL PRODUCTS
======================== */

router.get('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET / - Fetching products');
    console.log('[PRODUCTS] DB Connection State:', mongoose.connection.readyState);
    
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[PRODUCTS] ❌ Database not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please try again.',
        dbState: mongoose.connection.readyState
      });
    }

    // Load models
    const { Product: ProductModel } = getModels();

    // Extract query parameters
    const { 
      minPrice = 0, 
      maxPrice = 5000, 
      minRating = 0, 
      search = '',
      page = 1,
      limit = 20,
      category = '',
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    let filter = {
      price: { $gte: minPrice, $lte: maxPrice },
      rating: { $gte: minRating }
    };

    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    console.log('[PRODUCTS] Filter:', JSON.stringify(filter));

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Execute query with timeout
    const query = ProductModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .maxTimeMS(10000); // 10 second timeout on query

    const products = await query.exec();

    // Get total count
    const total = await ProductModel.countDocuments(filter);

    console.log('[PRODUCTS] ✅ Found', products.length, 'products');

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error fetching products:', error.message);
    console.error('[PRODUCTS] Stack:', error.stack);

    // Don't expose internal errors in production
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* ========================
   GET SINGLE PRODUCT
======================== */

router.get('/:id', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET /:id - Fetching product:', req.params.id);

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed'
      });
    }

    const { Product: ProductModel } = getModels();

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await ProductModel.findById(req.params.id)
      .maxTimeMS(10000)
      .exec();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('[PRODUCTS] ✅ Found product:', product._id);

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error fetching product:', error.message);

    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* ========================
   SEARCH PRODUCTS
======================== */

router.get('/search/q', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed'
      });
    }

    const { Product: ProductModel } = getModels();

    const products = await ProductModel.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
      .limit(20)
      .maxTimeMS(10000)
      .exec();

    console.log('[PRODUCTS] ✅ Search found', products.length, 'results');

    res.json({
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Search error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* ========================
   ERROR HANDLING
======================== */

router.use((err, req, res, next) => {
  console.error('[PRODUCTS] Route error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

module.exports = router;
