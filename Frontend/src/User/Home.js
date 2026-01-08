import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Award, Loader } from 'lucide-react';
import './CssPages/Home.css'
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://luxora-backend-zeta.vercel.app/api';

const Home = ({ onAddToCart, onToggleWishlist, isWishlisted }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[Home] Fetching products from:', `${API_BASE_URL}/products`);

        const response = await fetch(`${API_BASE_URL}/products`);
        const data = await response.json();

        console.log('[Home] API Response:', { status: response.status, data });

        if (!response.ok) {
          console.error('[Home] API Error:', data?.message || `Status ${response.status}`);
          throw new Error(data?.message || `HTTP error! status: ${response.status}`);
        }

        // Handle various response formats
        let productsArray = [];
        if (Array.isArray(data)) {
          productsArray = data;
        } else if (data?.products && Array.isArray(data.products)) {
          productsArray = data.products;
        } else if (data?.data?.products) {
          productsArray = data.data.products;
        }

        const transformedProducts = productsArray.map(product => ({
          id: product._id || product.id,
          _id: product._id || product.id,
          name: product.name || 'Unknown Product',
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price * 1.2,
          image: product.images?.[0] || '/placeholder-product.jpg',
          category: product.category || 'Other',
          rating: product.rating || 0,
          reviews: product.numReviews || product.reviews || 0,
          description: product.description || 'No description available',
          stock: product.stock || 0,
          brand: product.brand || 'Unknown'
        }));

        console.log('[Home] Transformed products:', transformedProducts.length);
        setProducts(transformedProducts);
      } catch (err) {
        console.error('[Home] Error fetching products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const calculateDiscount = (originalPrice, salePrice) => {
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  const handleAddToCartClick = (e, product) => {
    e.stopPropagation();
    console.log('[Home] Add to cart:', product.name, product._id);
    onAddToCart(product, true);
  };

  const handleWishlistClick = (e, product) => {
    e.stopPropagation();
    console.log('[Home] Wishlist toggle:', product.name);
    onToggleWishlist(product);
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

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
            <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

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
            ⚠️ Backend issue: {error}
          </div>
        )}

        {/* Hero Banner */}
        <div className="banner hero-banner">
          <div className="banner-overlay"></div>
          <div className="banner-content-center">
            <div className="hero-emoji">🎉</div>
            <h1 className="hero-title">Mega Sale - Up to 70% OFF</h1>
            <p className="hero-subtitle">Limited time offer! Don't miss out</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-section">
          <h2 className="section-title">🔥 Hot Deals ({products.length} Products)</h2>
          <div className="products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product)}
              >
                <div className="product-image">
                  <button
                    className="product-wishlist-btn"
                    onClick={(e) => handleWishlistClick(e, product)}
                  >
                    <Heart
                      className="wishlist-heart-icon"
                      fill={isWishlisted(product.id) ? '#D4AF37' : 'none'}
                      stroke="#D4AF37"
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
                        -{calculateDiscount(product.originalPrice, product.price)}%
                      </span>
                      <span className="current-price">₹{product.price.toLocaleString()}</span>
                    </div>
                    <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                  </div>

                  <button
                    className="btn-add-cart"
                    onClick={(e) => handleAddToCartClick(e, product)}
                  >
                    <ShoppingCart className="btn-icon" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Badges */}
        <div className="feature-badges-grid">
          {[
            { icon: <Truck className="icon-size" />, title: 'Free Shipping', desc: 'On orders over $50' },
            { icon: <Shield className="icon-size" />, title: 'Premium Quality', desc: 'Guaranteed authentic' },
            { icon: <RotateCcw className="icon-size" />, title: '30-Day Returns', desc: 'Hassle-free returns' },
            { icon: <Award className="icon-size" />, title: 'Best Prices', desc: 'Price match guarantee' }
          ].map((badge, idx) => (
            <div key={idx} className="feature-badge">
              <div className="feature-icon">{badge.icon}</div>
              <div className="feature-text">
                <h4 className="feature-title">{badge.title}</h4>
                <p className="feature-desc">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default Home
