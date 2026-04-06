import { Cart } from '../../models/cart.model.js';
import { Order } from '../../models/order.model.js';
import { Transaction } from '../../models/transaction.model.js';
import { AppError } from '../../utils/AppError.js';
import { clearCommerceCache, clearOrderCache } from '../../utils/cache.js';
import { logger } from '../../utils/logger.js';
import { runWithOptionalTransaction } from '../../utils/mongoTransactions.js';
import {
  buildCartSnapshot,
  getBlockingCartIssues,
  hasBlockingCartIssues,
  isShippingInfoComplete,
  reserveInventoryForItems,
} from '../commerce/cart.service.js';
import {
  PAYMENT_STATUS,
  createOrderDocument,
  syncOrderPaymentState,
} from '../commerce/order.service.js';
import { paymentService } from './payment.service.js';
import {
  buildVerificationTracking,
  resolveVerifiedPaymentContext,
  assertVerifiedAmountMatchesTransaction,
  toPaymentErrorMeta,
} from './payment.helpers.js';
import {
  buildPollingState,
  roundMoney,
  toOrderPaymentStatus,
  TRANSACTION_STATUS,
} from './payment.constants.js';

const serializeDocument = (document) =>
  typeof document?.toObject === 'function' ? document.toObject() : document;

const saveTransaction = async ({
  gateway,
  reference,
  amount,
  currency,
  status,
  providerStatus = '',
  userId,
  orderId,
  cartId,
  idempotencyKey,
  providerResponse,
  verificationAttempts = 0,
  lastVerifiedAt = null,
  nextVerificationAt = null,
  completedAt = null,
  lastError = null,
  session,
}) => {
  const nextValues = {
    gateway,
    reference,
    amount,
    currency,
    status,
    providerStatus,
    user: userId,
    providerResponse,
    verificationAttempts,
    lastVerifiedAt,
    nextVerificationAt,
    completedAt,
    lastError,
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

  return Transaction.findOneAndUpdate(
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
    actor: 'payment_verification',
    note: providerStatus,
  });

  await order.save({ validateBeforeSave: false });

  clearOrderCache(transactionWithOrder.user);

  return {
    order,
    transaction: await saveTransaction({
      gateway,
      reference,
      amount,
      currency,
      status,
      providerStatus,
      userId: transactionWithOrder.user,
      orderId: order._id,
      cartId: transactionWithOrder.cart,
      idempotencyKey: transactionWithOrder.idempotencyKey,
      providerResponse: raw,
      verificationAttempts: transactionWithOrder.verificationAttempts,
      lastVerifiedAt: transactionWithOrder.lastVerifiedAt,
      nextVerificationAt: transactionWithOrder.nextVerificationAt,
      completedAt: transactionWithOrder.completedAt,
      lastError: null,
    }),
  };
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
  verificationAttempts,
}) => {
  const existingTransaction = await Transaction.findOne({ gateway, reference }).populate(
    'order'
  );
  const tracking = buildVerificationTracking({
    status: TRANSACTION_STATUS.SUCCESSFUL,
    verificationAttempts,
    completedAt: existingTransaction?.completedAt,
  });

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
      status: TRANSACTION_STATUS.SUCCESSFUL,
      providerStatus,
      userId: existingTransaction.user,
      orderId: existingTransaction.order._id,
      cartId: existingTransaction.cart,
      idempotencyKey: existingTransaction.idempotencyKey,
      providerResponse,
      verificationAttempts: tracking.verificationAttempts,
      lastVerifiedAt: tracking.lastVerifiedAt,
      nextVerificationAt: tracking.nextVerificationAt,
      completedAt: tracking.completedAt,
      lastError: null,
    });

    clearCommerceCache(existingTransaction.user);

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

  const result = await runWithOptionalTransaction(async (session) => {
    const activeCartQuery = Cart.findOne({
      _id: resolvedCartId,
      user: resolvedUserId,
      status: 'active',
    });

    if (session) {
      activeCartQuery.session(session);
    }

    const cart = await activeCartQuery;

    if (!cart) {
      const convertedCartQuery = Cart.findOne({
        _id: resolvedCartId,
        user: resolvedUserId,
      }).populate('convertedOrder');

      if (session) {
        convertedCartQuery.session(session);
      }

      const convertedCart = await convertedCartQuery;

      if (convertedCart?.convertedOrder) {
        syncOrderPaymentState(convertedCart.convertedOrder, {
          reference,
          gateway,
          paymentStatus: PAYMENT_STATUS.PAID,
          providerStatus,
          amount,
          currency,
          actor: 'payment_verification',
          note: providerStatus,
        });
        await convertedCart.convertedOrder.save({ validateBeforeSave: false });

        const transaction = await saveTransaction({
          gateway,
          reference,
          amount,
          currency,
          status: TRANSACTION_STATUS.SUCCESSFUL,
          providerStatus,
          userId: resolvedUserId,
          orderId: convertedCart.convertedOrder._id,
          cartId: convertedCart._id,
          idempotencyKey: existingTransaction?.idempotencyKey,
          providerResponse,
          verificationAttempts: tracking.verificationAttempts,
          lastVerifiedAt: tracking.lastVerifiedAt,
          nextVerificationAt: tracking.nextVerificationAt,
          completedAt: tracking.completedAt,
          lastError: null,
          session,
        });

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

    if (Math.abs(roundMoney(amount) - roundMoney(snapshot.summary.totalPrice || 0)) > 0.01) {
      throw new AppError('Payment amount does not match the server cart total', 409);
    }

    await reserveInventoryForItems(snapshot.items, { session });

    const createOrderArgs = [
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
        actor: 'payment_verification',
      }),
    ];

    const [order] = session
      ? await Order.create(createOrderArgs, { session })
      : await Order.create(createOrderArgs);

    cart.items = snapshot.items;
    cart.summary = snapshot.summary;
    cart.issues = snapshot.issues;
    cart.status = 'converted';
    cart.convertedOrder = order._id;
    cart.lastActivityAt = new Date();
    await cart.save({ validateBeforeSave: false, ...(session ? { session } : {}) });

    return {
      order,
      transaction: await saveTransaction({
        gateway,
        reference,
        amount,
        currency,
        status: TRANSACTION_STATUS.SUCCESSFUL,
        providerStatus,
        userId: resolvedUserId,
        cartId: cart._id,
        orderId: order._id,
        idempotencyKey: existingTransaction?.idempotencyKey,
        providerResponse,
        verificationAttempts: tracking.verificationAttempts,
        lastVerifiedAt: tracking.lastVerifiedAt,
        nextVerificationAt: tracking.nextVerificationAt,
        completedAt: tracking.completedAt,
        lastError: null,
        session,
      }),
      created: true,
    };
  });

  clearCommerceCache(resolvedUserId);

  return result;
};

