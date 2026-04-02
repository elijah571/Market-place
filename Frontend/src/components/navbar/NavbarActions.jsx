import React, { memo } from 'react';
import {
  Close,
  ExpandMore,
  FavoriteBorder,
  Menu,
  PersonAddAlt1Outlined,
  PersonOutline,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import { NavLink } from 'react-router-dom';

const ActionIconLink = ({ to, label, count, icon, onNavigate }) => {
  const Icon = icon;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `navbar-icon-link${isActive ? ' is-active' : ''}`
      }
      aria-label={label}
      onClick={onNavigate}
    >
      <Icon fontSize="small" aria-hidden="true" />
      {typeof count === 'number' ? <span className="navbar-icon-badge">{count}</span> : null}
    </NavLink>
  );
};

const NavbarActions = ({
  isAuthenticated,
  user,
  wishlistCount,
  cartCount,
  accountLinks,
  isAccountMenuOpen,
  onToggleAccountMenu,
  onCloseMenus,
  accountMenuRef,
  isDrawerOpen,
  onToggleDrawer,
}) => {
  return (
    <div className="navbar-actions">
      <ActionIconLink
        to="/favorites"
        label="Wishlist"
        count={wishlistCount}
        icon={FavoriteBorder}
        onNavigate={onCloseMenus}
      />
      <ActionIconLink
        to="/cart"
        label="Cart"
        count={cartCount}
        icon={ShoppingCartOutlined}
        onNavigate={onCloseMenus}
      />

      {isAuthenticated ? (
        <div className="navbar-account" ref={accountMenuRef}>
          <button
            type="button"
            className={`navbar-account-trigger${isAccountMenuOpen ? ' is-open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={isAccountMenuOpen}
            aria-controls="navbar-account-menu"
            onClick={onToggleAccountMenu}
          >
            <PersonOutline fontSize="small" aria-hidden="true" />
            <span>{user?.name?.split(' ')[0] || 'Account'}</span>
            <ExpandMore fontSize="small" aria-hidden="true" />
          </button>

          <div
            id="navbar-account-menu"
            className={`navbar-popover navbar-account-menu${
              isAccountMenuOpen ? ' is-open' : ''
            }`}
            role="menu"
            aria-label="Account menu"
          >
            {accountLinks.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={({ isActive }) =>
                    `navbar-popover-link${isActive ? ' is-active' : ''}`
                  }
                  onClick={onCloseMenus}
                >
                  <Icon fontSize="small" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      ) : (
        <NavLink
          to="/signup"
          className={({ isActive }) =>
            `navbar-profile-link${isActive ? ' is-active' : ''}`
          }
          onClick={onCloseMenus}
        >
          <PersonAddAlt1Outlined fontSize="small" aria-hidden="true" />
          <span>Join</span>
        </NavLink>
      )}

      <button
        type="button"
        className="navbar-hamburger"
        onClick={onToggleDrawer}
        aria-label={isDrawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isDrawerOpen}
        aria-controls="navbar-mobile-drawer"
      >
        {isDrawerOpen ? <Close className="icon" /> : <Menu className="icon" />}
      </button>
    </div>
  );
};

export default memo(NavbarActions);
