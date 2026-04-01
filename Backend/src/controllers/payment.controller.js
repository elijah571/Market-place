import { asyncHandler } from '../middleware/asyncHandler.js';
import { Order } from '../models/order.model.js';
import { Transaction } from '../models/transaction.model.js';
import { AppError } from '../utils/AppError.js';
import { paymentService } from '../services/payment/payment.service.js';
import { sendSuccess } from '../utils/response.js';

const normalizeGateway = (gateway) => String(gateway || '').toLowerCase();

const saveTransaction = async ({
  gateway,
  reference,
  amount,
  currency,
  status,
  userId,
  orderId,
  providerResponse,
}) => {
  const transaction = await Transaction.findOneAndUpdate(
    { gateway, reference },
    {
      gateway,
      reference,
      amount,
      currency,
      status,
      user: userId,
      order: orderId || null,
      providerResponse,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  if (orderId && status === 'successful') {
    await Order.findByIdAndUpdate(orderId, {
      paymentInfo: {
        id: reference,
        status: 'Paid',
      },
      paidAt: Date.now(),
    });
  }

  return transaction;
};

export const initializePayment = asyncHandler(async (req, res) => {
  const { gateway, amount, currency = 'USD', orderId } = req.body;

  const normalizedGateway = normalizeGateway(gateway);

  if (!normalizedGateway || !amount || Number(amount) <= 0) {
    throw new AppError('gateway and valid amount are required', 400);
  }

  const payload = {
    amount: Number(amount),
    currency: String(currency).toUpperCase(),
    email: req.user.email,
    metadata: {
      orderId: orderId || '',
      userId: req.user._id.toString(),
    },
  };

  const initialized = await paymentService.initialize({
    gateway: normalizedGateway,
    payload,
  });

  const transaction = await saveTransaction({
    gateway: normalizedGateway,
    reference: initialized.reference,
    amount: Number(amount),
    currency: payload.currency,
    status: 'pending',
    userId: req.user._id,
    orderId,
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
        nextAction: initialized.nextAction,
      },
    },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { gateway, reference, orderId } = req.body;

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
    orderId: orderId || verified.orderId,
    providerResponse: verified.raw,
  });

  return sendSuccess(res, {
    message:
      verified.status === 'successful'
        ? 'Payment verified successfully'
        : 'Payment verification failed',
    data: transaction,
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

  const userId = webhookData.raw?.data?.meta?.userId || existingTransaction?.user;

  if (!userId) {
    throw new AppError('Unable to resolve user for webhook transaction', 400);
  }

  await saveTransaction({
    gateway: normalizedGateway,
    reference: webhookData.reference,
    amount: Number(webhookData.amount || 0),
    currency: webhookData.currency || 'USD',
    status: webhookData.status,
    userId,
    orderId: webhookData.orderId || existingTransaction?.order,
    providerResponse: webhookData.raw,
  });

  return sendSuccess(res, { data: { received: true } });
});

export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('order', 'orderStatus totalPrice')
    .lean();

  return sendSuccess(res, {
    data: transactions,
    meta: {
      results: transactions.length,
      supportedGateways: paymentService.getSupportedGateways(),
    },
  });
});
