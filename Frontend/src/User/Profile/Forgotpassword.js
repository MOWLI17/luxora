import React from 'react'
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../Api/services';
import Swal from 'sweetalert2';
import '../CssPages/Profilecss/ForgotPassword.css'

const Forgotpassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  
  const [step, setStep] = useState(token ? 'reset' : 'email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetData, setResetData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Validate email format
  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  // Validate password strength
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Required',
        text: 'Please enter your email address',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('[FORGOT PASSWORD] Sending reset link for:', email);
      
      const response = await authService.forgotPassword({ email: email.trim() });

      console.log('[FORGOT PASSWORD] Response:', response);

      await Swal.fire({
        icon: 'success',
        title: 'Email Sent!',
        html: `<p>Password reset link has been sent to:</p><p style="font-weight: 600; color: #10b981;">${email}</p><p>Please check your inbox and click the link to reset your password.</p>`,
        confirmButtonColor: '#6366f1',
        timer: 4000,
        showConfirmButton: true,
        timerProgressBar: true
      });

      setEmail('');
      navigate('/login');

    } catch (error) {
      console.error('[FORGOT PASSWORD] Error:', error);

      let errorMessage = 'Failed to process request. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'No user found with this email address.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid email address.';
      } else if (!error.response) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords
    if (!resetData.newPassword || !resetData.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please enter both password fields',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Passwords Do Not Match',
        text: 'Please ensure both passwords are the same',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    if (!validatePassword(resetData.newPassword)) {
      Swal.fire({
        icon: 'error',
        title: 'Weak Password',
        html: '<p>Password must contain:</p><ul style="text-align: left;"><li>✓ At least 8 characters</li><li>✓ 1 uppercase letter (A-Z)</li><li>✓ 1 lowercase letter (a-z)</li><li>✓ 1 number (0-9)</li><li>✓ 1 special character (@$!%*?&#)</li></ul>',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('[RESET PASSWORD] Submitting password reset');
      
      const response = await authService.resetPassword(token, {
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword
      });

      console.log('[RESET PASSWORD] Response:', response);

      await Swal.fire({
        icon: 'success',
        title: 'Password Reset Successful!',
        text: 'Your password has been updated. Redirecting to login...',
        confirmButtonColor: '#6366f1',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
      });

      setResetData({ newPassword: '', confirmPassword: '' });
      navigate('/login');

    } catch (error) {
      console.error('[RESET PASSWORD] Error:', error);

      let errorMessage = 'Failed to reset password. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired reset link. Please request a new one.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please request a new password reset.';
      } else if (!error.response) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          {step === 'email' ? (
            <>
              <div className="forgot-header">
                <h1>🔐 Forgot Password?</h1>
                <p>Don't worry, we'll help you reset it</p>
              </div>

              <form onSubmit={handleEmailSubmit}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="forgot-input"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`forgot-btn ${loading ? 'loading' : ''}`}
                >
                  {loading ? '⏳ Sending Reset Link...' : '📧 Send Reset Link'}
                </button>
              </form>

              <div className="forgot-footer">
                <p>
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="login-link"
                    disabled={loading}
                  >
                    Login here
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/User')}
                  className="back-home-btn"
                  disabled={loading}
                >
                  ← Back to Home
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="forgot-header">
                <h1>🔑 Reset Password</h1>
                <p>Enter your new password below</p>
              </div>

              <form onSubmit={handleResetSubmit}>
                <div className="form-group">
                  <label>New Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={resetData.newPassword}
                      onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                      disabled={loading}
                      className="forgot-input"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="eye-btn"
                      disabled={loading}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <div className="password-requirements">
                    <p className="req-title">Password must contain:</p>
                    <ul>
                      <li>✓ At least 8 characters</li>
                      <li>✓ Uppercase letter (A-Z)</li>
                      <li>✓ Lowercase letter (a-z)</li>
                      <li>✓ Number (0-9)</li>
                      <li>✓ Special character (@$!%*?&#)</li>
                    </ul>
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={resetData.confirmPassword}
                      onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                      disabled={loading}
                      className="forgot-input"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="eye-btn"
                      disabled={loading}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`forgot-btn ${loading ? 'loading' : ''}`}
                >
                  {loading ? '⏳ Resetting Password...' : '✓ Reset Password'}
                </button>
              </form>

              <div className="forgot-footer">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="back-home-btn"
                  disabled={loading}
                >
                  ← Back to Login
                </button>
              </div>
            </>
          )}
        </div>

        <div className="security-badge">
          🔒 Your information is secure and encrypted
        </div>
      </div>
    </div>
  );
};
export default Forgotpassword