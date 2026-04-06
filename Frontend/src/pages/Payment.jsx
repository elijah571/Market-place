import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'react-toastify';
import PageTitle from '../components/PageTitle';
import CheckoutPath from '../components/CheckoutPath';
import '../CartStyles/Payment.css';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const StripePaymentForm = ({ reference, cartId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?gateway=stripe&reference=${reference}&cartId=${cartId}`,
      },
    });

    setSubmitting(false);

    if (error) {
      toast.error(error.message || 'Unable to confirm payment');
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      navigate(`/payment-success?gateway=stripe&reference=${reference}&cartId=${cartId}`);
      return;
    }

    toast.info('Complete the remaining payment steps to finish checkout.');
  };

  return (
    <div className="payment-shell page-shell">
      <div className="payment-layout">
        <div className="payment-panel payment-panel--primary">
          <div className="payment-panel-head">
            <p className="payment-kicker">Secure Payment</p>
            <h1>Confirm your checkout without leaving the experience behind.</h1>
            <p>
              Your order is already staged on the server. Complete payment here and we&apos;ll
              verify the result directly with Stripe before the order moves forward.
            </p>
          </div>
          <form className="payment-form-card" onSubmit={handleSubmit}>
            <div className="payment-form-toolbar">
              <Link to="/checkout" className="payment-go-back">
                Back to checkout
              </Link>
              <div className="payment-inline-badge">Reference {reference}</div>
            </div>
            <div className="payment-element-shell">
              <PaymentElement />
            </div>
            <button className="payment-btn" type="submit" disabled={!stripe || submitting}>
              {submitting ? 'Processing...' : 'Pay now'}
            </button>
          </form>
        </div>
        <aside className="payment-panel payment-panel--aside">
          <div className="payment-status-card">
            <span className="payment-status-chip">Verification ready</span>
            <h2>What happens next</h2>
            <div className="payment-info-list">
              <div>
                <span>Gateway</span>
                <strong>Stripe</strong>
              </div>
              <div>
                <span>Cart</span>
                <strong>{cartId}</strong>
              </div>
              <div>
                <span>Validation</span>
                <strong>Server-side after confirmation</strong>
              </div>
            </div>
          </div>
          <div className="payment-note-card">
            <strong>No webhook dependency</strong>
            <p>
              If Stripe needs extra time, the success page will retry verification automatically
              until the backend gets a final result.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const Payment = () => {
  const [searchParams] = useSearchParams();
  const paymentData = useSelector((state) => state.payment.paymentData);
  const paymentTransaction = useSelector((state) => state.payment.transaction);

  const clientSecret =
    searchParams.get('clientSecret') || paymentData?.nextAction?.clientSecret || '';
  const gateway = searchParams.get('gateway') || paymentData?.gateway || '';
  const reference = searchParams.get('reference') || paymentData?.reference || '';
  const cartId =
    searchParams.get('cartId') ||
    paymentData?.cartId ||
    paymentTransaction?.cart ||
    '';

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: 'stripe',
      },
    }),
    [clientSecret]
  );

  const isStripeFlow = gateway === 'stripe' && clientSecret && stripePromise;

  return (
    <>
      <PageTitle title="Payment" />
      <CheckoutPath activeStep={2} />
      {!isStripeFlow ? (
        <div className="payment-shell page-shell page-shell--narrow">
          <div className="payment-panel payment-panel--empty">
            <Link to="/checkout" className="payment-go-back">
              Back to checkout
            </Link>
            <p className="payment-kicker">Stripe session unavailable</p>
            <h1>We couldn&apos;t load the payment form.</h1>
            <p className="payment-empty-copy">
              {!stripePromise
                ? 'Stripe is not configured on the client yet. Add `VITE_STRIPE_PUBLISHABLE_KEY` and restart the frontend to render the embedded payment form.'
                : 'This payment session is missing the Stripe client secret. Restart checkout to create a fresh payment session.'}
            </p>
          </div>
        </div>
      ) : (
        <Elements stripe={stripePromise} options={options}>
          <StripePaymentForm reference={reference} cartId={cartId} />
        </Elements>
      )}
    </>
  );
};

export default Payment;
