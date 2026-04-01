import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTitle from '../components/PageTitle';
import '../CartStyles/Shipping.css';
import '../CartStyles/Payment.css';
import CheckoutPath from '../components/CheckoutPath';
import { cartSelectors, saveShippingInfo } from '../features/cart/cartSlice';
import { createOrder } from '../features/orders/orderSlice';
import { initializePayment } from '../features/payments/paymentSlice';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItems = useSelector((state) => state.cart.items);
  const { isAuthenticated } = useSelector((state) => state.user);
  const storedShippingInfo = useSelector((state) => state.cart.shippingInfo);
  const subtotal = useSelector(cartSelectors.getSubtotal);
  const shippingPrice = useSelector(cartSelectors.getShippingFee);
  const taxPrice = useSelector(cartSelectors.getTaxFee);
  const totalPrice = Number((subtotal + shippingPrice + taxPrice).toFixed(2));

  const [gateway, setGateway] = useState('stripe');
  const [shippingInfo, setShippingInfo] = useState(storedShippingInfo);
  const [submitting, setSubmitting] = useState(false);

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
  };

  const validateShipping = () => {
    const requiredKeys = [
      'country',
      'state',
      'city',
      'address',
      'pinCode',
      'phoneNo',
    ];
    return requiredKeys.every((key) => String(shippingInfo[key] || '').trim());
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to complete checkout');
      return navigate('/login');
    }

    if (!cartItems.length) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateShipping()) {
      toast.error('Complete all shipping fields');
      return;
    }

    setSubmitting(true);
    dispatch(saveShippingInfo(shippingInfo));

    try {
      const orderPayload = {
        shippingInfo: {
          ...shippingInfo,
          pinCode: Number(shippingInfo.pinCode),
          phoneNo: Number(shippingInfo.phoneNo),
        },
        orderItems,
        paymentInfo: { status: 'Pending' },
        itemPrice: subtotal,
        taxPrice,
        shippingPrice,
        totalPrice,
      };

      const orderResult = await dispatch(createOrder(orderPayload)).unwrap();
      const order = orderResult.data;

      const paymentResult = await dispatch(
        initializePayment({
          gateway,
          amount: totalPrice,
          currency: 'USD',
          orderId: order._id,
        })
      ).unwrap();

      const payment = paymentResult.data?.payment;

      if (payment?.nextAction?.authorizationUrl) {
        window.open(payment.nextAction.authorizationUrl, '_blank');
      }

      toast.info('Complete payment and verify on the next page');
      navigate(
        `/payment-success?gateway=${gateway}&reference=${payment?.reference}&orderId=${order._id}`
      );
    } catch (error) {
      toast.error(error || 'Unable to complete checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle title="Checkout" />
      <Navbar />
      <CheckoutPath activeStep={0} />
      <div className="shipping-form-container">
        <h2 className="shipping-form-header">Checkout</h2>
        <form className="shipping-form" onSubmit={handleCheckout}>
          <div className="shipping-section">
            <div className="shipping-form-group">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                value={shippingInfo.country}
                onChange={onInputChange}
              />
            </div>
            <div className="shipping-form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                value={shippingInfo.state}
                onChange={onInputChange}
              />
            </div>
            <div className="shipping-form-group">
              <label htmlFor="city">City</label>
              <input id="city" name="city" value={shippingInfo.city} onChange={onInputChange} />
            </div>
            <div className="shipping-form-group">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                value={shippingInfo.address}
                onChange={onInputChange}
              />
            </div>
            <div className="shipping-form-group">
              <label htmlFor="pinCode">Pin Code</label>
              <input
                id="pinCode"
                name="pinCode"
                value={shippingInfo.pinCode}
                onChange={onInputChange}
              />
            </div>
            <div className="shipping-form-group">
              <label htmlFor="phoneNo">Phone Number</label>
              <input
                id="phoneNo"
                name="phoneNo"
                value={shippingInfo.phoneNo}
                onChange={onInputChange}
              />
            </div>
          </div>
          <div className="shipping-section">
            <div className="shipping-form-group">
              <label htmlFor="gateway">Payment Gateway</label>
              <select
                id="gateway"
                value={gateway}
                onChange={(event) => setGateway(event.target.value)}
              >
                <option value="stripe">Stripe</option>
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
              </select>
            </div>
            <div className="shipping-form-group">
              <label>Subtotal</label>
              <input readOnly value={`$${subtotal.toFixed(2)}`} />
            </div>
            <div className="shipping-form-group">
              <label>Shipping</label>
              <input readOnly value={`$${shippingPrice.toFixed(2)}`} />
            </div>
            <div className="shipping-form-group">
              <label>Tax</label>
              <input readOnly value={`$${taxPrice.toFixed(2)}`} />
            </div>
            <div className="shipping-form-group">
              <label>Total</label>
              <input readOnly value={`$${totalPrice.toFixed(2)}`} />
            </div>
          </div>
          <button className="shipping-submit-btn" type="submit" disabled={submitting}>
            {submitting ? 'Processing...' : 'Place Order & Pay'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default Checkout;
