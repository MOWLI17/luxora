// routes/password.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

console.log('[ROUTES] Password routes loaded');

// Initialize nodemailer with error handling
let transporter = null;

try {
  const nodemailer = require('nodemailer');
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('[EMAIL] Email transporter configured');
  } else {
    console.warn('[EMAIL] Email credentials not configured - password reset emails will be disabled');
  }
} catch (error) {
  console.warn('[EMAIL] Nodemailer not available:', error.message);
}

// In-memory store for reset tokens
const resetTokens = new Map();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt) {
      resetTokens.delete(token);
    }
  }
}, 3600000);

// Helper function to send email
const sendResetEmail = async (email, name, resetUrl) => {
  if (!transporter) {
    console.log('[EMAIL] Email not configured, skipping email send');
    return true;
  }

  try {
    const mailOptions = {
      from: `"LUXORA Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - LUXORA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>We received a request to reset your password for your LUXORA account.</p>
              <p>Click the button below to reset your password:</p>
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link expires in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              <p>If you have any questions, contact our support team.</p>
              <p>Best regards,<br><strong>LUXORA Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} LUXORA. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] ✅ Email sent to:', email);
    return true;
  } catch (emailError) {
    console.error('[EMAIL] ❌ Email error:', emailError.message);
    return false;
  }
};

// @route   POST /api/password/forgot
// @desc    Send password reset email
// @access  Public
router.post('/forgot', async (req, res) => {
  try {
    console.log('\n[PASSWORD RESET] Forgot password request');
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      console.log('[PASSWORD RESET] User not found:', email);
      // Return success to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Store token with expiry (1 hour)
    resetTokens.set(hashedToken, {
      userId: user._id.toString(),
      email: user.email,
      expiresAt: Date.now() + 3600000
    });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Send email
    await sendResetEmail(user.email, user.name, resetUrl);

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('[PASSWORD RESET] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

// @route   POST /api/password/reset/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset/:token', async (req, res) => {
  try {
    console.log('\n[PASSWORD RESET] Reset password request');
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    // Validate input
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, number and special character'
      });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find token
    const tokenData = resetTokens.get(hashedToken);

    if (!tokenData) {
      console.log('[PASSWORD RESET] ❌ Invalid or expired token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.'
      });
    }

    // Check if token expired
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(hashedToken);
      console.log('[PASSWORD RESET] ❌ Token expired');
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired. Please request a new one.'
      });
    }

    // Find user
    const user = await User.findById(tokenData.userId);

    if (!user) {
      resetTokens.delete(hashedToken);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Delete used token
    resetTokens.delete(hashedToken);

    console.log('[PASSWORD RESET] ✅ Password reset successful for:', user.email);

    // Send confirmation email
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"LUXORA Support" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: 'Password Changed Successfully - LUXORA',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                <h1>✅ Password Changed</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>Your password has been successfully changed.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <p>Best regards,<br><strong>LUXORA Team</strong></p>
              </div>
            </div>
          `
        });
      } catch (emailError) {
        console.error('[EMAIL] Confirmation email error:', emailError.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('[PASSWORD RESET] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// @route   POST /api/password/change
// @desc    Change password (authenticated user)
// @access  Private
router.post('/change', protect, async (req, res) => {
  try {
    console.log('[PASSWORD CHANGE] Request for user:', req.userId);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const user = await User.findById(req.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('[PASSWORD CHANGE] ✅ Password changed for user:', req.userId);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('[PASSWORD CHANGE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;