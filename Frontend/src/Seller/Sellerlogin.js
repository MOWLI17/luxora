import React from 'react'
import { useState } from 'react';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_URL } from '../Config/config';
import './CssPage/SellerLogin.css';



const Sellerlogin = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear API error
    if (apiError) {
      setApiError('');
    }
  };

  // Handle API response
  const handleResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || `Server Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    if (data.success === false) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    setApiError('');

    // Validate inputs
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      console.log('[AUTH] Starting seller login...');
      console.log('[AUTH] API_URL from config:', API_URL);

      // ✅ FIXED: Changed from /api/seller/login to /api/seller/auth/login
      const loginUrl = `${API_URL}/seller/auth/login`;
      console.log('[AUTH] Full login endpoint:', loginUrl);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      console.log('[AUTH] Response status:', response.status);

      const data = await handleResponse(response);

      console.log('[SUCCESS] Login response:', data);

      if (!data.token) {
        throw new Error('No token received from server');
      }

      if (!data.seller && !data.user) {
        throw new Error('No seller/user data received from server');
      }

      const seller = data.seller || data.user;
      const token = data.token;

      console.log('[SUCCESS] Seller login successful:', seller.email);

      // Save token and seller data
      localStorage.setItem('sellerToken', token);
      localStorage.setItem('seller', JSON.stringify(seller));

      // Reset form
      setFormData({ email: '', password: '' });
      setErrors({});

      setLoading(false);
      onLogin(seller, token);
    } catch (error) {
      setLoading(false);
      console.error('[ERROR] Login failed:', error);

      let errorMessage = 'Login failed. Please check your credentials and try again.';

      if (error instanceof TypeError) {
        if (error.message === 'Failed to fetch') {
          errorMessage = 'Network error. Please ensure the backend server is running at http://localhost:5000';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof SyntaxError) {
        errorMessage = 'Server returned invalid data. Please check your API configuration.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setApiError(errorMessage);
      setErrors({ submit: errorMessage });
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="header-icon">
            <ShoppingBag size={32} />
          </div>
          <h1 className="header-title">Welcome Back</h1>
          <p className="header-subtitle">Sign in to your seller account</p>
        </div>

        {/* Form Card */}
        <div className="login-card">
          {/* Error Alert */}
          {(errors.submit || apiError) && (
            <div className="error-alert">
              <AlertCircle size={20} className="error-alert-icon" />
              <div className="error-alert-content">
                <p className="error-alert-title">Login Error</p>
                <p className="error-alert-message">{errors.submit || apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail size={20} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={loading}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="error-text">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={20} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="toggle-password-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`submit-btn ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner">⌛</span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="register-switch">
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="register-link"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Sellerlogin