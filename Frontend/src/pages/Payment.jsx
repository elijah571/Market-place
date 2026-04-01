import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageTitle from '../components/PageTitle';
import CheckoutPath from '../components/CheckoutPath';
import '../CartStyles/Payment.css';

const Payment = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageTitle title="Payment" />
      <Navbar />
      <CheckoutPath activeStep={2} />
      <div className="payment-container">
        <Link to="/checkout" className="payment-go-back">
          Go Back
        </Link>
        <button className="payment-btn" onClick={() => navigate('/checkout')}>
          Continue Payment
        </button>
      </div>
    </>
  );
};

export default Payment;
