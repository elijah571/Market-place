import React, { useEffect, useState } from 'react';
import '../UserStyles/Form.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  login,
  removeErrors,
  removeSuccess,
} from '../features/users/userSlice';
import Loader from '../components/Loader';
import AuthShell from '../components/AuthShell';

const Login = () => {
  const { success, loading, error, isAuthenticated } = useSelector(
    (state) => state.user
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill all required fields');
      return;
    }

    dispatch(login({ email, password }));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(removeErrors());
    }
  }, [dispatch, error]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (success) {
      toast.success('Login successful');
      dispatch(removeSuccess());
      navigate('/');
    }
  }, [dispatch, success, navigate]);

  if (loading) return <Loader />;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to keep your cart, saved products, and order history in sync."
      description="Your checkout progress, wishlist, and address book follow you across devices with a cleaner storefront flow."
      alternateLink={{ to: '/signup', label: 'Create account' }}
    >
      <div className="form-container">
        <div className="form-content">
          <form className="form" onSubmit={loginSubmit}>
            <h2>Login</h2>

            <div className="input-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter Password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="authBtn" type="submit">
              {loading ? 'Signing in...' : 'Login'}
            </button>

            <p className="form-links">
              Don&apos;t have an account? <Link to="/signup">Sign up here</Link>
            </p>
          </form>
        </div>
      </div>
    </AuthShell>
  );
};

export default Login;
