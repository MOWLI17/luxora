// src/Api/services.js - FINAL (VercEL READY)
import axios from 'axios';

/* ======================================================
   ENV & BASE CONFIG
====================================================== */
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'https://luxora-backend-zeta.vercel.app/api';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  console.log('[API] Environment:', process.env.NODE_ENV);
  console.log('[API] Base URL:', API_BASE_URL);
}

/* ======================================================
   LOGGER
====================================================== */
const logger = {
  debug: (...args) => isDev && console.log('[API]', ...args),
  warn: (...args) => isDev && console.warn('[API]', ...args),
  error: (...args) => console.error('[API]', ...args),
};

/* ======================================================
   AXIOS INSTANCE
====================================================== */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/* ======================================================
   AUTH HELPERS
====================================================== */
const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('sellerToken');
  localStorage.removeItem('seller');
};

/* ======================================================
   REQUEST INTERCEPTOR
====================================================== */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('sellerToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logger.debug('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    logger.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

/* ======================================================
   RESPONSE INTERCEPTOR
====================================================== */
api.interceptors.response.use(
  (response) => {
    logger.debug('Response:', response.config.url);
    return response;
  },
  (error) => {
    const status = error.response?.status;

    logger.error('API Error:', {
      url: error.config?.url,
      status,
      message: error.message,
    });

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.customMessage = 'Request timeout. Please try again.';
      } else {
        error.customMessage =
          'Cannot connect to server. Check your internet connection.';
      }
    } else {
      switch (status) {
        case 400:
          error.customMessage =
            error.response.data?.message || 'Invalid request';
          break;

        case 401:
          clearAuthStorage();
          error.customMessage = 'Session expired. Please login again.';
          if (window.location.pathname !== '/') {
            window.location.replace('/');
          }
          break;

        case 403:
          error.customMessage = 'Access denied.';
          break;

        case 404:
          error.customMessage =
            error.response.data?.message || 'Resource not found';
          break;

        case 409:
          error.customMessage =
            error.response.data?.message || 'Conflict occurred';
          break;

        default:
          if (status >= 500) {
            error.customMessage = 'Server error. Try again later.';
          } else {
            error.customMessage =
              error.response.data?.message || 'Unexpected error occurred';
          }
      }
    }

    return Promise.reject(error);
  }
);

/* ======================================================
   AUTH SERVICE (USER)
====================================================== */
export const authService = {
  register: (data) =>
    api.post('/auth/register', data).then((res) => {
      const user = res.data?.user;
      const token = res.data?.token;
      if (user && token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      return res;
    }),

  login: (emailOrMobile, password) =>
    api.post('/auth/login', { emailOrMobile, password }).then((res) => {
      const user = res.data?.user;
      const token = res.data?.token;
      if (user && token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      return res;
    }),

  logout: () => {
    clearAuthStorage();
    return Promise.resolve();
  },
};

/* ======================================================
   USER SERVICE
====================================================== */
export const userService = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  deleteAccount: () => api.delete('/auth/profile'),
};

/* ======================================================
   SELLER AUTH SERVICE
====================================================== */
export const sellerAuthService = {
  register: (data) =>
    api.post('/seller/auth/register', data).then((res) => {
      if (res.data?.token && res.data?.seller) {
        localStorage.setItem('sellerToken', res.data.token);
        localStorage.setItem('seller', JSON.stringify(res.data.seller));
      }
      return res;
    }),

  login: (email, password) =>
    api.post('/seller/auth/login', { email, password }).then((res) => {
      if (res.data?.token && res.data?.seller) {
        localStorage.setItem('sellerToken', res.data.token);
        localStorage.setItem('seller', JSON.stringify(res.data.seller));
      }
      return res;
    }),

  logout: () => {
    clearAuthStorage();
    return Promise.resolve();
  },

  getProfile: () => api.get('/seller/auth/profile'),
  updateProfile: (data) => api.put('/seller/auth/profile', data),
  getProducts: () => api.get('/seller/auth/products'),
  getOrders: () => api.get('/seller/auth/orders'),
  updateOrderStatus: (orderId, status) =>
    api.put(`/seller/auth/orders/${orderId}/status`, { status }),
};

/* ======================================================
   PRODUCT SERVICE
====================================================== */
export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  search: (search) => api.get('/products', { params: { search } }),
  filterByCategory: (category) =>
    api.get('/products', { params: { category } }),
  filterByPrice: (minPrice, maxPrice) =>
    api.get('/products', { params: { minPrice, maxPrice } }),

  getSellerProducts: () => api.get('/products/seller/my-products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, review) =>
    api.post(`/products/${id}/review`, review),
};

/* ======================================================
   CART SERVICE
====================================================== */
export const cartService = {
  getCart: () => api.get('/cart'),

  addToCart: (productId, quantity = 1) =>
    api.post('/cart', {
      productId: String(productId),
      quantity: Math.max(1, Number(quantity)),
    }),

  updateCart: (productId, quantity) =>
    api.put(`/cart/${productId}`, {
      quantity: Math.max(1, Number(quantity)),
    }),

  removeFromCart: (productId) =>
    api.delete(`/cart/${productId}`),

  clearCart: () => api.delete('/cart'),
};

/* ======================================================
   WISHLIST SERVICE
====================================================== */
export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  toggleWishlist: (id) => api.post(`/wishlist/${id}`),
  removeFromWishlist: (id) => api.delete(`/wishlist/${id}`),
  clearWishlist: () => api.delete('/wishlist'),
};

/* ======================================================
   ORDER SERVICE
====================================================== */
export const orderService = {
  getAll: (status = 'all', limit = 50, page = 1) =>
    api.get('/orders', { params: { status, limit, page } }),

  getMyOrders: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getStats: () => api.get('/orders/user/stats'),
  create: (data) => api.post('/orders', data),
  cancel: (id, reason) =>
    api.put(`/orders/${id}/cancel`, { cancelReason: reason }),
  delete: (id) => api.delete(`/orders/${id}`),
};

/* ======================================================
   PAYMENT SERVICE
====================================================== */
export const paymentService = {
  getConfig: () => api.get('/payment/config'),
  createPaymentIntent: (amount, currency = 'inr') =>
    api.post('/payment/create-payment-intent', { amount, currency }),
  createOrder: (data) =>
    api.post('/payment/create-order', data),
  confirmPayment: (orderId, paymentIntentId) =>
    api.post('/payment/confirm-payment', {
      orderId,
      paymentIntentId,
    }),
};

/* ======================================================
   PASSWORD SERVICE
====================================================== */
export const passwordService = {
  forgot: (email) => api.post('/password/forgot', { email }),
  reset: (token, newPassword, confirmPassword) =>
    api.post(`/password/reset/${token}`, {
      newPassword,
      confirmPassword,
    }),
  change: (data) => api.post('/password/change', data),
};

/* ======================================================
   HELPERS
====================================================== */
export const getErrorMessage = (error) =>
  error.customMessage ||
  error.response?.data?.message ||
  error.message ||
  'Something went wrong';

export const isUserLoggedIn = () =>
  !!localStorage.getItem('token');

export const isSellerLoggedIn = () =>
  !!localStorage.getItem('sellerToken');

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
