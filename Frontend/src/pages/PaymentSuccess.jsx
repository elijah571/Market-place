import React, { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import '../CartStyles/PaymentSuccess.css';
import PageTitle from '../components/PageTitle';
import { clearCart } from '../features/cart/cartSlice';
import { verifyPayment } from '../features/payments/paymentSlice';

const PaymentSuccess = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { loading, transaction, error } = useSelector((state) => state.payment);

  const gateway = searchParams.get('gateway');
  const reference = searchParams.get('reference');
  const orderId = searchParams.get('orderId');

  const isVerified = useMemo(
    () => transaction?.status === 'successful',
    [transaction?.status]
  );

  const handleVerifyPayment = async () => {
    if (!gateway || !reference) {
      toast.error('Missing payment reference details');
      return;
    }

    try {
      const result = await dispatch(
        verifyPayment({ gateway, reference, orderId })
      ).unwrap();

      if (result.data?.status === 'successful') {
        dispatch(clearCart());
        toast.success('Payment verified successfully');
      } else {
        toast.warning('Payment still pending or failed');
      }
    } catch (verifyError) {
      toast.error(verifyError || 'Payment verification failed');
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <>
      <PageTitle title="Payment Status" />
      <div className="payment-success-container">
        <div className="success-content">
          <div className="success-icon">
            <span className="checkmark" />
          </div>
          <h1>{isVerified ? 'Payment Confirmed' : 'Awaiting Verification'}</h1>
          <p className="success-para">
            {isVerified
              ? 'Your payment has been confirmed and your order is being processed.'
              : 'Complete the gateway flow and click verify to update your order status.'}
          </p>
          {!isVerified && (
            <button className="explore-btn" onClick={handleVerifyPayment} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Payment'}
            </button>
          )}
          <Link className="explore-btn" to="/products">
            Continue Shopping
          </Link>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
