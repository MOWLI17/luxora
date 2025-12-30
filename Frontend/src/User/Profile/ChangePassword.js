import React from 'react'
import { useState } from 'react';
import { authService } from '../../Api/services';
import { useNavigate } from 'react-router-dom';
import '../CssPages/Profilecss/ChangePassword.css'

import Swal from 'sweetalert2';
const ChangePassword = () => {
    const navigate = useNavigate();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
      currentPassword: '',
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
      
      // Clear error for this field
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    };
  
    const validateForm = () => {
      const newErrors = {};
  
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
  
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (!validatePassword(formData.newPassword)) {
        newErrors.newPassword = 'Password must contain uppercase, lowercase, number and special character';
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
  
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
  
      if (formData.currentPassword === formData.newPassword) {
        newErrors.newPassword = 'New password must be different from current password';
      }
  
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
  
      if (!validateForm()) {
        return;
      }
  
      setLoading(true);
  
      try {
        console.log('[CHANGE PASSWORD] Submitting password change');
  
        const response = await authService.changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        });
  
        console.log('[CHANGE PASSWORD] Success:', response);
  
        await Swal.fire({
          icon: 'success',
          title: 'Password Changed!',
          text: 'Your password has been updated successfully.',
          confirmButtonColor: '#6366f1',
          timer: 2000,
          timerProgressBar: true
        });
  
        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
  
        // Redirect to profile
        navigate('/profile');
  
      } catch (error) {
        console.error('[CHANGE PASSWORD] Error:', error);
  
        let errorMessage = 'Failed to change password. Please try again.';
  
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 401) {
          errorMessage = 'Current password is incorrect';
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
      <div className="change-password-page">
        <div className="change-password-container">
          <div className="change-password-card">
            <div className="change-password-header">
              <h1>🔐 Change Password</h1>
              <p>Update your account password</p>
            </div>
  
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Current Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.currentPassword ? 'input-error' : ''}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="eye-btn"
                    disabled={loading}
                  >
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.currentPassword && (
                  <div className="error-text">⚠️ {errors.currentPassword}</div>
                )}
              </div>
  
              <div className="form-group">
                <label>New Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
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
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="eye-btn"
                    disabled={loading}
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
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
                <label>Confirm New Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
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
  
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => navigate('/User/Profile')}
                  className="cancel-btn"
                  disabled={loading}
                >
                  ← Back to Profile
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                >
                  {loading ? '⏳ Changing Password...' : '✓ Change Password'}
                </button>
              </div>
            </form>
  
            <div className="security-tips">
              <h4>💡 Security Tips:</h4>
              <ul>
                <li>Use a unique password you don't use elsewhere</li>
                <li>Change your password regularly</li>
                <li>Don't share your password with anyone</li>
                <li>Enable two-factor authentication for extra security</li>
              </ul>
            </div>
          </div>
  
          <div className="security-badge">
            🔒 Your password is encrypted and secure
          </div>
        </div>
      </div>
    );
  };
export default ChangePassword