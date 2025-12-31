// api/index.js - Emergency Ultra Simple Version
const express = require('express');
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

console.log('[API] Starting...');

// Test route
app.get('/api', (req, res) => {
  console.log('[API] Root endpoint hit');
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('[API] Health check');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Products endpoint - MOCK DATA
app.get('/api/products', (req, res) => {
  console.log('[API] Products endpoint hit');
  
  const mockProducts = [
    {
      _id: '1',
      name: 'Sample Product 1',
      description: 'This is a sample product',
      price: 99.99,
      originalPrice: 149.99,
      discount: 33,
      category: 'Electronics',
      images: ['https://via.placeholder.com/300'],
      stock: 50,
      brand: 'SampleBrand',
      rating: 4.5,
      numReviews: 100
    },
    {
      _id: '2',
      name: 'Sample Product 2',
      description: 'Another sample product',
      price: 149.99,
      originalPrice: 199.99,
      discount: 25,
      category: 'Fashion',
      images: ['https://via.placeholder.com/300'],
      stock: 30,
      brand: 'SampleBrand',
      rating: 4.0,
      numReviews: 50
    }
  ];

  res.json({
    success: true,
    products: mockProducts,
    pagination: {
      total: 2,
      page: 1,
      pages: 1,
      limit: 20
    }
  });
});

// Catch all 404
app.use((req, res) => {
  console.log('[404]', req.method, req.url);
  res.status(404).json({
    success: false,
    message: 'Not found',
    path: req.url
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: err.message
  });
});

module.exports = app;
