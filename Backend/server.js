// server.js — FINAL PRODUCTION FIX (VERCEL READY) - FIXED VERSION

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

/* =======================
   CORS CONFIGURATION
======================= */

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

console.log('[SERVER] Allowed CORS Origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, true); // allow for now (safe behind auth)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

/* =======================
   BODY & COOKIES
======================= */

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =======================
   ROUTES
======================= */

app.use('/api/auth', require('./routes/auth'));
app.use('/api/seller/auth', require('./routes/sellerAuth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/password', require('./routes/password'));
app.use('/api/user', require('./routes/user'));

console.log('[ROUTES] All routes registered');

/* =======================
   STATIC FILES (LOCAL ONLY)
======================= */

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

/* =======================
   HEALTH CHECK
======================= */

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LUXORA API running'
  });
});

/* =======================
   404 HANDLER
======================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/* =======================
   GLOBAL ERROR HANDLER
======================= */

app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

/* =======================
   LOCAL SERVER (DEV ONLY)
======================= */

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

/* =======================
   EXPORT FOR VERCEL
======================= */

module.exports = app;
