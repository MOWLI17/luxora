import React from 'react'
import { useState,useEffect } from 'react';
import { AlertCircle, Save, Loader, Edit2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import config from '../Config/config';
import { authService } from '../Hooks/SellerApi';
import './CssPage/SellerSettings.css';


const AlertBox = ({ type = 'warning', message }) => {
  return (
    <div className="alert-box">
      <AlertCircle size={20} className="alert-icon" />
      <p className="alert-text">{message}</p>
    </div>
  );
};

// Reusable Form Input Component
const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  required = false, 
  disabled = false,
  error,
  value,
  onChange,
  maxLength,
  pattern
}) => {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        pattern={pattern}
        className={`form-input ${error ? 'error' : ''}`}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

// Reusable Textarea Component
const FormTextarea = ({ 
  label, 
  name, 
  placeholder, 
  required = false, 
  disabled = false,
  error,
  value,
  onChange,
  rows = 3
}) => {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`form-textarea ${error ? 'error' : ''}`}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

// Reusable Select Component
const FormSelect = ({ 
  label, 
  name, 
  options, 
  required = false, 
  disabled = false,
  error,
  value,
  onChange
}) => {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`form-select ${error ? 'error' : ''}`}
      >
        <option value="">Select option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};


const SellerSettings = ({ currentSeller, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    businessAddress: '',
    city: '',
    state: '',
    zipCode: '',
    storeName: '',
    storeDescription: '',
    productCategory: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    gstNumber: '',
    panNumber: '',
    taxId: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Business type options
  const businessTypeOptions = [
    { value: 'sole', label: 'Sole Proprietorship' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'llp', label: 'LLP' },
    { value: 'pvt-ltd', label: 'Private Limited' },
    { value: 'ngo', label: 'NGO' }
  ];

  // Product category options
  const categoryOptions = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Clothing', label: 'Clothing' },
    { value: 'Home & Garden', label: 'Home & Garden' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Beauty', label: 'Beauty' },
    { value: 'Books', label: 'Books' },
    { value: 'Toys', label: 'Toys' },
    { value: 'Other', label: 'Other' }
  ];

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError('');

        const seller = await authService.getCurrentUser();

        if (!seller) {
          showAlert('Error', 'Authentication failed. Please login again.', 'error');
          setLoading(false);
          return;
        }

        setFormData(prev => ({
          ...prev,
          fullName: seller.fullName || '',
          email: seller.email || '',
          phone: seller.phone || '',
          businessName: seller.businessName || '',
          businessType: seller.businessType || '',
          businessAddress: seller.businessAddress || '',
          city: seller.city || '',
          state: seller.state || '',
          zipCode: seller.zipCode || '',
          storeName: seller.storeName || '',
          storeDescription: seller.storeDescription || '',
          productCategory: seller.productCategory || '',
          bankName: seller.bankName || '',
          accountHolderName: seller.accountHolderName || '',
          accountNumber: seller.accountNumber ? '****' + seller.accountNumber.slice(-4) : '',
          ifscCode: seller.ifscCode || '',
          gstNumber: seller.gstNumber || '',
          panNumber: seller.panNumber || '',
          taxId: seller.taxId || '',
        }));
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err.message);
        showAlert('Error', `Failed to load settings: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Show alert helper
  const showAlert = (title, message, type = 'info') => {
    Swal.fire({
      title,
      text: message,
      icon: type,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'OK',
      allowOutsideClick: false,
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setError('');
  };

  // Validation functions
  const validateProfile = () => {
    const errors = {};

    if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!/^[0-9]{10}$/.test(formData.phone)) errors.phone = 'Phone must be 10 digits';
    if (!formData.businessName?.trim()) errors.businessName = 'Business name is required';
    if (!formData.businessType) errors.businessType = 'Business type is required';
    if (!formData.businessAddress?.trim()) errors.businessAddress = 'Business address is required';
    if (!formData.city?.trim()) errors.city = 'City is required';
    if (!formData.state?.trim()) errors.state = 'State is required';
    if (!formData.zipCode?.trim()) errors.zipCode = 'ZIP code is required';
    if (!/^[0-9]{6}$/.test(formData.zipCode)) errors.zipCode = 'ZIP code must be 6 digits';
    if (!formData.storeName?.trim()) errors.storeName = 'Store name is required';
    if (!formData.productCategory) errors.productCategory = 'Product category is required';

    return errors;
  };

  const validateBankDetails = () => {
    const errors = {};

    if (!formData.bankName?.trim()) errors.bankName = 'Bank name is required';
    if (!formData.accountHolderName?.trim()) errors.accountHolderName = 'Account holder name is required';
    if (!formData.ifscCode?.trim()) errors.ifscCode = 'IFSC code is required';
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      errors.ifscCode = 'Invalid IFSC code format (e.g., ABCD0123456)';
    }

    return errors;
  };

  const validateTaxDetails = () => {
    const errors = {};

    if (!formData.taxId?.trim()) errors.taxId = 'Tax ID is required';
    if (!formData.panNumber?.trim()) errors.panNumber = 'PAN number is required';
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      errors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }

    return errors;
  };

  // Handle save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showAlert('Validation Error', Object.values(errors)[0], 'warning');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`${config.API_URL}/seller/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          businessName: formData.businessName.trim(),
          businessType: formData.businessType,
          businessAddress: formData.businessAddress.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
          storeName: formData.storeName.trim(),
          storeDescription: formData.storeDescription.trim(),
          productCategory: formData.productCategory,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile');
      }

      showAlert('Success!', 'Profile updated successfully!', 'success');
      setIsEditing(false);
      if (onUpdate) onUpdate(data.seller);
    } catch (err) {
      console.error('Error saving profile:', err);
      showAlert('Error', err.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle save bank details
  const handleSaveBankDetails = async (e) => {
    e.preventDefault();

    const errors = validateBankDetails();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showAlert('Validation Error', Object.values(errors)[0], 'warning');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`${config.API_URL}/seller/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        },
        body: JSON.stringify({
          bankName: formData.bankName.trim(),
          accountHolderName: formData.accountHolderName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.toUpperCase().trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save bank details');
      }

      showAlert('Success!', 'Bank details updated successfully!', 'success');
      setIsEditing(false);
      if (onUpdate) onUpdate(data.seller);
    } catch (err) {
      console.error('Error saving bank details:', err);
      showAlert('Error', err.message || 'Failed to save bank details', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle save tax details
  const handleSaveTaxDetails = async (e) => {
    e.preventDefault();

    const errors = validateTaxDetails();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showAlert('Validation Error', Object.values(errors)[0], 'warning');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`${config.API_URL}/seller/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sellerToken')}`
        },
        body: JSON.stringify({
          taxId: formData.taxId.trim(),
          gstNumber: formData.gstNumber.toUpperCase().trim(),
          panNumber: formData.panNumber.toUpperCase().trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save tax details');
      }

      showAlert('Success!', 'Tax details updated successfully!', 'success');
      setIsEditing(false);
      if (onUpdate) onUpdate(data.seller);
    } catch (err) {
      console.error('Error saving tax details:', err);
      showAlert('Error', err.message || 'Failed to save tax details', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={48} className="loading-spinner" />
        <p className="loading-text">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-wrapper">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-content">
          <h1>⚙️ Seller Settings</h1>
          <p>Manage your store and account information</p>
        </div>
        <button
          className={`edit-toggle-btn ${isEditing ? 'cancel' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <X size={18} /> : <Edit2 size={18} />}
          {isEditing ? 'Cancel Edit' : 'Edit Details'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert">
          <AlertCircle size={24} className="error-alert-icon" />
          <div>
            <p className="error-alert-title">Error</p>
            <p className="error-alert-message">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        {['profile', 'bank', 'tax'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'profile' && 'Profile'}
            {tab === 'bank' && 'Bank Details'}
            {tab === 'tax' && 'Tax Info'}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="form-section">
          <h2 className="form-section-title">Profile Information</h2>

          <div className="form-grid">
            <FormInput
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.fullName}
            />
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              disabled
              error={validationErrors.email}
            />
            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="9876543210"
              maxLength="10"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.phone}
            />
            <FormInput
              label="Business Name"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.businessName}
            />
          </div>

          <div className="form-grid">
            <FormSelect
              label="Business Type"
              name="businessType"
              options={businessTypeOptions}
              value={formData.businessType}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.businessType}
            />
            <FormSelect
              label="Product Category"
              name="productCategory"
              options={categoryOptions}
              value={formData.productCategory}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.productCategory}
            />
            <FormInput
              label="Store Name"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.storeName}
            />
          </div>

          <div className="form-grid">
            <FormInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.city}
            />
            <FormInput
              label="State"
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.state}
            />
            <FormInput
              label="ZIP Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.zipCode}
            />
          </div>

          <FormTextarea
            label="Business Address"
            name="businessAddress"
            placeholder="Street address, building, floor"
            value={formData.businessAddress}
            onChange={handleChange}
            required
            disabled={!isEditing}
            error={validationErrors.businessAddress}
            rows={3}
          />

          <FormTextarea
            label="Store Description"
            name="storeDescription"
            placeholder="Tell customers about your store..."
            value={formData.storeDescription}
            onChange={handleChange}
            disabled={!isEditing}
            rows={3}
          />

          {isEditing && (
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? <Loader size={20} className="loader-icon" /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      )}

      {/* Bank Details Tab */}
      {activeTab === 'bank' && (
        <form onSubmit={handleSaveBankDetails} className="form-section">
          <h2 className="form-section-title">Bank Account Details</h2>
          <AlertBox message="⚠️ Payments will be transferred to this account. Verify all details carefully." />

          <div className="form-grid">
            <FormInput
              label="Bank Name"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.bankName}
            />
            <FormInput
              label="Account Holder Name"
              name="accountHolderName"
              placeholder="As per bank records"
              value={formData.accountHolderName}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.accountHolderName}
            />
            <FormInput
              label="IFSC Code"
              name="ifscCode"
              placeholder="ABCD0123456"
              maxLength="11"
              value={formData.ifscCode}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.ifscCode}
            />
          </div>

          {isEditing && (
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? <Loader size={20} className="loader-icon" /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Bank Details'}
            </button>
          )}
        </form>
      )}

      {/* Tax Details Tab */}
      {activeTab === 'tax' && (
        <form onSubmit={handleSaveTaxDetails} className="form-section">
          <h2 className="form-section-title">Tax Information</h2>
          <AlertBox message="✓ Ensure all tax details are accurate for invoicing and compliance." />

          <div className="form-grid">
            <FormInput
              label="Tax ID / TIN"
              name="taxId"
              placeholder="Enter your Tax ID"
              value={formData.taxId}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.taxId}
            />
            <FormInput
              label="GST Number"
              name="gstNumber"
              placeholder="GST number (optional)"
              maxLength="15"
              value={formData.gstNumber}
              onChange={handleChange}
              disabled={!isEditing}
              error={validationErrors.gstNumber}
            />
            <FormInput
              label="PAN Number"
              name="panNumber"
              placeholder="ABCDE1234F"
              maxLength="10"
              value={formData.panNumber}
              onChange={handleChange}
              required
              disabled={!isEditing}
              error={validationErrors.panNumber}
            />
          </div>

          <div className="tax-format-info">
            📋 PAN Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
          </div>

          {isEditing && (
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? <Loader size={20} className="loader-icon" /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Tax Details'}
            </button>
          )}
        </form>
      )}
    </div>
  );
};
export default SellerSettings