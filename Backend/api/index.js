// api/index.js - Vercel Serverless Entry Point
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

console.log('\n========== API START ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('================================\n');

/* =======================
   CORS - ALLOW YOUR FRONTEND
======================= */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://luxora-take.vercel.app',
    'https://luxora-frontend.vercel.app',
    /\.vercel\.app$/ // Allow all vercel preview deployments
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* =======================
   REQUEST LOGGING
======================= */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* =======================
   DATABASE (CACHED)
======================= */
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    throw new Error('MONGODB_URI not found in environment variables');
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('Connection string starts with:', process.env.MONGODB_URI.substring(0, 20));

    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB Connected');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🏠 Host:', mongoose.connection.host);

    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

/* =======================
   HEALTH & DEBUG ROUTES
======================= */
app.get('/', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: 'LUXORA API Server Running',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({
      success: false,
      message: err.message,
      database: 'Disconnected'
    });
  }
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    const dbState = mongoose.connection.readyState;
    res.json({
      success: true,
      status: 'ok',
      database: dbState === 1 ? 'Connected' : 'Disconnected',
      dbState: dbState,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({
      success: false,
      database: 'Disconnected',
      error: err.message
    });
  }
});

app.get('/api/debug', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    success: true,
    debug: {
      nodeEnv: process.env.NODE_ENV,
      mongodbUriExists: !!process.env.MONGODB_URI,
      mongodbUriPrefix: process.env.MONGODB_URI?.substring(0, 20) + '...',
      mongoConnectionState: statusText[dbStatus],
      mongoConnectionStateCode: dbStatus,
      mongoHost: mongoose.connection.host || 'Not connected',
      mongoDatabase: mongoose.connection.name || 'Not connected',
      timestamp: new Date().toISOString()
    }
  });
});

/* =======================
   CONNECT DB MIDDLEWARE
======================= */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Database connection failed in middleware:', err.message);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message
    });
  }
});

/* =======================
   API ROUTES - FIXED
======================= */
try {
  // Use require with relative paths
  const authRoutes = require('../routes/auth');
  const productsRoutes = require('../routes/products');
  const sellerAuthRoutes = require('../routes/sellerauth');
  const cartRoutes = require('../routes/cart');
  const wishlistRoutes = require('../routes/wishlist');
  const ordersRoutes = require('../routes/orders');
  const paymentRoutes = require('../routes/payment');
  const userRoutes = require('../routes/user');
  const passwordRoutes = require('../routes/password');

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/seller/auth', sellerAuthRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/password', passwordRoutes);

  console.log('✅ All routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
  console.error('Stack:', err.stack);
}

/* =======================
   404 HANDLER WITH DETAILED INFO
======================= */
app.use((req, res) => {
  const availableRoutes = [
    '/api/health',
    '/api/debug',
    '/api/auth/*',
    '/api/seller/*',
    '/api/products/*',
    '/api/cart/*',
    '/api/orders/*',
    '/api/wishlist/*',
    '/api/payment/*'
  ];

  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: availableRoutes
  });
});

/* =======================
   GLOBAL ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  console.error('Stack:', err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

/* =======================
   EXPORT FOR VERCEL
======================= */
module.exports = app;