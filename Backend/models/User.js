// models/User.js - FIXED (Removed duplicate indexes)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      index: true // FIXED: Use index: true instead of duplicate schema.index()
    },
    mobile: {
      type: String,
      required: [true, 'Please provide a mobile number'],
      unique: true,
      match: [/^\d{10}$/, 'Mobile must be exactly 10 digits'],
      index: true // FIXED: Use index: true instead of duplicate schema.index()
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'seller', 'admin'],
      default: 'user',
      index: true
    },
    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    profileImage: {
      type: String,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: {
      type: String,
      default: undefined
    },
    resetPasswordExpiry: {
      type: Date,
      default: undefined
    },
    lastLogin: Date,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// ======= PRE-SAVE MIDDLEWARE =======
// Hash password before saving if it's modified
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('[USER] Password hashed for:', this.email);
    next();
  } catch (error) {
    console.error('[ERROR] Password hashing error:', error.message);
    next(error);
  }
});

// ======= INSTANCE METHODS =======

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('[ERROR] Password comparison error:', error.message);
    throw error;
  }
};

// Get public user profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    mobile: this.mobile,
    role: this.role,
    address: this.address,
    profileImage: this.profileImage,
    isVerified: this.isVerified,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;