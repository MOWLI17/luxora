import React from 'react'
import { ShoppingBag } from 'lucide-react';
import { authService } from '../Hooks/SellerApi';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import Analytics from './Analytics';
import SellerSettings from './SellerSettings';
import ProductList from './ProductList';
import ProductUpload from './ProductUpload';
import SellerHome from './SellerHome';
import SellerHeader from './SellerHeader';
import SellerRegister from './SellerRegister';
import Sellerlogin from './Sellerlogin';

const Seller = () => {
  const [authState, setAuthState] = useState('loading');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);

  const fetchSellerProducts = useCallback(async (sellerId) => {
    try {
      console.log('[SELLER] Fetching products for seller:', sellerId);
      const { getSellerProducts } = await import('../Hooks/SellerApi');
      const response = await getSellerProducts();
      console.log('[SELLER] Products fetched:', response.length);
      setProducts(response || []);
    } catch (error) {
      console.error('[SELLER] Failed to fetch products:', error);
      setProducts([]);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      console.log('[SELLER] Checking authentication...');
      const user = await authService.getCurrentUser();
      
      if (user) {
        console.log('[SELLER] User authenticated:', user.email);
        setCurrentUser(user);
        setAuthState('authenticated');
        // Fetch products for this seller
        await fetchSellerProducts(user._id);
      } else {
        console.log('[SELLER] No authenticated user found');
        setAuthState('login');
      }
    } catch (error) {
      console.error('[SELLER] Auth check failed:', error);
      setAuthState('login');
    }
  }, [fetchSellerProducts]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = useCallback((user, loginToken) => {
    console.log('[SELLER] Login successful:', user.email);
    setCurrentUser(user);
    setToken(loginToken);
    setAuthState('authenticated');
    setCurrentPage('dashboard');
    fetchSellerProducts(user._id);
  }, [fetchSellerProducts]);

  const handleRegister = useCallback((user, registerToken) => {
    console.log('[SELLER] Registration successful:', user.email);
    setCurrentUser(user);
    setToken(registerToken);
    setAuthState('authenticated');
    setCurrentPage('dashboard');
    fetchSellerProducts(user._id);
  }, [fetchSellerProducts]);

  const handleLogout = useCallback(async () => {
    try {
      console.log('[SELLER] Logging out...');
      await authService.logout();
    } catch (error) {
      console.error('[SELLER] Logout error:', error);
    }
    setCurrentUser(null);
    setToken(null);
    setProducts([]);
    setAuthState('login');
    setCurrentPage('dashboard');
  }, []);

  // Loading Screen
  if (authState === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)' 
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <ShoppingBag size={48} style={{ marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.25rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (authState === 'login') {
    return (
      <Sellerlogin
        onLogin={handleLogin} 
        onSwitchToRegister={() => setAuthState('register')} 
      />
    );
  }

  // Register Screen
  if (authState === 'register') {
    return (
      <SellerRegister 
        onRegister={handleRegister} 
        onSwitchToLogin={() => setAuthState('login')} 
      />
    );
  }

  // Main Dashboard
  return (
    <div>
      <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
        {/* Header Navigation */}
        <SellerHeader
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          currentSeller={currentUser}
          onLogout={handleLogout}
        />

        {/* Page Content */}
        {currentPage === 'dashboard' && (
          <SellerHome currentSeller={currentUser} />
        )}
        
        {currentPage === 'upload' && (
          <ProductUpload
            currentSeller={currentUser}
            authToken={token}
            onProductAdded={() => {
              if (currentUser) {
                fetchSellerProducts(currentUser._id);
              }
            }}
          />
        )}

        {currentPage === 'products' && (
          <ProductList products={products} />
        )}
        
        {currentPage === 'analytics' && (
          <Analytics products={products} />
        )}
        
        {currentPage === 'settings' && (
          <SellerSettings
            currentSeller={currentUser}
            onUpdate={(updatedSeller) => {
              console.log('[SELLER] Updating seller:', updatedSeller);
              setCurrentUser(updatedSeller);
            }}
          />
        )}
      </div>
    </div>
  );
};
export default Seller