import React from 'react'
import { useState } from 'react';
import { ShoppingBag, Store, LogOut, Home, Upload, Package, BarChart3, Settings,X,Menu } from 'lucide-react';
import './CssPage/SellerHeder.css';



const SellerHeader = ({ currentPage, setCurrentPage, currentSeller, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Handle nav click
  const handleNavClick = (id) => {
    setCurrentPage(id);
    setIsMobileMenuOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="seller-nav">
        <div className="seller-container">
          <div className="seller-nav-inner">
            {/* Logo */}
            <div className="seller-logo">
              <ShoppingBag size={28} className="seller-logo-icon" />
              <h1 className="seller-logo-text">🛍️ LUXORA</h1>
            </div>

            {/* Seller Info (Desktop) */}
            {currentSeller && (
              <div className="seller-info">
                <Store size={20} className="seller-info-icon" />
                <div>
                  <p className="seller-info-label">Seller Store</p>
                  <p className="seller-info-name">
                    {currentSeller.businessName}
                  </p>
                </div>
              </div>
            )}

            {/* Desktop Navigation */}
            <div className="seller-menu">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`seller-btn ${currentPage === item.id ? 'active' : ''}`}
                    title={item.label}
                  >
                    <Icon size={18} className="seller-btn-icon" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={handleLogout}
                className="seller-btn logout"
                title="Logout"
              >
                <LogOut size={18} className="seller-btn-icon" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="seller-mobile-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} className="seller-mobile-icon" />
              ) : (
                <Menu size={24} className="seller-mobile-icon" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="seller-mobile-menu">
          <div className="seller-mobile-container">
            {/* Seller Info (Mobile) */}
            {currentSeller && (
              <div className="mobile-seller-info">
                <Store size={16} />
                <div>
                  <p className="mobile-seller-label">Seller Store</p>
                  <p className="mobile-seller-name">
                    {currentSeller.businessName}
                  </p>
                </div>
              </div>
            )}

            {/* Mobile Navigation Items */}
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`mobile-nav-btn ${
                    currentPage === item.id ? 'active' : ''
                  }`}
                  title={item.label}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="mobile-nav-btn logout"
              title="Logout"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default SellerHeader