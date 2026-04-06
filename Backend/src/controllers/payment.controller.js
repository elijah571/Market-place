import { asyncHandler } from '../middleware/asyncHandler.js';
import { Cart } from '../models/cart.model.js';
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
} from '../services/commerce/cart.service.js';
import {
  findReusableTransaction,
  recordInitializedTransaction,
  serializeTransactionResponse,
  verifyPaymentForUser,
} from '../services/payment/paymentTransaction.service.js';

const normalizeGateway = (gateway) => String(gateway || '').toLowerCase();
const serializeDocument = (document) =>
  typeof document?.toObject === 'function' ? document.toObject() : document;

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
  const reusableTransaction = await findReusableTransaction({
    gateway: normalizedGateway,
    idempotencyKey,
    userId: req.user._id,
    cartId: cart._id,
  });

  if (reusableTransaction?.status === 'pending') {
    return sendSuccess(res, {
      message: 'Existing payment session reused successfully',
      data: {
        transaction: reusableTransaction,
        payment: paymentService.rehydrateInitialization({
          gateway: normalizedGateway,
          transaction: reusableTransaction,
        }),
      },
    });
  }

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

  const transaction = await recordInitializedTransaction({
    gateway: normalizedGateway,
    initialization: initialized,
    payload,
    userId: req.user._id,
    cartId: cart._id,
    idempotencyKey,
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
        amount: initialized.amount,
        currency: initialized.currency,
        cartId: cart._id,
        nextAction: initialized.nextAction,
        polling: initialized.polling,
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

  const result = await verifyPaymentForUser({
    gateway: normalizedGateway,
    reference,
    cartId,
    userId: req.user._id,
  });
  const responseData = serializeTransactionResponse(result.transaction, {
    order: serializeDocument(result.order),
    polling: result.verification.polling,
    isFinal: result.verification.isFinal,
  });

  return sendSuccess(res, {
    message:
      result.transaction.status === 'refunded'
        ? 'Payment refund recorded successfully'
        : result.transaction.status === 'successful'
          ? 'Payment verified successfully'
          : 'Payment verification completed',
    data: responseData,
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
