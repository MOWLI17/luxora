const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

console.log('[SERVER] Starting LUXORA Backend...');
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);

// ===== CORS =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

console.log('[CORS] Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

// ===== BODY & COOKIES =====
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// ===== DATABASE CONNECTION =====
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not defined in .env file');
  process.exit(1);
}

console.log('[DB] Connecting to MongoDB...');
console.log('[DB] URI:', MONGODB_URI.substring(0, 50) + '...');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🖥️  Host:', mongoose.connection.host);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed');
    console.error('Error:', err.message);
    console.log('⚠️  Continuing without database connection...');
  });

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected';
  
  res.json({
    success: true,
    message: 'LUXORA API is healthy',
    environment: process.env.NODE_ENV,
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 LUXORA API is running!',
    health: '/api/health',
    version: '1.0.0'
  });
});

// ===== ROUTES =====
console.log('[ROUTES] Registering API routes...');

app.use('/api/products', require('./routes/products'));
console.log('✅ Products routes registered');

try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ Auth routes registered');
} catch (e) {
  console.warn('⚠️  Auth routes not found');
}

try {
  app.use('/api/seller/auth', require('./routes/sellerAuth'));
  console.log('✅ Seller Auth routes registered');
} catch (e) {
  console.warn('⚠️  Seller Auth routes not found');
}

try {
  app.use('/api/cart', require('./routes/cart'));
  console.log('✅ Cart routes registered');
} catch (e) {
  console.warn('⚠️  Cart routes not found');
}

try {
  app.use('/api/wishlist', require('./routes/wishlist'));
  console.log('✅ Wishlist routes registered');
} catch (e) {
  console.warn('⚠️  Wishlist routes not found');
}

try {
  app.use('/api/orders', require('./routes/order'));
  console.log('✅ Orders routes registered');
} catch (e) {
  console.warn('⚠️  Orders routes not found');
}

try {
  app.use('/api/payment', require('./routes/payment'));
  console.log('✅ Payment routes registered');
} catch (e) {
  console.warn('⚠️  Payment routes not found');
}

try {
  app.use('/api/seller', require('./routes/seller'));
  console.log('✅ Seller routes registered');
} catch (e) {
  console.warn('⚠️  Seller routes not found');
}

try {
  app.use('/api/password', require('./routes/password'));
  console.log('✅ Password routes registered');
} catch (e) {
  console.warn('⚠️  Password routes not found');
}

try {
  app.use('/api/user', require('./routes/user'));
  console.log('✅ User routes registered');
} catch (e) {
  console.warn('⚠️  User routes not found');
}

// ===== 404 HANDLER =====
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// ===== GLOBAL ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { error: err.stack })
  });
});

// ===== LOCAL SERVER (DEV ONLY) =====
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
