import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import PageTitle from '../components/PageTitle';
import apiClient from '../utils/apiClient';
import '../UserStyles/Profile.css';

const SingleUser = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await apiClient.get(`/users/${userId}`);
        setUser(data?.user || null);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to fetch user');
      }
    };

    fetchUser();
  }, [userId]);

  if (!user) {
    return (
      <>
        <div className="page-shell page-shell--narrow">
          <p style={{ textAlign: 'center' }}>User not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="User Details" />
      <div className="profile-container page-shell">
        <div className="profile-image">
          <h1 className="profile-heading">User Details</h1>
          <img src={user?.avatar?.url || '/images/profile.jpeg'} alt="User Profile" />
        </div>
        <div className="profile-details">
          <div className="profile-detail">
            <h2>Name</h2>
            <p>{user.name}</p>
          </div>
          <div className="profile-detail">
            <h2>Email</h2>
            <p>{user.email}</p>
          </div>
          <div className="profile-detail">
            <h2>Role</h2>
            <p>{user.role}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SingleUser;
