import axios from 'axios';

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
  timeout: 20000,
});

// ===== REQUEST INTERCEPTOR =====
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

// ===== RESPONSE INTERCEPTOR =====
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

    if (!error.response) {
      if (error.message === 'Network Error') {
        error.customMessage = '❌ Cannot connect to server. Check internet connection.';
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
      error.customMessage = 'Session expired. Please login again.';
      window.location.href = '/';
    } else if (error.response?.status === 403) {
      error.customMessage = 'You do not have permission to access this.';
    } else if (error.response?.status === 404) {
      error.customMessage = error.response.data?.message || 'Resource not found';
    } else if (error.response?.status >= 500) {
      error.customMessage = 'Server error. Please try again later.';
    } else {
      error.customMessage = error.response.data?.message || 'An error occurred';
    }

    return Promise.reject(error);
  }
);

// ===== USER AUTH =====
export const authService = {
  register: (data) => {
    logger.debug('Register API call');
    return api.post('/auth/register', data)
      .then(response => {
        const { user, token } = response.data;
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
      });
  },
  
  login: (emailOrMobile, password) => {
    logger.debug('Login API call');
    return api.post('/auth/login', { emailOrMobile, password })
      .then(response => {
        const { user, token } = response.data;
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        return response.data;
      });
  },
  
  logout: () => {
    logger.debug('Logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return api.post('/auth/logout').catch(() => Promise.resolve());
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

// ===== SELLER AUTH =====
export const sellerAuthService = {
  register: (data) => {
    logger.debug('Seller registration');
    return api.post('/seller/auth/register', data)
      .then(response => {
        const { seller, token } = response.data;
        if (token && seller) {
          localStorage.setItem('sellerToken', token);
          localStorage.setItem('seller', JSON.stringify(seller));
        }
        return response.data;
      });
  },
  
  login: (email, password) => {
    logger.debug('Seller login');
    return api.post('/seller/auth/login', { email, password })
      .then(response => {
        const { seller, token } = response.data;
        if (token && seller) {
          localStorage.setItem('sellerToken', token);
          localStorage.setItem('seller', JSON.stringify(seller));
        }
        return response.data;
      });
  },
  
  logout: () => {
    logger.debug('Seller logout');
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('seller');
    return api.post('/seller/auth/logout').catch(() => Promise.resolve());
  },
  
  getProfile: () => {
    return api.get('/seller/auth/profile');
  },
  
  getProducts: () => {
    return api.get('/seller/auth/products');
  },
  
  getOrders: () => {
    return api.get('/seller/auth/orders');
  }
};

// ===== PRODUCTS =====
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
  
  filterByPrice: (minPrice, maxPrice) => {
    logger.debug('Filter by price:', minPrice, maxPrice);
    return api.get('/products', { params: { minPrice, maxPrice } });
  }
};

// ===== CART =====
export const cartService = {
  getCart: () => {
    logger.debug('Getting cart');
    return api.get('/cart');
  },
  
  addToCart: (productId, quantity = 1) => {
    logger.debug('Add to cart:', { productId, quantity });
    return api.post('/cart', {
      productId: String(productId).trim(),
      quantity: parseInt(quantity) || 1
    });
  },
  
  updateCart: (productId, quantity) => {
    logger.debug('Update cart:', { productId, quantity });
    return api.put(`/cart/${productId}`, {
      quantity: parseInt(quantity) || 1
    });
  },
  
  removeFromCart: (productId) => {
    logger.debug('Remove from cart:', productId);
    return api.delete(`/cart/${productId}`);
  },
  
  clearCart: () => {
    logger.debug('Clear cart');
    return api.delete('/cart');
  }
};

// ===== WISHLIST =====
export const wishlistService = {
  getWishlist: () => {
    return api.get('/wishlist');
  },
  
  toggleWishlist: (productId) => {
    return api.post(`/wishlist/${productId}`);
  },
  
  removeFromWishlist: (productId) => {
    return api.delete(`/wishlist/${productId}`);
  }
};

// ===== ORDERS =====
export const orderService = {
  getMyOrders: () => {
    return api.get('/orders');
  },
  
  getById: (id) => {
    return api.get(`/orders/${id}`);
  },
  
  create: (orderData) => {
    logger.debug('Creating order');
    return api.post('/orders', orderData);
  }
};

// ===== PAYMENT =====
export const paymentService = {
  getConfig: () => {
    return api.get('/payment/config');
  },
  
  createPaymentIntent: (amount, currency = 'inr') => {
    return api.post('/payment/create-payment-intent', { amount, currency });
  }
};

// ===== HELPERS =====
export const getErrorMessage = (error) => {
  if (error.customMessage) return error.customMessage;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors) return error.response.data.errors[0];
  return error.message || 'An error occurred';
};

export const isUserLoggedIn = () => !!localStorage.getItem('token');
export const isSellerLoggedIn = () => !!localStorage.getItem('sellerToken');
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
