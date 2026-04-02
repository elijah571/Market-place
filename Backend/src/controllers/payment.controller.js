import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { Cart } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';
import { Transaction } from '../models/transaction.model.js';
import { AppError } from '../utils/AppError.js';
import { paymentService } from '../services/payment/payment.service.js';
import { sendSuccess } from '../utils/response.js';
import {
  buildCartSnapshot,
  getActiveCartForUser,
  getBlockingCartIssues,
  hasBlockingCartIssues,
  isShippingInfoComplete,
  reserveInventoryForItems,
} from '../services/commerce/cart.service.js';
import { clearCommerceCache } from '../utils/cache.js';
import {
  createOrderDocument,
  PAYMENT_STATUS,
  syncOrderPaymentState,
} from '../services/commerce/order.service.js';

const normalizeGateway = (gateway) => String(gateway || '').toLowerCase();
const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const toOrderPaymentStatus = (status) => {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus === 'successful') {
    return PAYMENT_STATUS.PAID;
  }

  if (normalizedStatus === 'failed') {
    return PAYMENT_STATUS.FAILED;
  }

  if (normalizedStatus === 'refunded') {
    return PAYMENT_STATUS.REFUNDED;
  }

  return PAYMENT_STATUS.PENDING;
};

const saveTransaction = async ({
  gateway,
  reference,
  amount,
  currency,
  status,
  userId,
  orderId,
  cartId,
  idempotencyKey,
  providerResponse,
  session,
}) => {
  const nextValues = {
    gateway,
    reference,
    amount,
    currency,
    status,
    user: userId,
    providerResponse,
  };

  if (orderId) {
    nextValues.order = orderId;
  }

  if (cartId) {
    nextValues.cart = cartId;
  }

  if (idempotencyKey) {
    nextValues.idempotencyKey = idempotencyKey;
  }

  const transaction = await Transaction.findOneAndUpdate(
    { gateway, reference },
    { $set: nextValues },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      ...(session ? { session } : {}),
    }
  );

  return transaction;
};

const findExistingOrderForTransaction = async (gateway, reference) => {
  const existingTransaction = await Transaction.findOne({ gateway, reference }).populate(
    'order'
  );

  if (existingTransaction?.order) {
    return existingTransaction;
  }

  return null;
};

const syncExistingOrderPayment = async ({
  gateway,
  reference,
  status,
  providerStatus,
  amount,
  currency,
  raw,
}) => {
  const transactionWithOrder = await findExistingOrderForTransaction(gateway, reference);

  if (!transactionWithOrder?.order) {
    return null;
  }

  const order = transactionWithOrder.order;
  syncOrderPaymentState(order, {
    reference,
    gateway,
    paymentStatus: toOrderPaymentStatus(status),
    providerStatus,
    amount,
    currency,
    actor: 'payment_webhook',
    note: providerStatus,
  });

  await order.save({ validateBeforeSave: false });

  const transaction = await saveTransaction({
    gateway,
    reference,
    amount,
    currency,
    status,
    userId: transactionWithOrder.user,
    orderId: order._id,
    cartId: transactionWithOrder.cart,
    idempotencyKey: transactionWithOrder.idempotencyKey,
    providerResponse: raw,
  });

  clearCommerceCache();

  return { order, transaction };
};

