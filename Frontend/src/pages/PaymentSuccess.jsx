import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
  const autoVerifyAttemptRef = useRef('');
  const hasMatchingTransaction =
    transaction?.reference === reference || order?.paymentInfo?.id === reference;

  const isVerified = useMemo(
    () => transaction?.status === 'successful',
    [transaction?.status]
  );

  const handleVerifyPayment = useCallback(async ({ silent = false } = {}) => {
    if (!gateway || !reference) {
      if (!silent) {
        toast.error('Missing payment reference details');
      }
      return;
    }

    try {
      const result = await dispatch(
        verifyPayment({ gateway, reference, cartId })
      ).unwrap();

      if (result.data?.status === 'successful') {
        dispatch(clearCart());
        toast.success('Payment verified successfully');
      } else if (!silent) {
        toast.warning('Payment still pending or failed');
      }
    } catch (verifyError) {
      if (!silent) {
        toast.error(verifyError || 'Payment verification failed');
      }
    }
  }, [cartId, dispatch, gateway, reference]);

  useEffect(() => {
    dispatch(clearPaymentState());
    autoVerifyAttemptRef.current = '';
  }, [dispatch, gateway, reference]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    const attemptKey = [gateway, reference, cartId].filter(Boolean).join(':');

    if (
      gateway &&
      reference &&
      !hasMatchingTransaction &&
      !loading &&
      autoVerifyAttemptRef.current !== attemptKey
    ) {
      autoVerifyAttemptRef.current = attemptKey;
      handleVerifyPayment({ silent: true });
    }
  }, [cartId, gateway, handleVerifyPayment, hasMatchingTransaction, loading, reference]);

  useEffect(() => {
    if (
      !gateway ||
      !reference ||
      loading ||
      isVerified ||
      transaction?.status !== 'pending' ||
      !transaction?.polling?.shouldPoll
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      handleVerifyPayment({ silent: true });
    }, Number(transaction.polling.intervalMs || 3000));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    gateway,
    handleVerifyPayment,
    isVerified,
    loading,
    reference,
    transaction?.polling?.intervalMs,
    transaction?.polling?.shouldPoll,
    transaction?.status,
  ]);

  return (
    <>
      <PageTitle title="Payment Status" />
      <div className="payment-success-shell page-shell">
        <div className="payment-success-grid">
          <section className="payment-success-container">
            <div className="success-content">
              <div
                className={`success-icon ${
                  transaction?.status === 'failed'
                    ? 'success-icon--failed'
                    : transaction?.status === 'refunded'
                      ? 'success-icon--refunded'
                      : ''
                }`}
              >
                <span className="checkmark" />
              </div>
              <p className="payment-kicker">Verification status</p>
              <h1>{isVerified ? 'Payment Confirmed' : 'Awaiting Verification'}</h1>
              <p className="success-para">
                {isVerified
                  ? 'Your payment has been confirmed and your order is being processed.'
                  : transaction?.status === 'refunded'
                    ? 'This payment was refunded and the order timeline has been updated.'
                    : transaction?.status === 'failed'
                      ? 'The payment did not complete. You can retry verification or return to checkout.'
                      : transaction?.polling?.shouldPoll
                        ? 'We are polling the gateway for confirmation. You can still verify manually at any time.'
                        : 'Complete the gateway flow and click verify to update your order status.'}
              </p>
              {error ? (
                <p className="success-para success-para--error">
                  {error}
                </p>
              ) : null}
              {transaction?.polling?.shouldPoll ? (
                <p className="success-para success-para--muted">
                  We&apos;ll keep checking every{' '}
                  {Math.ceil((transaction.polling.intervalMs || 3000) / 1000)}s.{' '}
                  {transaction.polling.attemptsRemaining} automatic checks remaining.
                </p>
              ) : null}
              <div className="payment-success-actions">
                {!isVerified && (
                  <button className="explore-btn" onClick={() => handleVerifyPayment()} disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify Payment'}
                  </button>
                )}
                {order?._id ? (
                  <Link className="explore-btn explore-btn--secondary" to={`/orders/${order._id}`}>
                    View Order
                  </Link>
                ) : null}
                <Link className="explore-btn explore-btn--secondary" to="/products">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </section>
          <aside className="payment-success-sidecard">
            <div className="payment-status-chip payment-status-chip--wide">
              {transaction?.status || 'pending'}
            </div>
            <h2>Transaction details</h2>
            <div className="payment-info-list">
              <div>
                <span>Gateway</span>
                <strong>{gateway || 'Unknown'}</strong>
              </div>
              <div>
                <span>Reference</span>
                <strong>{reference || transaction?.reference || 'Pending'}</strong>
              </div>
              <div>
                <span>Cart</span>
                <strong>{cartId || 'Unavailable'}</strong>
              </div>
              <div>
                <span>Order state</span>
                <strong>{order?.orderStatus || 'Awaiting confirmation'}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
