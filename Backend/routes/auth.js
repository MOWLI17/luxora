// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { protect, authorize } = require('../middleware/auth');

console.log('[ROUTES] Auth routes loaded');

// ======= JWT TOKEN GENERATOR =======
const generateToken = (id, type = 'user') => {
  return jwt.sign(
    { id, type },
    process.env.JWT_SECRET || 'your_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ======= EMAIL TRANSPORTER =======
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ======= VALIDATION HELPERS =======
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateMobile = (mobile) => {
  const mobileRegex = /^\d{10}$/;
  return mobileRegex.test(mobile);
};

// ======= REGISTER ROUTE =======
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('[AUTH] Processing registration request...');
    
    const { name, email, mobile, password, address } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, mobile, password'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate mobile format
    if (!validateMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { mobile }
      ]
    });

    if (existingUser) {
      console.log('[AUTH] User already exists:', existingUser.email || existingUser.mobile);
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Mobile number already registered'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      password,
      role: 'user',
      isActive: true,
      address: address || {}
    });

    // Save user (password will be hashed by pre-save middleware)
    await user.save();

    console.log('[AUTH] User registered successfully:', user._id);

    // Generate token
    const token = generateToken(user._id, 'user');

    // Prepare user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      address: user.address,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('[AUTH] Register error:', error.message);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

// ======= LOGIN ROUTE =======
// @route   POST /api/auth/login
// @desc    Login user with email or mobile
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log('[AUTH] Processing login request...');
    
    const { emailOrMobile, password } = req.body;

    // Validate required fields
    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password'
      });
    }

    // Find user by email or mobile (include password field)
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    }).select('+password');

    if (!user) {
      console.log('[AUTH] User not found:', emailOrMobile);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('[AUTH] Inactive user attempt:', user._id);
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Compare passwords
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      console.log('[AUTH] Wrong password for user:', emailOrMobile);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('[AUTH] Login successful for user:', user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, 'user');

    // Prepare user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      address: user.address
    };

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('[AUTH] Login error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

// ======= LOGOUT ROUTE =======
// @route   POST /api/auth/logout
// @desc    Logout user (client clears token)
// @access  Private
router.post('/logout', protect, (req, res) => {
  console.log('[AUTH] User logged out:', req.userId);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ======= GET PROFILE ROUTE =======
// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('[AUTH] Fetching profile for user:', req.userId);

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          address: user.address,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('[AUTH] Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch profile'
    });
  }
});

// ======= UPDATE PROFILE ROUTE =======
// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    console.log('[AUTH] Updating profile for user:', req.userId);

    const { name, email, mobile, address } = req.body;

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate mobile if provided
    if (mobile && !validateMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    // Check if email/mobile already exists (excluding current user)
    if (email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.userId }
      });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    if (mobile) {
      const mobileExists = await User.findOne({
        mobile,
        _id: { $ne: req.userId }
      });
      if (mobileExists) {
        return res.status(409).json({
          success: false,
          message: 'Mobile number already in use'
        });
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (mobile) updateData.mobile = mobile;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('[AUTH] Profile updated for user:', req.userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          address: user.address
        }
      }
    });

  } catch (error) {
    console.error('[AUTH] Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile'
    });
  }
});

// ======= DELETE ACCOUNT ROUTE =======
// @route   DELETE /api/auth/profile
// @desc    Delete user account
// @access  Private
router.delete('/profile', protect, async (req, res) => {
  try {
    console.log('[AUTH] Deleting account for user:', req.userId);

    await User.findByIdAndDelete(req.userId);

    console.log('[AUTH] Account deleted for user:', req.userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('[AUTH] Delete account error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete account'
    });
  }
});

// ======= FORGOT PASSWORD ROUTE =======
// @route   POST /api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('[AUTH] Forgot password request...');

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry (30 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiry = Date.now() + 30 * 60 * 1000;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'LUXORA - Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetUrl}</p>
        <p><strong>This link expires in 30 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log('[AUTH] Password reset email sent to:', email);

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('[AUTH] Forgot password error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send reset email'
    });
  }
});

// ======= RESET PASSWORD ROUTE =======
// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    console.log('[AUTH] Processing password reset...');

    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password and confirm password'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    console.log('[AUTH] Password reset successful for user:', user._id);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('[AUTH] Reset password error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reset password'
    });
  }
});

// ======= CHANGE PASSWORD ROUTE =======
// @route   POST /api/auth/change-password
// @desc    Change password for authenticated user
// @access  Private
router.post('/change-password', protect, async (req, res) => {
  try {
    console.log('[AUTH] Changing password for user:', req.userId);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    // Verify current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('[AUTH] Password changed for user:', req.userId);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('[AUTH] Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
});

module.exports = router;