import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authService } from '../../Api/services';
import '../CssPages/Profilecss/Login.css';

const Login = ({ onLoginSuccess = () => {} }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrMobile: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (values) => {
    const newErrors = {};
    
    if (!values.emailOrMobile.trim()) {
      newErrors.emailOrMobile = 'Email or mobile is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^\d{10}$/;
      
      if (!emailRegex.test(values.emailOrMobile) && !mobileRegex.test(values.emailOrMobile)) {
        newErrors.emailOrMobile = 'Enter valid email or 10-digit mobile';
      }
    }
    
    if (!values.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);
    
    if (touched[name]) {
      const newErrors = validate(newFormData);
      setErrors(newErrors);
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    const newErrors = validate(formData);
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newTouched = {
      emailOrMobile: true,
      password: true
    };
    setTouched(newTouched);

    const newErrors = validate(formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      try {
        console.log('[LOGIN PAGE] Attempting login with:', { emailOrMobile: formData.emailOrMobile });
        
        const response = await authService.login({
          emailOrMobile: formData.emailOrMobile.trim(),
          password: formData.password
        });

        console.log('[LOGIN PAGE] Response:', response);

        const user = response?.data?.user;
        const token = response?.data?.token;

        if (!user || !token) {
          throw new Error('Invalid response from server: Missing user or token data');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: `Logged in as ${user.name}`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        if (onLoginSuccess) {
          onLoginSuccess(user, token);
        }

        setFormData({ emailOrMobile: '', password: '' });
        setTouched({});
        setErrors({});

        navigate('/user');

      } catch (error) {
        console.error('[LOGIN PAGE] Error occurred:', error);

        let errorMessage = 'Invalid credentials. Please try again.';

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 401) {
          errorMessage = 'Invalid email/mobile or password.';
        } else if (error.response?.status === 404) {
          errorMessage = 'User not found. Please register first.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Your account has been deactivated.';
        } else if (!error.response) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleForgotPassword = () => {
    navigate('/user/forgot-password');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-page-background">
        <div className="login-page-circle login-page-circle-1" />
        <div className="login-page-circle login-page-circle-2" />
      </div>

      <div className="login-page-card-wrapper">
        <div className="login-page-card">
          <div className="login-page-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-page-form">
            <div className="login-page-form-group">
              <label>Email or Mobile *</label>
              <input
                name="emailOrMobile"
                placeholder="📧 Enter email or mobile number"
                value={formData.emailOrMobile}
                onChange={handleChange}
                onBlur={handleBlur}
                className={touched.emailOrMobile && errors.emailOrMobile ? 'login-page-error' : ''}
                autoComplete="email"
                disabled={isSubmitting}
              />
              {touched.emailOrMobile && errors.emailOrMobile && (
                <div className="login-page-error-text">⚠️ {errors.emailOrMobile}</div>
              )}
            </div>

            <div className="login-page-form-group">
              <label>Password *</label>
              <div className="login-page-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="🔐 Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={touched.password && errors.password ? 'login-page-error' : ''}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="login-page-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isSubmitting}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {touched.password && errors.password && (
                <div className="login-page-error-text">⚠️ {errors.password}</div>
              )}
            </div>

            <div className="login-page-forgot-section">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="login-page-forgot-btn"
                disabled={isSubmitting}
              >
                🔑 Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`login-page-submit-btn ${isSubmitting ? 'login-page-loading' : ''}`}
            >
              {isSubmitting ? '⏳ Signing in...' : '✓ Sign In'}
            </button>
          </form>

          <div className="login-page-footer">
            <p>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/user/register')} 
                className="login-page-register-btn"
                disabled={isSubmitting}
              >
                Register here
              </button>
            </p>

            <button 
              type="button" 
              onClick={() => navigate('/user')} 
              className="login-page-back-btn"
              disabled={isSubmitting}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login