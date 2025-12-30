import React from 'react'
import { useState } from 'react';
import { authService } from '../../Api/services';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../CssPages/Profilecss/ResetPassword.css'

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (!validatePassword(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, number and special character';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Link',
        text: 'Reset link is invalid. Please request a new password reset.',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('[RESET PASSWORD] Submitting password reset');

      const response = await authService.resetPassword(token, {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      console.log('[RESET PASSWORD] Success:', response);

      await Swal.fire({
        icon: 'success',
        title: 'Password Reset Successful!',
        text: 'Your password has been updated. Redirecting to login...',
        confirmButtonColor: '#6366f1',
        timer: 2000,
        timerProgressBar: true
      });

      setFormData({ newPassword: '', confirmPassword: '' });
      navigate('/login');

    } catch (error) {
      console.error('[RESET PASSWORD] Error:', error);

      let errorMessage = 'Failed to reset password. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid or expired reset link. Please request a new one.';
      } else if (!error.response) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
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

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '#e5e7eb' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&#]/.test(password)) strength++;

    const levels = [
      { text: 'Very Weak', color: '#ef4444' },
      { text: 'Weak', color: '#f59e0b' },
      { text: 'Fair', color: '#eab308' },
      { text: 'Good', color: '#84cc16' },
      { text: 'Strong', color: '#10b981' },
      { text: 'Very Strong', color: '#059669' },
    ];

    return { strength, ...(levels[Math.min(strength - 1, levels.length - 1)] || levels[0]) };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-header">
            <h1>🔐 Reset Password</h1>
            <p>Create a new password for your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="Create a strong password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.newPassword ? 'input-error' : ''}
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
              
              {formData.newPassword && (
                <div className="password-strength">
                  <div className="strength-bar-container">
                    <div 
                      className="strength-bar"
                      style={{
                        width: `${(passwordStrength.strength / 6) * 100}%`, 
                        backgroundColor: passwordStrength.color
                      }}
                    ></div>
                  </div>
                  <span className="strength-text" style={{ color: passwordStrength.color }}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}

              {errors.newPassword && (
                <div className="error-text">⚠️ {errors.newPassword}</div>
              )}

              <div className="password-requirements">
                <p className="req-title">Password must contain:</p>
                <ul>
                  <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                    {formData.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                    {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'} Uppercase letter (A-Z)
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                    {/[a-z]/.test(formData.newPassword) ? '✓' : '○'} Lowercase letter (a-z)
                  </li>
                  <li className={/[0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                    {/[0-9]/.test(formData.newPassword) ? '✓' : '○'} Number (0-9)
                  </li>
                  <li className={/[@$!%*?&#]/.test(formData.newPassword) ? 'valid' : ''}>
                    {/[@$!%*?&#]/.test(formData.newPassword) ? '✓' : '○'} Special character (@$!%*?&#)
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={errors.confirmPassword ? 'input-error' : ''}
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
              {errors.confirmPassword && (
                <div className="error-text">⚠️ {errors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? '⏳ Resetting Password...' : '✓ Reset Password'}
            </button>
          </form>

          <div className="footer">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="back-btn"
              disabled={loading}
            >
              ← Back to Login
            </button>
          </div>
        </div>

        <div className="security-badge">
          🔒 Your password is encrypted and secure
        </div>
      </div>
    </div>
  );
};

export default ResetPassword