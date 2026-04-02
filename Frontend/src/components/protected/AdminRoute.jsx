import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../Loader';

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { loading, isAuthenticated, user, authChecked } = useSelector((state) => state.user);

  if (loading || !authChecked) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
