import React from 'react'
import { useState } from 'react';
import { Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { API_URL } from '../Config/config';
import Swal from 'sweetalert2';
import './CssPage/ProductUpload.css';

const ProductUpload = ({ currentSeller }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: '',
    brand: '',
    images: []
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports',
    'Books',
    'Toys',
    'Food',
    'Beauty',
    'Accessories',
    'Other'
  ];

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Convert file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => {
        reader.abort();
        reject(new Error('Failed to read file'));
      };

      reader.onload = () => {
        try {
          resolve(reader.result);
        } catch (error) {
          reject(error);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  // Handle Image Upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    // Validate file types
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload only image files (JPEG, PNG, WebP, GIF)',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    // Validate file size
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Each image must be less than 5MB',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    setUploadingImages(true);

    try {
      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);

      // Convert files to Base64
      const base64Images = await Promise.all(
        files.map(file => convertToBase64(file))
      );

      // Update form data with new images
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...base64Images]
      }));

      // Clear any existing image errors
      if (errors.images) {
        setErrors(prev => ({ ...prev, images: '' }));
      }

      // Show success message
      Swal.fire({
        icon: 'success',
        title: 'Images Uploaded!',
        text: `${files.length} image(s) added successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Error processing images. Please try again.',
        confirmButtonColor: '#ef4444'
      });
      // Remove previews on error
      setImagePreviews(prev =>
        prev.slice(0, prev.length - files.length)
      );
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove specific image
  const removeImage = (index) => {
    Swal.fire({
      title: 'Remove Image?',
      text: 'Are you sure you want to remove this image?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Revoke object URL
        URL.revokeObjectURL(imagePreviews[index]);

        // Update state
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        }));

        Swal.fire({
          icon: 'success',
          title: 'Removed!',
          text: 'Image has been removed.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim())
      newErrors.name = 'Product name is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.category)
      newErrors.category = 'Category is required';
    if (!formData.price)
      newErrors.price = 'Price is required';
    if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) < 0
    )
      newErrors.price = 'Price must be a valid positive number';
    if (!formData.stock)
      newErrors.stock = 'Stock quantity is required';
    if (
      isNaN(parseInt(formData.stock)) ||
      parseInt(formData.stock) < 0
    )
      newErrors.stock = 'Stock must be a valid number';
    if (!formData.brand.trim())
      newErrors.brand = 'Brand name is required';
    if (
      formData.originalPrice &&
      isNaN(parseFloat(formData.originalPrice))
    )
      newErrors.originalPrice = 'Original price must be a valid number';

    if (formData.images.length < 4) {
      newErrors.images = 'At least 4 product images are required';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);

      // Show loading alert
      Swal.fire({
        title: 'Uploading Product...',
        html: 'Please wait while we process your product',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        // Get authentication token
        const token =
          localStorage.getItem('sellerToken') ||
          localStorage.getItem('token');

        if (!token) {
          Swal.fire({
            icon: 'error',
            title: 'Authentication Required',
            text: 'You must be logged in to upload a product',
            confirmButtonColor: '#ef4444'
          });
          setLoading(false);
          return;
        }

        // Prepare product data
        const productData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice
            ? parseFloat(formData.originalPrice)
            : parseFloat(formData.price),
          stock: parseInt(formData.stock),
          brand: formData.brand.trim(),
          images: formData.images
        };

        console.log('[ProductUpload] Using API_URL:', API_URL);
        console.log('[ProductUpload] Submitting to:', `${API_URL}/products`);

        // Submit to API
        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (response.ok) {
          // Show success alert
          Swal.fire({
            icon: 'success',
            title: 'Product Uploaded Successfully!',
            html: `<b>${formData.name}</b> has been added to your store`,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Great!'
          });

          // Clean up preview URLs
          imagePreviews.forEach(url => URL.revokeObjectURL(url));

          // Reset form
          setFormData({
            name: '',
            description: '',
            category: '',
            price: '',
            originalPrice: '',
            stock: '',
            brand: '',
            images: []
          });
          setImagePreviews([]);
          setErrors({});
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: data.message || 'Failed to upload product. Please try again.',
            confirmButtonColor: '#ef4444'
          });
        }
      } catch (error) {
        console.error('Error uploading product:', error);
        Swal.fire({
          icon: 'error',
          title: 'Network Error',
          text: 'Error uploading product. Please check your connection and try again.',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);

      // Show first error as alert
      const firstErrorKey = Object.keys(newErrors)[0];
      const firstError = newErrors[firstErrorKey];

      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: firstError,
        confirmButtonColor: '#f59e0b'
      });
    }
  };

  // Handle clear form
  const handleClearForm = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      originalPrice: '',
      stock: '',
      brand: '',
      images: []
    });
    setImagePreviews([]);
    setErrors({});
  };

  return (
    <div className="product-upload-wrapper">
      <div className="product-upload-container">
        <h1 className="upload-title">📦 Upload New Product</h1>
        <p className="upload-subtitle">
          Add a new product to your store inventory
        </p>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Product Name */}
          <div className="form-group">
            <label className="form-label">
              Product Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className={`form-input ${errors.name ? 'error' : ''}`}
            />
            {errors.name && (
              <p className="error-text">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">
              Description <span className="required">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your product in detail"
              rows="5"
              className={`form-input form-textarea ${
                errors.description ? 'error' : ''
              }`}
            />
            {errors.description && (
              <p className="error-text">{errors.description}</p>
            )}
          </div>

          {/* Category & Brand */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`form-input form-select ${
                  errors.category ? 'error' : ''
                }`}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="error-text">{errors.category}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Brand <span className="required">*</span>
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Enter brand name"
                className={`form-input ${errors.brand ? 'error' : ''}`}
              />
              {errors.brand && (
                <p className="error-text">{errors.brand}</p>
              )}
            </div>
          </div>

          {/* Price & Original Price */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Price (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className={`form-input ${errors.price ? 'error' : ''}`}
              />
              {errors.price && (
                <p className="error-text">{errors.price}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Original Price (₹)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                placeholder="For discount calculation"
                step="0.01"
                className={`form-input ${
                  errors.originalPrice ? 'error' : ''
                }`}
              />
              {errors.originalPrice && (
                <p className="error-text">{errors.originalPrice}</p>
              )}
            </div>
          </div>

          {/* Stock Quantity */}
          <div className="form-group">
            <label className="form-label">
              Stock Quantity <span className="required">*</span>
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="Enter stock quantity"
              className={`form-input ${errors.stock ? 'error' : ''}`}
            />
            {errors.stock && (
              <p className="error-text">{errors.stock}</p>
            )}
          </div>

          {/* Product Images */}
          <div className="form-group">
            <label className="form-label">
              Product Images <span className="required">*</span> (Minimum 4 required)
            </label>

            {/* Upload Button */}
            <div className="upload-section">
              <label className="upload-button">
                <ImageIcon size={20} />
                {uploadingImages ? 'Processing...' : 'Choose Images'}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="file-input"
                />
              </label>
              <p className="upload-hint">
                💡 Accepted formats: JPEG, PNG, WebP, GIF (Max 5MB each)
              </p>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="image-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-card">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="preview-img"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-btn"
                      title="Remove image"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="image-index">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="image-count">
              Uploaded: {formData.images.length} image(s){' '}
              {formData.images.length < 4 &&
                `(${4 - formData.images.length} more needed)`}
            </p>

            {errors.images && (
              <p className="error-text">{errors.images}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="btn-submit"
            >
              <Upload size={20} />
              {loading
                ? 'Uploading...'
                : uploadingImages
                ? 'Processing Images...'
                : 'Upload Product'}
            </button>
            <button
              type="button"
              disabled={loading || uploadingImages}
              onClick={handleClearForm}
              className="btn-clear"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProductUpload