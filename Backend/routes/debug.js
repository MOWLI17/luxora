// routes/debug.js - Add this to diagnose connection issues

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

/* ========================
   HEALTH CHECK ENDPOINT
======================== */

router.get('/health', (req, res) => {
  try {
    const states = {
      0: 'Disconnected',
      1: '✅ Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };

    const dbState = mongoose.connection.readyState;
    const isConnected = dbState === 1;

    console.log('[DEBUG] Health check - DB State:', dbState, states[dbState]);

    res.json({
      success: true,
      status: 'API is running',
      database: {
        connected: isConnected,
        state: dbState,
        stateDescription: states[dbState],
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'N/A'
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DEBUG] Health check error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/* ========================
   DB CONNECTION TEST
======================== */

router.get('/db-test', async (req, res) => {
  try {
    console.log('[DEBUG] Testing database connection...');

    const dbState = mongoose.connection.readyState;
    
    if (dbState !== 1) {
      console.error('[DEBUG] ❌ Database not connected. State:', dbState);
      return res.status(503).json({
        success: false,
        message: 'Database not connected',
        state: dbState
      });
    }

    // Try to run a simple admin command
    try {
      const admin = mongoose.connection.db.admin();
      const status = await admin.ping();
      
      console.log('[DEBUG] ✅ MongoDB ping successful');

      res.json({
        success: true,
        message: 'Database connection successful',
        ping: status,
        connection: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState
        }
      });
    } catch (pingError) {
      console.error('[DEBUG] ❌ Ping failed:', pingError.message);
      throw pingError;
    }

  } catch (error) {
    console.error('[DEBUG] ❌ DB test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
});

/* ========================
   ENVIRONMENT VARIABLES
======================== */

router.get('/env', (req, res) => {
  try {
    // Don't expose actual secrets, just check if they exist
    const mongoUri = process.env.MONGODB_URI;
    const jwtSecret = process.env.JWT_SECRET;

    res.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: mongoUri ? '✅ Set' : '❌ Not set',
        JWT_SECRET: jwtSecret ? '✅ Set' : '❌ Not set',
        FRONTEND_URL: process.env.FRONTEND_URL || 'Not set',
        CLIENT_URL: process.env.CLIENT_URL || 'Not set'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking environment'
    });
  }
});

/* ========================
   MODELS CHECK
======================== */

router.get('/models', (req, res) => {
  try {
    const models = Object.keys(mongoose.modelNames ? mongoose.modelNames() : {});
    
    console.log('[DEBUG] Registered models:', models);

    res.json({
      success: true,
      registeredModels: models,
      modelCount: models.length,
      connection: {
        readyState: mongoose.connection.readyState,
        connected: mongoose.connection.readyState === 1
      }
    });
  } catch (error) {
    console.error('[DEBUG] ❌ Models check failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error checking models',
      error: error.message
    });
  }
});

module.exports = router;
