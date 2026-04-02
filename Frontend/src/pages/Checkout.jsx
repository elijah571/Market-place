import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTitle from '../components/PageTitle';
import '../CartStyles/Shipping.css';
import '../CartStyles/Payment.css';
import CheckoutPath from '../components/CheckoutPath';
import {
  cartSelectors,
  fetchCart,
  saveShippingInfo,
  syncCartWithServer,
} from '../features/cart/cartSlice';
import { initializePayment } from '../features/payments/paymentSlice';
import { addAddress } from '../features/users/userSlice';
import { formatCurrency } from '../utils/formatters';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);
  const cartId = useSelector((state) => state.cart.cartId);
  const cartIssues = useSelector((state) => state.cart.issues);
  const cartSyncing = useSelector((state) => state.cart.syncing);
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const storedShippingInfo = useSelector((state) => state.cart.shippingInfo);
  const appliedPromo = useSelector((state) => state.cart.promo);
  const subtotal = useSelector(cartSelectors.getSubtotal);
  const shippingPrice = useSelector(cartSelectors.getShippingFee);
  const taxPrice = useSelector(cartSelectors.getTaxFee);
  const discountPrice = useSelector(cartSelectors.getDiscountFee);
  const totalPrice = useSelector(cartSelectors.getTotal);
  const hasBlockingIssues = useSelector(cartSelectors.hasBlockingIssues);

  const [gateway, setGateway] = useState('stripe');
  const [shippingInfo, setShippingInfo] = useState(storedShippingInfo);
  const [shippingErrors, setShippingErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [saveAddressForLater, setSaveAddressForLater] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    setShippingInfo(storedShippingInfo);
  }, [storedShippingInfo]);

  const orderItems = useMemo(
    () =>
      cartItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        product: item.productId,
        selectedColor: item.selectedColor || '',
        selectedSize: item.selectedSize || '',
        variantId: item.variantId || null,
      })),
    [cartItems]
  );

  const onInputChange = (event) => {
    const { name, value } = event.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
    setShippingErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateShipping = () => {
    const requiredKeys = ['country', 'state', 'city', 'address', 'pinCode', 'phoneNo'];
    const nextErrors = requiredKeys.reduce((acc, key) => {
      if (!String(shippingInfo[key] || '').trim()) {
        acc[key] = 'This field is required';
      }

      return acc;
    }, {});

    setShippingErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleUseSavedAddress = (address) => {
    setShippingInfo({
      country: address.country || '',
      state: address.state || '',
      city: address.city || '',
      address: address.address || '',
      pinCode: String(address.pinCode || ''),
      phoneNo: String(address.phoneNo || ''),
    });
  };

  const handleContinue = async () => {
    if (activeStep === 0 && !validateShipping()) {
      toast.error('Complete all shipping fields before continuing');
      return;
    }

    if (hasBlockingIssues) {
      toast.error('Resolve the cart issues before continuing to payment');
      return;
    }

    if (activeStep === 0 && isAuthenticated) {
      try {
        await dispatch(
          syncCartWithServer({
            shippingInfo: {
              ...shippingInfo,
              pinCode: String(shippingInfo.pinCode || ''),
              phoneNo: String(shippingInfo.phoneNo || ''),
            },
            promoCode: appliedPromo?.code || '',
          })
        ).unwrap();
      } catch (error) {
        toast.error(error || 'Unable to sync checkout details');
        return;
      }
    }

    setActiveStep((prev) => Math.min(prev + 1, 2));
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to complete checkout');
      navigate('/login');
      return;
    }

    if (!cartItems.length) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateShipping()) {
      toast.error('Complete all shipping fields');
      return;
    }

    if (hasBlockingIssues) {
      toast.error('Resolve the cart issues before checking out');
      return;
    }

    setSubmitting(true);
    dispatch(saveShippingInfo(shippingInfo));

    try {
      const normalizedShippingInfo = {
        ...shippingInfo,
        pinCode: String(shippingInfo.pinCode || ''),
        phoneNo: String(shippingInfo.phoneNo || ''),
      };

      if (saveAddressForLater) {
        await dispatch(
          addAddress({
            label: `${shippingInfo.city} address`,
            ...normalizedShippingInfo,
          })
        ).unwrap();
      }

      const syncedCartResult = await dispatch(
        syncCartWithServer({
          shippingInfo: normalizedShippingInfo,
          promoCode: appliedPromo?.code || '',
        })
      ).unwrap();

      const syncedCart = syncedCartResult.cart;

      if (!syncedCart?._id) {
        throw new Error('Unable to prepare checkout cart');
      }

      const paymentResult = await dispatch(
        initializePayment({
          gateway,
          cartId: syncedCart._id || cartId,
        })
      ).unwrap();

      const payment = paymentResult.data?.payment;

      if (gateway === 'stripe' && payment?.nextAction?.clientSecret) {
        navigate(
          `/payment?gateway=${gateway}&reference=${payment.reference}&cartId=${
            syncedCart._id || cartId
          }&clientSecret=${encodeURIComponent(payment.nextAction.clientSecret)}`
        );
        return;
      }

      if (payment?.nextAction?.authorizationUrl) {
        window.open(payment.nextAction.authorizationUrl, '_blank');
      }

      toast.info('Complete payment and verify on the next page');
      navigate(
        `/payment-success?gateway=${gateway}&reference=${payment?.reference}&cartId=${
          syncedCart._id || cartId
        }`
      );
    } catch (error) {
      toast.error(error?.message || error || 'Unable to complete checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle title="Checkout" />
      <Navbar />
      <CheckoutPath activeStep={activeStep} />
      <div className="shipping-form-container">
        <div className="checkout-header">
          <div>
            <p className="checkout-kicker">Checkout</p>
            <h2 className="shipping-form-header">Complete your order in three guided steps</h2>
          </div>
          <div className="checkout-summary-pill">
            {cartSyncing ? 'Syncing cart...' : `${cartItems.length} items ready`}
          </div>
        </div>
        {cartIssues.length > 0 && (
          <div className="promo-active-row" style={{ marginBottom: '1rem' }}>
            <span>{cartIssues.map((issue) => issue.message).join(' ')}</span>
          </div>
        )}
        <form className="shipping-form" onSubmit={handleCheckout}>
          {activeStep === 0 && (
            <div className="checkout-stage-grid">
              <div className="shipping-section">
                <div className="checkout-section-head">
                  <h3>Delivery Details</h3>
                  <p>Choose a saved address or fill in a new one.</p>
                </div>
                {(user?.addresses || []).length > 0 && (
                  <div className="saved-address-grid">
                    {(user.addresses || []).map((address) => (
                      <button
                        type="button"
                        key={address._id}
                        className="saved-address-card"
                        onClick={() => handleUseSavedAddress(address)}
                      >
                        <strong>{address.label || `${address.city}, ${address.state}`}</strong>
                        <span>{address.address}</span>
                        <small>
                          {address.city}, {address.state}, {address.country}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
                <div className="shipping-form-grid">
                  <div className="shipping-form-group">
                    <label htmlFor="country">Country</label>
                    <input id="country" name="country" value={shippingInfo.country} onChange={onInputChange} />
                    {shippingErrors.country ? <small>{shippingErrors.country}</small> : null}
                  </div>
                  <div className="shipping-form-group">
                    <label htmlFor="state">State</label>
                    <input id="state" name="state" value={shippingInfo.state} onChange={onInputChange} />
                    {shippingErrors.state ? <small>{shippingErrors.state}</small> : null}
                  </div>
                  <div className="shipping-form-group">
                    <label htmlFor="city">City</label>
                    <input id="city" name="city" value={shippingInfo.city} onChange={onInputChange} />
                    {shippingErrors.city ? <small>{shippingErrors.city}</small> : null}
                  </div>
                  <div className="shipping-form-group">
                    <label htmlFor="address">Address</label>
                    <input id="address" name="address" value={shippingInfo.address} onChange={onInputChange} />
                    {shippingErrors.address ? <small>{shippingErrors.address}</small> : null}
                  </div>
                  <div className="shipping-form-group">
                    <label htmlFor="pinCode">Pin Code</label>
                    <input id="pinCode" name="pinCode" value={shippingInfo.pinCode} onChange={onInputChange} />
                    {shippingErrors.pinCode ? <small>{shippingErrors.pinCode}</small> : null}
                  </div>
                  <div className="shipping-form-group">
                    <label htmlFor="phoneNo">Phone Number</label>
                    <input id="phoneNo" name="phoneNo" value={shippingInfo.phoneNo} onChange={onInputChange} />
                    {shippingErrors.phoneNo ? <small>{shippingErrors.phoneNo}</small> : null}
                  </div>
                </div>
                <label className="save-address-checkbox">
                  <input
                    type="checkbox"
                    checked={saveAddressForLater}
                    onChange={(event) => setSaveAddressForLater(event.target.checked)}
                  />
                  <span>Save this address for future orders</span>
                </label>
              </div>
              <aside className="checkout-aside">
                <h3>Why this flow is faster</h3>
                <p>Shipping, discounts, and stock are synced to the server before payment starts.</p>
                <button type="button" className="shipping-submit-btn" onClick={handleContinue}>
                  Continue to payment setup
                </button>
              </aside>
            </div>
          )}

          {activeStep === 1 && (
            <div className="checkout-stage-grid">
              <div className="shipping-section">
                <div className="checkout-section-head">
                  <h3>Payment Setup</h3>
                  <p>Select the gateway that fits your checkout preference.</p>
                </div>
                <div className="gateway-grid">
                  {['stripe', 'paystack', 'flutterwave'].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`gateway-card ${gateway === item ? 'active' : ''}`}
                      onClick={() => setGateway(item)}
                    >
                      <strong>{item}</strong>
                      <span>{item === 'stripe' ? 'Embedded secure form' : 'Gateway redirect flow'}</span>
                    </button>
                  ))}
                </div>
                <div className="checkout-action-row">
                  <button type="button" className="checkout-secondary-btn" onClick={() => setActiveStep(0)}>
                    Back
                  </button>
                  <button type="button" className="shipping-submit-btn" onClick={() => setActiveStep(2)}>
                    Review order
                  </button>
                </div>
              </div>
              <aside className="checkout-aside">
                <h3>Delivery destination</h3>
                <p>
                  {shippingInfo.address}, {shippingInfo.city}, {shippingInfo.state}, {shippingInfo.country}
                </p>
              </aside>
            </div>
          )}

          {activeStep === 2 && (
            <div className="checkout-stage-grid">
              <div className="shipping-section">
                <div className="checkout-section-head">
                  <h3>Order Review</h3>
                  <p>Confirm totals, promo savings, and delivery details before payment.</p>
                </div>
                <div className="review-summary-list">
                  {orderItems.map((item) => (
                    <div key={`${item.product}-${item.variantId || ''}`} className="review-summary-item">
                      <span>{item.name}</span>
                      <strong>
                        {item.quantity} x {formatCurrency(item.price)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="checkout-aside order-total-panel">
                <div className="shipping-form-group">
                  <label>Subtotal</label>
                  <input readOnly value={formatCurrency(subtotal)} />
                </div>
                <div className="shipping-form-group">
                  <label>Shipping</label>
                  <input readOnly value={formatCurrency(shippingPrice)} />
                </div>
                <div className="shipping-form-group">
                  <label>Tax</label>
                  <input readOnly value={formatCurrency(taxPrice)} />
                </div>
                {discountPrice > 0 && (
                  <div className="shipping-form-group">
                    <label>Discount ({appliedPromo?.code})</label>
                    <input readOnly value={`-${formatCurrency(discountPrice)}`} />
                  </div>
                )}
                <div className="shipping-form-group">
                  <label>Total</label>
                  <input readOnly value={formatCurrency(totalPrice)} />
                </div>
                <div className="checkout-action-row">
                  <button type="button" className="checkout-secondary-btn" onClick={() => setActiveStep(1)}>
                    Back
                  </button>
                  <button className="shipping-submit-btn" type="submit" disabled={submitting}>
                    {submitting ? 'Processing...' : 'Continue to payment'}
                  </button>
                </div>
              </aside>
            </div>
          )}
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
