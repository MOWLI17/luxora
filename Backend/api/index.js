const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

/* =======================
   CORS
======================= */
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/* =======================
   DATABASE (CACHED)
======================= */
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection) return cachedConnection;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not found');
  }

  cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000
  });

  console.log('✅ MongoDB Connected');
  return cachedConnection;
}

/* =======================
   PRODUCT MODEL (SAFE)
======================= */
const productSchema = new mongoose.Schema({}, { strict: false });
const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

/* =======================
   HEALTH CHECK
======================= */
app.get('/api/health', async (req, res) => {
  try {
    await connectDB();
    res.json({
      success: true,
      status: 'API running',
      database: 'connected',
      time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* =======================
   PRODUCTS API
======================= */
app.get('/api/products', async (req, res) => {
  try {
    await connectDB();

    const minPrice = Number(req.query.minPrice) || 0;
    const maxPrice = Number(req.query.maxPrice) || 1000000;
    const minRating = Number(req.query.minRating) || 0;
    const search = req.query.search?.trim();

    const query = {
      price: { $gte: minPrice, $lte: maxPrice },
      rating: { $gte: minRating }
    };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query).lean();

    res.json({
      success: true,
      products,
      total: products.length
    });

  } catch (err) {
    console.error('❌ Products error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

/* =======================
   ROOT
======================= */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Luxora Backend API is running'
  });
});

module.exports = app;
