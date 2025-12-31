// test-connection.js - Test MongoDB Connection
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://Ecom:Mowli12%40@ecom.pbem7rb.mongodb.net/luxora?retryWrites=true&w=majority&authSource=admin';

console.log('🔄 Testing MongoDB connection...');
console.log('URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Hide password

async function testConnection() {
  try {
    console.log('\n⏳ Connecting...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000
    });

    console.log('✅ Connection successful!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🖥️  Host:', mongoose.connection.host);
    console.log('📈 Ready State:', mongoose.connection.readyState);

    // Test querying products
    console.log('\n🔍 Testing Product collection...');
    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String,
      price: Number
    }));

    const count = await Product.countDocuments();
    console.log('📦 Total products:', count);

    if (count > 0) {
      const sample = await Product.findOne().lean();
      console.log('✨ Sample product:', {
        name: sample.name,
        price: sample.price
      });
    } else {
      console.log('⚠️  No products found in database');
    }

    console.log('\n✅ All tests passed!');

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Authentication issue - check username/password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 DNS issue - check cluster URL');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Timeout - check network/firewall');
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

testConnection();
