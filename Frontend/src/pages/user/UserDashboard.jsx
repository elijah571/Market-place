import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../../UserStyles/UserDashboard.css';

const UserDashboard = () => {
  const [open, setOpen] = useState(false);
  const { user } = useSelector((state) => state.user);

  return (
    <>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <div className="profile-header" onClick={() => setOpen((prev) => !prev)}>
        <img
          src={user?.avatar?.url || '/images/profile.jpeg'}
          alt="avatar"
          className="profile-avatar"
        />
        <span className="profile-name">{user?.name || 'My Account'}</span>
      </div>
      {open && (
        <div className="menu-options">
          <Link to="/profile" className="menu-option-btn">
            Profile
          </Link>
          <Link to="/orders/me" className="menu-option-btn">
            My Orders
          </Link>
          <Link to="/change-password" className="menu-option-btn">
            Change Password
          </Link>
          <Link to="/logout" className="menu-option-btn">
            Logout
          </Link>
        </div>
      )}
    </>
  );
};

export default UserDashboard;
