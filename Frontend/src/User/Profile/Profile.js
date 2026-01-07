import React from 'react'
import { useState,useEffect,useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { userService,orderService } from '../../Api/services.js';
import '../CssPages/Profilecss/Profile.css'

const Profile = ({currentUser, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const [userData, setUserData] = useState({
    name: currentUser?.name || 'Guest User',
    email: currentUser?.email || 'guest@example.com',
    mobile: currentUser?.mobile || '',
    address: '',
    joinDate: 'January 2024',
    avatar: '👤',
  });

  const [editedData, setEditedData] = useState({ ...userData });

  const loadUserProfile = useCallback(async () => {
    if (!currentUser) return;

    try {
      console.log('[PROFILE] Loading user profile...');
      const response = await userService.getProfile();
      console.log('[PROFILE] Response:', response.data);
      
      const profile = response.data.user || response.data;
      
      let addressStr = '';
      
      if (profile.address) {
        if (typeof profile.address === 'object') {
          addressStr = `${profile.address.addressLine1 || ''}${
            profile.address.addressLine2 ? ', ' + profile.address.addressLine2 : ''
          }, ${profile.address.city || ''}, ${profile.address.state || ''} - ${
            profile.address.zipCode || ''
          }, ${profile.address.country || ''}`;
        } 
        else if (typeof profile.address === 'string') {
          addressStr = profile.address;
        }
      }

      const newUserData = {
        name: profile.name || 'Guest User',
        email: profile.email || '',
        mobile: profile.mobile || '',
        address: addressStr.trim() || 'Not provided',
        joinDate: profile.createdAt 
          ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) 
          : 'January 2024',
        avatar: '👤',
      };
      
      console.log('[PROFILE] Formatted user data:', newUserData);
      setUserData(newUserData);
      setEditedData(newUserData);
    } catch (error) {
      console.error('[PROFILE] Error loading profile:', error);
      
      setUserData({
        name: currentUser?.name || 'Guest User',
        email: currentUser?.email || 'guest@example.com',
        mobile: currentUser?.mobile || '',
        address: 'Not provided',
        joinDate: 'January 2024',
        avatar: '👤',
      });
    }
  }, [currentUser]);

  const loadOrders = useCallback(async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      console.log('[ORDERS] Loading orders...');
      const response = await orderService.getMyOrders();
      console.log('[ORDERS] Response:', response.data);
      
      const ordersData = response.data.orders || [];
      
      const transformedOrders = ordersData.map(order => {
        console.log('[ORDERS] Processing order:', order._id, order);
        
        return {
          id: order._id,
          date: new Date(order.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          items: (order.orderItems || []).map(item => ({
            id: item.product?._id || item.productId,
            name: item.product?.name || item.title || 'Unknown Product',
            description: item.product?.description || '',
            image: item.product?.image || '',
            price: item.price || 0,
            quantity: item.quantity || 1
          })),
          subtotal: (order.totalAmount || 0) - (order.shippingCost || 0),
          shipping: order.shippingCost || 0,
          tax: 0,
          total: order.totalAmount || 0,
          status: order.status || 'Pending',
          statusColor: getStatusColor(order.status || 'Pending'),
          shippingAddress: order.shippingAddress 
            ? `${order.shippingAddress.addressLine1 || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} - ${order.shippingAddress.zipCode || ''}, ${order.shippingAddress.country || ''}`
            : 'Address not provided'
        };
      });
      
      console.log('[ORDERS] Transformed orders:', transformedOrders);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('[ORDERS] Error loading orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#f59e0b',
      'Processing': '#3b82f6',
      'Shipped': '#8b5cf6',
      'Delivered': '#10b981',
      'Cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
      loadOrders();
    }
  }, [currentUser, loadUserProfile, loadOrders]);

  useEffect(() => {
    if (!currentUser) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Login',
        text: 'You need to login to view your profile',
        confirmButtonColor: '#6366f1'
      }).then(() => {
        navigate('/user/login');
      });
    }
  }, [currentUser, navigate]);

  const validateProfileData = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    if (!data.email || data.email.trim().length === 0) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        errors.email = 'Enter valid email';
      }
    }

    if (data.mobile && data.mobile.trim().length > 0) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(data.mobile.trim())) {
        errors.mobile = 'Mobile must be 10 digits';
      }
    }

    if (!data.address || data.address.trim().length < 10) {
      errors.address = 'Address must be at least 10 characters';
    }

    return errors;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...userData });
    setValidationErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({ ...userData });
    setValidationErrors({});
  };

  const handleSave = async () => {
    const errors = validateProfileData(editedData);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    
    try {
      const addressParts = editedData.address.split(',').map(s => s.trim());
      
      const updateData = {
        name: editedData.name.trim(),
        email: editedData.email.trim(),
        mobile: editedData.mobile.trim(),
        address: {
          addressLine1: addressParts[0] || '',
          addressLine2: addressParts[1] || '',
          city: addressParts[2] || '',
          state: addressParts[3] || '',
          zipCode: addressParts[4] || '',
          country: addressParts[5] || 'India'
        }
      };

      console.log('[PROFILE] Saving profile:', updateData);
      await userService.updateProfile(updateData);
      
      await loadUserProfile();
      
      setIsEditing(false);
      setValidationErrors({});

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile has been updated successfully.',
        confirmButtonColor: '#6366f1',
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });

    } catch (error) {
      console.error('[PROFILE] Error saving profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save profile. Please try again.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value });
    
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: undefined });
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
        navigate('/user');
      }
    });
  };

  const handleDeleteAccount = async () => {
    const { value: confirmation } = await Swal.fire({
      title: 'Delete Account',
      html: `
        <p style="color: #dc2626; font-weight: 600; margin-bottom: 15px;">
          ⚠️ This action cannot be undone!
        </p>
        <p style="margin-bottom: 15px;">
          All your data will be permanently deleted.
        </p>
        <p style="font-size: 14px; color: #6b7280;">
          Type <strong>DELETE</strong> to confirm account deletion:
        </p>
      `,
      input: 'text',
      inputPlaceholder: 'Type DELETE here',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete Account',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to type DELETE to confirm!';
        }
        if (value !== 'DELETE') {
          return 'Please type DELETE exactly to confirm';
        }
      }
    });
    
    if (confirmation === 'DELETE') {
      try {
        await userService.deleteAccount();
        
        await Swal.fire({
          icon: 'success',
          title: 'Account Deleted',
          text: 'Your account has been permanently deleted.',
          confirmButtonColor: '#6366f1',
          timer: 2000,
          showConfirmButton: false
        });
        
        onLogout();
        navigate('/user');
      } catch (error) {
        console.error('[PROFILE] Error deleting account:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to delete account. Please try again.',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const handleOrderClick = (order) => {
    if (order && order.id) {
      setSelectedOrder(order);
    }
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId) => {
    const result = await Swal.fire({
      title: 'Delete Order',
      text: 'Are you sure you want to delete this order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
      try {
        await orderService.delete(orderId);
        await loadOrders();
        setSelectedOrder(null);
        
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Order deleted successfully!',
          confirmButtonColor: '#6366f1',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (error) {
        console.error('[PROFILE] Error deleting order:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to delete order. Please try again.',
          confirmButtonColor: '#ef4444'
        });
      }
    }
  };

  const getOrderStatusBadge = (order) => {
    if (!order || !order.status) return null;
    
    return (
      <span
        className="order-status"
        style={{
          color: order.statusColor || '#6b7280',
          backgroundColor: `${order.statusColor || '#6b7280'}20`,
        }}
      >
        {order.status}
      </span>
    );
  };

  if (!currentUser) return null;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Account</h1>
          <div className="header-line" />
          <p>Manage your account information and view your order history</p>
        </div>

        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar">{userData.avatar}</div>
            <div>
              <h2>{userData.name}</h2>
              <p>Member since {userData.joinDate}</p>
            </div>
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
              disabled={isEditing}
            >
              👤 Personal
            </button>
            <button
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('orders');
                setSelectedOrder(null);
              }}
              disabled={isEditing}
            >
              📦 Orders {orders.length > 0 && `(${orders.length})`}
            </button>
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
              disabled={isEditing}
            >
              🔒 Security
            </button>
            <button
              className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
              disabled={isEditing}
            >
              ⚙️ Account
            </button>
          </div>

          {activeTab === 'personal' && (
            <div>
              <h3 className="section-title">Personal Information</h3>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={isEditing ? editedData.name : userData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`input ${isEditing ? 'editing' : ''} ${validationErrors.name ? 'input-error' : ''}`}
                  placeholder="Enter your full name"
                />
                {validationErrors.name && (
                  <div className="error-text">
                    ⚠️ {validationErrors.name}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={isEditing ? editedData.email : userData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`input ${isEditing ? 'editing' : ''} ${validationErrors.email ? 'input-error' : ''}`}
                  placeholder="Enter your email"
                />
                {validationErrors.email && (
                  <div className="error-text">
                    ⚠️ {validationErrors.email}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Mobile</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={isEditing ? editedData.mobile : userData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className={`input ${isEditing ? 'editing' : ''} ${validationErrors.mobile ? 'input-error' : ''}`}
                  placeholder="Enter your mobile number"
                  maxLength="10"
                />
                {validationErrors.mobile && (
                  <div className="error-text">
                    ⚠️ {validationErrors.mobile}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={isEditing ? editedData.address : userData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={`input ${isEditing ? 'editing' : ''} ${validationErrors.address ? 'input-error' : ''}`}
                  placeholder="Enter your full address"
                />
                {validationErrors.address && (
                  <div className="error-text">
                    ⚠️ {validationErrors.address}
                  </div>
                )}
              </div>

              <div className="button-row">
                {!isEditing ? (
                  <button className="btn edit-btn" onClick={handleEdit}>
                    ✏️ Edit Profile
                  </button>
                ) : (
                  <div className="button-group">
                    <button 
                      className="btn save-btn" 
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? '⏳ Saving...' : '✔ Save Changes'}
                    </button>
                    <button 
                      className="btn cancel-btn" 
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              {isLoading ? (
                <div className="loading-state">
                  <p>⏳ Loading orders...</p>
                </div>
              ) : !selectedOrder ? (
                <>
                  <h3 className="section-title">Order History</h3>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div 
                        key={order.id} 
                        className="order-card"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="order-header">
                          <span className="order-id">{order.id}</span>
                          {getOrderStatusBadge(order)}
                        </div>
                        <p className="order-details">
                          <span>📅 {order.date}</span>
                          <span>📦 {order.items.length} items</span>
                          <span>💰 ${order.total.toFixed(2)}</span>
                        </p>
                        <p className="order-click-hint">
                          Click to view details →
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="empty-state-icon">📦</p>
                      <p className="empty-state-text">No orders yet</p>
                      <p className="empty-state-subtext">
                        Your orders will appear here once you make a purchase
                      </p>
                      <button 
                        className="btn edit-btn" 
                        onClick={() => navigate('/user')}
                      >
                        🛍️ Start Shopping
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="order-details-view">
                  <button 
                    className="back-to-orders-btn"
                    onClick={handleBackToOrders}
                  >
                    ← Back to Orders
                  </button>
                  
                  <h3 className="section-title">Order Details</h3>
                  
                  <div className="order-detail-header">
                    <div>
                      <h4 className="order-detail-id">{selectedOrder.id}</h4>
                      <p className="order-detail-date">Placed on {selectedOrder.date}</p>
                    </div>
                    {getOrderStatusBadge(selectedOrder)}
                  </div>

                  <div className="order-items-section">
                    <h4 className="section-subtitle">Items Ordered</h4>
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="order-item-card">
                        <div className="order-item-image">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                            />
                          ) : (
                            <span className="item-placeholder">📦</span>
                          )}
                        </div>
                        <div className="order-item-details">
                          <h5>{item.name}</h5>
                          <p className="item-description">{item.description}</p>
                          <div className="item-price-qty">
                            <span>Quantity: {item.quantity}</span>
                            <span className="item-price">${item.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary-section">
                    <h4 className="section-subtitle">Order Summary</h4>
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Shipping:</span>
                      <span>${selectedOrder.shipping.toFixed(2)}</span>
                    </div>
                    <div className="summary-row total-row">
                      <span>Total:</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedOrder.shippingAddress && (
                    <div className="shipping-address-section">
                      <h4 className="section-subtitle">📍 Shipping Address</h4>
                      <p className="shipping-address-text">
                        {selectedOrder.shippingAddress}
                      </p>
                    </div>
                  )}

                  <div className="order-actions">
                    <button 
                      className="btn edit-btn"
                      onClick={handleBackToOrders}
                    >
                      ← Back to All Orders
                    </button>
                    <button 
                      className="btn delete-btn"
                      onClick={() => handleDeleteOrder(selectedOrder.id)}
                    >
                      🗑️ Delete Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 className="section-title">Security Settings</h3>
              
              <div className="security-card security-card-green">
                <h4>🔐 Password Management</h4>
                <p>Keep your account secure by using a strong, unique password</p>
                <p className="security-meta">Last changed: Never or Unknown</p>
                <button 
                  className="btn edit-btn security-action-btn" 
                  onClick={() => navigate('/user/change-password')}
                >
                  🔑 Change Password
                </button>
              </div>
          
              <div className="security-card security-card-purple">
                <h4>🔔 Forgot Password?</h4>
                <p>If you've forgotten your password, you can reset it here</p>
                <button 
                  className="btn action-btn-primary"
                  onClick={() => navigate('/user/forgot-password')}
                >
                  📧 Reset Password via Email
                </button>
              </div>
          
              <div className="security-card security-card-blue">
                <h4>📱 Two-Factor Authentication</h4>
                <p>Add an extra layer of security to your account</p>
                <p className="security-meta">
                  Status: <strong className="status-disabled">Disabled</strong>
                </p>
                <button 
                  className="btn action-btn-primary"
                  onClick={() => {
                    Swal.fire({
                      icon: 'info',
                      title: 'Coming Soon',
                      text: '2FA feature coming soon!',
                      confirmButtonColor: '#6366f1'
                    });
                  }}
                >
                  ✓ Enable 2FA
                </button>
              </div>
          
              <div className="security-best-practices">
                <h4>🛡️ Security Best Practices</h4>
                <ul>
                  <li>
                    <span className="checkmark">✓</span>
                    Enable two-factor authentication when available
                  </li>
                  <li>
                    <span className="checkmark">✓</span>
                    Use a unique password for your LUXORA account
                  </li>
                  <li>
                    <span className="checkmark">✓</span>
                    Change your password regularly (every 3-6 months)
                  </li>
                  <li>
                    <span className="checkmark">✓</span>
                    Never share your password with anyone
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h3 className="section-title">Account Management</h3>
              
              <div className="security-card security-card-yellow">
                <h4>⚙️ Account Preferences</h4>
                <p>Member since {userData.joinDate}</p>
                <p className="account-meta">Total Orders: {orders.length}</p>
              </div>

              <div className="logout-box">
                <h4>🚪 Sign Out</h4>
                <p>You will be logged out of your account</p>
                <button className="btn logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>

              <div className="delete-account-box">
                <h4>🗑️ Delete Account</h4>
                <p>Permanently delete your account and all associated data</p>
                <p className="warning-text">
                  ⚠️ Warning: This action cannot be undone. All your data will be permanently deleted.
                </p>
                <button className="btn delete-btn" onClick={handleDeleteAccount}>
                  Delete Account Permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile