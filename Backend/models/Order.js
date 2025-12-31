const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  },
  items: [
    {
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
      title: String
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    phone: String
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash on delivery', 'cod', 'upi', 'wallet'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'cancelled'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    default: 'pending'
  },
  transactionId: String,
  cancelReason: String,
  cancelledAt: Date,
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