const finalizeSuccessfulPayment = async ({
  gateway,
  reference,
  amount,
  currency,
  providerStatus,
  providerResponse,
  cartId,
  userId,
}) => {
  const existingTransaction = await Transaction.findOne({ gateway, reference }).populate(
    'order'
  );

  if (existingTransaction?.order) {
    syncOrderPaymentState(existingTransaction.order, {
      reference,
      gateway,
      paymentStatus: PAYMENT_STATUS.PAID,
      providerStatus,
      amount,
      currency,
      actor: 'payment_verification',
      note: providerStatus,
    });
    await existingTransaction.order.save({ validateBeforeSave: false });

    const transaction = await saveTransaction({
      gateway,
      reference,
      amount,
      currency,
      status: 'successful',
      userId: existingTransaction.user,
      orderId: existingTransaction.order._id,
      cartId: existingTransaction.cart,
      idempotencyKey: existingTransaction.idempotencyKey,
      providerResponse,
    });

    return {
      transaction,
      order: existingTransaction.order,
      created: false,
    };
  }

  const resolvedCartId = cartId || existingTransaction?.cart;
  const resolvedUserId = userId || existingTransaction?.user;

  if (!resolvedCartId || !resolvedUserId) {
    throw new AppError('Unable to resolve checkout cart for payment finalization', 400);
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cart = await Cart.findOne({
      _id: resolvedCartId,
      user: resolvedUserId,
      status: 'active',
    }).session(session);

    if (!cart) {
      const convertedCart = await Cart.findOne({
        _id: resolvedCartId,
        user: resolvedUserId,
      })
        .populate('convertedOrder')
        .session(session);

      if (convertedCart?.convertedOrder) {
        const transaction = await saveTransaction({
          gateway,
          reference,
          amount,
          currency,
          status: 'successful',
          userId: resolvedUserId,
          orderId: convertedCart.convertedOrder._id,
          cartId: convertedCart._id,
          idempotencyKey: existingTransaction?.idempotencyKey,
          providerResponse,
          session,
        });

        await session.commitTransaction();

        return {
          transaction,
          order: convertedCart.convertedOrder,
          created: false,
        };
      }

      throw new AppError('Checkout cart not found or already converted', 404);
    }

    const snapshot = await buildCartSnapshot(
      {
        items: cart.items,
        shippingInfo: cart.shippingInfo,
        promoCode: cart.promoCode,
        currency,
      },
      { session }
    );

    if (!snapshot.items.length) {
      throw new AppError('Cannot finalize payment for an empty cart', 400);
    }

    if (!isShippingInfoComplete(snapshot.shippingInfo)) {
      throw new AppError('Shipping information is incomplete for this checkout', 400);
    }

    if (hasBlockingCartIssues(snapshot.issues)) {
      throw new AppError(getBlockingCartIssues(snapshot.issues)[0].message, 409);
    }

    if (
      Math.abs(roundMoney(amount || 0) - roundMoney(snapshot.summary.totalPrice || 0)) >
      0.01
    ) {
      throw new AppError('Payment amount does not match the server cart total', 409);
    }

    await reserveInventoryForItems(snapshot.items, { session });

    const [order] = await Order.create(
      [
        createOrderDocument({
          userId: resolvedUserId,
          cartId: cart._id,
          snapshot,
          payment: {
            id: reference,
            gateway,
            status: PAYMENT_STATUS.PAID,
            providerStatus,
            amountPaid: amount,
            currency,
          },
          orderStatus: 'Processing',
          actor: 'payment_gateway',
        }),
      ],
      { session }
    );

    cart.items = snapshot.items;
    cart.summary = snapshot.summary;
    cart.issues = snapshot.issues;
    cart.status = 'converted';
    cart.convertedOrder = order._id;
    cart.lastActivityAt = new Date();
    await cart.save({ validateBeforeSave: false, session });

    const transaction = await Transaction.findOneAndUpdate(
      { gateway, reference },
      {
        gateway,
        reference,
        amount,
        currency,
        status: 'successful',
        user: resolvedUserId,
        cart: cart._id,
        order: order._id,
        providerResponse,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        session,
      }
    );

    await session.commitTransaction();
    clearCommerceCache();

    return { transaction, order, created: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const initializePayment = asyncHandler(async (req, res) => {
  const { gateway, cartId, currency = 'USD' } = req.body;

  const normalizedGateway = normalizeGateway(gateway);

  if (!normalizedGateway || !cartId) {
    throw new AppError('gateway and cartId are required', 400);
  }

  const cart =
    (await Cart.findOne({
      _id: cartId,
      user: req.user._id,
      status: 'active',
    })) || (await getActiveCartForUser(req.user._id, { createIfMissing: true }));

  if (!cart || String(cart._id) !== String(cartId)) {
    throw new AppError('Checkout cart not found', 404);
  }

  const snapshot = await buildCartSnapshot({
    items: cart.items,
    shippingInfo: cart.shippingInfo,
    promoCode: cart.promoCode,
    currency,
  });

  if (!snapshot.items.length) {
    throw new AppError('Your cart is empty', 400);
  }

  if (!isShippingInfoComplete(snapshot.shippingInfo)) {
    throw new AppError('Shipping information is required before payment', 400);
  }

  if (hasBlockingCartIssues(snapshot.issues)) {
    throw new AppError(getBlockingCartIssues(snapshot.issues)[0].message, 409);
  }

  cart.items = snapshot.items;
  cart.summary = snapshot.summary;
  cart.shippingInfo = snapshot.shippingInfo;
  cart.promoCode = snapshot.summary.promoCode;
  cart.currency = snapshot.currency;
  cart.issues = snapshot.issues;
  cart.lastActivityAt = new Date();
  await cart.save({ validateBeforeSave: false });

  const idempotencyKey = `${normalizedGateway}:${cart._id}:${cart.updatedAt.getTime()}`;

  const payload = {
    amount: Number(snapshot.summary.totalPrice),
    currency: String(snapshot.currency || currency).toUpperCase(),
    email: req.user.email,
    metadata: {
      cartId: cart._id.toString(),
      userId: req.user._id.toString(),
      cartUpdatedAt: cart.updatedAt.toISOString(),
      totalPrice: String(snapshot.summary.totalPrice),
    },
  };

  const initialized = await paymentService.initialize({
    gateway: normalizedGateway,
    payload,
    idempotencyKey,
  });

  const transaction = await saveTransaction({
    gateway: normalizedGateway,
    reference: initialized.reference,
    amount: Number(snapshot.summary.totalPrice),
    currency: payload.currency,
    status: 'pending',
    userId: req.user._id,
    cartId: cart._id,
    idempotencyKey,
    providerResponse: initialized.raw,
  });

  return sendSuccess(res, {
    status: 201,
    message: 'Payment initialized successfully',
    data: {
      transaction,
      payment: {
        gateway: normalizedGateway,
        reference: initialized.reference,
        status: initialized.status,
        amount: snapshot.summary.totalPrice,
        cartId: cart._id,
        nextAction: initialized.nextAction,
      },
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { gateway, reference, cartId } = req.body;

  const normalizedGateway = normalizeGateway(gateway);

  if (!normalizedGateway || !reference) {
    throw new AppError('gateway and reference are required', 400);
  }

  const verified = await paymentService.verify({
    gateway: normalizedGateway,
    reference,
  });

  const transaction = await saveTransaction({
    gateway: normalizedGateway,
    reference: verified.reference,
    amount: Number(verified.amount || 0),
    currency: verified.currency || 'USD',
    status: verified.status,
    userId: req.user._id,
    cartId: cartId || verified.cartId,
    providerResponse: verified.raw,
  });

  if (verified.status === 'successful') {
    const finalized = await finalizeSuccessfulPayment({
      gateway: normalizedGateway,
      reference: verified.reference,
      amount: Number(verified.amount || 0),
      currency: verified.currency || 'USD',
      providerStatus: verified.raw?.status || verified.status,
      providerResponse: verified.raw,
      cartId: cartId || verified.cartId,
      userId: req.user._id,
    });

    return sendSuccess(res, {
      message: 'Payment verified successfully',
      data: {
        ...(typeof finalized.transaction?.toObject === 'function'
          ? finalized.transaction.toObject()
          : finalized.transaction),
        order: finalized.order,
      },
    });
  }

  const updatedOrder = await syncExistingOrderPayment({
    gateway: normalizedGateway,
    reference: verified.reference,
    status: verified.status,
    providerStatus: verified.raw?.status || verified.status,
    amount: Number(verified.amount || 0),
    currency: verified.currency || 'USD',
    raw: verified.raw,
  });

  return sendSuccess(res, {
    message:
      verified.status === 'refunded'
        ? 'Payment refund recorded successfully'
        : 'Payment verification completed',
    data: {
      ...(typeof transaction?.toObject === 'function' ? transaction.toObject() : transaction),
      order: updatedOrder?.order || null,
    },
  });
});

export const paymentWebhook = asyncHandler(async (req, res) => {
  const { gateway } = req.params;
  const normalizedGateway = normalizeGateway(gateway);

  const signature =
    req.headers['stripe-signature'] ||
    req.headers['x-paystack-signature'] ||
    req.headers['verif-hash'];

  if (!signature) {
    throw new AppError('Missing webhook signature', 400);
  }

  const webhookData = await paymentService.verifyWebhook({
    gateway: normalizedGateway,
    payload: req.body,
    signature,
  });

  if (!webhookData) {
    return res.status(200).json({ received: true });
  }

  const existingTransaction = await Transaction.findOne({
    gateway: normalizedGateway,
    reference: webhookData.reference,
  });

  const userId = webhookData.userId || existingTransaction?.user;

  if (!userId) {
    throw new AppError('Unable to resolve user for webhook transaction', 400);
  }

  const transaction = await saveTransaction({
    gateway: normalizedGateway,
    reference: webhookData.reference,
    amount: Number(webhookData.amount || 0),
    currency: webhookData.currency || 'USD',
    status: webhookData.status,
    userId,
    cartId: webhookData.cartId || existingTransaction?.cart,
    providerResponse: webhookData.raw,
  });

  let updatedOrder = null;

  if (webhookData.status === 'successful') {
    const finalized = await finalizeSuccessfulPayment({
      gateway: normalizedGateway,
      reference: webhookData.reference,
      amount: Number(webhookData.amount || 0),
      currency: webhookData.currency || 'USD',
      providerStatus: webhookData.raw?.type || webhookData.status,
      providerResponse: webhookData.raw,
      cartId: webhookData.cartId || existingTransaction?.cart,
      userId,
    });
    updatedOrder = { order: finalized.order, transaction: finalized.transaction };
  } else {
    updatedOrder = await syncExistingOrderPayment({
      gateway: normalizedGateway,
      reference: webhookData.reference,
      status: webhookData.status,
      providerStatus:
        webhookData.raw?.type || webhookData.raw?.status || webhookData.status,
      amount: Number(webhookData.amount || 0),
      currency: webhookData.currency || 'USD',
      raw: webhookData.raw,
    });
  }

  return sendSuccess(res, {
    data: {
      received: true,
      transactionId: transaction._id,
      orderId: updatedOrder?.order?._id || null,
    },
  });
});

export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('order', 'orderStatus totalPrice')
    .populate('cart', 'summary status')
    .lean();

  return sendSuccess(res, {
    data: transactions,
    meta: {
      results: transactions.length,
      supportedGateways: paymentService.getSupportedGateways(),
    },
  });
});
