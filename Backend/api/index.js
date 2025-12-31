// api/index.js - Vercel Serverless Entry Point (FIXED)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

console.log('[API] Initializing Vercel serverless function...');

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// DATABASE CONNECTION (SINGLETON)
// ========================================
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('[DB] ✅ Using cached database connection');
    return cachedDb;
  }

  try {
    console.log('[DB] Creating new database connection...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    };

    cachedDb = await mongoose.connect(process.env.MONGODB_URI, opts);
    console.log('[DB] ✅ MongoDB Connected');
    return cachedDb;
    
  } catch (error) {
    console.error('[DB] ❌ Connection Error:', error.message);
    cachedDb = null;
    throw error;
  }
};

// ========================================
// ROUTES WITH DB CONNECTION WRAPPER
// ========================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
});

// Root route
app.get('/api', (req, res) => {
  res.json({
    message: 'Luxora API',
    version: '1.0.0'
  });
});

// Products routes
const productsRouter = require('../routes/products');
app.use('/api/products', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('[API] DB Connection failed for /products');
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
}, productsRouter);

// Auth routes
const authRouter = require('../routes/auth');
app.use('/api/auth', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
}, authRouter);

// User routes
const userRouter = require('../routes/users');
app.use('/api/users', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
}, userRouter);

// Order routes
const orderRouter = require('../routes/orders');
app.use('/api/orders', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
}, orderRouter);

// Seller routes
const sellerRouter = require('../routes/sellers');
app.use('/api/sellers', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Database connection failed' });
  }
}, sellerRouter);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ========================================
// EXPORT FOR VERCEL
// ========================================
module.exports = app;
