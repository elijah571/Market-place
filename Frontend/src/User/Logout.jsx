import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout, logoutUserApi } from '../features/users/userSlice';
import Loader from '../components/Loader';

const Logout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const runLogout = async () => {
      try {
        await dispatch(logoutUserApi()).unwrap();
        dispatch(logout());
        toast.success('Logged out successfully');
      } catch {
        dispatch(logout());
      } finally {
        navigate('/login');
      }
    };

    runLogout();
  }, [dispatch, navigate]);

  return <Loader />;
};

export default Logout;
