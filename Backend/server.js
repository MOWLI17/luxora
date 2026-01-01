// server.js - Main Entry Point (Local + Vercel Safe)

console.log('\n========== ENVIRONMENT VARIABLES DIAGNOSTIC ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('======================================================\n');

// Also add this route for debugging - PUT IT AFTER HEALTH CHECK ROUTE

app.get('/api/debug', (req, res) => {
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
      mongodbUriFirstChars: process.env.MONGODB_URI?.substring(0, 30) + '...',
      mongoConnectionState: statusText[dbStatus],
      mongoConnectionStateCode: dbStatus,
      mongoHost: mongoose.connection.host || 'Not connected',
      mongoDatabase: mongoose.connection.name || 'Not connected',
      frontendUrl: process.env.FRONTEND_URL,
      clientUrl: process.env.CLIENT_URL,
      timestamp: new Date().toISOString()
    }
  });
});
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

/* ============================
   CORS CONFIGURATION
============================ */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://luxora-frontend.vercel.app',
    'https://luxora-h8qumwleu-mowli17s-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ============================
   REQUEST LOGGING
============================ */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/* ============================
   MONGODB CONNECTION (CACHED)
============================ */
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) return cachedConnection;

  if (!process.env.MONGODB_URI) {
    throw new Error('❌ MONGODB_URI is not defined');
  }

  cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000
  });

  console.log('✅ MongoDB Connected');
  console.log('📦 Database:', mongoose.connection.name);

  return cachedConnection;
}

/* ============================
   HEALTH ROUTES
============================ */
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
    res.status(500).json({
      success: false,
      message: err.message
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
    res.json({
      success: true,
      status: 'ok',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      database: 'Disconnected',
      error: err.message
    });
  }
});

/* ============================
   CONNECT DB BEFORE ROUTES
============================ */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

/* ============================
   ROUTES
============================ */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/seller/auth', require('./routes/sellerAuth'));
app.use('/api/seller/auth/products', require('./routes/sellerProducts'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));

/* ============================
   404 HANDLER
============================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

/* ============================
   GLOBAL ERROR HANDLER
============================ */
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

/* ============================
   START SERVER (LOCAL ONLY)
============================ */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

