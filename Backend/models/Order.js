// models/Order.js - FIXED Order Model Schema
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  // ✅ FIXED: Changed from 'product' to 'productId' to match your routes
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  title: String,
  name: String,
  description: String
});

const orderSchema = new mongoose.Schema({
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Seller Information (optional, for future multi-vendor support)
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  },

  // ✅ FIXED: Changed from 'orderItems' to 'items' to match payment.js
  items: [orderItemSchema],
  
  // Amounts
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  
  shippingCost: {
    type: Number,
    default: 0
  },
  
  tax: {
    type: Number,
    default: 0
  },

  // Shipping Address
  shippingAddress: {
    fullName: String,
    address: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash on delivery', 'cod', 'stripe', 'paypal', 'credit card', 'debit card', 'upi', 'wallet'],
    default: 'cash on delivery'
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  
  transactionId: String,
  paymentIntentId: String,

  // Order Status
  status: {
    type: String,
    enum: ['pending', 'Pending', 'Processing', 'confirmed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'pending'
  },

  // ✅ ADDED: orderStatus (some routes use this instead of status)
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  // Tracking
  trackingNumber: String,
  trackingUrl: String,

  // Notes
  notes: String,
  cancelReason: String,

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  deliveredAt: Date,
  cancelledAt: Date

}, { 
  timestamps: true,
  // ✅ ADDED: This helps with populate issues
  strictPopulate: false 
});

// Indexes for better query performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ transactionId: 1 });

// Middleware to update updatedAt
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ ADDED: Virtual to sync status fields
orderSchema.pre('save', function(next) {
  // Sync status and orderStatus
  if (this.isModified('status') && !this.isModified('orderStatus')) {
    this.orderStatus = this.status.toLowerCase();
  }
  if (this.isModified('orderStatus') && !this.isModified('status')) {
    this.status = this.orderStatus.charAt(0).toUpperCase() + this.orderStatus.slice(1);
  }
  next();
});

// Method to calculate total with shipping and tax
orderSchema.methods.calculateTotal = function() {
  let itemsTotal = 0;
  this.items.forEach(item => {
    itemsTotal += item.price * item.quantity;
  });
  return itemsTotal + (this.shippingCost || 0) + (this.tax || 0);
};

// Static method to get user's orders
orderSchema.statics.getUserOrders = function(userId, limit = 10, skip = 0) {
  return this.find({ userId })
    .populate('items.productId', 'name description images price')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        avgOrderValue: { $avg: '$totalAmount' },
        statuses: { $push: '$status' }
      }
    }
  ]);
  return stats[0] || {};
};

module.exports = mongoose.model('Order', orderSchema);