import React, { memo } from 'react';
import { StorefrontOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const NavbarBrand = ({ onNavigate }) => {
  return (
    <Link to="/" className="navbar-logo" onClick={onNavigate} aria-label="Marketplace home">
      <span className="navbar-logo-mark" aria-hidden="true">
        <StorefrontOutlined fontSize="small" />
      </span>
      <span className="navbar-logo-text">
        Market<span>Place</span>
      </span>
    </Link>
  );
};

export default memo(NavbarBrand);
