import React from 'react'
import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CssPages/Header.css';

const Header = ({ 
  cartCount = 0,
  wishlistCount = 0,
  filters = { category: 'all', priceRange: [0, 5000], rating: 0 },
  setFilters = () => {},
  onViewCart = () => {},
  onSearch = () => {},
  searchQuery = '',
  currentUser = null,
  onOpenProfile = () => {}
}) => {

  const navigate = useNavigate();
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [scrolled, setScrolled] = useState(false);

  // Debug: Log counts whenever they change
  useEffect(() => {
    console.log('📊 Header counts updated:', { cartCount, wishlistCount });
  }, [cartCount, wishlistCount]);

  // Update temp filters when main filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const filterDropdown = document.querySelector('.filter-dropdown');
      if (filterDropdown && !filterDropdown.contains(event.target)) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterDropdownOpen]);

  // Toggle filter dropdown
  const toggleFilterDropdown = () => {
    setIsFilterDropdownOpen(!isFilterDropdownOpen);
    if (!isFilterDropdownOpen) {
      setTempFilters(filters);
    }
  };

  // Close filter dropdown
  const closeFilterDropdown = () => {
    setIsFilterDropdownOpen(false);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterDropdownOpen(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      category: 'all',
      priceRange: [0, 5000],
      rating: 0
    };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
    setIsFilterDropdownOpen(false);
  };

  // Navigation handlers
  const handleLogoClick = () => {
    console.log('🏠 Logo clicked - navigating to home');
    navigate('/user');
  };

  const handleWishlistClick = () => {
    console.log('❤️ Wishlist clicked - navigating to wishlist');
    navigate('/user/wishlist');
  };

  const handleProfileClick = () => {
    console.log('👤 Profile clicked - navigating to profile');
    navigate('/user/profile');
  };

  const handleCartClick = () => {
    console.log('🛒 Cart clicked - opening cart sidebar');
    onViewCart();
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Fashion', label: 'Fashion' },
    { value: 'Accessories', label: 'Accessories' },
    { value: 'Beauty', label: 'Beauty' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Stationery', label: 'Stationery' }
  ];

  const ratingOptions = [
    { value: 0, label: 'All Ratings' },
    { value: 3, label: '3+ Stars' },
    { value: 4, label: '4+ Stars' },
    { value: 4.5, label: '4.5+ Stars' },
    { value: 5, label: '5 Stars' }
  ];

  return (
    <div>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            luxury
            <span className="logo-icon">✨</span>
          </div>

          <div className="search-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search luxury items..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Filter Dropdown */}
            <div className="filter-dropdown">
              <button
                onClick={toggleFilterDropdown}
                className="filter-button"
                title="Open filters"
              >
                <span>🧩</span>
                <span>Filters</span>
                <span className={`filter-arrow ${isFilterDropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              {isFilterDropdownOpen && (
                <div className="filter-dropdown-menu">
                  {/* Category Filter */}
                  <div className="filter-group">
                    <label className="filter-label">CATEGORY</label>
                    <select
                      value={tempFilters.category}
                      onChange={(e) =>
                        setTempFilters({
                          ...tempFilters,
                          category: e.target.value
                        })
                      }
                      className="filter-select"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div className="filter-group">
                    <label className="filter-label">PRICE RANGE</label>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={tempFilters.priceRange[1]}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        setTempFilters({
                          ...tempFilters,
                          priceRange: [0, newValue]
                        });
                      }}
                      className="filter-range"
                    />
                    <div className="filter-range-value">
                      ${tempFilters.priceRange[0]} - ${tempFilters.priceRange[1]}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="filter-group">
                    <label className="filter-label">RATING</label>
                    <select
                      value={tempFilters.rating}
                      onChange={(e) => {
                        const newRating = parseFloat(e.target.value);
                        setTempFilters({
                          ...tempFilters,
                          rating: newRating
                        });
                      }}
                      className="filter-select"
                    >
                      {ratingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Buttons */}
                  <div className="filter-buttons">
                    <button
                      onClick={handleApplyFilters}
                      className="filter-apply-btn"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleResetFilters}
                      className="filter-reset-btn"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Wishlist Icon */}
            <div
              className="wishlist-icon"
              onClick={handleWishlistClick}
              title="View wishlist"
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <span className="icon-heart">❤️</span>
              {wishlistCount > 0 && (
                <span className="badge badge-wishlist">{wishlistCount}</span>
              )}
            </div>

            {/* Account Button */}
            <button
              onClick={handleProfileClick}
              className="account-button"
              title="View profile"
              style={{ cursor: 'pointer' }}
            >
              <span>👤</span>
              <span>{currentUser?.name || 'Account'}</span>
            </button>

            {/* Cart Icon */}
            <div
              className="cart-icon"
              onClick={handleCartClick}
              title="View cart"
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <span className="icon-cart">🛒</span>
              {cartCount > 0 && (
                <span className="badge badge-cart">{cartCount}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filter Overlay */}
      {isFilterDropdownOpen && (
        <div onClick={closeFilterDropdown} className="filter-overlay" />
      )}
    </div>
  );
};

  
export default Header