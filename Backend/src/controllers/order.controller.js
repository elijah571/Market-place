import { Order } from '../models/order.model.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';

/* ===============================
   CREATE NEW ORDER
================================= */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!shippingInfo || !orderItems || orderItems.length === 0) {
    throw new AppError('Order items and shipping info are required', 400);
  }

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    paidAt: paymentInfo?.status === 'Paid' ? Date.now() : null,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order,
  });
});
// get all my Orders
export const getAllMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    status: 'success',
    results: orders.length,
    orders,
  });
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

  res.status(200).json({
    status: 'success',
    order,
  });
});

export const getAllrdeOrsByAdmin = asyncHandler(async (req, res) => {
  const orders = await Order.find();

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  res.status(200).json({
    status: 'success',
    totalOrders: orders.length,
    totalAmount,
    orders,
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

  // Reduce stock when order is delivered
  if (req.body.status === 'Delivered') {
    await Promise.all(
      order.orderItems.map((item) =>
        updateQuantity(item.product, item.quantity)
      )
    );

    order.deliveredAt = Date.now();
  }

  order.orderStatus = req.body.status;

  await order.save();

  res.status(200).json({
    status: 'success',
    message: 'Order updated successfully',
    order,
  });
});

async function updateQuantity(id, quantity) {
  const product = await Product.findById(id);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.stock < quantity) {
    throw new AppError('Not enough stock available', 400);
  }

  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.orderStatus !== 'Delivered') {
    throw new AppError('Only delivered orders can be deleted', 400);
  }

  await order.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Order deleted successfully',
  });
});
