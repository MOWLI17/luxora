const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const Product = require('../models/product');
const User = require('../models/User');

const sampleProducts = [
  {
    name: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation and superior sound quality.",
    price: 299,
    originalPrice: 399,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    stock: 50,
    rating: 4.5,
    numReviews: 120,
    brand: "AudioTech",
    discount: 25
  },
  {
    name: "Smart Watch Pro",
    description: "Feature-rich smartwatch with health tracking, GPS, and long battery life.",
    price: 399,
    originalPrice: 499,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    stock: 30,
    rating: 4.7,
    numReviews: 85,
    brand: "TechWear",
    discount: 20
  },
  {
    name: "Designer Leather Jacket",
    description: "Premium genuine leather jacket with modern design and perfect fit.",
    price: 249,
    originalPrice: 349,
    category: "clothing",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5",
    stock: 25,
    rating: 4.6,
    numReviews: 65,
    brand: "StyleCo",
    discount: 29
  },
  {
    name: "Running Shoes Ultra",
    description: "Lightweight running shoes with superior cushioning and support.",
    price: 129,
    originalPrice: 179,
    category: "sports",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    stock: 100,
    rating: 4.8,
    numReviews: 200,
    brand: "SportMax",
    discount: 28
  },
  {
    name: "Minimalist Backpack",
    description: "Sleek and functional backpack perfect for daily commute or travel.",
    price: 79,
    originalPrice: 99,
    category: "accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
    stock: 75,
    rating: 4.4,
    numReviews: 95,
    brand: "UrbanGear",
    discount: 20
  },
  {
    name: "Luxury Skincare Set",
    description: "Complete skincare routine with natural ingredients and proven results.",
    price: 149,
    originalPrice: 199,
    category: "beauty",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571",
    stock: 60,
    rating: 4.7,
    numReviews: 110,
    brand: "GlowLux",
    discount: 25
  },
  {
    name: "Smart Home Hub",
    description: "Central control for all your smart home devices with voice control.",
    price: 199,
    originalPrice: 249,
    category: "electronics",
    image: "https://images.unsplash.com/photo-1558089687-5a37e62b2b5b",
    stock: 40,
    rating: 4.5,
    numReviews: 78,
    brand: "HomeTech",
    discount: 20
  },
  {
    name: "Yoga Mat Premium",
    description: "Eco-friendly yoga mat with excellent grip and cushioning.",
    price: 49,
    originalPrice: 69,
    category: "sports",
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f",
    stock: 150,
    rating: 4.6,
    numReviews: 145,
    brand: "ZenFit",
    discount: 29
  },
  {
    name: "Classic Cotton T-Shirt",
    description: "Comfortable everyday t-shirt made from 100% organic cotton.",
    price: 29,
    originalPrice: 39,
    category: "clothing",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    stock: 200,
    rating: 4.3,
    numReviews: 320,
    brand: "EcoWear",
    discount: 26
  },
  {
    name: "Coffee Table Book Collection",
    description: "Curated collection of inspiring photography and design books.",
    price: 89,
    originalPrice: 119,
    category: "books",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794",
    stock: 35,
    rating: 4.8,
    numReviews: 42,
    brand: "ArtPress",
    discount: 25
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxora-ecommerce';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');

    // Find or create a default seller
    let seller = await User.findOne({ email: 'seller@luxora.com' });

    if (!seller) {
      seller = await User.create({
        name: 'Default Seller',
        email: 'seller@luxora.com',
        mobile: '9876543210',
        password: 'Seller123!@#',
        role: 'seller',
        isActive: true
      });
      console.log('✅ Default seller created');
    } else {
      console.log('✅ Default seller already exists');
    }

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Add seller ID to products
    const productsWithSeller = sampleProducts.map(product => ({
      ...product,
      seller: seller._id,
      isActive: true
    }));

    // Insert products
    await Product.insertMany(productsWithSeller);
    console.log(`✅ ${productsWithSeller.length} products seeded successfully`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
    process.exit(1);
  }
}

// Run seeder
seedProducts();