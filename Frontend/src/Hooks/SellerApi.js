import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://luxora-backend-zeta.vercel.app/api';

console.log('[SELLERAPI] API_BASE_URL:', API_BASE_URL);

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

const handleResponse = async (response, isJson = true) => {
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    console.error('[API] Response error:', response.status, data);
    
    if (response.status === 401) {
      await setToken(null);
      throw new Error(data.message || 'Unauthorized');
    }
    
    throw new Error(data.message || `Error: ${response.statusText}`);
  }

  return data;
};

export const authService = {
  login: async (email, password) => {
    try {
      console.log('[AUTH] Login attempt for:', email);
      
      const response = await fetch(`${API_BASE_URL}/seller/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await handleResponse(response);
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
      
      const response = await fetch(`${API_BASE_URL}/seller/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await handleResponse(response);
      if (data.token) {
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

  logout: async () => {
    try {
      console.log('[AUTH] Logout');
      await setToken(null);
      return { success: true };
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
      await setToken(null);
      return { success: true };
    }
  }
};

export const getAllProducts = async () => {
  try {
    console.log('[API] Fetching all products');
    const response = await fetch(`${API_BASE_URL}/products`);
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
    
    const response = await fetch(`${API_BASE_URL}/seller/auth/products`, {
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

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
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

const SellerApiService = {
  getAllProducts,
  getSellerProducts,
  useSellerProducts,
  useDashboardStats,
  authService
};

export default SellerApiService;
