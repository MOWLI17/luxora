// ============================================
// models/Seller.js - SELLER MODEL
// ============================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sellerSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: [true, 'Please provide business name'],
      trim: true
    },
    businessType: {
      type: String,
      enum: ['Individual', 'Partnership', 'Company']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false
    },
    mobile: String,
    businessLicense: String,
    GST: String,
    bankAccount: {
      accountNumber: String,
      accountHolder: String,
      bankName: String,
      IFSC: String
    },
    verified: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 0
    },
    totalSales: {
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

sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

sellerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

sellerSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = mongoose.model('Seller', sellerSchema);

