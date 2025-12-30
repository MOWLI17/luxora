// src/Hooks/SellerApi.js - COMPLETE FIXED VERSION
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://luxora-backend-zeta.vercel.app/api';

console.log('[SELLERAPI] API_URL:', API_URL);

// ===== HELPER FUNCTIONS =====

const getToken = async () => {
  try {
    const tokenData = await window.storage?.get('sellerToken');
    return tokenData ? tokenData.value : localStorage.getItem('sellerToken');
  } catch (error) {
    return localStorage.getItem('sellerToken');
  }
};

const setToken = async (token) => {
  try {
    if (token) {
      await window.storage?.set('sellerToken', token);
      localStorage.setItem('sellerToken', token);
    } else {
      await window.storage?.delete('sellerToken');
      await window.storage?.delete('seller');
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('seller');
    }
  } catch (e) {
    if (token) {
      localStorage.setItem('sellerToken', token);
    } else {
      localStorage.removeItem('sellerToken');
      localStorage.removeItem('seller');
    }
  }
};

const setSeller = async (seller) => {
  try {
    if (seller) {
      await window.storage?.set('seller', JSON.stringify(seller));
      localStorage.setItem('seller', JSON.stringify(seller));
    }
  } catch (e) {
    if (seller) {
      localStorage.setItem('seller', JSON.stringify(seller));
    }
  }
};

const getSeller = async () => {
  try {
    const seller = await window.storage?.get('seller');
    if (seller) return JSON.parse(seller.value);
  } catch (e) {
    console.log('[API] Storage get error');
  }
  
  const stored = localStorage.getItem('seller');
  return stored ? JSON.parse(stored) : null;
};

// ===== API RESPONSE HANDLER =====

const handleResponse = async (response, isJson = true) => {
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    console.error('[API] Response error:', response.status, data);
    
    // Handle 401 - unauthorized
    if (response.status === 401) {
      await setToken(null);
      throw new Error(data.message || 'Unauthorized - Please login again');
    }
    
    throw new Error(data.message || `Error: ${response.statusText}`);
  }

  return data;
};

// ===== AUTHENTICATION ENDPOINTS =====

export const authService = {
  login: async (email, password) => {
    try {
      console.log('[AUTH] Login attempt for:', email);
      
      const response = await fetch(`${API_URL}/seller/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await handleResponse(response);

      console.log('[AUTH] Login successful, saving token');
      await setToken(data.token);
      await setSeller(data.seller);

      console.log('[AUTH] Login complete:', data.seller);
      return { success: true, user: data.seller, token: data.token };
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return { success: false, message: error.message };
    }
  },

  register: async (userData) => {
    try {
      console.log('[AUTH] Register attempt for:', userData.email);
      
      const response = await fetch(`${API_URL}/seller/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await handleResponse(response);

      if (data.token) {
        console.log('[AUTH] Register successful, saving token');
        await setToken(data.token);
        await setSeller(data.seller);
      }

      console.log('[AUTH] Register complete:', data.seller);
      return { success: true, user: data.seller, token: data.token };
    } catch (error) {
      console.error('[AUTH] Register error:', error);
      return { success: false, message: error.message };
    }
  },

  getCurrentUser: async () => {
    try {
      const token = await getToken();
      
      if (!token) {
        console.log('[AUTH] No token found');
        return null;
      }

      console.log('[AUTH] Validating token with backend...');
      
      const response = await fetch(`${API_URL}/seller/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('[AUTH] Token invalid or expired');
          await setToken(null);
        }
        return null;
      }

      const data = await response.json();
      console.log('[AUTH] Token valid, user found:', data.seller.email);
      
      // Update stored seller data
      await setSeller(data.seller);
      
      return data.seller;
    } catch (error) {
      console.error('[AUTH] Error validating token:', error);
      return null;
    }
  },

  logout: async () => {
    try {
      console.log('[AUTH] Logout');
      const token = await getToken();
      
      if (token) {
        try {
          await fetch(`${API_URL}/seller/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
        } catch (e) {
          console.log('[AUTH] Logout API call failed (not critical)');
        }
      }
      
      await setToken(null);
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
      await setToken(null);
      return { success: true };
    }
  },

  isAuthenticated: async () => {
    const token = await getToken();
    return !!token;
  }
};

// ===== PRODUCT ENDPOINTS =====

export const getAllProducts = async () => {
  try {
    console.log('[API] Fetching all products');
    const response = await fetch(`${API_URL}/products`);
    const data = await handleResponse(response);
    return data.products || [];
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    throw error;
  }
};

