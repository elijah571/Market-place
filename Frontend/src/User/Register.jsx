import React, { useEffect, useState } from 'react';
import '../UserStyles/Form.css';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import {
  register,
  removeErrors,
  removeSuccess,
} from '../features/users/userSlice';
import Loader from '../components/Loader';
import AuthShell from '../components/AuthShell';

function Register() {
  const { success, loading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { name, email, password } = user;

  const [avatar, setAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('./images/profile.jpeg');

  const registerDataChange = (e) => {
    if (e.target.name === 'avatar') {
      const file = e.target.files[0];

      setAvatar(file);

      // preview only
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.readyState === 2) {
          setAvatarPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setUser({ ...user, [e.target.name]: e.target.value });
    }
  };
  const registerSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error('Please fill all required fields');
      return;
    }

    const form = new FormData();
    form.append('name', name);
    form.append('email', email);
    form.append('password', password);

    if (avatar) {
      form.append('avatar', avatar);
    }

    dispatch(register(form));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(removeErrors());
    }
  }, [dispatch, error]);
  useEffect(() => {
    if (success) {
      navigate('/verify-email');
      dispatch(removeSuccess());
    }
  }, [dispatch, success, navigate]);

  if (loading) return <Loader />;

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Join the storefront with saved addresses, favorites, and faster repeat checkout."
      description="Set up your profile once and keep shopping context, recommendations, and order progress attached to your account."
      alternateLink={{ to: '/login', label: 'Sign in' }}
    >
      <div className="form-container">
        <div className="form-content">
          <form
            className="form"
            onSubmit={registerSubmit}
            encType="multipart/form-data"
          >
            <h2>Register</h2>

            <div className="input-group">
              <label htmlFor="register-name">Name</label>
              <input
                id="register-name"
                type="text"
                placeholder="Enter user name"
                name="name"
                value={name}
                onChange={registerDataChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                placeholder="Enter email"
                name="email"
                value={email}
                onChange={registerDataChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                placeholder="Enter Password"
                name="password"
                value={password}
                onChange={registerDataChange}
              />
            </div>

            <div className="input-group avatar-group">
              <label htmlFor="register-avatar">Avatar</label>
              <div className="avatar-input-row">
                <input
                  id="register-avatar"
                  type="file"
                  name="avatar"
                  className="file-input"
                  accept="image/*"
                  onChange={registerDataChange}
                />
                <img src={avatarPreview} alt="Avatar Preview" className="avatar" />
              </div>
            </div>

            <button className="authBtn" type="submit">
              {loading ? 'Creating account...' : 'Register'}
            </button>

            <p className="form-links">
              Already have an account? <Link to="/login">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </AuthShell>
  );
}

export default Register;
