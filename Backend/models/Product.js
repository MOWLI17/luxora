// ============================================
// models/Product.js - PRODUCT MODEL
// ============================================
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: [true, 'Please provide price']
    },
    originalPrice: Number,
    category: {
      type: String,
      required: true
    },
    brand: String,
    images: [String],
    stock: {
      type: Number,
      default: 0
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    numReviews: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

// ============================================
// models/Cart.js - CART MODEL
// ============================================
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1
        },
        price: Number
      }
    ],
    total: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);

// ============================================
// models/Wishlist.js - WISHLIST MODEL
// ============================================
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