export const getSellerProducts = async () => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('[API] Fetching seller products');
    
    const response = await fetch(`${API_URL}/seller/auth/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    const data = await handleResponse(response);
    return data.products || [];
  } catch (error) {
    console.error('[API] Error fetching seller products:', error);
    throw error;
  }
};

export const uploadProduct = async (productData) => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Not authenticated - please login first');
    }

    console.log('[API] Uploading product:', productData.name);

    const response = await fetch(`${API_URL}/seller/auth/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(productData)
    });

    const data = await handleResponse(response);
    console.log('[API] Product uploaded successfully');
    return data;
  } catch (error) {
    console.error('[API] Error uploading product:', error);
    throw error;
  }
};

export const getProductById = async (productId) => {
  try {
    console.log('[API] Fetching product:', productId);
    const response = await fetch(`${API_URL}/products/${productId}`);
    const data = await handleResponse(response);
    return data.product;
  } catch (error) {
    console.error('[API] Error fetching product:', error);
    throw error;
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('[API] Updating product:', productId);
    
    const response = await fetch(`${API_URL}/seller/auth/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify(productData)
    });

    const data = await handleResponse(response);
    console.log('[API] Product updated successfully');
    return data;
  } catch (error) {
    console.error('[API] Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('[API] Deleting product:', productId);
    
    const response = await fetch(`${API_URL}/seller/auth/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    const data = await handleResponse(response);
    console.log('[API] Product deleted successfully');
    return data;
  } catch (error) {
    console.error('[API] Error deleting product:', error);
    throw error;
  }
};

// ===== ORDER ENDPOINTS =====

export const getSellerOrders = async () => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('[API] Fetching seller orders');
    
    const response = await fetch(`${API_URL}/seller/auth/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    const data = await handleResponse(response);
    return data.orders || [];
  } catch (error) {
    console.error('[API] Error fetching seller orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('[API] Updating order status:', orderId);
    
    const response = await fetch(`${API_URL}/seller/auth/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: JSON.stringify({ status })
    });

    const data = await handleResponse(response);
    console.log('[API] Order status updated successfully');
    return data;
  } catch (error) {
    console.error('[API] Error updating order status:', error);
    throw error;
  }
};

// ===== CUSTOM HOOKS =====

export const useSellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        console.log('[HOOK] No token found');
        setProducts([]);
        setError(null);
        return;
      }

      const data = await getSellerProducts();
      console.log('[HOOK] Fetched products:', data);
      
      setProducts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('[HOOK] Error fetching products:', err);
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData) => {
    try {
      const newProduct = await uploadProduct(productData);
      setProducts([...products, newProduct.product]);
      return newProduct;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeProduct = async (productId) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    addProduct,
    deleteProduct: removeProduct,
    refetch: fetchProducts
  };
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: '₹0',
    totalOrders: 0,
    totalCustomers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        
        if (!token) {
          console.log('[STATS] No token found');
          return;
        }

        const products = await getSellerProducts();
        const totalValue = Array.isArray(products) 
          ? products.reduce((sum, p) => sum + (parseInt(p.price) || 0), 0)
          : 0;
        
        console.log('[STATS] Total products:', Array.isArray(products) ? products.length : 0);
        
        setStats({
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalSales: `₹${totalValue.toLocaleString()}`,
          totalOrders: 0,
          totalCustomers: 0
        });
        setError(null);
      } catch (err) {
        console.error('[STATS] Error fetching stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};

export const useSalesData = (period = '6months') => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const mockData = [
          { month: 'Jan', sales: 45000, orders: 12 },
          { month: 'Feb', sales: 52000, orders: 15 },
          { month: 'Mar', sales: 48000, orders: 14 },
          { month: 'Apr', sales: 61000, orders: 18 },
          { month: 'May', sales: 55000, orders: 16 },
          { month: 'Jun', sales: 67000, orders: 20 }
        ];
        setSalesData(mockData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('[SALES] Error fetching sales data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [period]);

  return { salesData, loading, error };
};

export const useSellerOrdersHook = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        
        if (!token) {
          console.log('[ORDERS] No token found');
          setOrders([]);
          return;
        }

        const data = await getSellerOrders();
        console.log('[ORDERS] Fetched orders:', data);
        
        setOrders(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('[ORDERS] Error fetching orders:', err);
        setError(err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, loading, error };
};

// Default export
const SellerApiService = {
  getAllProducts,
  getSellerProducts,
  uploadProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerOrders,
  updateOrderStatus,
  useSellerProducts,
  useDashboardStats,
  useSalesData,
  useSellerOrdersHook,
  authService
};

export default SellerApiService;
