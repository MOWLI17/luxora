
// ============================================
// models/Order.js - ORDER MODEL
// ============================================
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        },
        quantity: Number,
        price: Number
      }
    ],
    totalPrice: Number,
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String
    },
    paymentMethod: {
      type: String,
      enum: ['credit-card', 'debit-card', 'upi', 'net-banking'],
      default: 'credit-card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    cancelReason: String,
    trackingNumber: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
