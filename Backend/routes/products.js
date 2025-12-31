// routes/products.js - Minimal Working Version
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

console.log('[PRODUCTS-ROUTE] Products route loaded');

// Get Product model safely
function getProductModel() {
  try {
    // Check if model already exists
    if (mongoose.models.Product) {
      return mongoose.models.Product;
    }
    // Otherwise require it
    return require('../models/Product');
  } catch (error) {
    console.error('[PRODUCTS-ROUTE] Error loading Product model:', error.message);
    throw error;
  }
}

/* ========================
   GET ALL PRODUCTS
======================== */
router.get('/', async (req, res) => {
  console.log('[PRODUCTS] GET / - Fetching all products');
  
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('[PRODUCTS] Database not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database is not connected',
        dbState: mongoose.connection.readyState
      });
    }

    console.log('[PRODUCTS] Database connected. Loading model...');
    const Product = getProductModel();

    // Extract query parameters with defaults
    const {
      minPrice = 0,
      maxPrice = 10000,
      minRating = 0,
      search = '',
      page = 1,
      limit = 20,
      category = ''
    } = req.query;

    // Build filter
    const filter = {
      price: { 
        $gte: Number(minPrice) || 0, 
        $lte: Number(maxPrice) || 10000 
      }
    };

    // Add rating filter if provided
    if (minRating && Number(minRating) > 0) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Add search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Add category filter
    if (category && category.trim()) {
      filter.category = category.trim();
    }

    console.log('[PRODUCTS] Filter:', JSON.stringify(filter));

    // Calculate pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    console.log('[PRODUCTS] Executing query...');

    // Execute query with timeout
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .maxTimeMS(15000)
      .lean()
      .exec();

    console.log('[PRODUCTS] ✅ Found', products.length, 'products');

    // Get total count (with timeout)
    const total = await Product.countDocuments(filter)
      .maxTimeMS(10000)
      .exec();

    console.log('[PRODUCTS] Total count:', total);

    return res.json({
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
    console.error('[PRODUCTS] ❌ Error:', error.message);
    console.error('[PRODUCTS] Stack:', error.stack);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/* ========================
   GET SINGLE PRODUCT
======================== */
router.get('/:id', async (req, res) => {
  console.log('[PRODUCTS] GET /:id -', req.params.id);

  try {
    // Check database
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }

    const Product = getProductModel();

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(req.params.id)
      .maxTimeMS(10000)
      .lean()
      .exec();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('[PRODUCTS] ✅ Found product');

    return res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

/* ========================
   SEARCH PRODUCTS
======================== */
router.get('/search/q', async (req, res) => {
  console.log('[PRODUCTS] Search query:', req.query.q);

  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }

    const Product = getProductModel();

    const products = await Product.find({
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { description: { $regex: q.trim(), $options: 'i' } },
        { brand: { $regex: q.trim(), $options: 'i' } }
      ]
    })
      .limit(20)
      .maxTimeMS(10000)
      .lean()
      .exec();

    console.log('[PRODUCTS] ✅ Search found', products.length, 'results');

    return res.json({
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Search error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

module.exports = router;
