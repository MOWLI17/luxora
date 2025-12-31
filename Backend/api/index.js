// api/index.js - Vercel Serverless Entry Point
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

console.log('[API] Initializing Vercel serverless function...');
console.log('[API] NODE_ENV:', process.env.NODE_ENV);
console.log('[API] MongoDB URI exists:', !!process.env.MONGODB_URI);

// ========================================
// MIDDLEWARE
// ========================================
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://luxora-frontend.vercel.app',
    'https://luxora-156o9ckdd-mowli17s-projects.vercel.app',
    /^https:\/\/luxora-.*\.vercel\.app$/
  ],
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
// DATABASE CONNECTION
// ========================================
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('[DB] Using existing database connection');
    return;
  }

  try {
    console.log('[DB] Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
      w: 'majority'
    });

    isConnected = true;
    console.log('[DB] ✅ MongoDB Connected:', conn.connection.host);
    console.log('[DB] Database:', conn.connection.name);
    
  } catch (error) {
    console.error('[DB] ❌ MongoDB Connection Error:', error.message);
    console.error('[DB] Stack:', error.stack);
    isConnected = false;
    throw error;
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('[DB] Mongoose connected to MongoDB');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('[DB] Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('[DB] Mongoose disconnected');
  isConnected = false;
});

// ========================================
// ROUTES
// ========================================

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbState: mongoose.connection.readyState,
    environment: process.env.NODE_ENV
  });
});

// Root route
app.get('/api', (req, res) => {
  res.json({
    message: 'Luxora API is running',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      auth: '/api/auth',
      users: '/api/users',
      orders: '/api/orders',
      sellers: '/api/sellers'
    }
  });
});

// Import routes (lazy loaded after DB connection)
app.use('/api/products', async (req, res, next) => {
  try {
    await connectDB();
    const productRoutes = require('../routes/products');
    productRoutes(req, res, next);
  } catch (error) {
    console.error('[API] Error loading products route:', error);
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.use('/api/auth', async (req, res, next) => {
  try {
    await connectDB();
    const authRoutes = require('../routes/auth');
    authRoutes(req, res, next);
  } catch (error) {
    res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

app.use('/api/users', async (req, res, next) => {
  try {
    await connectDB();
    const userRoutes = require('../routes/users');
    userRoutes(req, res, next);
  } catch (error) {
    res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

app.use('/api/orders', async (req, res, next) => {
  try {
    await connectDB();
    const orderRoutes = require('../routes/orders');
    orderRoutes(req, res, next);
  } catch (error) {
    res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

app.use('/api/sellers', async (req, res, next) => {
  try {
    await connectDB();
    const sellerRoutes = require('../routes/sellers');
    sellerRoutes(req, res, next);
  } catch (error) {
    res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  console.log('[API] 404 Not Found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[API] ❌ Global Error:', err.message);
  console.error('[API] Stack:', err.stack);

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
