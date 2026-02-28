import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  verifyAccount,
  removeErrors,
  removeSuccess,
} from '../features/users/userSlice';
import '../UserStyles/Form.css';
import { toast } from 'react-toastify';

const VerifyCode = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [code, setCode] = useState('');

  const { loading, error, verifySuccess } = useSelector((state) => state.user);

  // Handle verification submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code) return toast.error('Please enter the verification code');
    dispatch(verifyAccount(code));
  };

  // Handle success + errors
  useEffect(() => {
    if (verifySuccess) {
      toast.success('Account verified successfully 🎉');

      setTimeout(() => {
        dispatch(removeSuccess());
        navigate('/login');
      }, 2000);
    }

    if (error) {
      toast.error(error);
      setTimeout(() => {
        dispatch(removeErrors());
      }, 2500);
    }
  }, [verifySuccess, error, dispatch, navigate]);

  return (
    <div className="form-container">
      <div className="container">
        <div className="form-content">
          <div className="form">
            <h2>Enter Verification Code</h2>
            <p style={{ textAlign: 'center', marginBottom: '15px' }}>
              📩 Please enter the code sent to your email to verify your account
            </p>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="authBtn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
