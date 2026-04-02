import React, { useCallback, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import '../CartStyles/PaymentSuccess.css';
import PageTitle from '../components/PageTitle';
import { clearCart } from '../features/cart/cartSlice';
import { clearPaymentState, verifyPayment } from '../features/payments/paymentSlice';

const PaymentSuccess = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { loading, transaction, order, error } = useSelector((state) => state.payment);

  const gateway = searchParams.get('gateway');
  const reference = searchParams.get('reference');
  const cartId = searchParams.get('cartId');
  const hasMatchingTransaction =
    transaction?.reference === reference || transaction?.paymentInfo?.id === reference;

  const isVerified = useMemo(
    () => transaction?.status === 'successful',
    [transaction?.status]
  );

  const handleVerifyPayment = useCallback(async () => {
    if (!gateway || !reference) {
      toast.error('Missing payment reference details');
      return;
    }

    try {
      const result = await dispatch(
        verifyPayment({ gateway, reference, cartId })
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
  }, [cartId, dispatch, gateway, reference]);

  useEffect(() => {
    dispatch(clearPaymentState());
  }, [dispatch, gateway, reference]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (gateway && reference && !hasMatchingTransaction && !loading) {
      handleVerifyPayment();
    }
  }, [gateway, handleVerifyPayment, hasMatchingTransaction, loading, reference]);

  return (
    <>
      <PageTitle title="Payment Status" />
      <div className="payment-success-container page-shell page-shell--narrow">
        <div className="success-content">
          <div className="success-icon">
            <span className="checkmark" />
          </div>
          <h1>{isVerified ? 'Payment Confirmed' : 'Awaiting Verification'}</h1>
          <p className="success-para">
            {isVerified
              ? 'Your payment has been confirmed and your order is being processed.'
              : transaction?.status === 'refunded'
                ? 'This payment was refunded and the order timeline has been updated.'
                : transaction?.status === 'failed'
                  ? 'The payment did not complete. You can retry verification or return to checkout.'
                  : 'Complete the gateway flow and click verify to update your order status.'}
          </p>
          {!isVerified && (
            <button className="explore-btn" onClick={handleVerifyPayment} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Payment'}
            </button>
          )}
          {order?._id ? (
            <Link className="explore-btn" to={`/orders/${order._id}`}>
              View Order
            </Link>
          ) : null}
          <Link className="explore-btn" to="/products">
            Continue Shopping
          </Link>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
