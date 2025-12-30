import React from 'react'
import { useState,useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ArrowLeft, Truck, Shield, RotateCcw, Award, Loader } from 'lucide-react';
import '../CssPages/Productcss/ProductDetail.css'

const API_BASE_URL = 'http://localhost:5000/api';


const colors = {
  emeraldDark: '#0d5d4f',
  emeraldMain: '#10b981',
  emeraldLight: '#a7f3d0',
  emeraldLighter: '#d1fae5',
  silverDark: '#374151',
  silverMain: '#6b7280',
  silverLight: '#e5e7eb',
  silverLighter: '#f3f4f6',
  white: '#ffffff',
  error: '#ef4444'
};


const Productdetail = ({ onAddToCart, onToggleWishlist, isWishlisted }) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Fetch product from API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);

        if (!response.ok) {
          throw new Error(`Product not found`);
        }

        const data = await response.json();
        const productData = data.product || data;

        const transformedProduct = {
          id: productData._id || productData.id,
          name: productData.name,
          price: productData.price,
          originalPrice: productData.originalPrice || productData.price * 1.5,
          images: productData.images || ['/placeholder-product.jpg'],
          category: productData.category || 'Other',
          rating: productData.rating || 4.5,
          reviews: productData.reviews || 0,
          description: productData.description || 'No description available',
          badge: productData.stock < 10 ? '🔥 Low Stock' : productData.badge || null,
          stock: productData.stock || 0,
          brand: productData.brand || 'Unknown',
          features: productData.features || []
        };

        setProduct(transformedProduct);
        setError(null);
      } catch (err) {
        console.error('[ProductDetails] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Calculate discount percentage
  const calculateDiscount = (originalPrice, salePrice) => {
    const discount = ((originalPrice - salePrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader className="animate-spin" size={48} style={{ color: colors.emeraldMain }} />
        <p style={{ fontSize: '1.2rem', color: colors.silverMain }}>Loading product details...</p>
      </div>
    );
  }

  // Error state
  if (error && !product) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '4rem auto',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h2 style={{ color: colors.error, marginBottom: '1rem' }}>Product Not Found</h2>
        <p style={{ color: colors.silverMain, marginBottom: '2rem' }}>{error}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: colors.emeraldMain,
            color: colors.white,
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'background 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = colors.emeraldDark}
          onMouseLeave={(e) => e.currentTarget.style.background = colors.emeraldMain}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="product-details-page">
      <div className="product-details-container">

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="back-button"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.emeraldDark;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.emeraldMain;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>

        {/* Main Product Container */}
        <div className="product-card-container">
          <div className="product-card-grid">

            {/* Left: Images */}
            <div className="product-images-section">
              {/* Main Image */}
              <div className="main-image-container">
                {product.badge && (
                  <div className="product-badge">{product.badge}</div>
                )}

                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="main-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg';
                  }}
                />
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="thumbnail-container">
                  {product.images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        className="thumbnail-image"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="product-details-section">
              <div className="category-badge">{product.category}</div>

              <h1 className="product-title">{product.name}</h1>

              <div className="rating-container">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      fill={i < Math.floor(product.rating) ? colors.emeraldMain : 'none'}
                      stroke={i < Math.floor(product.rating) ? colors.emeraldMain : colors.silverLight}
                    />
                  ))}
                </div>
                <span className="rating-text">
                  ({product.rating}) · {product.reviews} reviews
                </span>
              </div>

              <p className="product-description">{product.description}</p>

              {/* Price */}
              <div className="price-section">
                <div className="price-row">
                  <span className="current-price">₹{product.price.toLocaleString()}</span>
                  <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                  <span className="discount-badge-inline">
                    -{calculateDiscount(product.originalPrice, product.price)}% OFF
                  </span>
                </div>
                <p className="savings-text">
                  You save ₹{(product.originalPrice - product.price).toLocaleString()}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="quantity-section">
                <label className="quantity-label">Quantity:</label>
                <div className="quantity-controls">
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.emeraldLight;
                      e.currentTarget.style.borderColor = colors.emeraldMain;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.white;
                      e.currentTarget.style.borderColor = colors.silverLight;
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="qty-input"
                  />
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.emeraldLight;
                      e.currentTarget.style.borderColor = colors.emeraldMain;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.white;
                      e.currentTarget.style.borderColor = colors.silverLight;
                    }}
                  >
                    +
                  </button>
                  <span className="stock-text">{product.stock} available</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="btn-add-cart"
                  onClick={() => onAddToCart({ ...product, quantity })}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.emeraldDark;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.emeraldMain;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <ShoppingCart size={24} />
                  Add to Cart
                </button>
                <button
                  className="btn-wishlist"
                  onClick={() => onToggleWishlist(product)}
                  onMouseEnter={(e) => {
                    if (!isWishlisted(product.id)) {
                      e.currentTarget.style.background = colors.emeraldLighter;
                      e.currentTarget.style.borderColor = colors.emeraldMain;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isWishlisted(product.id)) {
                      e.currentTarget.style.background = colors.silverLighter;
                      e.currentTarget.style.borderColor = colors.silverLight;
                    }
                  }}
                >
                  <Heart
                    size={24}
                    fill={isWishlisted(product.id) ? colors.emeraldMain : 'none'}
                    stroke={isWishlisted(product.id) ? colors.emeraldMain : colors.silverMain}
                  />
                </button>
              </div>

              {/* Features */}
              <div className="features-grid">
                {[
                  { icon: <Truck size={20} />, title: 'Free Delivery', desc: 'On orders over $50' },
                  { icon: <Shield size={20} />, title: 'Secure Payment', desc: '100% protected' },
                  { icon: <RotateCcw size={20} />, title: 'Easy Returns', desc: '30 days return' },
                  { icon: <Award size={20} />, title: 'Warranty', desc: '1 year guarantee' }
                ].map((feature, idx) => (
                  <div key={idx} className="feature-item">
                    <div className="feature-icon" style={{ color: colors.emeraldMain }}>
                      {feature.icon}
                    </div>
                    <div>
                      <div className="feature-title">{feature.title}</div>
                      <div className="feature-desc">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Productdetail