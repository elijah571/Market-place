import React, { useState, useEffect } from 'react';
import '../UserStyles/Form.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendResetToken,
  removeErrors,
  removeSuccess,
} from '../features/users/userSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';

const ResetPasswordToken = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, resetTokenSent, resetUserId } = useSelector(
    (state) => state.user
  );

  const [email, setEmail] = useState('');

  const submitHandler = (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email is required');
      return;
    }

    dispatch(sendResetToken(email));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(removeErrors());
    }

    if (resetTokenSent && resetUserId) {
      toast.success('Reset token sent to your email');

      dispatch(removeSuccess());

      // ✅ AUTO REDIRECT
      setTimeout(() => {
        navigate(`/reset-password/${resetUserId}`);
      }, 1200);
    }
  }, [error, resetTokenSent, resetUserId, dispatch, navigate]);

  return (
    <div className="form-container">
      {loading && <Loader />}

      <div className="container">
        <div className="form-content">
          <form className="form" onSubmit={submitHandler}>
            <h2>Request Password Reset</h2>

            <div className="input-group email-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="authBtn">
              Send Reset Token
            </button>

            <div className="form-links">
              Check your email for the 6-digit reset code.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordToken;
