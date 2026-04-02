import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { clearOrderCache } from '../utils/cache.js';
import {
  buildCartSnapshot,
  isShippingInfoComplete,
  reserveInventoryForItems,
} from '../services/commerce/cart.service.js';
import {
  appendOrderTimelineEntry,
  createOrderDocument,
  PAYMENT_STATUS,
} from '../services/commerce/order.service.js';

/* ===============================
   CREATE NEW ORDER
================================= */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    promoCode,
    totalPrice,
  } = req.body;

  if (!shippingInfo || !orderItems || orderItems.length === 0) {
    throw new AppError('Order items and shipping info are required', 400);
  }

  const snapshot = await buildCartSnapshot({
    items: orderItems,
    shippingInfo,
    promoCode,
    currency: paymentInfo?.currency || 'USD',
  });

  if (!snapshot.items.length) {
    throw new AppError('No valid items remain in this order', 400);
  }

  if (!isShippingInfoComplete(snapshot.shippingInfo)) {
    throw new AppError('Shipping information is incomplete', 400);
  }

  if (snapshot.issues.length > 0) {
    throw new AppError(snapshot.issues[0].message, 400);
  }

  if (Math.abs(snapshot.summary.totalPrice - Number(totalPrice || 0)) > 0.01) {
    throw new AppError(
      'Order total mismatch. Please refresh your cart and try again.',
      400
    );
  }

  const session = await mongoose.startSession();
  let order;
  const requestedPaymentStatus = String(
    paymentInfo?.status || PAYMENT_STATUS.PENDING
  );
  const isPaid =
    requestedPaymentStatus.toLowerCase() === PAYMENT_STATUS.PAID.toLowerCase();
  const normalizedPaymentStatus = isPaid
    ? PAYMENT_STATUS.PAID
    : PAYMENT_STATUS.PENDING;

  try {
    session.startTransaction();

    await reserveInventoryForItems(snapshot.items, { session });

    [order] = await Order.create(
      [
        createOrderDocument({
          userId: req.user._id,
          snapshot,
          payment: {
            id: paymentInfo?.id || '',
            gateway: paymentInfo?.gateway || '',
            status: normalizedPaymentStatus,
            providerStatus: paymentInfo?.providerStatus || '',
            currency: paymentInfo?.currency || 'USD',
            amountPaid: isPaid ? snapshot.summary.totalPrice : 0,
          },
          orderStatus: isPaid ? 'Processing' : 'PendingPayment',
          actor: 'customer',
        }),
      ],
      { session }
    );

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  clearOrderCache(req.user._id);

  return sendSuccess(res, {
    status: 201,
    message: 'Order created successfully',
    data: order,
  });
});
// get all my Orders
export const getAllMyOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;
  const orderStatus = String(req.query.status || '').trim();
  const paymentStatus = String(req.query.paymentStatus || '').trim();
  const search = String(req.query.search || '').trim();

  const query = {
    user: req.user._id,
  };

  if (orderStatus) {
    query.orderStatus = orderStatus;
  }

  if (paymentStatus) {
    query['paymentInfo.status'] = paymentStatus;
  }

  if (search) {
    query.$or = [
      { 'orderItems.name': { $regex: search, $options: 'i' } },
      { promoCode: { $regex: search, $options: 'i' } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query),
  ]);

  return sendSuccess(res, {
    data: orders,
    meta: {
      results: orders.length,
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
  });
});

export const getMySingleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const isOwner = order.user?._id?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }

  return sendSuccess(res, { data: order });
});

//admin
export const getSingleOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return sendSuccess(res, { data: order });
});

export const getAllrdeOrsByAdmin = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [orders, totalOrders, amountSummary] = await Promise.all([
    Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalPrice' },
        },
      },
    ]),
  ]);

  const totalAmount = amountSummary[0]?.totalAmount || 0;

  return sendSuccess(res, {
    data: orders,
    meta: {
      totalOrders,
      page,
      totalPage: Math.ceil(totalOrders / limit),
      pageOrders: orders.length,
      totalAmount,
    },
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.orderStatus === 'Delivered') {
    throw new AppError('Order has already been delivered', 400);
  }

  const requestedStatus = String(req.body.status || '').trim();
  const allowedStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

  if (!allowedStatuses.includes(requestedStatus)) {
    throw new AppError('Invalid order status', 400);
  }

  if (requestedStatus === 'Delivered') {
    const paymentStatus = String(order.paymentInfo?.status || '').toLowerCase();
    if (paymentStatus !== 'paid') {
      throw new AppError(
        'Order can only be marked as delivered after payment is completed',
        400
      );
    }

    order.deliveredAt = Date.now();
  }

  if (requestedStatus === 'Shipped' && order.orderStatus === 'Delivered') {
    throw new AppError('Delivered orders cannot move back to shipped', 400);
  }

  if (requestedStatus === 'Cancelled' && order.orderStatus === 'Delivered') {
    throw new AppError('Delivered orders cannot be cancelled', 400);
  }

  order.orderStatus = requestedStatus;
  appendOrderTimelineEntry(order, {
    type: 'order',
    status: requestedStatus,
    note: `Order status updated to ${requestedStatus}.`,
    actor: req.user.role || 'admin',
  });

  await order.save();
  clearOrderCache(order.user);

  return sendSuccess(res, {
    message: 'Order updated successfully',
    data: order,
  });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.orderStatus !== 'Delivered') {
    throw new AppError('Only delivered orders can be deleted', 400);
  }

  await order.deleteOne();
  clearOrderCache(order.user);

  return sendSuccess(res, { message: 'Order deleted successfully' });
});
