import React from 'react';
import '../UserStyles/Form.css';

const VerifyEmail = () => {
  return (
    <div className="form-container">
      <div className="container">
        <div className="form-content">
          <div className="form">
            <h2>Verify Your Email</h2>

            <p style={{ textAlign: 'center' }}>
              📩 We have sent a verification link to your email.
              <br />
              <br />
              Please check your inbox and click the link to activate your
              account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
