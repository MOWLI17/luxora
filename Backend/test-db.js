// test-db.js - Run this locally to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('URI exists:', !!MONGODB_URI);
console.log('URI starts with:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'N/A');

async function testConnection() {
  try {
    console.log('\n🔄 Attempting to connect...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log('✅ Successfully connected to MongoDB!');
    console.log('📊 Connection details:');
    console.log('  - Host:', mongoose.connection.host);
    console.log('  - Database:', mongoose.connection.name);
    console.log('  - Ready State:', mongoose.connection.readyState);

    // Test Product model
    console.log('\n🔍 Testing Product model...');
    const Product = require('./models/Product');
    
    const count = await Product.countDocuments();
    console.log('✅ Product count:', count);

    if (count > 0) {
      const sample = await Product.findOne().lean();
      console.log('📦 Sample product:', sample ? sample.name : 'None');
    }

    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

testConnection();
