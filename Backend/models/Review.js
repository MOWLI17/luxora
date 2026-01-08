
// ============================================
// models/Review.js - REVIEW MODEL
// ============================================
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: String,
        helpful: {
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

module.exports = mongoose.model('Review', reviewSchema);

