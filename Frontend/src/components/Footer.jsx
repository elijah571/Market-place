import React from 'react';
import {
  HeadsetMicOutlined,
  LocalShippingOutlined,
  Mail,
  Phone,
  SecurityOutlined,
} from '@mui/icons-material';
import '../componentStyles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <p className="footer-kicker">Marketplace</p>
          <h3>Commerce that feels fast, trusted, and easy to return to.</h3>
          <p>
            Built for product discovery, checkout confidence, and smoother day-to-day store
            operations.
          </p>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <p>
            <Phone fontSize="small" /> +234 800 000 0000
          </p>
          <p>
            <Mail fontSize="small" />
            support@marketplace.dev
          </p>
        </div>

        <div className="footer-section">
          <h4>Why It Works</h4>
          <p>
            <LocalShippingOutlined fontSize="small" /> Flexible delivery options
          </p>
          <p>
            <SecurityOutlined fontSize="small" /> Secure checkout with leading gateways
          </p>
          <p>
            <HeadsetMicOutlined fontSize="small" /> Responsive customer support
          </p>
        </div>

        <div className="footer-section">
          <h4>Explore</h4>
          <a href="/products">All Products</a>
          <a href="/favorites">Wishlist</a>
          <a href="/orders/me">Order Tracking</a>
          <a href="/admin/dashboard">Admin Analytics</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Marketplace. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
