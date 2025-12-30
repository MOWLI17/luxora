import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./CssPages/Wishlist.css"

const Wishlist = ({ wishlist = [], onAddToCart = () => {}, onToggleWishlist = () => {}, isWishlisted = () => {} } ) => {
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);

  const handleRemove = (product) => {
    setRemovingId(product.id);
    setTimeout(() => {
      onToggleWishlist(product);
      setRemovingId(null);
    }, 300);
  };

  // FIXED: Navigate to user home with correct path
  const handleStartShopping = () => {
    navigate('/user');
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-bg-overlay">
        <div className="wishlist-bg-circle-1" />
        <div className="wishlist-bg-circle-2" />
      </div>

      <div className="wishlist-container">
        <div className="wishlist-header">
          <div className="wishlist-title-row">
            <h1 className="wishlist-title">
              <span className="wishlist-title-icon">❤️</span>
              My Wishlist
            </h1>
            <span className="wishlist-count-badge">
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <p className="wishlist-subtitle">
            Your curated collection of favorite items
          </p>
        </div>
        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon">👜</div>
            <h2 className="wishlist-empty-title">Your wishlist is empty</h2>
            <p className="wishlist-empty-text">
              Start adding your favorite items to build your personalized wishlist. 
              Find something you love!
            </p>
            <button className="wishlist-empty-button" onClick={handleStartShopping}>
              Start Shopping →
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((product, idx) => (
              <div
                key={product.id}
                className={`wishlist-card ${removingId === product.id ? 'removing' : ''}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="wishlist-card-inner">
                  {/* Product Image */}
                  <div className="wishlist-product-image">
                    <div className="wishlist-product-emoji">
                      {product.emoji || '📦'}
                    </div>
                    <div className="wishlist-heart-badge">❤️</div>
                  </div>

                  {/* Product Info */}
                  <div className="wishlist-product-info">
                    <h3 className="wishlist-product-name">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="wishlist-product-description">
                        {product.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="wishlist-price-row">
                      <span className="wishlist-price-current">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="wishlist-price-original">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    {product.rating && (
                      <div className="wishlist-rating">
                        <span className="wishlist-rating-star">☆</span>
                        <span className="wishlist-rating-text">
                          {product.rating} ({product.reviews || 0})
                        </span>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="wishlist-buttons">
                      <button
                        className="wishlist-btn-cart"
                        onClick={() => onAddToCart(product)}
                      >
                        🛒 Add to Cart
                      </button>
                      <button
                        className="wishlist-btn-remove"
                        onClick={() => handleRemove(product)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist