import React, { useState } from 'react';
import '../componentStyles/Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import { ShoppingCart, PersonAdd, Close, Menu } from '@mui/icons-material';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  const navigate = useNavigate();
  const isAuthenticated = false;
  const handleSearchSubmit = (e) => {
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/products`);
    }
    e.preventDefault();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" onClick={() => setIsMenuOpen(false)}>
            BuyEasy
          </Link>
        </div>
        <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/about-us">About Us</Link>
            </li>
            <li>
              <Link to="/contact-us">Contact Us</Link>
            </li>
          </ul>
        </div>
        <div className="navbar-icons">
          <div className="{search-container}">
            <div className="search-item">
              <form
                className={`search-form ${isSearchOpen ? 'active' : ''}`}
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              <button
                type="button"
                className="search-icon"
                onClick={toggleSearch}
              >
                <SearchIcon focusable="false" />
              </button>
            </div>
          </div>
          <div className="cart-container">
            <Link to="/cart">
              <ShoppingCart className="icon" />
              <span className="cart-badge">6</span>
            </Link>
          </div>
          {!isAuthenticated && (
            <Link to="/signup" className="register-link">
              <PersonAdd className="icon" />
            </Link>
          )}
          <div className="navbar-hamburger" onClick={toggleMenu}>
            {isMenuOpen ? (
              <Close className="icon" />
            ) : (
              <Menu className="icon" />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
