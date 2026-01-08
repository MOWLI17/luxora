import React from 'react'
import { useState, useMemo, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { productService, cartService, wishlistService, orderService } from '../Api/services.js'
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Home from './Home';
import Productdetail from './ProductCard/Productdetail';
import Wishlist from './Wishlist';
import Cart from './Cart';
import Login from './Profile/Login';
import Forgotpassword from './Profile/Forgotpassword';
import ChangePassword from './Profile/ChangePassword';
import Profile from './Profile/Profile';
import Regester from './Profile/Regester';
import ResetPassword from './Profile/ResetPassword';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Error caught by boundary:', error);
    console.error('Error Info:', errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          background: '#fef2f2',
          padding: '40px 20px',
          textAlign: 'center',
          borderRadius: '12px',
          margin: '20px',
          border: '2px solid #fecaca'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '10px', fontSize: '24px', margin: '0 0 15px 0' }}>
            ⚠️ Something Went Wrong
          </h1>
          <p style={{ color: '#991b1b', marginBottom: '20px', fontSize: '14px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <details style={{ marginBottom: '20px', textAlign: 'left', fontSize: '12px', color: '#7f1d1d' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{ background: '#fee2e2', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => window.history.back()}
              style={{
                background: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              ⬅️ Go Back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const User = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: [0, 5000],
    rating: 0,
  });

  console.log('✅ User component mounted');

  // ✅ Load user from localStorage on mount
  useEffect(() => {
    console.log('🔍 Loading user from localStorage...');
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        const parsedUser = JSON.parse(user);
        console.log('✅ User loaded:', parsedUser.name);
        setCurrentUser(parsedUser);
      } else {
        console.log('ℹ️ No user logged in');
      }
    } catch (error) {
      console.error('❌ Error parsing user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  // ✅ Load products from backend
  useEffect(() => {
    console.log('🔍 Loading products...');
    loadProducts();
  }, [filters, searchQuery]);

  // ✅ Load cart and wishlist when user logs in
  useEffect(() => {
    if (currentUser) {
      console.log('🔍 User logged in, loading cart and wishlist...');
      loadCart();
      loadWishlist();
    }
  }, [currentUser]);

  // ✅ Load Products Function
  const loadProducts = async () => {
    try {
      console.log('📡 Fetching products...');
      const response = await productService.getAll({
        category: filters.category !== 'all' ? filters.category : undefined,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
        minRating: filters.rating,
        search: searchQuery
      });

      // Handle various response formats
      let productsData = [];
      if (response?.data?.products) {
        productsData = response.data.products;
      } else if (Array.isArray(response?.data)) {
        productsData = response.data;
      } else if (response?.products) {
        productsData = response.products;
      }

      console.log('✅ Products loaded:', productsData.length);
      setProducts(productsData);
    } catch (error) {
      console.error('❌ Error loading products:', error?.message || error);
      // Don't show error toast for 500 errors - backend may still be starting
      if (error?.response?.status !== 500) {
        Swal.fire({
          title: 'Error',
          text: error?.customMessage || 'Failed to load products',
          icon: 'error',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
      }
      setProducts([]);
    }
  };

  // ✅ Load Cart Function - FIXED
  const loadCart = async () => {
    if (!currentUser) {
      console.log('ℹ️ No user, skipping cart load');
      return;
    }

    try {
      console.log('📡 Fetching cart...');
      const response = await cartService.getCart();

      console.log('📦 Full Cart Response:', response);

      // ✅ FIX: Correct path is response.data.data.cart.items
      const cartItems = response.data?.data?.cart?.items || [];

      console.log('✅ Cart loaded:', cartItems.length, 'items');
      console.log('📋 Cart items data:', cartItems);

      setCart(Array.isArray(cartItems) ? cartItems : []);
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      setCart([]);
    }
  };

  // ✅ Load Wishlist Function
  const loadWishlist = async () => {
    if (!currentUser) {
      console.log('ℹ️ No user, skipping wishlist load');
      return;
    }

    try {
      console.log('📡 Fetching wishlist...');
      const response = await wishlistService.getWishlist();
      const wishlistItems = response.data.wishlist?.products || [];
      console.log('✅ Wishlist loaded:', wishlistItems.length, 'items');
      setWishlist(wishlistItems);
    } catch (error) {
      console.error('❌ Error loading wishlist:', error);
      setWishlist([]);
    }
  };

  // Total cart item count
  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const wishlistCount = wishlist.length;

  // Filter products (client-side for immediate response)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        filters.category === 'all' || product.category === filters.category;
      const matchesPrice =
        product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1];
      const matchesRating = product.rating >= filters.rating;

      return matchesSearch && matchesCategory && matchesPrice && matchesRating;
    });
  }, [products, searchQuery, filters]);

  // ✅ FIXED: Add to cart with proper error handling
  const handleAddToCart = async (product, showNotification = true) => {
    console.log('========== ADD TO CART DEBUG START ==========');
    console.log('Product object received:', product);
    console.log('Product keys:', Object.keys(product));

    if (!currentUser) {
      const result = await Swal.fire({
        title: 'Please Login',
        text: 'You must login to add items to cart.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
      });

      if (result.isConfirmed) {
        navigate('/user/login');
      }
      return;
    }

    try {
      // ✅ CRITICAL FIX: Extract productId from product object
      const productId = product._id || product.id;
      const quantity = product.quantity || 1;

      console.log('📦 Extracted values:');
      console.log('  productId:', productId, 'type:', typeof productId);
      console.log('  quantity:', quantity, 'type:', typeof quantity);
      console.log('  productName:', product.name);

      if (!productId) {
        console.error('❌ productId is falsy:', productId);
        throw new Error('Invalid product ID');
      }

      console.log('🛒 Calling cartService.addToCart with:');
      console.log('  Parameters: (productId:', productId, ', quantity:', quantity, ')');

      // ✅ FIXED: Pass productId and quantity as separate parameters
      const response = await cartService.addToCart(productId, quantity);

      console.log('✅ Add to cart success response:', response.data);

      await loadCart();

      if (showNotification) {
        Swal.fire({
          title: 'Added to Cart!',
          text: `${product.name} has been added to your cart`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
      }

      console.log('========== ADD TO CART DEBUG END (SUCCESS) ==========\n');

    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      console.log('Error details:', {
        message: error.message,
        customMessage: error.customMessage,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      });

      if (error.response?.data) {
        console.error('❌ Backend error response:', JSON.stringify(error.response.data, null, 2));
      }

      Swal.fire({
        title: 'Error',
        text: error.customMessage || error.response?.data?.message || 'Failed to add to cart',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });

      console.log('========== ADD TO CART DEBUG END (ERROR) ==========\n');
    }
  };

  // ✅ Increase Quantity
  const handleIncreaseQuantity = async (productId) => {
    try {
      const item = cart.find(i => i.product._id === productId || i.product.id === productId);
      if (!item) return;

      console.log('⬆️ Increasing quantity for:', productId);
      await cartService.updateCart(productId, item.quantity + 1);
      await loadCart();
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
    }
  };

  // ✅ Decrease Quantity
  const handleDecreaseQuantity = async (productId) => {
    try {
      const item = cart.find(i => i.product._id === productId || i.product.id === productId);
      if (!item) return;

      console.log('⬇️ Decreasing quantity for:', productId);
      if (item.quantity > 1) {
        await cartService.updateCart(productId, item.quantity - 1);
      } else {
        await cartService.removeFromCart(productId);
      }
      await loadCart();
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
    }
  };

  // ✅ Remove from Cart
  const handleRemoveFromCart = async (productId) => {
    try {
      console.log('🗑️ Removing from cart:', productId);
      await cartService.removeFromCart(productId);
      await loadCart();

      Swal.fire({
        title: 'Removed from Cart',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
    }
  };

  // ✅ Toggle Wishlist
  const handleToggleWishlist = async (product) => {
    if (!currentUser) {
      const result = await Swal.fire({
        title: 'Please Login',
        text: 'You must login to use wishlist.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
      });

      if (result.isConfirmed) {
        navigate('/user/login');
      }
      return;
    }

    try {
      const productId = product._id || product.id;
      const wasInWishlist = wishlist.some(
        item => (item._id || item.id) === productId
      );

      console.log('❤️ Toggling wishlist for:', productId);
      await wishlistService.toggleWishlist(productId);
      await loadWishlist();

      const isNowInWishlist = !wasInWishlist;

      Swal.fire({
        title: isNowInWishlist ? 'Added to Wishlist!' : 'Removed from Wishlist!',
        text: `${product.name} has been ${isNowInWishlist ? 'added to' : 'removed from'} your wishlist.`,
        icon: isNowInWishlist ? 'success' : 'info',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
    } catch (error) {
      console.error('❌ Error toggling wishlist:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update wishlist',
        icon: 'error',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // ✅ Check if wishlisted
  const isWishlisted = (id) => {
    return wishlist.some(item => (item._id || item.id) === id);
  };

  // ✅ FIXED CHECKOUT - Receives orderPayload from Cart component
  const handleCheckout = async (orderPayload) => {
    console.log('========== USER.JS handleCheckout START ==========');
    console.log('Received payload from Cart:', JSON.stringify(orderPayload, null, 2));

    // ✅ Check if payload has cartItems (new field name)
    if (!orderPayload || !orderPayload.cartItems || orderPayload.cartItems.length === 0) {
      console.error('❌ No cartItems in payload!');
      Swal.fire({
        title: 'Error',
        text: 'No items to checkout',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    if (!currentUser) {
      const result = await Swal.fire({
        title: 'Please Login',
        text: 'You must login to complete your purchase.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
      });

      if (result.isConfirmed) {
        navigate('/user/login');
      }
      return;
    }

    try {
      console.log('💳 Processing order...');

      // ✅ Use cartItems from payload (as structured by Cart.js)
      const cartItems = orderPayload.cartItems;
      const totalAmount = orderPayload.totalAmount || 0;

      console.log('📦 Items to send:', cartItems.length, 'items');
      console.log('💰 Total amount:', totalAmount);

      // ✅ Build exact payload structure backend expects
      const finalOrderData = {
        cartItems: cartItems,                    // ✅ CRITICAL: Use 'cartItems'
        totalAmount: totalAmount,
        paymentMethod: orderPayload.paymentMethod || 'cash on delivery',
        shippingAddress: orderPayload.shippingAddress,  // ✅ Already has correct structure
        paymentIntentId: orderPayload.paymentIntentId || null
      };

      console.log('📤 Sending to backend:', JSON.stringify(finalOrderData, null, 2));

      // ✅ Call orderService to create order
      // This calls POST /api/payment/create-order
      const response = await orderService.create(finalOrderData);

      console.log('✅ Backend response:', response.data);
      const newOrder = response.data.data?.order || response.data;

      console.log('✅ Order created with ID:', newOrder._id);

      // ✅ Clear the cart after successful order
      try {
        await cartService.clearCart();
        setCart([]);
      } catch (err) {
        console.warn('⚠️ Error clearing cart:', err);
      }

      setShowCart(false);

      // ✅ Show success message
      const result = await Swal.fire({
        title: 'Order Placed Successfully! 🎉',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 20px;">✓️</div>
            <p style="margin: 10px 0;"><strong>Order ID:</strong> <br><span style="color: #6366f1; font-weight: bold;">${newOrder._id}</span></p>
            <p style="margin: 10px 0;"><strong>Items:</strong> ${cartItems.length} item${cartItems.length > 1 ? 's' : ''}</p>
            <p style="margin: 10px 0;"><strong>Total Amount:</strong> <br><span style="color: #10b981; font-size: 18px; font-weight: bold;">₹${totalAmount.toLocaleString()}</span></p>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">Thank you for your order!</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: '📦 View My Orders',
        confirmButtonColor: '#6366f1',
        showCancelButton: true,
        cancelButtonText: '🏠 Continue Shopping',
        cancelButtonColor: '#10b981',
        allowOutsideClick: false,
      });

      console.log('========== USER.JS handleCheckout END (SUCCESS) ==========\n');

      // ✅ Navigate based on user choice
      if (result.isConfirmed) {
        navigate('/user/profile');
      } else {
        navigate('/user');
      }

    } catch (error) {
      console.error('❌ Checkout failed:', error);
      console.log('Error details:', {
        message: error.message,
        status: error.response?.status,
        backendError: error.response?.data?.message,
        fullResponse: error.response?.data
      });

      console.log('========== USER.JS handleCheckout END (ERROR) ==========\n');

      // ✅ Show detailed error message
      Swal.fire({
        title: 'Order Failed ❌',
        text: error.response?.data?.message || error.customMessage || 'Unable to place order. Please try again.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        footer: error.response?.data?.message ? `Error: ${error.response.data.message}` : ''
      });
    }
  };

  // ✅ Clear Cart
  const handleClearCart = async () => {
    if (cart.length === 0) {
      Swal.fire({
        title: 'Cart is Empty',
        text: 'There are no items to clear',
        icon: 'info',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Clear Cart?',
      text: 'Are you sure you want to remove all items?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        console.log('🗑️ Clearing entire cart...');
        await cartService.clearCart();
        setCart([]);

        Swal.fire({
          title: 'Cart Cleared',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });
      } catch (error) {
        console.error('❌ Error clearing cart:', error);
      }
    }
  };

  const handleSearch = (query) => {
    console.log('🔍 Searching for:', query);
    setSearchQuery(query);
  };

  const handleViewCart = () => {
    console.log('👀 Opening cart...');
    setShowCart(true);
  };

  // ✅ Login Success
  const handleLoginSuccess = (user, token) => {
    console.log('✅ Login success for:', user.name);
    setCurrentUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    Swal.fire({
      title: 'Welcome!',
      text: `Logged in as ${user.name}`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });

    loadCart();
    loadWishlist();
    navigate('/user');
  };

  // ✅ Register Success
  const handleRegisterSuccess = (user, token) => {
    console.log('✅ Registration success for:', user.name);
    setCurrentUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    Swal.fire({
      title: 'Account Created!',
      text: `Welcome to LUXORA, ${user.name}`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });

    navigate('/user');
  };

  // ✅ Logout
  const handleLogout = () => {
    console.log('👋 Logging out...');
    setCurrentUser(null);
    setCart([]);
    setWishlist([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    Swal.fire({
      title: 'Logged Out',
      text: 'You have been successfully logged out.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });

    navigate('/user');
  };

  // ✅ Loading State
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#6366f1'
      }}>
        ⏳ Loading...
      </div>
    );
  }

  return (
    <div className="app-container">
      <ErrorBoundary>
        <Header
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          filters={filters}
          setFilters={setFilters}
          onViewCart={handleViewCart}
          onSearch={handleSearch}
          searchQuery={searchQuery}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </ErrorBoundary>

      {showCart && (
        <ErrorBoundary>
          <Cart
            cart={cart}
            onRemoveFromCart={handleRemoveFromCart}
            onIncreaseQuantity={handleIncreaseQuantity}
            onDecreaseQuantity={handleDecreaseQuantity}
            onCheckout={handleCheckout}
            onClearCart={handleClearCart}
            onClose={() => setShowCart(false)}
            currentUser={currentUser}
          />
        </ErrorBoundary>
      )}

      <div className="content-wrapper">
        <Routes>
          {/* ✅ Home Route */}
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Home
                  products={filteredProducts}
                  filters={filters}
                  setFilters={setFilters}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={isWishlisted}
                />
              </ErrorBoundary>
            }
          />

          {/* ✅ Product Detail Route */}
          <Route
            path="/product/:productId"
            element={
              <ErrorBoundary>
                <Productdetail
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={isWishlisted}
                />
              </ErrorBoundary>
            }
          />

          {/* ✅ Wishlist Route */}
          <Route
            path="/wishlist"
            element={
              <ErrorBoundary>
                <Wishlist
                  wishlist={wishlist}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={isWishlisted}
                />
              </ErrorBoundary>
            }
          />

          {/* ✅ Login Route */}
          <Route
            path="/Login"
            element={
              <ErrorBoundary>
                <Login onLoginSuccess={handleLoginSuccess} />
              </ErrorBoundary>
            }
          />

          {/* ✅ Register Route */}
          <Route
            path="/Register"
            element={
              <ErrorBoundary>
                <Regester onRegisterSuccess={handleRegisterSuccess} />
              </ErrorBoundary>
            }
          />

          {/* ✅ Profile Route */}
          <Route
            path="/profile"
            element={
              <ErrorBoundary>
                {currentUser ? (
                  <Profile currentUser={currentUser} onLogout={handleLogout} />
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <h2>Please login to view profile</h2>
                    <button
                      onClick={() => navigate('/user/login')}
                      style={{
                        background: '#6366f1',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginTop: '20px'
                      }}
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </ErrorBoundary>
            }
          />

          {/* ✅ Forgot Password Route */}
          <Route
            path="/forgot-password"
            element={
              <ErrorBoundary>
                <Forgotpassword />
              </ErrorBoundary>
            }
          />

          {/* ✅ Reset Password Route */}
          <Route
            path="/Resetpassword/:token"
            element={
              <ErrorBoundary>
                <ResetPassword />
              </ErrorBoundary>
            }
          />

          {/* ✅ Change Password Route */}
          <Route
            path="/Change-password"
            element={
              <ErrorBoundary>
                <ChangePassword />
              </ErrorBoundary>
            }
          />

          {/* ✅ 404 Catch-all Route */}
          <Route
            path="*"
            element={
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#1f2937' }}>404</h1>
                <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
                  Page not found
                </p>
                <button
                  onClick={() => navigate('/user')}
                  style={{
                    background: '#6366f1',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  🏠 Go Home
                </button>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
};


export default User