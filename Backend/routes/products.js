const express = require('express');
const router = express.Router();

// Try to require Product model with error handling
let Product;
try {
  Product = require('../models/Product');
  console.log('✅ Product model loaded successfully');
} catch (error) {
  console.error('❌ Error loading Product model:', error.message);
  console.error('Tried path: ../models/Product');
}

// ===== GET ALL PRODUCTS WITH FILTERS =====
router.get('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET / - Started');
    console.log('[PRODUCTS] Query params:', req.query);
    
    // Check if Product model is loaded
    if (!Product) {
      console.error('[PRODUCTS] ❌ Product model not loaded');
      return res.status(500).json({
        success: false,
        message: 'Product model not loaded',
        error: 'Internal configuration error'
      });
    }

    const { 
      search = '', 
      category = '', 
      minPrice = 0, 
      maxPrice = 999999,
      minRating = 0,
      sort = '-createdAt',
      page = 1,
      limit = 12
    } = req.query;

    // Build filter object
    const filter = {
      stock: { $gt: 0 }
    };

    // Search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category.trim() && category !== 'all') {
      filter.category = { $regex: category, $options: 'i' };
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    console.log('[PRODUCTS] Filters:', JSON.stringify(filter, null, 2));
    console.log('[PRODUCTS] About to query database...');

    // Fetch products with sort and pagination
    const products = await Product.find(filter)
      .populate('seller', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean()
      .exec();

    const total = await Product.countDocuments(filter);

    console.log(`[PRODUCTS] ✅ Found ${products.length} products (Total: ${total})`);

    res.status(200).json({
      success: true,
      products: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in GET /:', error.message);
    console.error('[PRODUCTS] Stack:', error.stack);
    console.error('[PRODUCTS] Full error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===== GET SINGLE PRODUCT BY ID =====
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[PRODUCTS] GET /:id - ID:', id);

    if (!Product) {
      return res.status(500).json({
        success: false,
        message: 'Product model not loaded'
      });
    }

    // Check if valid MongoDB ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id)
      .populate('seller', 'name email')
      .populate('reviews.user', 'name email')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('[PRODUCTS] ✅ Product found:', product.name);
    res.status(200).json({
      success: true,
      product: product
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in GET /:id:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// ===== CREATE PRODUCT (Admin/Seller) =====
router.post('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] POST / - Creating new product');
    console.log('Request body:', req.body);
    
    if (!Product) {
      return res.status(500).json({
        success: false,
        message: 'Product model not loaded'
      });
    }

    const { name, description, price, originalPrice, category, images, stock, brand, rating, seller } = req.body;

    // Validation
    if (!name || !description || !price || !originalPrice || !category || !brand) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, originalPrice, category, brand'
      });
    }

    const sellerId = seller || req.user?.id || req.seller?.id;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID is required'
      });
    }

    const product = new Product({
      name,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice),
      discount: Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100),
      category,
      images: images || ['https://via.placeholder.com/400'],
      stock: Number(stock) || 0,
      brand,
      rating: Number(rating) || 0,
      seller: sellerId
    });

    const savedProduct = await product.save();
    console.log('[PRODUCTS] ✅ Product created:', savedProduct._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in POST /:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// ===== UPDATE PRODUCT =====
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[PRODUCTS] PUT /:id - Updating product:', id);

    if (!Product) {
      return res.status(500).json({
        success: false,
        message: 'Product model not loaded'
      });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('[PRODUCTS] ✅ Product updated:', id);
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in PUT /:id:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// ===== DELETE PRODUCT =====
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[PRODUCTS] DELETE /:id - Deleting product:', id);

    if (!Product) {
      return res.status(500).json({
        success: false,
        message: 'Product model not loaded'
      });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('[PRODUCTS] ✅ Product deleted:', id);
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in DELETE /:id:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

module.exports = router;