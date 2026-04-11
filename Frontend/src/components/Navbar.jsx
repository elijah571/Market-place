import React, { useEffect, useRef, useState } from 'react';
import '../componentStyles/Navbar.css';
import { Close } from '@mui/icons-material';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NavbarBrand from './navbar/NavbarBrand';
import NavbarSearch from './navbar/NavbarSearch';
import NavbarActions from './navbar/NavbarActions';
import {
  getAccountLinks,
  getQuickActionLinks,
  PRIMARY_NAV_LINKS,
} from './navbar/navbar.config';
import { useDebouncedValue } from '../utils/useDebouncedValue';

const Navbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCartMenuOpen, setIsCartMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const accountMenuRef = useRef(null);
  const cartMenuRef = useRef(null);
  const { isAuthenticated, user, wishlist } = useSelector((state) => state.user);
  const cartItemsCount = useSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0)
  );
  const currentKeyword = new URLSearchParams(location.search).get('keyword') || '';
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const quickActionLinks = getQuickActionLinks({ isAuthenticated });
  const accountLinks = getAccountLinks({ isAuthenticated, isAdmin });
  const primaryNavPaths = new Set(PRIMARY_NAV_LINKS.map((item) => item.to));
  const accountPaths = new Set(accountLinks.map((item) => item.to));
  const drawerPrimaryLinks = PRIMARY_NAV_LINKS.filter((item) => item.to !== '/');
  const drawerQuickActionLinks = quickActionLinks.filter(
    (item) => !primaryNavPaths.has(item.to) && !accountPaths.has(item.to)
  );

  const closeMenus = () => {
    setIsDrawerOpen(false);
    setIsAccountMenuOpen(false);
    setIsCartMenuOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    setSearchQuery(currentKeyword);
  }, [currentKeyword]);

  useEffect(() => {
    closeMenus();
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setIsAccountMenuOpen(false);
      }

      if (cartMenuRef.current && !cartMenuRef.current.contains(event.target)) {
        setIsCartMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
        setIsAccountMenuOpen(false);
        setIsCartMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith('/products')) {
      return;
    }

    if (searchQuery !== debouncedSearchQuery) {
      return;
    }

    const normalizedQuery = debouncedSearchQuery.trim();
    if (normalizedQuery === currentKeyword) {
      return;
    }

    const nextSearchParams = new URLSearchParams(location.search);

    if (normalizedQuery) {
      nextSearchParams.set('keyword', normalizedQuery);
    } else {
      nextSearchParams.delete('keyword');
    }

    nextSearchParams.delete('page');

    navigate(
      {
        pathname: '/products',
        search: nextSearchParams.toString()
          ? `?${nextSearchParams.toString()}`
          : '',
      },
      { replace: true }
    );
  }, [
    currentKeyword,
    debouncedSearchQuery,
    location.pathname,
    location.search,
    navigate,
    searchQuery,
  ]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      closeMenus();
      return;
    }

    navigate('/products');
    closeMenus();
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
    setIsAccountMenuOpen(false);
    setIsCartMenuOpen(false);
  };

  const toggleAccountMenu = () => {
    setIsCartMenuOpen(false);
    setIsAccountMenuOpen((prev) => !prev);
  };

  const toggleCartMenu = () => {
    setIsAccountMenuOpen(false);
    setIsCartMenuOpen((prev) => !prev);
  };
  const SidebarSection = ({ title, children }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="sidebar-section">
      <button
        className="sidebar-section-header"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span className={`chevron ${open ? 'open' : ''}`}>⌄</span>
      </button>

      {open && <div className="sidebar-section-content">{children}</div>}
    </div>
  );
};

  return (
    <header className="navbar-shell">
      <div className="navbar-announcement">
        <p>Daily deals, secure checkout, and modern storefront performance in one experience.</p>
      </div>

      <nav className="navbar" aria-label="Primary">
        <div className="navbar-container">
          <div className="navbar-row">
            <div className="navbar-left">
              <NavbarBrand onNavigate={closeMenus} />

              <div className="navbar-desktop-nav">
                <ul className="navbar-link-list">
                  {PRIMARY_NAV_LINKS.map((item) => {
                    const Icon = item.icon;

                    return (
                      <li key={item.to} className="navbar-link-item">
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `navbar-main-link${isActive ? ' is-active' : ''}`
                          }
                          onClick={closeMenus}
                        >
                          <Icon fontSize="small" aria-hidden="true" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="navbar-center">
              <NavbarSearch
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSubmit={handleSearchSubmit}
              />
            </div>

            <NavbarActions
              isAuthenticated={isAuthenticated}
              user={user}
              wishlistCount={wishlist?.length || 0}
              cartCount={cartItemsCount}
              accountLinks={accountLinks}
              isAccountMenuOpen={isAccountMenuOpen}
              onToggleAccountMenu={toggleAccountMenu}
              onCloseMenus={closeMenus}
              accountMenuRef={accountMenuRef}
              cartMenuRef={cartMenuRef}
              isCartMenuOpen={isCartMenuOpen}
              onToggleCartMenu={toggleCartMenu}
              onCloseCartMenu={() => setIsCartMenuOpen(false)}
              isDrawerOpen={isDrawerOpen}
              onToggleDrawer={toggleDrawer}
            />
          </div>
        </div>
      </nav>

      {isDrawerOpen ? (
        <button
          type="button"
          className="navbar-overlay"
          onClick={closeMenus}
          aria-label="Close navigation drawer"
        />
      ) : null}

     <aside className={`sidebar ${isDrawerOpen ? 'open' : ''}`}>
  <div className="sidebar-header">
    <NavbarBrand onNavigate={closeMenus} />

    <button onClick={closeMenus} className="sidebar-close">
      <Close fontSize="small" />
    </button>
  </div>

  {/* USER BLOCK */}
  <div className="sidebar-user">
    <strong>
      {isAuthenticated
        ? `Hi, ${user?.name?.split(' ')[0] || 'there'}`
        : 'Welcome'}
    </strong>
    <span>
      {isAuthenticated
        ? 'Manage your account & orders'
        : 'Login for faster checkout'}
    </span>

    <div className="sidebar-stats">
      <div>
        <strong>{wishlist?.length || 0}</strong>
        <span>Wishlist</span>
      </div>
      <div>
        <strong>{cartItemsCount}</strong>
        <span>Cart</span>
      </div>
    </div>
  </div>

  {/* SEARCH */}
  <div className="sidebar-search">
    <NavbarSearch
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onSubmit={handleSearchSubmit}
    />
  </div>

  {/* NAV SECTIONS */}
  <div className="sidebar-body">

    {/* PRIMARY */}
    <SidebarSection title="Browse">
      {drawerPrimaryLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={closeMenus}
          >
            <Icon fontSize="small" />
            <div>
              <span>{item.label}</span>
              <small>Main navigation</small>
            </div>
          </NavLink>
        );
      })}
    </SidebarSection>

    {/* QUICK */}
    <SidebarSection title="Quick Actions">
      {drawerQuickActionLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={closeMenus}
          >
            <Icon fontSize="small" />
            <div>
              <span>{item.label}</span>
              <small>Shortcut</small>
            </div>
          </NavLink>
        );
      })}
    </SidebarSection>

    {/* ACCOUNT */}
    <SidebarSection title="Account">
      {accountLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            onClick={closeMenus}
          >
            <Icon fontSize="small" />
            <div>
              <span>{item.label}</span>
              <small>Manage</small>
            </div>
          </NavLink>
        );
      })}
    </SidebarSection>

  </div>
</aside>
    </header>
  );
};

export default Navbar;
