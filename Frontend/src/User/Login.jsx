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
      toast.success('Registration successful');
      dispatch(removeSuccess());
      navigate('/');
    }
  }, [dispatch, success, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="form-container container">
      <div className="form-content">
        <form className="form" onSubmit={loginSubmit}>
          <h2>Login</h2>

          <div className="input-group">
            <input
              type="email"
              placeholder="Enter email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Enter Password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="authBtn">Login</button>

          <p className="form-links">
            Don't have an account? <Link to="/signup">signup here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
