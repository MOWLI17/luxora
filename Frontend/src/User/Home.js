import React from 'react'
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, X, Award, Loader } from 'lucide-react';
import './CssPages/Home.css'
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://luxora-backend-zeta.vercel.app/api';

const Home = ({ onAddToCart, onToggleWishlist, isWishlisted }) => {
  const navigate = useNavigate();
  const [flashSaleTime, setFlashSaleTime] = useState({ hours: 12, minutes: 34, seconds: 56 });
  const [limitedOfferTime, setLimitedOfferTime] = useState({ hours: 8, minutes: 45, seconds: 30 });
  const [weekendTime, setWeekendTime] = useState({ hours: 23, minutes: 15, seconds: 42 });
  const [megaDealTime, setMegaDealTime] = useState({ hours: 18, minutes: 22, seconds: 18 });
  const [festiveTime, setFestiveTime] = useState({ hours: 35, minutes: 48, seconds: 12 });
  const [midnightTime, setMidnightTime] = useState({ hours: 6, minutes: 18, seconds: 45 });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('[Home] Fetching products from:', `${API_BASE_URL}/products`);

        const response = await fetch(`${API_BASE_URL}/products`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Home] Products fetched:', data);

        // Handle different response structures
        const productsArray = Array.isArray(data)
          ? data
          : data.products
            ? data.products
            : data.data
              ? data.data
              : [];

        // Transform backend data
        const transformedProducts = productsArray.map(product => ({
          id: product._id || product.id,
          _id: product._id || product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice || product.price * 1.5,
          image: product.images && product.images.length > 0 ? product.images[0] : '/placeholder-product.jpg',
          category: product.category || 'Other',
          rating: product.rating || 4.5,
          reviews: product.reviews || 0,
          description: product.description || 'No description available',
          badge: product.stock < 10 ? '🔥 Low Stock' : product.badge || null,
          stock: product.stock || 0,
          brand: product.brand || 'Unknown'
        }));

        console.log('[Home] Transformed products:', transformedProducts.length);
        setProducts(transformedProducts);
        setError(null);
      } catch (err) {
        console.error('[Home] Error fetching products:', err);
        setError(err.message);
        console.log('[Home] Using fallback - No static data available');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Timer update effect
  useEffect(() => {
    const updateTimer = (setter) => {
      setter(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    };

    const timers = [
      setInterval(() => updateTimer(setFlashSaleTime), 1000),
      setInterval(() => updateTimer(setLimitedOfferTime), 1000),
      setInterval(() => updateTimer(setWeekendTime), 1000),
      setInterval(() => updateTimer(setMegaDealTime), 1000),
      setInterval(() => updateTimer(setFestiveTime), 1000),
      setInterval(() => updateTimer(setMidnightTime), 1000),
    ];

    return () => timers.forEach(timer => clearInterval(timer));
  }, []);

  // Calculate discount percentage
  const calculateDiscount = (originalPrice, salePrice) => {
    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  // Get original price
  const getOriginalPrice = (price, originalPrice) => {
    if (originalPrice && originalPrice > price) {
      return originalPrice.toFixed(2);
    }
    const discountPercent = Math.floor(Math.random() * 21) + 30;
    return (price / (1 - discountPercent / 100)).toFixed(2);
  };

  // Get gradient colors by category
  const getGradientColors = (category) => {
    const gradients = {
      'Electronics': '#a855f7 0%, #ec4899 100%',
      'Fashion': '#3b82f6 0%, #06b6d4 100%',
      'Clothing': '#3b82f6 0%, #06b6d4 100%',
      'Accessories': '#374151 0%, #111827 100%',
      'Beauty': '#34d399 0%, #10b981 100%',
      'Sports': '#ef4444 0%, #f43f5e 100%',
      'Stationery': '#fb923c 0%, #f59e0b 100%',
      'Home & Garden': '#22c55e 0%, #16a34a 100%',
      'Books': '#f59e0b 0%, #d97706 100%',
      'Toys': '#ec4899 0%, #db2777 100%',
      'Food': '#f97316 0%, #ea580c 100%'
    };
    return gradients[category] || '#6366f1 0%, #a855f7 100%';
  };

  // Render countdown timer
  const renderTimer = (timeLeft) => {
    return (
      <div className="timer-container">
        <span className="timer-label">Ends In:</span>
        {[
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Secs', value: timeLeft.seconds }
        ].map((item, idx) => (
          <div key={idx} className="timer-box">
            <div className="timer-value">{String(item.value).padStart(2, '0')}</div>
            <div className="timer-unit">{item.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="sale-homepage">
        <div className="homepage-container">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            gap: '1rem'
          }}>
            <Loader className="animate-spin" size={48} style={{ color: '#a855f7' }} />
            <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading amazing products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && products.length === 0) {
    return (
      <div className="sale-homepage">
        <div className="homepage-container">
          <div style={{
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '2rem auto'
          }}>
            <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>Unable to Load Products</h3>
            <p style={{ color: '#991b1b', marginBottom: '1rem' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  // ✅ FIXED: Proper handler for Add to Cart button
  const handleAddToCartClick = (e, product) => {
    e.stopPropagation();
    console.log('[Home] Add to cart clicked for:', product.name, 'ID:', product._id || product.id);
    onAddToCart(product, true);
  };

  // ✅ FIXED: Proper handler for Wishlist button
  const handleWishlistClick = (e, product) => {
    e.stopPropagation();
    console.log('[Home] Wishlist toggled for:', product.name);
    onToggleWishlist(product);
  };

  return (
    <div className="sale-homepage">
      <div className="homepage-container">
        {error && products.length > 0 && (
          <div style={{
            background: '#fef3c7',
            border: '2px solid #fcd34d',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center',
            color: '#92400e'
          }}>
            ⚠️ Using sample data - Backend connection issue: {error}
          </div>
        )}

        {/* Hero Banner */}
        <div className="banner hero-banner">
          <div className="banner-overlay"></div>
          <div className="banner-content-center">
            <div className="hero-emoji">🎉</div>
            <h1 className="hero-title">Mega Sale - Up to 70% OFF</h1>
            <p className="hero-subtitle">Limited time offer! Don't miss out on incredible deals</p>
          </div>
        </div>

        {/* Sale Banners Grid */}
        <div className="sale-banners-grid">
          <div className="banner flash-sale-banner">
            <div className="banner-overlay"></div>
            <div className="banner-content-compact">
              <div className="banner-info-compact">
                <span className="banner-icon-compact">⚡</span>
                <h2 className="banner-title-compact">Flash Sale</h2>
                <p className="banner-description-compact">Extra 20% OFF!</p>
              </div>
              {renderTimer(flashSaleTime)}
            </div>
          </div>

          <div className="banner limited-offer-banner">
            <div className="banner-overlay"></div>
            <div className="banner-content-compact">
              <div className="banner-info-compact">
                <span className="banner-icon-compact">🔥</span>
                <h2 className="banner-title-compact">Limited Offer</h2>
                <p className="banner-description-compact">Up to 50% OFF!</p>
              </div>
              {renderTimer(limitedOfferTime)}
            </div>
          </div>

          <div className="banner weekend-banner">
            <div className="banner-overlay"></div>
            <div className="banner-content-compact">
              <div className="banner-info-compact">
                <span className="banner-icon-compact">🎁</span>
                <h2 className="banner-title-compact">Weekend Deal</h2>
                <p className="banner-description-compact">Buy 2 Get 1 Free!</p>
              </div>
              {renderTimer(weekendTime)}
            </div>
          </div>

          <div className="banner mega-deal-banner">
            <div className="banner-overlay"></div>
            <div className="banner-content-compact">
              <div className="banner-info-compact">
                <span className="banner-icon-compact">💰</span>
                <h2 className="banner-title-compact">Mega Deal</h2>
                <p className="banner-description-compact">60% OFF Electronics!</p>
              </div>
              {renderTimer(megaDealTime)}
            </div>
          </div>

          <div className="banner festive-banner">
            <div className="banner-overlay"></div>
            <div className="banner-content-compact">
              <div className="banner-info-compact">
                <span className="banner-icon-compact">🪔</span>
                <h2 className="banner-title-compact">Festive Sale</h2>
                <p className="banner-description-compact">70% OFF + Cashback!</p>
              </div>
              {renderTimer(festiveTime)}
            </div>
          </div>

          <div className="banner midnight-banner">
            <div className="banner-overlay"></div>
            <div className="banner-content-compact">
              <div className="banner-info-compact">
                <span className="banner-icon-compact">🌙</span>
                <h2 className="banner-title-compact">Midnight Sale</h2>
                <p className="banner-description-compact">12AM - 6AM Only!</p>
              </div>
              {renderTimer(midnightTime)}
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="feature-badges-grid">
          {[
            { icon: <Truck className="icon-size" />, title: 'Free Shipping', desc: 'On orders over $50', color: 'orange-red' },
            { icon: <Shield className="icon-size" />, title: 'Premium Quality', desc: 'Guaranteed authentic', color: 'green-emerald' },
            { icon: <RotateCcw className="icon-size" />, title: '30-Day Returns', desc: 'Hassle-free returns', color: 'blue-cyan' },
            { icon: <Award className="icon-size" />, title: 'Best Prices', desc: 'Price match guarantee', color: 'purple-pink' }
          ].map((badge, idx) => (
            <div key={idx} className="feature-badge">
              <div className={`feature-icon bg-${badge.color}`}>
                {badge.icon}
              </div>
              <div className="feature-text">
                <h4 className="feature-title">{badge.title}</h4>
                <p className="feature-desc">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Products Section */}
        <div className="products-section">
          <h2 className="section-title">🔥 Hot Deals - Limited Stock! ({products.length} Products)</h2>
          <div className="products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product)}
              >
                <div
                  className="product-image"
                  style={{ background: `linear-gradient(135deg, ${getGradientColors(product.category)})` }}
                >
                  {product.badge && <div className="discount-badge">{product.badge}</div>}

                  <button
                    className="product-wishlist-btn"
                    onClick={(e) => handleWishlistClick(e, product)}
                  >
                    <Heart
                      className="wishlist-heart-icon"
                      fill={isWishlisted(product.id) ? '#D4AF37' : 'none'}
                      stroke={isWishlisted(product.id) ? '#D4AF37' : '#D4AF37'}
                    />
                  </button>

                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image-img"
                    onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                  />
                </div>

                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>

                  <div className="product-rating">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`star-icon ${i < Math.floor(product.rating) ? 'star-filled' : 'star-empty'}`}
                        />
                      ))}
                    </div>
                    <span className="rating-text">({product.rating})</span>
                  </div>

                  <div className="product-pricing">
                    <div className="price-row">
                      <span className="discount-percent">
                        -{calculateDiscount(getOriginalPrice(product.price, product.originalPrice), product.price)}%
                      </span>
                      <span className="current-price">₹{product.price.toLocaleString()}</span>
                    </div>
                    <div className="price-row">
                      <span className="original-price">₹{getOriginalPrice(product.price, product.originalPrice)}</span>
                    </div>
                  </div>

                  <div className="product-actions">
                    <button
                      className="btn-add-cart"
                      onClick={(e) => handleAddToCartClick(e, product)}
                    >
                      <ShoppingCart className="btn-icon" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="newsletter-section">
          <h3 className="newsletter-title">Get Exclusive Deals! 📧</h3>
          <p className="newsletter-subtitle">Subscribe to our newsletter and get 15% OFF on your first order</p>
          <div className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email..."
              className="newsletter-input"
            />
            <button className="newsletter-button">Subscribe</button>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>
              <X className="close-icon" />
            </button>

            <div className="modal-content">
              <div className="modal-image-section">
                <div
                  className="modal-image-container"
                  style={{ background: `linear-gradient(135deg, ${getGradientColors(selectedProduct.category)})` }}
                >
                  {selectedProduct.badge && <div className="modal-badge">{selectedProduct.badge}</div>}
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="modal-image"
                    onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                  />
                </div>
              </div>

              <div className="modal-details">
                <div className="modal-category">{selectedProduct.category}</div>
                <h2 className="modal-title">{selectedProduct.name}</h2>

                <div className="modal-rating">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`star-icon ${i < Math.floor(selectedProduct.rating) ? 'star-filled' : 'star-empty'}`}
                      />
                    ))}
                  </div>
                  <span className="rating-text">({selectedProduct.rating})</span>
                  <span className="reviews-count">{selectedProduct.reviews} reviews</span>
                </div>

                <p className="modal-description">{selectedProduct.description}</p>

                <div className="modal-pricing">
                  <div className="price-row">
                    <span className="discount-percent">
                      -{calculateDiscount(getOriginalPrice(selectedProduct.price, selectedProduct.originalPrice), selectedProduct.price)}%
                    </span>
                    <span className="modal-current-price">₹{selectedProduct.price.toLocaleString()}</span>
                  </div>
                  <div className="price-row">
                    <span className="original-price">₹{getOriginalPrice(selectedProduct.price, selectedProduct.originalPrice)}</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="modal-btn-cart"
                    onClick={() => {
                      onAddToCart(selectedProduct, true);
                      setSelectedProduct(null);
                    }}
                  >
                    <ShoppingCart className="btn-icon" />
                    Add to Cart
                  </button>
                  <button
                    className="modal-btn-wishlist"
                    onClick={() => onToggleWishlist(selectedProduct)}
                  >
                    <Heart className="btn-icon" />
                    {isWishlisted(selectedProduct.id) ? 'Wishlisted' : 'Wishlist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home