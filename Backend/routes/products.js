// routes/products.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { protect, sellerProtect } = require('../middleware/auth');

console.log('[ROUTES] Products routes loaded');

// ======= GET SELLER'S PRODUCTS (MUST BE BEFORE /:id ROUTE) =======
// @route   GET /api/products/seller/my-products
// @desc    Get all products for logged-in seller
// @access  Private (Seller only)
router.get('/seller/my-products', sellerProtect, async (req, res) => {
  try {
    console.log('[PRODUCTS] Fetching products for seller:', req.sellerId);
    
    const products = await Product.find({ seller: req.sellerId })
      .populate('seller', 'businessName storeName')
      .sort({ createdAt: -1 });
    
    console.log(`[PRODUCTS] Found ${products.length} products for seller`);
    
    res.json({ 
      success: true, 
      count: products.length,
      products 
    });
  } catch (error) {
    console.error('[PRODUCTS] Get seller products error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ======= GET ALL PRODUCTS (Public) =======
// @route   GET /api/products
// @desc    Get all products with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] Fetching all products with filters:', req.query);
    
    const { 
      minPrice = 0, 
      maxPrice = 1000000, 
      search = '', 
      category = '',
      limit = 100 
    } = req.query;
    
    // Build filter object
    let filter = { 
      price: { 
        $gte: parseFloat(minPrice), 
        $lte: parseFloat(maxPrice) 
      } 
    };
    
    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add category filter
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    const products = await Product.find(filter)
      .populate('seller', 'businessName storeName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    console.log(`[PRODUCTS] Found ${products.length} products`);
    
    res.json({ 
      success: true, 
      count: products.length,
      products 
    });
  } catch (error) {
    console.error('[PRODUCTS] Get all error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ======= GET SINGLE PRODUCT (Public) =======
// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log('[PRODUCTS] Fetching product:', req.params.id);
    
    const product = await Product.findById(req.params.id)
      .populate('seller', 'businessName storeName email phone')
      .populate('reviews.user', 'name email');
    
    if (!product) {
      console.log('[PRODUCTS] Product not found:', req.params.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    console.log('[PRODUCTS] Product found:', product.name);
    
    res.json({ 
      success: true, 
      product 
    });
  } catch (error) {
    console.error('[PRODUCTS] Get single error:', error.message);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid product ID' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ======= CREATE PRODUCT (Seller Only) =======
// @route   POST /api/products
// @desc    Create a new product
// @access  Private (Seller only)
router.post('/', sellerProtect, async (req, res) => {
  try {
    console.log('[PRODUCTS] Creating product for seller:', req.sellerId);
    console.log('[PRODUCTS] Request body:', {
      name: req.body.name,
      price: req.body.price,
      category: req.body.category,
      imageCount: req.body.images?.length
    });
    
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      category, 
      brand, 
      stock, 
      images 
    } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product name is required' 
      });
    }
    
    if (!description || !description.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product description is required' 
      });
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid price is required' 
      });
    }
    
    if (!category || !category.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product category is required' 
      });
    }
    
    if (!brand || !brand.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Brand name is required' 
      });
    }
    
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid stock quantity is required' 
      });
    }
    
    // Validate images
    if (!images || !Array.isArray(images) || images.length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least 4 product images are required' 
      });
    }
    
    // Verify seller exists and is approved
    const seller = await Seller.findById(req.sellerId);
    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: 'Seller account not found' 
      });
    }
    
    if (!seller.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your seller account is inactive. Please contact support.' 
      });
    }
    
    // Calculate discount if originalPrice is provided
    let discount = 0;
    const finalOriginalPrice = originalPrice ? parseFloat(originalPrice) : parseFloat(price);
    
    if (finalOriginalPrice > parseFloat(price)) {
      discount = Math.round(((finalOriginalPrice - parseFloat(price)) / finalOriginalPrice) * 100);
    }
    
    // Create product
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      originalPrice: finalOriginalPrice,
      discount: discount,
      category: category.trim(),
      brand: brand.trim(),
      stock: parseInt(stock),
      images: images,
      seller: req.sellerId,
      rating: 0,
      numReviews: 0,
      reviews: []
    });
    
    console.log('[PRODUCTS] Product created successfully:', product._id);
    
    // Populate seller info before sending response
    await product.populate('seller', 'businessName storeName email');
    
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully',
      product 
    });
    
  } catch (error) {
    console.error('[PRODUCTS] Create error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create product'
    });
  }
});

// ======= UPDATE PRODUCT (Seller Only) =======
// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private (Seller only - must own the product)
router.put('/:id', sellerProtect, async (req, res) => {
  try {
    console.log('[PRODUCTS] Updating product:', req.params.id);
    console.log('[PRODUCTS] Seller ID:', req.sellerId);
    
    const { 
      name, 
      description, 
      price, 
      originalPrice, 
      category, 
      brand, 
      stock, 
      images 
    } = req.body;
    
    // Find product
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check if seller owns this product
    if (product.seller.toString() !== req.sellerId.toString()) {
      console.log('[PRODUCTS] Unauthorized update attempt');
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this product' 
      });
    }

    // Update fields if provided
    if (name && name.trim()) product.name = name.trim();
    if (description && description.trim()) product.description = description.trim();
    if (price && !isNaN(parseFloat(price))) product.price = parseFloat(price);
    if (originalPrice && !isNaN(parseFloat(originalPrice))) product.originalPrice = parseFloat(originalPrice);
    if (category && category.trim()) product.category = category.trim();
    if (brand && brand.trim()) product.brand = brand.trim();
    if (stock !== undefined && !isNaN(parseInt(stock))) product.stock = parseInt(stock);
    if (images && Array.isArray(images) && images.length > 0) product.images = images;

    // Recalculate discount
    if (product.originalPrice > product.price) {
      product.discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    } else {
      product.discount = 0;
    }

    product.updatedAt = new Date();
    await product.save();
    
    // Populate seller info
    await product.populate('seller', 'businessName storeName email');

    console.log('[PRODUCTS] Product updated successfully:', product._id);

    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      product 
    });
  } catch (error) {
    console.error('[PRODUCTS] Update error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ======= DELETE PRODUCT (Seller Only) =======
// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Seller only - must own the product)
router.delete('/:id', sellerProtect, async (req, res) => {
  try {
    console.log('[PRODUCTS] Deleting product:', req.params.id);
    console.log('[PRODUCTS] Seller ID:', req.sellerId);
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check if seller owns this product
    if (product.seller.toString() !== req.sellerId.toString()) {
      console.log('[PRODUCTS] Unauthorized delete attempt');
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this product' 
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    console.log('[PRODUCTS] Product deleted successfully:', req.params.id);

    res.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('[PRODUCTS] Delete error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// ======= ADD PRODUCT REVIEW (User Only) =======
// @route   POST /api/products/:id/review
// @desc    Add a review to a product
// @access  Private (User only)
router.post('/:id/review', protect, async (req, res) => {
  try {
    console.log('[PRODUCTS] Adding review for product:', req.params.id);
    
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      review => review.user.toString() === req.userId.toString()
    );
    
    if (alreadyReviewed) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this product' 
      });
    }
    
    // Add review
    const review = {
      user: req.userId,
      name: req.user.name,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date()
    };
    
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    
    // Calculate average rating
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    await product.save();
    
    console.log('[PRODUCTS] Review added successfully');
    
    res.status(201).json({ 
      success: true, 
      message: 'Review added successfully',
      product 
    });
    
  } catch (error) {
    console.error('[PRODUCTS] Add review error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;