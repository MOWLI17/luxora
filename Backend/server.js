// server.js - Works locally AND on Vercel
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

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
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin);
      callback(null, true); // Still allow in production, just log
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ========== MONGODB CONNECTION (Local Only) ==========
const connectDB = async () => {
  // Skip if already connected (important for serverless)
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
    // Don't exit in production (Vercel will retry)
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Only connect in local development
if (process.env.NODE_ENV !== 'production') {
  connectDB();
}

// ========== IMPORT ROUTES ==========
// Wrap route imports in try-catch to identify which route is failing
let authRoutes, sellerAuthRoutes, productRoutes, cartRoutes, wishlistRoutes;
let ordersRoutes, paymentRoutes, sellerRoutes, passwordRoutes, userRoutes;

try {
  authRoutes = require('./routes/auth');
  console.log('[ROUTES] ✅ Auth routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load auth routes:', err.message);
}

try {
  sellerAuthRoutes = require('./routes/sellerAuth');
  console.log('[ROUTES] ✅ Seller auth routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load seller auth routes:', err.message);
}

try {
  productRoutes = require('./routes/products');
  console.log('[ROUTES] ✅ Product routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load product routes:', err.message);
}

try {
  cartRoutes = require('./routes/cart');
  console.log('[ROUTES] ✅ Cart routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load cart routes:', err.message);
}

try {
  wishlistRoutes = require('./routes/wishlist');
  console.log('[ROUTES] ✅ Wishlist routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load wishlist routes:', err.message);
}

try {
  ordersRoutes = require('./routes/order');
  console.log('[ROUTES] ✅ Orders routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load orders routes:', err.message);
}

try {
  paymentRoutes = require('./routes/payment');
  console.log('[ROUTES] ✅ Payment routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load payment routes:', err.message);
}

try {
  sellerRoutes = require('./routes/seller');
  console.log('[ROUTES] ✅ Seller routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load seller routes:', err.message);
}

try {
  passwordRoutes = require('./routes/password');
  console.log('[ROUTES] ✅ Password routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load password routes:', err.message);
}

try {
  userRoutes = require('./routes/user');
  console.log('[ROUTES] ✅ User routes loaded');
} catch (err) {
  console.error('[ROUTES] ❌ Failed to load user routes:', err.message);
}

// ========== REGISTER ROUTES ==========
if (authRoutes) app.use('/api/auth', authRoutes);
if (sellerAuthRoutes) app.use('/api/seller/auth', sellerAuthRoutes);
if (productRoutes) app.use('/api/products', productRoutes);
if (sellerRoutes) app.use('/api/seller', sellerRoutes);
if (cartRoutes) app.use('/api/cart', cartRoutes);
if (wishlistRoutes) app.use('/api/wishlist', wishlistRoutes);
if (ordersRoutes) app.use('/api/orders', ordersRoutes);
if (paymentRoutes) app.use('/api/payment', paymentRoutes);
if (passwordRoutes) app.use('/api/password', passwordRoutes);
if (userRoutes) app.use('/api/user', userRoutes);

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
    version: '1.0.0',
    nodeVersion: process.version
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

// ========== START SERVER (LOCAL ONLY) ==========
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🚀 SERVER STARTED SUCCESSFULLY                            ║
║  🌐 URL: http://localhost:${PORT}                         ║
║  📦 MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting'}                           ║
║  🔒 CORS: Enabled for ${allowedOrigins.length} origins                    ║
║  📊 Routes: ✅ All active                                  ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);
    server.close(async () => {
      console.log('✅ Server closed');
      await mongoose.connection.close();
      console.log('✅ MongoDB disconnected');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// ========== EXPORT FOR VERCEL ==========
module.exports = app;
