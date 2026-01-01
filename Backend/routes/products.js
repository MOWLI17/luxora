// routes/products.js - Products API Routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

console.log('[PRODUCTS ROUTE] Products routes loaded');

/* ========================
   GET ALL PRODUCTS
======================== */
router.get('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET / - Fetching products');
    console.log('[PRODUCTS] Query params:', req.query);
    console.log('[PRODUCTS] DB State:', mongoose.connection.readyState);
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('[PRODUCTS] ❌ Database not connected');
      return res.status(503).json({
        success: false,
        message: 'Database not connected',
        products: []
      });
    }

    // Extract query parameters with defaults
    const {
      minPrice = 0,
      maxPrice = 10000,
      minRating = 0,
      search = '',
      page = 1,
      limit = 20,
      category = '',
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filter = {
      price: {
        $gte: Number(minPrice) || 0,
        $lte: Number(maxPrice) || 10000
      }
    };

    // Add rating filter
    if (minRating && Number(minRating) > 0) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Add search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { brand: { $regex: search.trim(), $options: 'i' } }
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

    console.log('[PRODUCTS] Pagination:', { page: pageNum, limit: limitNum, skip });

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .maxTimeMS(20000)
      .lean()
      .exec();

    console.log('[PRODUCTS] ✅ Found', products.length, 'products');

    // Get total count
    let total = 0;
    try {
      total = await Product.countDocuments(filter).maxTimeMS(10000).exec();
      console.log('[PRODUCTS] Total count:', total);
    } catch (countErr) {
      console.error('[PRODUCTS] Count error:', countErr.message);
      total = products.length;
    }

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
      message: 'Error fetching products',
      error: error.message,
      products: []
    });
  }
});

/* ========================
   GET SINGLE PRODUCT
======================== */
router.get('/:id', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET /:id -', req.params.id);

    // Check database
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
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

    console.log('[PRODUCTS] ✅ Product found');

    return res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

/* ========================
   SEARCH PRODUCTS
======================== */
router.get('/search/q', async (req, res) => {
  try {
    const { q } = req.query;
    console.log('[PRODUCTS] Search query:', q);

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }

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
