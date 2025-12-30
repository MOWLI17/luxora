import React from 'react'
import { useState } from 'react';
import Swal from 'sweetalert2';
import { ChevronRight, ChevronLeft, Store, FileText, Building, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { API_URL } from '../Config/config';
import './CssPage/SellerRegister.css';


const SellerRegister = ({ onRegister, onSwitchToLogin }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    businessRegNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    taxId: '',
    gstNumber: '',
    panNumber: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    storeName: '',
    storeDescription: '',
    productCategory: '',
    returnPolicy: '',
    shippingPolicy: '',
    termsAccepted: false,
    privacyAccepted: false
  });

  const [errors, setErrors] = useState({});

  /* ============================================
     CONFIGURATION DATA
     ============================================ */

  const steps = [
    { id: 1, name: 'Personal Info', icon: Store },
    { id: 2, name: 'Business Details', icon: Building },
    { id: 3, name: 'Tax Information', icon: FileText },
    { id: 4, name: 'Bank Details', icon: CreditCard },
    { id: 5, name: 'Store Setup', icon: CheckCircle }
  ];

  const businessTypes = [
    { value: 'sole', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llp', label: 'LLP' },
    { value: 'pvt-ltd', label: 'Private Limited' },
    { value: 'public', label: 'Public Limited' }
  ];

  const productCategories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'home', label: 'Home & Living' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'sports', label: 'Sports & Fitness' }
  ];

  const returnPolicies = [
    { value: '7days', label: '7 Days Return' },
    { value: '15days', label: '15 Days Return' },
    { value: '30days', label: '30 Days Return' }
  ];

  const shippingOptions = [
    { value: 'free', label: 'Free Shipping' },
    { value: 'standard', label: 'Standard Shipping' },
    { value: 'express', label: 'Express Shipping' }
  ];

  /* ============================================
     FORM HANDLERS
     ============================================ */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /* ============================================
     VALIDATION FUNCTIONS
     ============================================ */

  const getStepErrors = (step) => {
    const stepErrors = {};

    if (step === 1) {
      if (!formData.fullName || formData.fullName.trim() === '')
        stepErrors.fullName = 'Full name is required';
      
      if (!formData.email || formData.email.trim() === '')
        stepErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        stepErrors.email = 'Please enter a valid email';

      if (!formData.phone || formData.phone.trim() === '')
        stepErrors.phone = 'Phone number is required';
      else {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
          stepErrors.phone = 'Phone must be at least 10 digits';
        }
      }

      if (!formData.password || formData.password.trim() === '')
        stepErrors.password = 'Password is required';
      else if (formData.password.length < 8)
        stepErrors.password = 'Password must be at least 8 characters';

      if (formData.password !== formData.confirmPassword)
        stepErrors.confirmPassword = 'Passwords do not match';
    }

    if (step === 2) {
      if (!formData.businessName || formData.businessName.trim() === '')
        stepErrors.businessName = 'Business name is required';
      
      if (!formData.businessType || formData.businessType.trim() === '')
        stepErrors.businessType = 'Business type is required';
      
      if (!formData.businessAddress || formData.businessAddress.trim() === '')
        stepErrors.businessAddress = 'Address is required';
      
      if (!formData.city || formData.city.trim() === '')
        stepErrors.city = 'City is required';
      
      if (!formData.state || formData.state.trim() === '')
        stepErrors.state = 'State is required';
      
      if (!formData.zipCode || formData.zipCode.trim() === '')
        stepErrors.zipCode = 'ZIP code is required';
    }

    if (step === 3) {
      if (!formData.taxId || formData.taxId.trim() === '')
        stepErrors.taxId = 'Tax ID is required';
      
      if (!formData.panNumber || formData.panNumber.trim() === '')
        stepErrors.panNumber = 'PAN number is required';
    }

    if (step === 4) {
      if (!formData.bankName || formData.bankName.trim() === '')
        stepErrors.bankName = 'Bank name is required';
      
      if (!formData.accountHolderName || formData.accountHolderName.trim() === '')
        stepErrors.accountHolderName = 'Account holder name is required';
      
      if (!formData.accountNumber || formData.accountNumber.trim() === '')
        stepErrors.accountNumber = 'Account number is required';
      
      if (formData.accountNumber !== formData.confirmAccountNumber)
        stepErrors.confirmAccountNumber = 'Account numbers do not match';
      
      if (!formData.ifscCode || formData.ifscCode.trim() === '')
        stepErrors.ifscCode = 'IFSC code is required';
    }

    if (step === 5) {
      if (!formData.storeName || formData.storeName.trim() === '')
        stepErrors.storeName = 'Store name is required';
      
      if (!formData.productCategory || formData.productCategory.trim() === '')
        stepErrors.productCategory = 'Product category is required';
      
      if (!formData.termsAccepted)
        stepErrors.termsAccepted = 'You must accept the terms';
      
      if (!formData.privacyAccepted)
        stepErrors.privacyAccepted = 'You must accept the privacy policy';
    }

    return stepErrors;
  };

  const validateAllSteps = () => {
    let allErrors = {};

    for (let step = 1; step <= 5; step++) {
      const stepErrors = getStepErrors(step);
      allErrors = { ...allErrors, ...stepErrors };
    }

    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      for (let step = 1; step <= 5; step++) {
        const stepErrors = getStepErrors(step);
        if (Object.keys(stepErrors).length > 0) {
          setCurrentStep(step);
          break;
        }
      }
      return false;
    }

    return true;
  };

  /* ============================================
     STEP NAVIGATION
     ============================================ */

  const handleNext = () => {
    const stepErrors = getStepErrors(currentStep);

    if (Object.keys(stepErrors).length === 0) {
      setErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrors(stepErrors);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ============================================
     FORM SUBMISSION
     ============================================ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const isValid = validateAllSteps();

    if (!isValid) {
      Swal.fire({
        title: 'Incomplete Form',
        text: 'Please fill in all required fields. You have been redirected to the first incomplete section.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setIsSubmitting(true);

    Swal.fire({
      title: 'Processing...',
      html: 'Please wait while we process your registration.',
      icon: 'info',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        Swal.showLoading();

        try {
          const phoneDigits = formData.phone.replace(/\D/g, '').slice(-10);

          const registrationData = {
            fullName: formData.fullName,
            email: formData.email,
            phone: phoneDigits,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            businessName: formData.businessName,
            businessType: formData.businessType,
            businessRegNumber: formData.businessRegNumber,
            businessAddress: formData.businessAddress,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
            taxId: formData.taxId,
            gstNumber: formData.gstNumber,
            panNumber: formData.panNumber,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            confirmAccountNumber: formData.confirmAccountNumber,
            ifscCode: formData.ifscCode,
            accountHolderName: formData.accountHolderName,
            storeName: formData.storeName,
            storeDescription: formData.storeDescription,
            productCategory: formData.productCategory,
            returnPolicy: formData.returnPolicy,
            shippingPolicy: formData.shippingPolicy
          };

          console.log('[SELLER REGISTER PAGE] Sending registration data:', registrationData);

          const apiEndpoint = `${API_URL}/seller/auth/register`;
          console.log('[SELLER REGISTER PAGE] API Endpoint:', apiEndpoint);

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(registrationData)
          });

          const data = await response.json();

          if (!response.ok) {
            if (data.errors && Array.isArray(data.errors)) {
              const errorMessages = data.errors.join('\n');
              throw new Error(errorMessages);
            }

            const errorMsg = data.message || data.error || `Server Error: ${response.status}`;
            throw new Error(errorMsg);
          }

          if (!data.success && data.message) {
            throw new Error(data.message);
          }

          if (data.token && data.seller) {
            console.log('[SELLER REGISTER PAGE] Registration successful, saving token');
            localStorage.setItem('sellerToken', data.token);
            localStorage.setItem('seller', JSON.stringify(data.seller));

            if (onRegister) {
              onRegister(data.seller, data.token);
            }
          }

          await Swal.fire({
            title: 'Registration Successful!',
            html: `
              <div style="text-align: left; margin-top: 1rem;">
                <p><strong>Congratulations!</strong> Your seller account has been created.</p>
                <p style="margin-top: 0.5rem;"><strong>Email:</strong> ${formData.email}</p>
                <p style="margin-top: 0.5rem;">You can now log in with your credentials and start selling.</p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Continue',
            confirmButtonColor: '#10b981',
            allowOutsideClick: false
          });

          // Reset form
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            businessName: '',
            businessType: '',
            businessRegNumber: '',
            businessAddress: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India',
            taxId: '',
            gstNumber: '',
            panNumber: '',
            bankName: '',
            accountNumber: '',
            confirmAccountNumber: '',
            ifscCode: '',
            accountHolderName: '',
            storeName: '',
            storeDescription: '',
            productCategory: '',
            returnPolicy: '',
            shippingPolicy: '',
            termsAccepted: false,
            privacyAccepted: false
          });
          setCurrentStep(1);
          setErrors({});
        } catch (error) {
          console.error('[SELLER REGISTER PAGE] Error:', error);

          let errorMessage = 'An error occurred during registration. Please try again.';

          if (error.message) {
            errorMessage = error.message;
          }

          await Swal.fire({
            title: 'Registration Failed',
            html: `
              <div style="text-align: left; margin-top: 1rem;">
                <p><strong>Error:</strong></p>
                <pre style="white-space: pre-wrap; background: #fee; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem;">${errorMessage}</pre>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                  Please check your information and try again.
                </p>
              </div>
            `,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444',
            allowOutsideClick: true
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  /* ============================================
     RENDER STEP CONTENT
     ============================================ */

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="seller-register-page-form-section">
            <h3 className="seller-register-page-section-title">Personal Information</h3>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`seller-register-page-form-input ${errors.fullName ? 'seller-register-page-error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="seller-register-page-error-text">⚠️ {errors.fullName}</p>}
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.email ? 'seller-register-page-error' : ''}`}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="seller-register-page-error-text">⚠️ {errors.email}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.phone ? 'seller-register-page-error' : ''}`}
                  placeholder="9876543210"
                />
                {errors.phone && <p className="seller-register-page-error-text">⚠️ {errors.phone}</p>}
              </div>
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.password ? 'seller-register-page-error' : ''}`}
                  placeholder="Min. 8 characters"
                />
                {errors.password && <p className="seller-register-page-error-text">⚠️ {errors.password}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.confirmPassword ? 'seller-register-page-error' : ''}`}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && <p className="seller-register-page-error-text">⚠️ {errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="seller-register-page-form-section">
            <h3 className="seller-register-page-section-title">Business Details</h3>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`seller-register-page-form-input ${errors.businessName ? 'seller-register-page-error' : ''}`}
                placeholder="Your Business Name"
              />
              {errors.businessName && <p className="seller-register-page-error-text">⚠️ {errors.businessName}</p>}
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Business Type *</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-select ${errors.businessType ? 'seller-register-page-error' : ''}`}
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.businessType && <p className="seller-register-page-error-text">⚠️ {errors.businessType}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Business Registration Number</label>
                <input
                  type="text"
                  name="businessRegNumber"
                  value={formData.businessRegNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="seller-register-page-form-input"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">Business Address *</label>
              <textarea
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`seller-register-page-form-input ${errors.businessAddress ? 'seller-register-page-error' : ''}`}
                placeholder="Street address, building, floor"
                rows="3"
              />
              {errors.businessAddress && <p className="seller-register-page-error-text">⚠️ {errors.businessAddress}</p>}
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.city ? 'seller-register-page-error' : ''}`}
                  placeholder="City"
                />
                {errors.city && <p className="seller-register-page-error-text">⚠️ {errors.city}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.state ? 'seller-register-page-error' : ''}`}
                  placeholder="State"
                />
                {errors.state && <p className="seller-register-page-error-text">⚠️ {errors.state}</p>}
              </div>
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">ZIP Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.zipCode ? 'seller-register-page-error' : ''}`}
                  placeholder="000000"
                />
                {errors.zipCode && <p className="seller-register-page-error-text">⚠️ {errors.zipCode}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  disabled
                  className="seller-register-page-form-input"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="seller-register-page-form-section">
            <h3 className="seller-register-page-section-title">Tax Information</h3>

            <div className="seller-register-page-alert-box">
              <AlertCircle size={20} />
              <p>Ensure all tax details are accurate for invoicing and compliance.</p>
            </div>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">Tax ID / TIN *</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`seller-register-page-form-input ${errors.taxId ? 'seller-register-page-error' : ''}`}
                placeholder="Enter your Tax ID"
              />
              {errors.taxId && <p className="seller-register-page-error-text">⚠️ {errors.taxId}</p>}
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="seller-register-page-form-input"
                  placeholder="Optional"
                />
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">PAN Number *</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.panNumber ? 'seller-register-page-error' : ''}`}
                  placeholder="ABCDE1234F"
                />
                {errors.panNumber && <p className="seller-register-page-error-text">⚠️ {errors.panNumber}</p>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="seller-register-page-form-section">
            <h3 className="seller-register-page-section-title">Bank Account Details</h3>

            <div className="seller-register-page-alert-box">
              <AlertCircle size={20} />
              <p>Payments will be transferred to this account. Verify details carefully.</p>
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Bank Name *</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.bankName ? 'seller-register-page-error' : ''}`}
                  placeholder="Bank name"
                />
                {errors.bankName && <p className="seller-register-page-error-text">⚠️ {errors.bankName}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Account Holder Name *</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.accountHolderName ? 'seller-register-page-error' : ''}`}
                  placeholder="As per bank records"
                />
                {errors.accountHolderName && <p className="seller-register-page-error-text">⚠️ {errors.accountHolderName}</p>}
              </div>
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Account Number *</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.accountNumber ? 'seller-register-page-error' : ''}`}
                  placeholder="Account number"
                />
                {errors.accountNumber && <p className="seller-register-page-error-text">⚠️ {errors.accountNumber}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Confirm Account Number *</label>
                <input
                  type="text"
                  name="confirmAccountNumber"
                  value={formData.confirmAccountNumber}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-input ${errors.confirmAccountNumber ? 'seller-register-page-error' : ''}`}
                  placeholder="Re-enter account number"
                />
                {errors.confirmAccountNumber && <p className="seller-register-page-error-text">⚠️ {errors.confirmAccountNumber}</p>}
              </div>
            </div>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">IFSC Code *</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`seller-register-page-form-input ${errors.ifscCode ? 'seller-register-page-error' : ''}`}
                placeholder="ABCD0123456"
              />
              {errors.ifscCode && <p className="seller-register-page-error-text">⚠️ {errors.ifscCode}</p>}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="seller-register-page-form-section">
            <h3 className="seller-register-page-section-title">Store Setup</h3>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">Store Name *</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`seller-register-page-form-input ${errors.storeName ? 'seller-register-page-error' : ''}`}
                placeholder="Your store display name"
              />
              {errors.storeName && <p className="seller-register-page-error-text">⚠️ {errors.storeName}</p>}
            </div>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">Store Description</label>
              <textarea
                name="storeDescription"
                value={formData.storeDescription}
                onChange={handleChange}
                disabled={isSubmitting}
                className="seller-register-page-form-input"
                placeholder="Tell customers about your store..."
                rows="4"
              />
            </div>

            <div className="seller-register-page-form-row">
              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Primary Product Category *</label>
                <select
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`seller-register-page-form-select ${errors.productCategory ? 'seller-register-page-error' : ''}`}
                >
                  <option value="">Select category</option>
                  {productCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.productCategory && <p className="seller-register-page-error-text">⚠️ {errors.productCategory}</p>}
              </div>

              <div className="seller-register-page-form-group">
                <label className="seller-register-page-form-label">Return Policy</label>
                <select
                  name="returnPolicy"
                  value={formData.returnPolicy}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="seller-register-page-form-select"
                >
                  <option value="">Select policy</option>
                  {returnPolicies.map((policy) => (
                    <option key={policy.value} value={policy.value}>
                      {policy.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="seller-register-page-form-group">
              <label className="seller-register-page-form-label">Shipping Policy</label>
              <select
                name="shippingPolicy"
                value={formData.shippingPolicy}
                onChange={handleChange}
                disabled={isSubmitting}
                className="seller-register-page-form-select"
              >
                <option value="">Select option</option>
                {shippingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="seller-register-page-terms-box">
              <h3>Terms & Conditions</h3>
              <div className="seller-register-page-checkbox-group">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="terms">I agree to the Terms and Conditions</label>
              </div>
              {errors.termsAccepted && <p className="seller-register-page-error-text">⚠️ {errors.termsAccepted}</p>}

              <div className="seller-register-page-checkbox-group">
                <input
                  type="checkbox"
                  name="privacyAccepted"
                  id="privacy"
                  checked={formData.privacyAccepted}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="privacy">I accept the Privacy Policy</label>
              </div>
              {errors.privacyAccepted && <p className="seller-register-page-error-text">⚠️ {errors.privacyAccepted}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ============================================
     RENDER COMPONENT
     ============================================ */

  return (
    <div className="seller-register-page-wrapper">
      <div className="seller-register-page-content">
        <div className="seller-register-page-header">
          <div className="seller-register-page-header-icon">
            <Store size={32} />
          </div>
          <h1>Become a Seller</h1>
          <p>Join us and grow your business</p>
        </div>

        <div className="seller-register-page-card">
          <div className="seller-register-page-progress-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="seller-register-page-step">
                    <div
                      className={`seller-register-page-step-icon ${
                        isCompleted ? 'seller-register-page-completed' : isActive ? 'seller-register-page-active' : 'seller-register-page-inactive'
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={24} /> : <Icon size={24} />}
                    </div>
                    <span className={`seller-register-page-step-name ${currentStep >= step.id ? 'seller-register-page-active' : 'seller-register-page-inactive'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`seller-register-page-step-connector ${currentStep > step.id ? 'seller-register-page-completed' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="seller-register-page-form">
            {renderStepContent()}

            <div className="seller-register-page-button-row">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className={`seller-register-page-btn seller-register-page-btn-back ${currentStep === 1 ? 'seller-register-page-disabled' : ''}`}
              >
                <ChevronLeft size={20} />
                Back
              </button>

              <div className="seller-register-page-button-group">
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="seller-register-page-btn seller-register-page-btn-next"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="seller-register-page-btn seller-register-page-btn-submit"
                  >
                    <CheckCircle size={20} />
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="seller-register-page-login-switch">
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                disabled={isSubmitting}
                className="seller-register-page-login-link"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRegister