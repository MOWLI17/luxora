// models/Seller.js - FIXED (Using index: true in schema)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const sellerSchema = new mongoose.Schema({
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    index: true // FIXED: Added index directly to field
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number'],
    match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    index: true // FIXED: Added index directly to field
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },

  // Business Details
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required']
  },
  businessRegNumber: {
    type: String,
    trim: true
  },
  businessAddress: {
    type: String,
    required: [true, 'Business address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required']
  },
  country: {
    type: String,
    default: 'India'
  },

  // Tax Information (ENCRYPTED for security)
  taxId: {
    type: String,
    required: [true, 'Tax ID is required'],
    unique: true
    // Will be encrypted before saving
  },
  panNumber: {
    type: String,
    required: [true, 'PAN number is required'],
    unique: true,
    uppercase: true
    // Will be encrypted before saving
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
    // Will be encrypted before saving
  },

  // Bank Details (ENCRYPTED for security)
  bankName: {
    type: String,
    required: [true, 'Bank name is required']
  },
  accountHolderName: {
    type: String,
    required: [true, 'Account holder name is required']
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required']
    // Will be encrypted before saving
  },
  ifscCode: {
    type: String,
    required: [true, 'IFSC code is required'],
    uppercase: true
  },

  // Store Information
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true
  },
  storeDescription: {
    type: String,
    trim: true
  },
  productCategory: {
    type: String,
    required: [true, 'Product category is required']
  },
  returnPolicy: {
    type: String
  },
  shippingPolicy: {
    type: String
  },

  // System Fields
  role: {
    type: String,
    default: 'seller',
    index: true // FIXED: Added index for role filtering
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true // FIXED: Added index for active sellers
  },
  isApproved: {
    type: Boolean,
    default: false,
    index: true // FIXED: Added index for approval status
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // FIXED: Added index for date filtering
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// ========== ENCRYPTION/DECRYPTION METHODS ==========

/**
 * Generic encryption function for sensitive data
 * @param {string} data - Plain text data to encrypt
 * @returns {string} Encrypted data (iv:encryptedData)
 */
const encryptData = (data) => {
  if (!data) return '';
  
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Generate random IV
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
  
  // Encrypt
  let encrypted = cipher.update(data.toString(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return iv + encrypted data
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Generic decryption function for sensitive data
 * @param {string} encryptedData - Encrypted data (iv:encryptedData)
 * @returns {string} Plain text data
 */
const decryptData = (encryptedData) => {
  if (!encryptedData || !encryptedData.includes(':')) return '';
  
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    return '';
  }
};

// ========== MIDDLEWARE: Encrypt sensitive fields before saving ==========
sellerSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    // Encrypt account number if modified
    if (this.isModified('accountNumber') && this.accountNumber) {
      // Check if already encrypted (contains ':')
      if (!this.accountNumber.includes(':')) {
        this.accountNumber = encryptData(this.accountNumber);
      }
    }

    // Encrypt tax ID if modified
    if (this.isModified('taxId') && this.taxId) {
      if (!this.taxId.includes(':')) {
        this.taxId = encryptData(this.taxId);
      }
    }

    // Encrypt PAN number if modified
    if (this.isModified('panNumber') && this.panNumber) {
      if (!this.panNumber.includes(':')) {
        this.panNumber = encryptData(this.panNumber.toUpperCase());
      }
    }

    // Encrypt GST number if modified
    if (this.isModified('gstNumber') && this.gstNumber) {
      if (!this.gstNumber.includes(':')) {
        this.gstNumber = encryptData(this.gstNumber.toUpperCase());
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ========== INSTANCE METHODS ==========

// Compare password method
sellerSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get masked account number (last 4 digits)
sellerSchema.methods.getMaskedAccountNumber = function() {
  if (!this.accountNumber) return '';
  try {
    const decrypted = decryptData(this.accountNumber);
    return '****' + decrypted.slice(-4);
  } catch (error) {
    console.error('Error masking account number:', error.message);
    return '****';
  }
};

// Get decrypted account number (for internal use - bank transfers, etc.)
sellerSchema.methods.getDecryptedAccountNumber = function() {
  if (!this.accountNumber) return '';
  try {
    return decryptData(this.accountNumber);
  } catch (error) {
    console.error('Error decrypting account number:', error.message);
    return '';
  }
};

// Get masked tax ID (last 4 characters)
sellerSchema.methods.getMaskedTaxId = function() {
  if (!this.taxId) return '';
  try {
    const decrypted = decryptData(this.taxId);
    return '****' + decrypted.slice(-4);
  } catch (error) {
    console.error('Error masking tax ID:', error.message);
    return '****';
  }
};

// Get decrypted tax ID (for internal use - government submissions, etc.)
sellerSchema.methods.getDecryptedTaxId = function() {
  if (!this.taxId) return '';
  try {
    return decryptData(this.taxId);
  } catch (error) {
    console.error('Error decrypting tax ID:', error.message);
    return '';
  }
};

// Get masked PAN (last 4 characters)
sellerSchema.methods.getMaskedPan = function() {
  if (!this.panNumber) return '';
  try {
    const decrypted = decryptData(this.panNumber);
    return decrypted.slice(0, 5) + '****' + decrypted.slice(-1); // ABCDE****F format
  } catch (error) {
    console.error('Error masking PAN:', error.message);
    return '****';
  }
};

// Get decrypted PAN (for internal use)
sellerSchema.methods.getDecryptedPan = function() {
  if (!this.panNumber) return '';
  try {
    return decryptData(this.panNumber);
  } catch (error) {
    console.error('Error decrypting PAN:', error.message);
    return '';
  }
};

// Get masked GST (last 4 characters)
sellerSchema.methods.getMaskedGst = function() {
  if (!this.gstNumber) return '';
  try {
    const decrypted = decryptData(this.gstNumber);
    return '****' + decrypted.slice(-4);
  } catch (error) {
    console.error('Error masking GST:', error.message);
    return '****';
  }
};

// Get decrypted GST (for internal use)
sellerSchema.methods.getDecryptedGst = function() {
  if (!this.gstNumber) return '';
  try {
    return decryptData(this.gstNumber);
  } catch (error) {
    console.error('Error decrypting GST:', error.message);
    return '';
  }
};

// Get full seller info (public - with masked sensitive fields)
sellerSchema.methods.getPublicData = function() {
  return {
    _id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    businessName: this.businessName,
    businessType: this.businessType,
    businessAddress: this.businessAddress,
    city: this.city,
    state: this.state,
    zipCode: this.zipCode,
    storeName: this.storeName,
    storeDescription: this.storeDescription,
    productCategory: this.productCategory,
    // Bank details (masked)
    bankName: this.bankName,
    accountHolderName: this.accountHolderName,
    accountNumber: this.getMaskedAccountNumber(),
    ifscCode: this.ifscCode,
    // Tax details (masked)
    taxId: this.getMaskedTaxId(),
    panNumber: this.getMaskedPan(),
    gstNumber: this.getMaskedGst(),
    // Store status
    role: this.role,
    isApproved: this.isApproved,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Get full seller info (private - with decrypted sensitive fields for admin/internal use)
sellerSchema.methods.getPrivateData = function() {
  return {
    _id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    businessName: this.businessName,
    businessType: this.businessType,
    businessAddress: this.businessAddress,
    city: this.city,
    state: this.state,
    zipCode: this.zipCode,
    storeName: this.storeName,
    storeDescription: this.storeDescription,
    productCategory: this.productCategory,
    // Bank details (decrypted - for payments)
    bankName: this.bankName,
    accountHolderName: this.accountHolderName,
    accountNumber: this.getDecryptedAccountNumber(),
    ifscCode: this.ifscCode,
    // Tax details (decrypted - for government submissions)
    taxId: this.getDecryptedTaxId(),
    panNumber: this.getDecryptedPan(),
    gstNumber: this.getDecryptedGst(),
    // Store status
    role: this.role,
    isApproved: this.isApproved,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Seller', sellerSchema);