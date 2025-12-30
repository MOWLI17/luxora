// api/index.js - Vercel Serverless Entry Point - FIXED VERSION
const mongoose = require('mongoose');

// Import the Express app from server.js
const app = require('../server');

// Global connection cache for serverless
let cachedDb = null;

// Connect to MongoDB with caching for serverless
async function connectToDatabase() {
  // ✅ CRITICAL: Check cache state properly
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('[VERCEL] ✅ Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    console.log('[VERCEL] 🔄 Creating new MongoDB connection...');
    console.log('[VERCEL] URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    
    const opts = {
      serverSelectionTimeoutMS: 15000,      // ⬆️ INCREASED from 5000 (was too short)
      socketTimeoutMS: 45000,               // Socket stays open for 45s
      connectTimeoutMS: 15000,              // Initial connection timeout
      maxPoolSize: 5,                       // ⬇️ REDUCED from 10 (Vercel serverless limits)
      minPoolSize: 0,                       // ⬇️ CHANGED from 1 (don't keep idle connections on Vercel)
      maxIdleTimeMS: 60000,                 // Close idle connections after 60s
      family: 4,                            // ✅ Force IPv4 (Vercel compatibility)
      waitQueueTimeoutMS: 10000,            // ✅ Queue timeout for connection requests
      retryWrites: true,                    // ✅ Retry failed writes
      authSource: 'admin',                  // ✅ Specify auth database
    };

    const connection = await mongoose.connect(process.env.MONGODB_URI, opts);
    
    cachedDb = connection;
    console.log('[VERCEL] ✅ MongoDB connected successfully');
    console.log('[VERCEL] Connection State:', mongoose.connection.readyState);
    
    return cachedDb;
  } catch (error) {
    console.error('[VERCEL] ❌ MongoDB connection failed:', error.message);
    console.error('[VERCEL] Error Code:', error.code);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// Serverless function handler
module.exports = async (req, res) => {
  try {
    // ✅ CRITICAL: Connect to database before handling request
    console.log(`[VERCEL] ${req.method} ${req.url}`);
    
    await connectToDatabase();
    
    // Set serverless headers
    res.setHeader('X-Powered-By', 'Vercel');
    res.setHeader('X-Function-Region', process.env.VERCEL_REGION || 'unknown');
    
    // ✅ Handle the request with Express
    return app(req, res);
    
  } catch (error) {
    console.error('[VERCEL] ❌ Handler error:', error.message);
    console.error('[VERCEL] Stack:', error.stack);
    
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable - Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};
