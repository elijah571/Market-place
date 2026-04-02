import React, { useEffect, useState } from 'react';
import '../componentStyles/Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import {
  Close,
  DashboardCustomizeOutlined,
  FavoriteBorder,
  Menu,
  PersonAddAlt1Outlined,
  PersonOutline,
  Search,
  ShoppingCartOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { storefrontService } from '../services/storefront.service';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user, wishlist } = useSelector((state) => state.user);
  const cartItemsCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  useEffect(() => {
    storefrontService
      .getProductMeta()
      .then((data) => setCategories((data?.categories || []).slice(0, 6)))
      .catch(() => setCategories([]));
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      return;
    }

    navigate('/products');
  };

  return (
    <header className="navbar-shell">
      <div className="navbar-announcement">
        <p>Daily deals, secure checkout, and modern storefront performance in one experience.</p>
      </div>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="navbar-logo-mark">
              <StorefrontOutlined fontSize="small" />
            </span>
            <span>
              Market<span>Place</span>
            </span>
          </Link>

          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <Search fontSize="small" />
            <input
              type="text"
              className="search-input"
              placeholder="Search products, categories, or brands"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
            <div className="navbar-links-main">
              <Link to="/">Home</Link>
              <Link to="/products">Shop</Link>
              {categories.map((category) => (
                <Link
                  key={category.label}
                  to={`/products?category=${encodeURIComponent(category.label)}`}
                >
                  {category.label}
                </Link>
              ))}
            </div>
            <div className="navbar-links-mobile-actions">
              <Link to="/cart">Cart</Link>
              <Link to="/favorites">Wishlist</Link>
              {isAuthenticated ? <Link to="/profile">My Account</Link> : <Link to="/login">Login</Link>}
            </div>
          </div>

          <div className="navbar-actions">
            <Link to="/favorites" className="navbar-icon-link" aria-label="Wishlist">
              <FavoriteBorder fontSize="small" />
              <span>{wishlist.length}</span>
            </Link>
            <Link to="/cart" className="navbar-icon-link" aria-label="Cart">
              <ShoppingCartOutlined fontSize="small" />
              <span>{cartItemsCount}</span>
            </Link>
            {isAuthenticated ? (
              <Link to="/profile" className="navbar-profile-link">
                <PersonOutline fontSize="small" />
                <span>{user?.name?.split(' ')[0] || 'Account'}</span>
              </Link>
            ) : (
              <Link to="/signup" className="navbar-profile-link">
                <PersonAddAlt1Outlined fontSize="small" />
                <span>Join</span>
              </Link>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="navbar-admin-link">
                <DashboardCustomizeOutlined fontSize="small" />
                <span>Admin</span>
              </Link>
            )}
            <button
              type="button"
              className="navbar-hamburger"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? <Close className="icon" /> : <Menu className="icon" />}
            </button>
          </div>
        </div>
      </nav>

      {categories.length > 0 && (
        <div className="navbar-category-bar">
          <div className="navbar-category-track">
            {categories.map((category) => (
              <Link
                key={`bar-${category.label}`}
                to={`/products?category=${encodeURIComponent(category.label)}`}
                className="navbar-category-pill"
              >
                <span>{category.label}</span>
                <small>{category.count}</small>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
