// api/index.js - Complete Working Entry Point for Vercel
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ========================================
// CONFIGURATION
// ========================================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Ecom:Mowli12%40@ecom.pbem7rb.mongodb.net/luxora?retryWrites=true&w=majority&authSource=admin';
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('[SERVER] Starting Luxora API...');
console.log('[SERVER] Environment:', NODE_ENV);
console.log('[SERVER] MongoDB URI exists:', !!MONGODB_URI);

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ========================================
// DATABASE CONNECTION (CACHED)
// ========================================
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('[DB] ✅ Using cached connection');
    return true;
  }

  try {
    console.log('[DB] Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2
    });

    isConnected = true;
    console.log('[DB] ✅ Connected successfully');
    console.log('[DB] Database:', mongoose.connection.name);
    return true;

  } catch (error) {
    console.error('[DB] ❌ Connection failed:', error.message);
    isConnected = false;
    return false;
  }
};

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('[DB] Mongoose connected');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] Mongoose error:', err.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('[DB] Mongoose disconnected');
  isConnected = false;
});

// ========================================
// PRODUCT MODEL (Inline to avoid import issues)
// ========================================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  category: { type: String, required: true },
  images: { type: [String], default: ['https://via.placeholder.com/300'] },
  stock: { type: Number, required: true, min: 0, default: 0 },
  brand: { type: String, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0, min: 0 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Get or create Product model
const getProductModel = () => {
  return mongoose.models.Product || mongoose.model('Product', productSchema);
};

// ========================================
// ROUTES
// ========================================

// Root route
app.get('/api', (req, res) => {
  res.json({
    message: '🚀 Luxora API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      productById: '/api/products/:id'
    }
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const connected = await connectDB();
    
    const Product = getProductModel();
    let productCount = 0;
    
    if (connected) {
      try {
        productCount = await Product.countDocuments().maxTimeMS(5000);
      } catch (err) {
        console.error('[HEALTH] Error counting products:', err.message);
      }
    }
    
    res.json({
      status: connected ? 'healthy' : 'unhealthy',
      database: connected ? 'connected' : 'disconnected',
      dbState: mongoose.connection.readyState,
      productCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET all products
app.get('/api/products', async (req, res) => {
  console.log('[PRODUCTS] GET /api/products');
  
  try {
    // Connect to database
    const connected = await connectDB();
    
    if (!connected) {
      console.error('[PRODUCTS] Database not connected');
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please try again later.',
        products: []
      });
    }

    const Product = getProductModel();

    // Extract query parameters
    const {
      minPrice = 0,
      maxPrice = 100000,
      minRating = 0,
      search = '',
      page = 1,
      limit = 20,
      category = ''
    } = req.query;

    console.log('[PRODUCTS] Query params:', { minPrice, maxPrice, minRating, search, category });

    // Build filter
    const filter = {
      price: {
        $gte: Number(minPrice) || 0,
        $lte: Number(maxPrice) || 100000
      }
    };

    if (minRating && Number(minRating) > 0) {
      filter.rating = { $gte: Number(minRating) };
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (category && category.trim()) {
      filter.category = category.trim();
    }

    console.log('[PRODUCTS] Filter:', JSON.stringify(filter));

    // Pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    console.log('[PRODUCTS] Executing query...');
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
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
    } catch (err) {
      console.error('[PRODUCTS] Count error:', err.message);
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
      error: NODE_ENV === 'development' ? error.message : 'Internal server error',
      products: []
    });
  }
});

// GET single product
app.get('/api/products/:id', async (req, res) => {
  console.log('[PRODUCTS] GET /api/products/:id -', req.params.id);

  try {
    const connected = await connectDB();
    
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed'
      });
    }

    const Product = getProductModel();

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
      error: NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ========================================
// ERROR HANDLERS
// ========================================

// 404 handler
app.use((req, res) => {
  console.log('[404] Not found:', req.method, req.url);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.url
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  console.error('[ERROR] Stack:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ========================================
// EXPORT
// ========================================
module.exports = app;
