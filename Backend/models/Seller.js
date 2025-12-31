const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 8
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['sole', 'partnership', 'pvt', 'llp'],
    default: 'sole'
  },
  businessAddress: String,
  city: String,
  state: String,
  zipCode: String,
  taxId: String,
  panNumber: String,
  gstNumber: String,
  bankName: String,
  accountNumber: String,
  ifscCode: String,
  accountHolderName: String,
  storeName: String,
  storeDescription: String,
  productCategory: String,
  role: {
    type: String,
    default: 'seller'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSales: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
sellerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
sellerSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get public data (without sensitive info)
sellerSchema.methods.getPublicData = function() {
  const seller = this.toObject();
  delete seller.password;
  delete seller.bankName;
  delete seller.accountNumber;
  delete seller.ifscCode;
  delete seller.panNumber;
  delete seller.gstNumber;
  return seller;
};

module.exports = mongoose.model('Seller', sellerSchema);
