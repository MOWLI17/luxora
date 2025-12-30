// src/Api/services.js - UPDATED FOR VERCEL BACKEND
import axios from 'axios';

// ✅ UPDATED: Use your actual Vercel backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://luxora-backend-zeta.vercel.app/api';
const isDev = process.env.NODE_ENV === 'development';

console.log('[API] Environment:', process.env.NODE_ENV);
console.log('[API] Base URL:', API_BASE_URL);

const logger = {
  debug: (msg, data) => isDev && console.log(`[API] ${msg}`, data),
  warn: (msg, data) => console.warn(`[API] ${msg}`, data),
  error: (msg, data) => console.error(`[API] ${msg}`, data)
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ========== REQUEST INTERCEPTOR ==========
api.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem('token');
    const sellerToken = localStorage.getItem('sellerToken');
    const token = userToken || sellerToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('Request with token for:', config.url);
    }
    
    logger.debug('Request:', { url: config.url, method: config.method });
    return config;
  },
  (error) => {
    logger.error('Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// ========== RESPONSE INTERCEPTOR ==========
api.interceptors.response.use(
  (response) => {
    logger.debug('Response successful:', response.config.url);
    return response;
  },
  (error) => {
    logger.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Handle different error scenarios
    if (!error.response) {
      if (error.message === 'Network Error') {
        error.customMessage = '❌ Cannot connect to server. Please check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        error.customMessage = '⏱️ Request took too long. Please try again.';
      } else {
        error.customMessage = `❌ ${error.message}`;
      }
    } else if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('seller');
      error.customMessage = 'Your session has expired. Please login again.';
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      error.customMessage = 'You do not have permission to access this resource.';
    } else if (error.response?.status === 404) {
      error.customMessage = error.response.data?.message || 'Resource not found';
    } else if (error.response?.status === 409) {
      error.customMessage = error.response.data?.message || 'This resource already exists';
    } else if (error.response?.status === 400) {
      error.customMessage = error.response.data?.message || 'Invalid request data';
    } else if (error.response?.status >= 500) {
      error.customMessage = 'Server error. Please try again later.';
    } else {
      error.customMessage = error.response.data?.message || 'An error occurred';
    }

    return Promise.reject(error);
  }
);

// ========== USER AUTH SERVICE ==========
export const authService = {
  register: (data) => {
    logger.debug('Register API call');
    return api.post('/auth/register', data)
      .then(response => {
        const responseData = response.data;
        const user = responseData.user || responseData.data?.user;
        const token = responseData.token || responseData.data?.token;
        
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { data: { user, token } };
      });
  },
  
  login: (emailOrMobile, password) => {
    logger.debug('Login API call');
    const payload = { emailOrMobile, password };
    
    return api.post('/auth/login', payload)
      .then(response => {
        const responseData = response.data;
        const user = responseData.user || responseData.data?.user;
        const token = responseData.token || responseData.data?.token;
        
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        return { data: { user, token } };
      });
  },
  
  logout: () => {
    logger.debug('Logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return api.post('/auth/logout')
      .catch(() => Promise.resolve());
  },
  
  getProfile: () => {
    logger.debug('Fetching user profile');
    return api.get('/auth/profile');
  },
  
  updateProfile: (data) => {
    logger.debug('Updating user profile');
    return api.put('/auth/profile', data);
  },

  changePassword: (data) => {
    logger.debug('Change password');
    return api.post('/auth/change-password', data);
  }
};

// ========== USER SERVICE ==========
export const userService = {
  getProfile: () => {
    logger.debug('Fetching user profile');
    return api.get('/auth/profile');
  },
  
  updateProfile: (data) => {
    logger.debug('Updating user profile');
    return api.put('/auth/profile', data);
  },
  
  changePassword: (data) => {
    logger.debug('Change password');
    return api.post('/auth/change-password', data);
  },
  
  deleteAccount: () => {
    logger.debug('Deleting account');
    return api.delete('/auth/profile');
  }
};

// ========== SELLER AUTH SERVICE ==========
export const sellerAuthService = {
  register: (data) => {
    logger.debug('Seller registration');
    return api.post('/seller/auth/register', data)
      .then(response => {
        const responseData = response.data;
        const seller = responseData.seller;
        const token = responseData.token;
        
        if (token && seller) {
          localStorage.setItem('sellerToken', token);
          localStorage.setItem('seller', JSON.stringify(seller));
        }
        
        return response;
      });
  },
  
  login: (email, password) => {
    logger.debug('Seller login');
    return api.post('/seller/auth/login', { email, password })
      .then(response => {
        const responseData = response.data;
        const seller = responseData.seller;
        const token = responseData.token;
        
        if (token && seller) {
          localStorage.setItem('sellerToken', token);
          localStorage.setItem('seller', JSON.stringify(seller));
        }
        
        return response;
      });
  },
  
  logout: () => {
    logger.debug('Seller logout');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('seller');
    return api.post('/seller/auth/logout')
      .catch(() => Promise.resolve());
  },
  
  getProfile: () => {
    return api.get('/seller/auth/profile');
  },
  
  updateProfile: (data) => {
    return api.put('/seller/auth/profile', data);
  },
  
  getProducts: () => {
    return api.get('/seller/auth/products');
  },
  
  getOrders: () => {
    return api.get('/seller/auth/orders');
  },
  
  updateOrderStatus: (orderId, status) => {
    return api.put(`/seller/auth/orders/${orderId}/status`, { status });
  }
};

// ========== PRODUCT SERVICE ==========
export const productService = {
  getAll: (params) => {
    logger.debug('Get all products');
    return api.get('/products', { params });
  },
  
  getById: (id) => {
    logger.debug('Get product by ID:', id);
    return api.get(`/products/${id}`);
  },
  
  search: (query) => {
    logger.debug('Search products:', query);
    return api.get('/products', { params: { search: query } });
  },
  
  filterByCategory: (category) => {
    logger.debug('Filter by category:', category);
    return api.get('/products', { params: { category } });
  },
  
  filterByPrice: (minPrice, maxPrice) => {
    logger.debug('Filter by price:', minPrice, maxPrice);
    return api.get('/products', { params: { minPrice, maxPrice } });
  },
  
  // Seller routes
  getSellerProducts: () => {
    return api.get('/products/seller/my-products');
  },
  
  create: (data) => {
    return api.post('/products', data);
  },
  
  update: (id, data) => {
    return api.put(`/products/${id}`, data);
  },
  
  delete: (id) => {
    return api.delete(`/products/${id}`);
  },
  
  addReview: (productId, review) => {
    return api.post(`/products/${productId}/review`, review);
  }
};

// ========== CART SERVICE ==========
export const cartService = {
  getCart: () => {
    logger.debug('Getting cart');
    return api.get('/cart');
  },
  
  addToCart: (productId, quantity = 1) => {
    logger.debug('Add to cart:', { productId, quantity });
    
    if (!productId) {
      return Promise.reject(new Error('Product ID is required'));
    }

    return api.post('/cart', {
      productId: String(productId).trim(),
      quantity: parseInt(quantity) || 1
    });
  },
  
  updateCart: (productId, quantity) => {
    logger.debug('Update cart:', { productId, quantity });
    
    if (!productId) {
      return Promise.reject(new Error('Product ID is required'));
    }

    return api.put(`/cart/${productId}`, {
      quantity: parseInt(quantity) || 1
    });
  },
  
  removeFromCart: (productId) => {
    logger.debug('Remove from cart:', productId);
    
    if (!productId) {
      return Promise.reject(new Error('Product ID is required'));
    }

    return api.delete(`/cart/${productId}`);
  },
  
  clearCart: () => {
    logger.debug('Clear cart');
    return api.delete('/cart');
  }
};

// ========== WISHLIST SERVICE ==========
export const wishlistService = {
  getWishlist: () => {
    return api.get('/wishlist');
  },
  
  toggleWishlist: (productId) => {
    return api.post(`/wishlist/${productId}`);
  },
  
  removeFromWishlist: (productId) => {
    return api.delete(`/wishlist/${productId}`);
  },
  
  clearWishlist: () => {
    return api.delete('/wishlist');
  }
};

// ========== ORDER SERVICE ==========
export const orderService = {
  getAll: (status = 'all', limit = 50, page = 1) => {
    return api.get('/orders', { params: { status, limit, page } });
  },
  
  getMyOrders: () => {
    return api.get('/orders');
  },
  
  getById: (id) => {
    return api.get(`/orders/${id}`);
  },
  
  getStats: () => {
    return api.get('/orders/user/stats');
  },
  
  // ✅ FIXED: Add create method for checkout
  create: (orderData) => {
    logger.debug('Creating order');
    return api.post('/orders', orderData);
  },
  
  cancel: (id, reason) => {
    return api.put(`/orders/${id}/cancel`, { cancelReason: reason });
  },
  
  delete: (id) => {
    return api.delete(`/orders/${id}`);
  }
};

// ========== PAYMENT SERVICE ==========
export const paymentService = {
  getConfig: () => {
    return api.get('/payment/config');
  },
  
  createPaymentIntent: (amount, currency = 'inr') => {
    return api.post('/payment/create-payment-intent', { amount, currency });
  },
  
  createOrder: (orderData) => {
    return api.post('/payment/create-order', orderData);
  },
  
  confirmPayment: (orderId, paymentIntentId) => {
    return api.post('/payment/confirm-payment', { orderId, paymentIntentId });
  }
};

// ========== PASSWORD SERVICE ==========
export const passwordService = {
  forgot: (email) => {
    return api.post('/password/forgot', { email });
  },
  
  reset: (token, newPassword, confirmPassword) => {
    return api.post(`/password/reset/${token}`, { newPassword, confirmPassword });
  },
  
  change: (data) => {
    return api.post('/password/change', data);
  }
};

// ========== HELPER FUNCTIONS ==========
export const getErrorMessage = (error) => {
  if (error.customMessage) {
    return error.customMessage;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.errors) {
    return error.response.data.errors[0] || 'An error occurred';
  }

  return error.message || 'An error occurred. Please try again.';
};

export const isUserLoggedIn = () => {
  return !!localStorage.getItem('token');
};

export const isSellerLoggedIn = () => {
  return !!localStorage.getItem('sellerToken');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getCurrentSeller = () => {
  const seller = localStorage.getItem('seller');
  return seller ? JSON.parse(seller) : null;
};

export const API_URL = API_BASE_URL;

export default api;