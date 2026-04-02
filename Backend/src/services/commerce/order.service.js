const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export const buildOrderTimelineEntry = ({
  type = 'order',
  status,
  note = '',
  actor = 'system',
  createdAt = new Date(),
}) => ({
  type,
  status,
  note,
  actor,
  createdAt,
});

export const appendOrderTimelineEntry = (order, entry) => {
  if (!order.statusTimeline) {
    order.statusTimeline = [];
  }

  const previousEntry = order.statusTimeline[order.statusTimeline.length - 1];

  if (
    previousEntry &&
    previousEntry.type === entry.type &&
    previousEntry.status === entry.status &&
    previousEntry.note === entry.note
  ) {
    return;
  }

  order.statusTimeline.push(buildOrderTimelineEntry(entry));
};

export const createOrderDocument = ({
  userId,
  cartId = null,
  snapshot,
  payment = {},
  orderStatus = 'PendingPayment',
  actor = 'system',
}) => {
  const paymentStatus = String(payment.status || PAYMENT_STATUS.PENDING);
  const isPaid = paymentStatus.toLowerCase() === PAYMENT_STATUS.PAID.toLowerCase();
  const paymentAmount = isPaid
    ? roundMoney(payment.amountPaid ?? snapshot.summary.totalPrice)
    : 0;

  return {
    shippingInfo: snapshot.shippingInfo,
    orderItems: snapshot.items.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      product: item.product,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      variantId: item.variantId,
    })),
    paymentInfo: {
      id: payment.id || '',
      gateway: payment.gateway || '',
      status: paymentStatus,
      providerStatus: payment.providerStatus || '',
      currency: payment.currency || snapshot.currency || 'USD',
      amountPaid: paymentAmount,
    },
    paidAt: isPaid ? new Date() : null,
    itemPrice: snapshot.summary.itemPrice,
    taxPrice: snapshot.summary.taxPrice,
    shippingPrice: snapshot.summary.shippingPrice,
    discountPrice: snapshot.summary.discountPrice,
    promoCode: snapshot.summary.promoCode,
    totalPrice: snapshot.summary.totalPrice,
    user: userId,
    cart: cartId,
    orderStatus,
    statusTimeline: [
      buildOrderTimelineEntry({
        type: 'order',
        status: orderStatus,
        note: isPaid
          ? 'Order created after successful payment.'
          : 'Order created and awaiting payment.',
        actor,
      }),
      buildOrderTimelineEntry({
        type: 'payment',
        status: paymentStatus,
        note: paymentStatus,
        actor,
      }),
    ],
  };
};

export const syncOrderPaymentState = (
  order,
  {
    reference = '',
    gateway = '',
    paymentStatus = PAYMENT_STATUS.PENDING,
    providerStatus = '',
    amount = 0,
    currency = 'USD',
    actor = 'system',
    note = '',
  } = {}
) => {
  const normalizedPaymentStatus = String(paymentStatus || PAYMENT_STATUS.PENDING);
  const lowerPaymentStatus = normalizedPaymentStatus.toLowerCase();
  const nextCurrency =
    String(currency || order.paymentInfo?.currency || 'USD').toUpperCase();

  order.paymentInfo = {
    ...order.paymentInfo,
    id: reference || order.paymentInfo?.id || '',
    gateway: gateway || order.paymentInfo?.gateway || '',
    status: normalizedPaymentStatus,
    providerStatus: providerStatus || order.paymentInfo?.providerStatus || '',
    currency: nextCurrency,
    amountPaid:
      lowerPaymentStatus === PAYMENT_STATUS.PAID.toLowerCase()
        ? roundMoney(amount || order.totalPrice || 0)
        : lowerPaymentStatus === PAYMENT_STATUS.REFUNDED.toLowerCase()
          ? 0
          : roundMoney(order.paymentInfo?.amountPaid || 0),
  };

  if (lowerPaymentStatus === PAYMENT_STATUS.PAID.toLowerCase()) {
    order.paidAt = order.paidAt || new Date();
    if (order.orderStatus === 'PendingPayment') {
      order.orderStatus = 'Processing';
      appendOrderTimelineEntry(order, {
        type: 'order',
        status: order.orderStatus,
        note: 'Payment confirmed and order moved into processing.',
        actor,
      });
    }
  }

  if (lowerPaymentStatus === PAYMENT_STATUS.FAILED.toLowerCase()) {
    order.paymentInfo.amountPaid = 0;
    if (order.orderStatus === 'Processing' && !order.paidAt) {
      order.orderStatus = 'PendingPayment';
      appendOrderTimelineEntry(order, {
        type: 'order',
        status: order.orderStatus,
        note: 'Payment failed. Order moved back to pending payment.',
        actor,
      });
    }
  }

  if (lowerPaymentStatus === PAYMENT_STATUS.REFUNDED.toLowerCase()) {
    order.paymentInfo.amountPaid = 0;
    if (order.orderStatus !== 'Cancelled') {
      order.orderStatus = 'Cancelled';
      appendOrderTimelineEntry(order, {
        type: 'order',
        status: order.orderStatus,
        note: 'Payment refunded and order cancelled.',
        actor,
      });
    }
  }

  appendOrderTimelineEntry(order, {
    type: 'payment',
    status: normalizedPaymentStatus,
    note: note || providerStatus || normalizedPaymentStatus,
    actor,
  });

  return order;
};
