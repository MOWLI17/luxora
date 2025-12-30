// server.js - Works locally AND on Vercel
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

dotenv.config();

const app = express();

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  // Add your production frontend URL
  'https://your-frontend.vercel.app'
].filter(Boolean);

console.log('[SERVER] Allowed CORS Origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== MONGODB CONNECTION ==========
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('[DB] Already connected');
    return;
  }

  try {
    console.log('[DB] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Connect DB immediately for serverless (optional: lazy connection per request)
connectDB();

// ========== IMPORT ROUTES ==========
const authRoutes = require('./routes/auth');
const sellerAuthRoutes = require('./routes/sellerAuth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const ordersRoutes = require('./routes/order');
const paymentRoutes = require('./routes/payment');
const sellerRoutes = require('./routes/seller');
const passwordRoutes = require('./routes/password');
const userRoutes = require('./routes/user');

// ========== REGISTER ROUTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/seller/auth', sellerAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/user', userRoutes);

console.log('[ROUTES] All routes registered');

// ========== STATIC FILES (Local Only) ==========
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LUXORA E-commerce API',
    docs: '/api/health'
  });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      '/api/health',
      '/api/auth/*',
      '/api/seller/*',
      '/api/products/*',
      '/api/cart/*',
      '/api/orders/*'
    ]
  });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ========== EXPORT FOR VERCEL ==========
module.exports = app;
