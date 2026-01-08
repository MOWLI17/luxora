// netlify/functions/api.js - Netlify Serverless Function Entry Point
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS Configuration
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://luxora-take.vercel.app',
        'https://luxora-frontend.vercel.app',
        /\.vercel\.app$/,
        /\.netlify\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection (Cached for Serverless)
let cachedConnection = null;

async function connectDB() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI not configured');
    }

    try {
        cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Connected');
        return cachedConnection;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        throw error;
    }
}

// Request Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'LUXORA E-commerce API (Netlify)',
        docs: '/api/health'
    });
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
            status: 'healthy',
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            database: 'Disconnected',
            error: err.message
        });
    }
});

// Connect DB Middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(503).json({
            success: false,
            message: 'Database connection failed',
            error: err.message
        });
    }
});

// Load Routes
try {
    app.use('/api/auth', require('../../routes/auth'));
    app.use('/api/products', require('../../routes/products'));
    app.use('/api/seller/auth', require('../../routes/sellerauth'));
    app.use('/api/cart', require('../../routes/cart'));
    app.use('/api/wishlist', require('../../routes/wishlist'));
    app.use('/api/orders', require('../../routes/orders'));
    app.use('/api/payment', require('../../routes/payment'));
    app.use('/api/user', require('../../routes/user'));
    app.use('/api/password', require('../../routes/password'));
    console.log('✅ All routes loaded');
} catch (err) {
    console.error('❌ Error loading routes:', err.message);
}

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Export for Netlify
module.exports.handler = serverless(app);
