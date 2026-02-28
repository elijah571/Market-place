import React, { useState, useEffect } from 'react';
import '../UserStyles/Form.css';
import { useDispatch, useSelector } from 'react-redux';
import {
  resetPassword,
  removeErrors,
  removeSuccess,
} from '../features/users/userSlice';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { useNavigate, useParams } from 'react-router-dom';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();

  const { loading, error, resetPasswordSuccess } = useSelector(
    (state) => state.user
  );

  const [formData, setFormData] = useState({
    resetToken: '',
    newPassword: '',
  });

  const { resetToken, newPassword } = formData;

  const changeHandler = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandler = (e) => {
    e.preventDefault();

    if (!resetToken || !newPassword) {
      toast.error('All fields are required');
      return;
    }

    dispatch(resetPassword({ userId, resetToken, newPassword }));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(removeErrors());
    }

    if (resetPasswordSuccess) {
      toast.success('Password reset successfully');

      dispatch(removeSuccess());

      setTimeout(() => {
        navigate('/login');
      }, 1000);
    }
  }, [error, resetPasswordSuccess, dispatch, navigate]);

  return (
    <div className="form-container">
      {loading && <Loader />}

      <div className="container">
        <div className="form-content">
          <form className="form" onSubmit={submitHandler}>
            <h2>Reset Password</h2>

            <div className="input-group">
              <input
                type="text"
                name="resetToken"
                placeholder="Enter 6-digit reset code"
                value={resetToken}
                onChange={changeHandler}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                name="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={changeHandler}
              />
            </div>

            <button type="submit" className="authBtn">
              Reset Password
            </button>

            <div className="form-links">
              Password must contain uppercase, lowercase, number & symbol.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
