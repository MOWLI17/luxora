import React from 'react'
import { useState,useEffect,useRef} from 'react';
import {  RefreshCw,Bell } from 'lucide-react';
import './CssPage/SellerHome.css';
import Analytics from './Analytics';
import Ordernotification from './Ordernotification';
import Orderhistory from './Orderhistory';


const API_URL = 'https://luxora-backend-sigma.vercel.app/api';


const SellerHome = ({ currentSeller }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNewOrder, setHasNewOrder] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const pollIntervalRef = useRef(null);
  const lastOrderCountRef = useRef(0);
  const clearedOrderIdsRef = useRef(new Set()); // ✅ Tracks permanently cleared orders
  const lastFetchTimeRef = useRef(null); // ✅ NEW: Track when orders were last cleared

  const getToken = async () => {
    try {
      const result = await window.storage?.get?.('sellerToken');
      return result?.value || localStorage.getItem('sellerToken');
    } catch {
      return localStorage.getItem('sellerToken');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/seller/auth/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/seller/auth/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      let newOrders = data.orders || [];

      // ✅ UPDATED: Filter out cleared orders (permanent removal)
      newOrders = newOrders.filter(order => !clearedOrderIdsRef.current.has(order._id));

      // ✅ NEW: Only show orders created AFTER the last clear time
      if (lastFetchTimeRef.current) {
        newOrders = newOrders.filter(order => {
          const orderTime = new Date(order.createdAt).getTime();
          return orderTime > lastFetchTimeRef.current;
        });
      }

      // Check if new orders came in
      if (newOrders.length > lastOrderCountRef.current) {
        setHasNewOrder(true);
        setTimeout(() => setHasNewOrder(false), 3000);
      }

      lastOrderCountRef.current = newOrders.length;
      setOrders(newOrders);
      
      // Update unread count
      if (!showNotifications) {
        setUnreadCount(newOrders.length);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // ✅ NEW: Handle notification button click
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
    }
  };

  // ✅ UPDATED: Clear all orders permanently
  const handleClearAllOrders = () => {
    try {
      console.log('[SELLERHOME] Clearing all orders permanently');
      
      // Add all current orders to cleared set (permanent)
      orders.forEach(order => clearedOrderIdsRef.current.add(order._id));
      
      // ✅ NEW: Set the clear time - only show orders created AFTER this moment
      lastFetchTimeRef.current = new Date().getTime();
      
      setOrders([]);
      setUnreadCount(0);
      lastOrderCountRef.current = 0;
      
      console.log('[SELLERHOME] All orders cleared permanently - only NEW orders will show');
    } catch (error) {
      console.error('[SELLERHOME] Error clearing orders:', error);
    }
  };

  // ✅ UPDATED: Delete single order permanently
  const handleDeleteOrder = (orderId) => {
    try {
      console.log('[SELLERHOME] Deleting order permanently:', orderId);
      
      // Add to cleared set (permanent)
      clearedOrderIdsRef.current.add(orderId);
      
      // Remove from display
      setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      lastOrderCountRef.current = Math.max(0, lastOrderCountRef.current - 1);
      
      console.log('[SELLERHOME] Order deleted permanently');
    } catch (error) {
      console.error('[SELLERHOME] Error deleting order:', error);
    }
  };

  // ✅ UPDATED: Refresh button now resets everything
  const handleRefresh = async () => {
    console.log('[SELLERHOME] Refreshing data - showing all orders again');
    clearedOrderIdsRef.current.clear();
    lastFetchTimeRef.current = null; 
    await fetchProducts();
    await fetchOrders();
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchOrders()]);
      setLoading(false);
    };

    loadDashboard();
    
    pollIntervalRef.current = setInterval(fetchOrders, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', position: 'relative', background: '#f9fafb' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Seller Dashboard</h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Welcome, {currentSeller?.businessName || 'Seller'}!</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* ✅ Notification Button */}
            <button
              onClick={handleNotificationClick}
              style={{
                padding: '0.75rem 1.5rem',
                background: hasNewOrder || unreadCount > 0 ? '#ef4444' : '#f97316',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = hasNewOrder || unreadCount > 0 ? '#dc2626' : '#ea580c';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = hasNewOrder || unreadCount > 0 ? '#ef4444' : '#f97316';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              title="View notifications"
            >
              <Bell size={18} />
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#fbbf24',
                  color: '#78350f',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: '2px solid white'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={handleRefresh}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#2563eb';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#3b82f6';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              title="Refresh dashboard (shows all orders again)"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            
            <button
              onClick={() => setShowOrderHistory(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#e5e7eb',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#d1d5db';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#e5e7eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
              title="View order history"
            >
              📋 History ({orders.length})
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem 2rem', background: '#fee2e2', color: '#991b1b' }}>
            ⚠️ {error}
          </div>
        )}

        <Analytics products={products} confirmedOrders={orders} />
      </div>

      {showNotifications && (
        <Ordernotification
          orders={orders}
          hasNewOrder={hasNewOrder}
          onClose={() => {
            setShowNotifications(false);
            setUnreadCount(0);
          }}
          onClearAll={handleClearAllOrders}
          onDeleteOrder={handleDeleteOrder}
        />
      )}

      {showOrderHistory && (
        <Orderhistory
          orders={orders}
          onClose={() => setShowOrderHistory(false)}
        />
      )}
    </div>
  );
};
export default SellerHome