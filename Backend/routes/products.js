const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0,
    index: true
  },
  originalPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  discount: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  category: { 
    type: String, 
    required: true,
    index: true
  },
  images: { 
    type: [String], 
    default: ['https://via.placeholder.com/400'] 
  },
  stock: { 
    type: Number, 
    required: true, 
    min: 0, 
    default: 0 
  },
  brand: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5,
    index: true
  },
  numReviews: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Seller', 
    required: false
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', brand: 'text' });

module.exports = mongoose.model('Product', productSchema);
