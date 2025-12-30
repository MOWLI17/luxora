// api/index.js - Vercel Serverless Entry Point
const mongoose = require('mongoose');

// Import the Express app from server.js
const app = require('../server');

// Global connection cache for serverless
let cachedDb = null;

// Connect to MongoDB with caching for serverless
async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('[VERCEL] Using cached MongoDB connection');
    return cachedDb;
  }

  try {
    console.log('[VERCEL] Creating new MongoDB connection...');
    
    const opts = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Connection pooling for serverless
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 10000,
    };

    await mongoose.connect(process.env.MONGODB_URI, opts);
    
    cachedDb = mongoose.connection;
    console.log('[VERCEL] ✅ MongoDB connected');
    
    return cachedDb;
  } catch (error) {
    console.error('[VERCEL] ❌ MongoDB connection error:', error.message);
    throw error;
  }
}

// Serverless function handler
module.exports = async (req, res) => {
  try {
    // Connect to database before handling request
    await connectToDatabase();
    
    // Set serverless headers
    res.setHeader('X-Powered-By', 'Vercel');
    
    // Handle the request with Express
    return app(req, res);
  } catch (error) {
    console.error('[VERCEL] Handler error:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};