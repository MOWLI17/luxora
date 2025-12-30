import React from 'react'
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { useState } from 'react';
import * as yup from 'yup';
import Swal from 'sweetalert2';
import { authService } from '../../Api/services';
import '../CssPages/Profilecss/Regester.css'

const Regester = (onRegisterSuccess, onBackToHome) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  const validationSchemaStep1 = yup.object({
    userName: yup.string()
      .trim()
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must not exceed 50 characters')
      .required('Name is required'),
    email: yup.string()
      .trim()
      .email('Enter a valid email address')
      .required('Email is required'),
    mobile: yup.string()
      .trim()
      .matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits')
      .required('Mobile number is required'),
    password: yup.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .matches(/[A-Z]/, 'Must contain uppercase letter')
      .matches(/[a-z]/, 'Must contain lowercase letter')
      .matches(/[0-9]/, 'Must contain number')
      .matches(/[@$!%*?&#]/, 'Must contain special character (@$!%*?&#)')
      .required('Password is required'),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const validationSchemaStep2 = yup.object({
    addressLine1: yup.string()
      .trim()
      .min(5, 'Address must be at least 5 characters')
      .required('Address Line 1 is required'),
    addressLine2: yup.string().trim(),
    city: yup.string()
      .trim()
      .min(2, 'City name too short')
      .required('City is required'),
    state: yup.string()
      .trim()
      .min(2, 'State name too short')
      .required('State is required'),
    zipCode: yup.string()
      .matches(/^\d{6}$/, 'ZIP code must be exactly 6 digits')
      .required('ZIP code is required'),
    country: yup.string().required('Country is required'),
    otp: otpSent 
      ? yup.string()
          .length(4, 'OTP must be exactly 4 digits')
          .matches(/^\d+$/, 'OTP must contain only numbers')
          .required('OTP is required')
      : yup.string(),
  });

  const formik = useFormik({
    initialValues: {
      userName: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      otp: '',
    },
    validationSchema: currentStep === 1 ? validationSchemaStep1 : validationSchemaStep2,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      if (currentStep === 1) {
        setCurrentStep(2);
        setSubmitting(false);
      } else {
        try {
          if (otpSent && values.otp !== generatedOtp) {
            await Swal.fire({
              icon: 'error',
              title: 'Invalid OTP',
              text: 'The OTP you entered is incorrect. Please try again.',
              confirmButtonColor: '#ef4444',
            });
            setSubmitting(false);
            return;
          }

          if (!otpSent) {
            const result = await Swal.fire({
              icon: 'warning',
              title: 'OTP Not Verified',
              text: 'You have not verified your email/phone. Do you want to continue without verification?',
              showCancelButton: true,
              confirmButtonText: 'Yes, Continue',
              cancelButtonText: 'Cancel',
              confirmButtonColor: '#6366f1',
              cancelButtonColor: '#6b7280',
            });

            if (!result.isConfirmed) {
              setSubmitting(false);
              return;
            }
          }

          const registrationData = {
            name: values.userName.trim(),
            email: values.email.trim(),
            mobile: values.mobile.trim(),
            password: values.password,
            address: {
              addressLine1: values.addressLine1.trim(),
              addressLine2: values.addressLine2.trim(),
              city: values.city.trim(),
              state: values.state.trim(),
              zipCode: values.zipCode,
              country: values.country
            }
          };

          console.log('[REGISTER PAGE] Sending registration data...');
          
          const response = await authService.register(registrationData);
          
          console.log('[REGISTER PAGE] API Response received:', response);
          
          const userData = response?.data?.user;
          const token = response?.data?.token;

          if (!userData || !token) {
            console.error('[REGISTER PAGE] Invalid response structure:', response);
            throw new Error('Server returned invalid response: Missing user or token data');
          }

          if (!userData.name || !userData.email) {
            console.error('[REGISTER PAGE] Invalid user data received:', userData);
            throw new Error('Server returned incomplete user data');
          }

          const { name } = userData;

          await Swal.fire({
            icon: 'success',
            title: 'Registration Successful!',
            text: `Welcome ${name}! Your account has been created.`,
            confirmButtonColor: '#6366f1',
            timer: 2000,
            timerProgressBar: true,
          });

          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));

          console.log('[REGISTER PAGE] Data stored in localStorage');

          if (onRegisterSuccess && typeof onRegisterSuccess === 'function') {
            onRegisterSuccess(userData, token);
          }

          resetForm();
          setOtpSent(false);
          setGeneratedOtp('');
          setCurrentStep(1);

          console.log('[REGISTER PAGE] Registration complete, redirecting to home...');
          
          navigate('/');

        } catch (error) {
          console.error('[REGISTER PAGE] Registration failed:', error);
          
          let errorMessage = 'An error occurred while creating your account. Please try again.';
          let errorTitle = 'Registration Failed';
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.status === 400) {
            errorMessage = 'Invalid registration data. Please check your information.';
            errorTitle = 'Invalid Data';
          } else if (error.response?.status === 409) {
            errorMessage = 'Email or mobile number is already registered. Please use different credentials.';
            errorTitle = 'Account Already Exists';
          } else if (error.response?.status === 500) {
            errorMessage = 'Server error. Please try again later.';
            errorTitle = 'Server Error';
          } else if (error.response?.status >= 400 && error.response?.status < 500) {
            errorMessage = error.response.data?.message || 'Request failed. Please try again.';
            errorTitle = 'Request Error';
          } else if (!error.response) {
            errorMessage = 'Cannot connect to server. Please check your internet connection.';
            errorTitle = 'Connection Error';
          } else if (error.message) {
            errorMessage = error.message;
          }

          console.error('[REGISTER PAGE] Error Details:', {
            title: errorTitle,
            message: errorMessage,
            status: error.response?.status,
            data: error.response?.data
          });

          await Swal.fire({
            icon: 'error',
            title: errorTitle,
            text: errorMessage,
            confirmButtonColor: '#ef4444',
          });
        } finally {
          setSubmitting(false);
        }
      }
    },
  });

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSendOtp = () => {
    const emailError = !formik.values.email || !formik.values.email.trim();
    const mobileError = !formik.values.mobile || !formik.values.mobile.trim();

    if (emailError && mobileError) {
      Swal.fire({
        icon: 'warning',
        title: 'Email/Mobile Required',
        text: 'Please enter your email or mobile number first.',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);
    setOtpSent(true);
    setOtpTimer(60);
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    Swal.fire({
      icon: 'info',
      title: 'OTP Sent!',
      html: `Your verification code is: <strong style="font-size: 24px; color: #6366f1;">${otp}</strong><br><small>(In production, this would be sent to your email/phone)</small>`,
      confirmButtonColor: '#6366f1',
      timer: 10000,
      timerProgressBar: true,
    });
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

    const level = levels[Math.min(strength - 1, levels.length - 1)] || levels[0];
    return { strength, ...level };
  };

  const passwordStrength = getPasswordStrength(formik.values.password);

  return (
    <div className="register-page-wrapper">
      <div className="register-page-container">
        <div className="register-page-header">
          <h2>Create Account</h2>
          <div className="register-page-step-indicator">
            <div className={currentStep === 1 ? 'register-page-step register-page-step-active' : 'register-page-step register-page-step-completed'}>
              <span className="register-page-step-number">{currentStep > 1 ? '✓' : '1'}</span>
              <span className="register-page-step-text">Account</span>
            </div>
            <div className="register-page-step-line"></div>
            <div className={currentStep === 2 ? 'register-page-step register-page-step-active' : 'register-page-step'}>
              <span className="register-page-step-number">2</span>
              <span className="register-page-step-text">Address</span>
            </div>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="register-page-form">
          {currentStep === 1 ? (
            <>
              <div className="register-page-form-group">
                <label>Full Name *</label>
                <input
                  name="userName"
                  placeholder="Enter your full name"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.userName}
                  className={formik.touched.userName && formik.errors.userName ? 'register-page-input-error' : ''}
                  autoComplete="name"
                  disabled={formik.isSubmitting}
                />
                {formik.touched.userName && formik.errors.userName && (
                  <div className="register-page-error">⚠️ {formik.errors.userName}</div>
                )}
              </div>

              <div className="register-page-form-group">
                <label>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.email}
                  className={formik.touched.email && formik.errors.email ? 'register-page-input-error' : ''}
                  autoComplete="email"
                  disabled={formik.isSubmitting}
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="register-page-error">⚠️ {formik.errors.email}</div>
                )}
              </div>

              <div className="register-page-form-group">
                <label>Mobile Number *</label>
                <input
                  name="mobile"
                  type="tel"
                  placeholder="9876543210"
                  maxLength="10"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.mobile}
                  className={formik.touched.mobile && formik.errors.mobile ? 'register-page-input-error' : ''}
                  autoComplete="tel"
                  disabled={formik.isSubmitting}
                />
                {formik.touched.mobile && formik.errors.mobile && (
                  <div className="register-page-error">⚠️ {formik.errors.mobile}</div>
                )}
              </div>

              <div className="register-page-form-group">
                <label>Password *</label>
                <div className="register-page-password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a strong password"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    className={formik.touched.password && formik.errors.password ? 'register-page-input-error' : ''}
                    autoComplete="new-password"
                    disabled={formik.isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="register-page-eye-button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={formik.isSubmitting}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formik.values.password && (
                  <div className="register-page-password-strength">
                    <div className="register-page-strength-bar-container">
                      <div 
                        className="register-page-strength-bar"
                        style={{
                          width: `${(passwordStrength.strength / 6) * 100}%`, 
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                    <span className="register-page-strength-text" style={{ color: passwordStrength.color }}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
                {formik.touched.password && formik.errors.password && (
                  <div className="register-page-error">⚠️ {formik.errors.password}</div>
                )}
              </div>

              <div className="register-page-form-group">
                <label>Confirm Password *</label>
                <div className="register-page-password-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.confirmPassword}
                    className={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'register-page-input-error' : ''}
                    autoComplete="new-password"
                    disabled={formik.isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="register-page-eye-button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    disabled={formik.isSubmitting}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <div className="register-page-error">⚠️ {formik.errors.confirmPassword}</div>
                )}
              </div>

              <button 
                type="submit" 
                className="register-page-register-btn"
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? '⏳ Processing...' : 'Continue to Address →'}
              </button>
            </>
          ) : (
            <>
              <div className="register-page-form-group">
                <label>Address Line 1 *</label>
                <input
                  name="addressLine1"
                  placeholder="House/Flat No, Building Name"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.addressLine1}
                  className={formik.touched.addressLine1 && formik.errors.addressLine1 ? 'register-page-input-error' : ''}
                  autoComplete="address-line1"
                  disabled={formik.isSubmitting}
                />
                {formik.touched.addressLine1 && formik.errors.addressLine1 && (
                  <div className="register-page-error">⚠️ {formik.errors.addressLine1}</div>
                )}
              </div>

              <div className="register-page-form-group">
                <label>Address Line 2</label>
                <input
                  name="addressLine2"
                  placeholder="Street, Area, Landmark (Optional)"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.addressLine2}
                  autoComplete="address-line2"
                  disabled={formik.isSubmitting}
                />
              </div>

              <div className="register-page-form-row">
                <div className="register-page-form-group">
                  <label>City *</label>
                  <input
                    name="city"
                    placeholder="City"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.city}
                    className={formik.touched.city && formik.errors.city ? 'register-page-input-error' : ''}
                    autoComplete="address-level2"
                    disabled={formik.isSubmitting}
                  />
                  {formik.touched.city && formik.errors.city && (
                    <div className="register-page-error">⚠️ {formik.errors.city}</div>
                  )}
                </div>

                <div className="register-page-form-group">
                  <label>State *</label>
                  <input
                    name="state"
                    placeholder="State"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.state}
                    className={formik.touched.state && formik.errors.state ? 'register-page-input-error' : ''}
                    autoComplete="address-level1"
                    disabled={formik.isSubmitting}
                  />
                  {formik.touched.state && formik.errors.state && (
                    <div className="register-page-error">⚠️ {formik.errors.state}</div>
                  )}
                </div>
              </div>

              <div className="register-page-form-row">
                <div className="register-page-form-group">
                  <label>ZIP Code *</label>
                  <input
                    name="zipCode"
                    placeholder="600001"
                    maxLength="6"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.zipCode}
                    className={formik.touched.zipCode && formik.errors.zipCode ? 'register-page-input-error' : ''}
                    autoComplete="postal-code"
                    disabled={formik.isSubmitting}
                  />
                  {formik.touched.zipCode && formik.errors.zipCode && (
                    <div className="register-page-error">⚠️ {formik.errors.zipCode}</div>
                  )}
                </div>

                <div className="register-page-form-group">
                  <label>Country *</label>
                  <select
                    name="country"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.country}
                    autoComplete="country"
                    disabled={formik.isSubmitting}
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>

              <div className="register-page-form-group">
                <label>OTP Verification (Optional)</label>
                <div className="register-page-otp-container">
                  <input
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 4-digit OTP"
                    maxLength="4"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.otp}
                    className={formik.touched.otp && formik.errors.otp ? 'register-page-input-error' : ''}
                    disabled={formik.isSubmitting}
                  />
                  <button 
                    type="button" 
                    className="register-page-otp-btn"
                    onClick={handleSendOtp}
                    disabled={otpTimer > 0 || formik.isSubmitting}
                  >
                    {otpTimer > 0 ? `Resend (${otpTimer}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                </div>
                {formik.touched.otp && formik.errors.otp && (
                  <div className="register-page-error">⚠️ {formik.errors.otp}</div>
                )}
                {otpSent && (
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>
                    ✓ OTP sent successfully! Check the popup for your code.
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                  You can skip OTP verification and register directly
                </div>
              </div>

              <div className="register-page-button-group">
                <button 
                  type="button" 
                  onClick={handleBack} 
                  className="register-page-back-btn"
                  disabled={formik.isSubmitting}
                >
                  ← Back
                </button>
                <button 
                  type="submit" 
                  className="register-page-submit-btn"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? '⏳ Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </>
          )}

          <p className="register-page-login-redirect">
            Already have an account?{' '}
            <Link to="/Login" className="register-page-login-link">
              Login here
            </Link>
          </p>

          {onBackToHome && (
            <button 
              type="button" 
              onClick={onBackToHome} 
              className="register-page-home-btn"
              disabled={formik.isSubmitting}
            >
              ← Back to Home
            </button>
          )}
        </form>

        <div className="register-page-security-badge">
          🔒 Your data is encrypted and secure
        </div>
      </div>
    </div>
  );
};

export default Regester