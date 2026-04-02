import React, { useMemo, useState } from 'react';
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
    <form className="payment-container" onSubmit={handleSubmit}>
      <Link to="/checkout" className="payment-go-back">
        Go Back
      </Link>
      <div className="shipping-section" style={{ width: '100%', maxWidth: '640px' }}>
        <PaymentElement />
      </div>
      <button className="payment-btn" type="submit" disabled={!stripe || submitting}>
        {submitting ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
};

const Payment = () => {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get('clientSecret');
  const gateway = searchParams.get('gateway');
  const reference = searchParams.get('reference');
  const cartId = searchParams.get('cartId');

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
        <div className="payment-container page-shell page-shell--narrow">
          <Link to="/checkout" className="payment-go-back">
            Go Back
          </Link>
          <p className="success-para">
            Stripe is not configured on the client yet. Add `VITE_STRIPE_PUBLISHABLE_KEY`
            and restart the frontend to render the embedded payment form.
          </p>
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
