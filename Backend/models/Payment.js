// ============================================
// models/Payment.js - PAYMENT MODEL
// ============================================
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: Number,
        currency: {
            type: String,
            default: 'INR'
        },
        paymentMethod: String,
        transactionId: String,
        status: {
            type: String,
            enum: ['pending', 'success', 'failed'],
            default: 'pending'
        },
        response: mongoose.Schema.Types.Mixed,
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);