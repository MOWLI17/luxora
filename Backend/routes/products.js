// routes/products.js - FIXED with Database Connection Checks
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

console.log('[ROUTES] Products routes loaded');

// ✅ Lazy load models to ensure DB is connected first
let Product;
const getProduct = () => {
  if (!Product) {
    Product = require('../models/Product');
  }
  return Product;
};

/* ========================
   GET ALL PRODUCTS
======================== */
router.get('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET / - Fetching products');
    console.log('[PRODUCTS] DB Connection State:', mongoose.connection.readyState);
    
    // ✅ Check if database is connected FIRST
    if (mongoose.connection.readyState !== 1) {
      console.error('[PRODUCTS] ❌ Database not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please try again.',
        dbState: mongoose.connection.readyState
      });
    }

    // Get the Product model
    const ProductModel = getProduct();

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
      price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
      rating: { $gte: parseInt(minRating) }
    };

    // Add search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category && category.trim()) {
      filter.category = category;
    }

    console.log('[PRODUCTS] Filter:', JSON.stringify(filter));

    // Calculate pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    // ✅ Execute query with timeout
    const products = await ProductModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .maxTimeMS(15000)
      .lean()
      .exec();

    // Get total count
    const total = await ProductModel.countDocuments(filter).maxTimeMS(10000);

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

    // ✅ Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed'
      });
    }

    const ProductModel = getProduct();

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await ProductModel.findById(req.params.id)
      .maxTimeMS(10000)
      .lean()
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

    // ✅ Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed'
      });
    }

    const ProductModel = getProduct();

    const products = await ProductModel.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
      .limit(20)
      .maxTimeMS(10000)
      .lean()
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

module.exports = router;
