import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../Loader';

const UserRoute = ({ children }) => {
  const location = useLocation();
  const { authLoading, isAuthenticated, authChecked } = useSelector((state) => state.user);

  if (authLoading || !authChecked) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default UserRoute;
