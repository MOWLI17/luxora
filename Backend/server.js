// server.js - Main Entry Point (Vercel + Local)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

/* ============================
   ENVIRONMENT VALIDATION
============================ */
console.log('\n========== SERVER START ==========');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI preview:', process.env.MONGODB_URI?.substring(0, 25) + '...');
console.log('===================================\n');

if (!process.env.MONGODB_URI) {
  console.error('❌ FATAL: MONGODB_URI not found in environment variables');
  process.exit(1);
}

/* ============================
   CORS CONFIGURATION
============================ */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://luxora-take.vercel.app',
    'https://luxora-frontend.vercel.app',
    'https://luxora-git-main-mowli17s-projects.vercel.app', // Your current preview URL
    /\.vercel\.app$/ // All Vercel preview deployments
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
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/* ============================
   MONGODB CONNECTION (CACHED FOR VERCEL)
============================ */
let cachedConnection = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

async function connectDB() {
  // Return cached connection if valid
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('✅ Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    console.log(`🔄 Attempting MongoDB connection (Attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS})...`);
    console.log('URI starts with:', process.env.MONGODB_URI.substring(0, 30));

    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      socketKeepAliveMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority'
    });

    connectionAttempts = 0; // Reset on successful connection
    console.log('✅ MongoDB Connected Successfully');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🏠 Host:', mongoose.connection.host);

    return cachedConnection;
  } catch (error) {
    connectionAttempts++;
    console.error('❌ CRITICAL - MongoDB Connection Failed');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);

    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      console.warn(`⏳ Retrying in 2 seconds... (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectDB(); // Retry
    }

    throw error;
  }
}

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
  cachedConnection = null;
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

/* ============================
   HEALTH & DEBUG ROUTES
============================ */
app.get('/', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      message: 'LUXORA API Server Running',
      database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message,
      timestamp: new Date().toISOString()
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
      status: 'healthy',
      database: dbState === 1 ? 'Connected' : 'Disconnected',
      dbReadyState: dbState,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'Disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/debug', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  try {
    await connectDB();
  } catch (e) {
    console.error('Debug route: Could not connect to DB');
  }

  res.json({
    success: true,
    debug: {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      mongodbUriExists: !!process.env.MONGODB_URI,
      mongodbUriPrefix: process.env.MONGODB_URI?.substring(0, 20) + '...',
      mongoConnectionState: statusMap[dbStatus],
      mongoConnectionStateCode: dbStatus,
      mongoHost: mongoose.connection.host || 'Not connected',
      mongoDatabase: mongoose.connection.name || 'Not connected',
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      connectionAttempts: connectionAttempts,
      timestamp: new Date().toISOString()
    }
  });
});

/* ============================
   DATABASE CONNECTION MIDDLEWARE
============================ */
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ Database middleware error:', err.message);
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

/* ============================
   API ROUTES
============================ */
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/seller/auth', require('./routes/sellerauth'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/wishlist', require('./routes/wishlist'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/payment', require('./routes/payment'));
  app.use('/api/user', require('./routes/user'));
  app.use('/api/password', require('./routes/password'));

  console.log('✅ All routes registered successfully');
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
}

/* ============================
   404 HANDLER
============================ */
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /',
      'GET /api',
      'GET /api/health',
      'GET /api/debug',
      '/api/auth/*',
      '/api/products/*',
      '/api/seller/*',
      '/api/cart/*',
      '/api/orders/*',
      '/api/wishlist/*',
      '/api/payment/*'
    ],
    timestamp: new Date().toISOString()
  });
});

/* ============================
   GLOBAL ERROR HANDLER
============================ */
app.use((err, req, res, next) => {
  console.error('❌ UNHANDLED ERROR:', err.message);
  console.error('Stack:', err.stack);
  console.error('Route:', req.method, req.originalUrl);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      stack: err.stack
    } : undefined,
    timestamp: new Date().toISOString()
  });
});

/* ============================
   START SERVER (LOCAL ONLY)
============================ */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log('📝 API Documentation: http://localhost:' + PORT + '/api');
  });
}

// Export for Vercel
module.exports = app;