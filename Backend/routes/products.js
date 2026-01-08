const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/* ============================
   LOAD PRODUCT MODEL (ROBUST)
============================ */
let Product;

if (mongoose.models.Product) {
  Product = mongoose.models.Product;
  console.log('✅ Product model already loaded');
} else {
  try {
    Product = require('../models/Product');
    console.log('✅ Product model loaded from ../models/Product');
  } catch (error) {
    console.error('❌ Failed to load Product model:', error.message);
    console.error('__dirname:', __dirname);
    console.error('cwd:', process.cwd());
  }
}

/* ============================
   MIDDLEWARE: CHECK MODEL LOADED
============================ */
const ensureProductModel = (req, res, next) => {
  if (!Product) {
    console.error('❌ Product model not available');
    return res.status(500).json({
      success: false,
      message: 'Product model not initialized',
      error: 'Server configuration error - Product model missing'
    });
  }
  next();
};

router.use(ensureProductModel);

/* ============================
   ⭐ SPECIFIC ROUTES FIRST (Before :id)
============================ */

/* GET FEATURED PRODUCTS */
router.get('/featured/list', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET /featured/list');

    const featuredProducts = await Product.find({
      featured: true,
      isActive: true,
      stock: { $gt: 0 }
    })
      .populate('seller', 'name businessName')
      .sort('-rating -createdAt')
      .limit(10)
      .lean()
      .exec();

    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      products: featuredProducts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error fetching featured products:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured products',
      error: error.message
    });
  }
});

/* ============================
   GENERAL ROUTES (After specific routes)
============================ */

/* GET ALL PRODUCTS WITH FILTERS */
router.get('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] GET / - Request received');
    console.log('[PRODUCTS] Query params:', JSON.stringify(req.query));
    console.log('[PRODUCTS] MongoDB state:', mongoose.connection.readyState);

    // Validate MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
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
      isActive: true
    };

    filter.stock = { $gt: 0 };

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex }
      ];
    }

    // Category filter
    if (category && category.trim() && category.toLowerCase() !== 'all') {
      filter.category = new RegExp(category.trim(), 'i');
    }

    // Price filter
    const minPriceNum = Number(minPrice);
    const maxPriceNum = Number(maxPrice);
    if (minPriceNum > 0 || maxPriceNum < 999999) {
      filter.price = {};
      if (minPriceNum > 0) filter.price.$gte = minPriceNum;
      if (maxPriceNum < 999999) filter.price.$lte = maxPriceNum;
    }

    // Rating filter
    const minRatingNum = Number(minRating);
    if (minRatingNum > 0) {
      filter.rating = { $gte: minRatingNum };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(parseInt(limit) || 12, 100));
    const skip = (pageNum - 1) * limitNum;

    console.log('[PRODUCTS] Filter:', JSON.stringify(filter, null, 2));
    console.log('[PRODUCTS] Sort:', sort);
    console.log('[PRODUCTS] Pagination:', { page: pageNum, limit: limitNum, skip });

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email businessName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean()
        .exec(),
      Product.countDocuments(filter).exec()
    ]);

    console.log(`[PRODUCTS] ✅ Found ${products.length}/${total} products`);

    res.status(200).json({
      success: true,
      count: products.length,
      total: total,
      products: products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        pageSize: limitNum,
        totalItems: total,
        hasMore: pageNum * limitNum < total
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in GET /:', error.message);
    console.error('[PRODUCTS] Stack:', error.stack);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        mongoState: mongoose.connection.readyState
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/* GET SINGLE PRODUCT BY ID */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[PRODUCTS] GET /:id - Product ID:', id);

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
        providedId: id
      });
    }

    const product = await Product.findById(id)
      .populate('seller', 'name email businessName phone')
      .populate('reviews.user', 'name email avatar')
      .lean()
      .exec();

    if (!product) {
      console.log('[PRODUCTS] ❌ Product not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        productId: id
      });
    }

    console.log('[PRODUCTS] ✅ Product found:', product.name);

    res.status(200).json({
      success: true,
      product: product,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in GET /:id:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/* CREATE PRODUCT */
router.post('/', async (req, res) => {
  try {
    console.log('[PRODUCTS] POST / - Creating new product');
    console.log('[PRODUCTS] Body:', JSON.stringify(req.body, null, 2));

    const {
      name,
      description,
      price,
      originalPrice,
      category,
      images,
      stock,
      brand,
      seller
    } = req.body;

    // Validation
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!price) missingFields.push('price');
    if (!category) missingFields.push('category');
    if (!brand) missingFields.push('brand');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    const sellerId = seller || req.seller?.id || req.user?.id;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID is required. Please authenticate.'
      });
    }

    const newProduct = new Product({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      category: category.trim(),
      images: Array.isArray(images) && images.length > 0
        ? images
        : ['https://via.placeholder.com/400x400?text=No+Image'],
      stock: Number(stock) || 0,
      brand: brand.trim(),
      seller: sellerId,
      rating: 0,
      numReviews: 0,
      isActive: true
    });

    const savedProduct = await newProduct.save();
    console.log('[PRODUCTS] ✅ Product created:', savedProduct._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in POST /:', error.message);
    console.error('[PRODUCTS] Stack:', error.stack);

    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/* UPDATE PRODUCT */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[PRODUCTS] PUT /:id - Updating product:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    delete req.body._id;
    delete req.body.createdAt;

    req.body.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
        context: 'query'
      }
    ).lean();

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        productId: id
      });
    }

    console.log('[PRODUCTS] ✅ Product updated:', id);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in PUT /:id:', error.message);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/* DELETE PRODUCT */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[PRODUCTS] DELETE /:id - Deleting product:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(id).lean();

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        productId: id
      });
    }

    console.log('[PRODUCTS] ✅ Product deleted:', id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      deletedProduct: {
        id: deletedProduct._id,
        name: deletedProduct.name
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PRODUCTS] ❌ Error in DELETE /:id:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;