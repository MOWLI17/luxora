import React from 'react'
import './CssPages/Footer.css'



const socialIcons = ['📘', '𝕏', '📷', '▶️'];
const Footer = () => {
  return (
    <footer className="footer">
      {/* Animated Background */}
      <div className="footer-bg">
        <div className="footer-bg-circle circle-left" />
        <div className="footer-bg-circle circle-right" />
      </div>

      <div className="footer-content">
        {/* Company Info */}
        <div>
          <h3 className="footer-title">
            <span className="footer-icon">💎</span> Luxury
          </h3>
          <p className="footer-desc">
            Your one-stop destination for quality products at unbeatable prices. Shop with confidence and style.
          </p>
          <div className="social-icons">
            {socialIcons.map((social, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Social link ${social}`}
                className="social-btn"
                onClick={() => alert(`${social} clicked`)}
              >
                {social}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-list">
            {['About Us', 'Shop', 'Contact', 'Blog', 'FAQs'].map((link, idx) => (
              <li key={idx}>
                <a href={`/page-${link.toLowerCase().replace(/\s/g, '-')}`} className="footer-link">
                  <span className="dot">•</span>{link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Service */}
        <div>
          <h4 className="footer-heading">Customer Service</h4>
          <ul className="footer-list">
            {['My Account', 'Track Order', 'Shipping Policy', 'Return Policy', 'Privacy Policy'].map((link, idx) => (
              <li key={idx}>
                <a href={`/page-${link.toLowerCase().replace(/\s/g, '-')}`} className="footer-link">
                  <span className="dot">•</span>{link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="footer-heading">Contact Us</h4>
          <ul className="contact-list">
            {[
              { icon: '📍', text: '123 Shopping Street, New York, NY 10001' },
              { icon: '☎️', text: '+1 (555) 123-4567' },
              { icon: '✉️', text: 'support@shophub.com' }
            ].map((item, idx) => (
              <li key={idx} className="contact-item">
                <span className="contact-icon">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer

