import React, { useState } from 'react';
import '../componentStyles/Navbar.css';
import '../pageStyles/Search.css';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import {
  ShoppingCart,
  PersonAdd,
  Close,
  Menu,
  FavoriteBorder,
  BookmarkBorder,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  const navigate = useNavigate();
  const { isAuthenticated, user, wishlist } = useSelector((state) => state.user);
  const cartItemsCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
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
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/products" onClick={() => setIsMenuOpen(false)}>
                Products
              </Link>
            </li>
            <li>
              <Link to="/favorites" onClick={() => setIsMenuOpen(false)}>
                Favorites
              </Link>
            </li>
            <li>
              <Link to="/saved-products" onClick={() => setIsMenuOpen(false)}>
                Saved Products
              </Link>
            </li>
          </ul>
        </div>
        <div className="navbar-icons">
          <div className="search-container">
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
              <span className="cart-badge">{cartItemsCount}</span>
            </Link>
          </div>
          {isAuthenticated && (
            <>
              <Link to="/favorites" className="wishlist-nav-link" aria-label="Favorite products">
                <FavoriteBorder className="icon" />
                <span className="wishlist-badge">{wishlist.length}</span>
              </Link>
              <Link
                to="/saved-products"
                className="saved-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookmarkBorder className="icon" />
                <span>Saved</span>
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin/dashboard" className="admin-dashboard-link">
              Dashboard
            </Link>
          )}
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
