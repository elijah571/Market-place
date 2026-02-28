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
    <div className="form-container container">
      <div className="form-content">
        <form
          className="form"
          onSubmit={registerSubmit}
          encType="multipart/form-data"
        >
          <h2>Register</h2>

          <div className="input-group">
            <input
              type="text"
              placeholder="Enter user name"
              name="name"
              value={name}
              onChange={registerDataChange}
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              placeholder="Enter email"
              name="email"
              value={email}
              onChange={registerDataChange}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Enter Password"
              name="password"
              value={password}
              onChange={registerDataChange}
            />
          </div>

          <div className="input-group avatar-group">
            <input
              type="file"
              name="avatar"
              className="file-input"
              accept="image/*"
              onChange={registerDataChange}
            />
            <img src={avatarPreview} alt="Avatar Preview" className="avatar" />
          </div>

          <button className="authBtn">Register</button>

          <p className="form-links">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
