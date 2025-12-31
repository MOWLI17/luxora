// api/index.js - Bulletproof Vercel Entry Point
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

console.log('[SERVER] Starting Luxora API...');
console.log('[SERVER] Environment:', process.env.NODE_ENV);
console.log('[SERVER] MongoDB URI exists:', !!process.env.MONGODB_URI);

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================
// DATABASE CONNECTION (CACHED)
// ========================================
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('[DB] Using existing connection');
    return cachedConnection;
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('[DB] Connecting to MongoDB...');

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });

    cachedConnection = connection;
    console.log('[DB] ✅ Connected to:', connection.connection.name);
    return connection;

  } catch (error) {
    console.error('[DB] ❌ Connection failed:', error.message);
    cachedConnection = null;
    throw error;
  }
}

// ========================================
// TEST/HEALTH ROUTES
// ========================================

app.get('/api', (req, res) => {
  res.json({
    message: 'Luxora API is running',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    
    res.json({
      status: 'healthy',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      dbState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================
// MAIN ROUTES WITH SAFE LOADING
// ========================================

// Products route
app.use('/api/products', async (req, res, next) => {
  try {
    console.log('[ROUTE] /api/products called');
    await connectToDatabase();
    
    // Safely load the products router
    try {
      const productsRouter = require('../routes/products');
      productsRouter(req, res, next);
    } catch (err) {
      console.error('[ROUTE] Error loading products router:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Products route failed to load',
        error: err.message
      });
    }
  } catch (dbError) {
    console.error('[ROUTE] DB connection failed:', dbError.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: dbError.message
    });
  }
});

// Auth route (with fallback if file doesn't exist)
app.use('/api/auth', async (req, res, next) => {
  try {
    await connectToDatabase();
    try {
      const authRouter = require('../routes/auth');
      authRouter(req, res, next);
    } catch (err) {
      console.error('[ROUTE] Auth route not found:', err.message);
      return res.status(501).json({
        success: false,
        message: 'Auth endpoint not implemented yet'
      });
    }
  } catch (dbError) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

// Users route (with fallback)
app.use('/api/users', async (req, res, next) => {
  try {
    await connectToDatabase();
    try {
      const usersRouter = require('../routes/users');
      usersRouter(req, res, next);
    } catch (err) {
      console.error('[ROUTE] Users route not found:', err.message);
      return res.status(501).json({
        success: false,
        message: 'Users endpoint not implemented yet'
      });
    }
  } catch (dbError) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

// Orders route (with fallback)
app.use('/api/orders', async (req, res, next) => {
  try {
    await connectToDatabase();
    try {
      const ordersRouter = require('../routes/orders');
      ordersRouter(req, res, next);
    } catch (err) {
      console.error('[ROUTE] Orders route not found:', err.message);
      return res.status(501).json({
        success: false,
        message: 'Orders endpoint not implemented yet'
      });
    }
  } catch (dbError) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

// Sellers route (with fallback)
app.use('/api/sellers', async (req, res, next) => {
  try {
    await connectToDatabase();
    try {
      const sellersRouter = require('../routes/sellers');
      sellersRouter(req, res, next);
    } catch (err) {
      console.error('[ROUTE] Sellers route not found:', err.message);
      return res.status(501).json({
        success: false,
        message: 'Sellers endpoint not implemented yet'
      });
    }
  } catch (dbError) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

// ========================================
// ERROR HANDLERS
// ========================================

// 404 handler
app.use((req, res) => {
  console.log('[404] Route not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR] Global handler:', err.message);
  console.error('[ERROR] Stack:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ========================================
// EXPORT FOR VERCEL
// ========================================
module.exports = app;