export const findReusableTransaction = async ({ gateway, idempotencyKey, userId, cartId }) => {
  if (!idempotencyKey) {
    return null;
  }

  return Transaction.findOne({
    gateway,
    idempotencyKey,
    user: userId,
    cart: cartId,
  });
};

export const recordInitializedTransaction = async ({
  gateway,
  initialization,
  payload,
  userId,
  cartId,
  idempotencyKey,
}) => {
  const polling = buildPollingState({
    status: initialization.status,
    verificationAttempts: 0,
  });

  return saveTransaction({
    gateway,
    reference: initialization.reference,
    amount: Number(initialization.amount || payload.amount || 0),
    currency: initialization.currency || payload.currency || 'USD',
    status: initialization.status,
    providerStatus: initialization.status,
    userId,
    cartId,
    idempotencyKey,
    providerResponse: initialization.raw,
    verificationAttempts: 0,
    lastVerifiedAt: null,
    nextVerificationAt: polling.nextRetryAt ? new Date(polling.nextRetryAt) : null,
    completedAt: null,
    lastError: null,
  });
};

export const verifyPaymentForUser = async ({
  gateway,
  reference,
  cartId,
  userId,
}) => {
  const existingTransaction = await Transaction.findOne({ gateway, reference }).populate(
    'order'
  );

  if (existingTransaction?.user && String(existingTransaction.user) !== String(userId)) {
    throw new AppError('Payment record does not belong to the authenticated user', 403);
  }

  const nextAttempt = Number(existingTransaction?.verificationAttempts || 0) + 1;
  let verified;

  try {
    verified = await paymentService.verify({
      gateway,
      reference,
      verificationAttempts: existingTransaction?.verificationAttempts || 0,
    });
  } catch (error) {
    logger.error('payment_verification_request_failed', {
      gateway,
      reference,
      userId: String(userId),
      attempt: nextAttempt,
      error: toPaymentErrorMeta(error),
    });

    if (existingTransaction) {
      const tracking = buildVerificationTracking({
        status: existingTransaction.status,
        verificationAttempts: nextAttempt,
        completedAt: existingTransaction.completedAt,
      });

      await saveTransaction({
        gateway,
        reference,
        amount: existingTransaction.amount,
        currency: existingTransaction.currency,
        status: existingTransaction.status,
        providerStatus: existingTransaction.providerStatus,
        userId: existingTransaction.user,
        cartId: existingTransaction.cart,
        orderId: existingTransaction.order?._id || existingTransaction.order,
        idempotencyKey: existingTransaction.idempotencyKey,
        providerResponse: existingTransaction.providerResponse,
        verificationAttempts: tracking.verificationAttempts,
        lastVerifiedAt: tracking.lastVerifiedAt,
        nextVerificationAt: tracking.nextVerificationAt,
        completedAt: tracking.completedAt,
        lastError: toPaymentErrorMeta(error),
      });
    }

    throw error;
  }

  const { resolvedUserId, resolvedCartId } = resolveVerifiedPaymentContext({
    transaction: existingTransaction,
    verification: verified,
    authenticatedUserId: userId,
    requestedCartId: cartId,
  });

  assertVerifiedAmountMatchesTransaction({
    transaction: existingTransaction,
    verification: verified,
  });

  const tracking = buildVerificationTracking({
    status: verified.status,
    verificationAttempts: nextAttempt,
    completedAt: existingTransaction?.completedAt,
  });

  const transaction = await saveTransaction({
    gateway,
    reference: verified.reference,
    amount: Number(verified.amount || 0),
    currency: verified.currency || 'USD',
    status: verified.status,
    providerStatus: verified.providerStatus,
    userId: resolvedUserId,
    cartId: resolvedCartId,
    orderId: existingTransaction?.order?._id || existingTransaction?.order,
    idempotencyKey: existingTransaction?.idempotencyKey,
    providerResponse: verified.raw,
    verificationAttempts: tracking.verificationAttempts,
    lastVerifiedAt: tracking.lastVerifiedAt,
    nextVerificationAt: tracking.nextVerificationAt,
    completedAt: tracking.completedAt,
    lastError: null,
  });

  if (verified.status === TRANSACTION_STATUS.SUCCESSFUL) {
    const finalized = await finalizeSuccessfulPayment({
      gateway,
      reference: verified.reference,
      amount: Number(verified.amount || 0),
      currency: verified.currency || 'USD',
      providerStatus: verified.providerStatus,
      providerResponse: verified.raw,
      cartId: resolvedCartId,
      userId: resolvedUserId,
      verificationAttempts: tracking.verificationAttempts,
    });

    return {
      transaction: finalized.transaction,
      order: finalized.order,
      verification: {
        ...verified,
        polling: tracking.polling,
      },
    };
  }

  const updatedOrder = await syncExistingOrderPayment({
    gateway,
    reference: verified.reference,
    status: verified.status,
    providerStatus: verified.providerStatus,
    amount: Number(verified.amount || 0),
    currency: verified.currency || 'USD',
    raw: verified.raw,
  });

  logger.info('payment_verification_completed', {
    gateway,
    reference: verified.reference,
    status: verified.status,
    userId: String(resolvedUserId),
    polling: tracking.polling,
  });

  return {
    transaction,
    order: updatedOrder?.order || null,
    verification: {
      ...verified,
      polling: tracking.polling,
    },
  };
};

export const serializeTransactionResponse = (transaction, extras = {}) => ({
  ...serializeDocument(transaction),
  ...extras,
});
