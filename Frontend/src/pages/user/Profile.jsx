import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../../UserStyles/Profile.css';
import Navbar from '../../components/Navbar';
import PageTitle from '../../components/PageTitle';

const Profile = () => {
  const { user } = useSelector((state) => state.user);

  return (
    <>
      <PageTitle title="My Profile" />
      <Navbar />
      <div className="profile-container">
        <div className="profile-image">
          <h1 className="profile-heading">My Profile</h1>
          <img src={user?.avatar?.url || '/images/profile.jpeg'} alt="User Profile" />
          <Link to="/profile/update">Update Profile</Link>
        </div>

        <div className="profile-details">
          <div className="profile-detail">
            <h2>Name</h2>
            <p>{user?.name || '-'}</p>
          </div>
          <div className="profile-detail">
            <h2>Email</h2>
            <p>{user?.email || '-'}</p>
          </div>
          <div className="profile-detail">
            <h2>Role</h2>
            <p>{user?.role || 'user'}</p>
          </div>
        </div>

        <div className="profile-buttons">
          <Link to="/orders/me">My Orders</Link>
          <Link to="/change-password">Change Password</Link>
        </div>
      </div>
    </>
  );
};

export default Profile;
