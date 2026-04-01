import { Order } from '../models/order.model.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';

const findVariant = (product, item) => {
  if (!item?.selectedColor && !item?.selectedSize && !item?.variantId) {
    return null;
  }

  return product.variants.find((variant) => {
    if (item.variantId && variant._id.toString() === String(item.variantId)) {
      return true;
    }

    return (
      variant.color === String(item.selectedColor || '').toLowerCase() &&
      variant.size === String(item.selectedSize || '').toUpperCase()
    );
  });
};

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

  const productIds = [...new Set(orderItems.map((item) => String(item.product)))];
  const products = await Product.find({ _id: { $in: productIds } })
    .select('name stock price image variants')
    .lean();

  const productMap = new Map(
    products.map((product) => [String(product._id), product])
  );

  const validatedItems = orderItems.map((item) => {
    const product = productMap.get(String(item.product));

    if (!product) {
      throw new AppError(`Product not found for item ${item.name}`, 404);
    }

    const quantity = Number(item.quantity || 0);
    if (quantity <= 0) {
      throw new AppError('Item quantity must be greater than 0', 400);
    }

    const matchedVariant = findVariant(product, item);

    if (matchedVariant && matchedVariant.stock < quantity) {
      throw new AppError(
        `Insufficient stock for ${product.name} (${matchedVariant.color}/${matchedVariant.size})`,
        400
      );
    }

    if (!matchedVariant && product.stock < quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }

    const unitPrice = Number(
      (
        Number(product.price) + Number(matchedVariant?.priceDelta || 0)
      ).toFixed(2)
    );

    return {
      name: product.name,
      price: unitPrice,
      quantity,
      image: matchedVariant?.image?.url || product.image?.[0]?.url || '',
      product: item.product,
      selectedColor: matchedVariant?.color || item.selectedColor || '',
      selectedSize: matchedVariant?.size || item.selectedSize || '',
      variantId: matchedVariant?._id || item.variantId || null,
    };
  });

  const computedItemPrice = Number(
    validatedItems
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)
  );
  const normalizedTaxPrice = Number(Number(taxPrice || 0).toFixed(2));
  const normalizedShippingPrice = Number(Number(shippingPrice || 0).toFixed(2));
  const computedTotalPrice = Number(
    (computedItemPrice + normalizedTaxPrice + normalizedShippingPrice).toFixed(2)
  );

  if (Math.abs(computedTotalPrice - Number(totalPrice || 0)) > 0.01) {
    throw new AppError(
      'Order total mismatch. Please refresh your cart and try again.',
      400
    );
  }

  const order = await Order.create({
    shippingInfo,
    orderItems: validatedItems,
    paymentInfo,
    paidAt: paymentInfo?.status === 'Paid' ? Date.now() : null,
    itemPrice: computedItemPrice,
    taxPrice: normalizedTaxPrice,
    shippingPrice: normalizedShippingPrice,
    totalPrice: computedTotalPrice,
    user: req.user._id,
  });

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

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ user: req.user._id }),
  ]);

  return sendSuccess(res, {
    data: orders,
    meta: {
      results: orders.length,
      total,
      page,
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
  const allowedStatuses = ['Processing', 'Delivered'];

  if (!allowedStatuses.includes(requestedStatus)) {
    throw new AppError('Invalid order status', 400);
  }

  // Reduce stock when order is delivered
  if (requestedStatus === 'Delivered') {
    const paymentStatus = String(order.paymentInfo?.status || '').toLowerCase();
    if (paymentStatus !== 'paid') {
      throw new AppError(
        'Order can only be marked as delivered after payment is completed',
        400
      );
    }

    await Promise.all(
      order.orderItems.map((item) =>
        updateQuantity({
          productId: item.product,
          quantity: item.quantity,
          variantId: item.variantId,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        })
      )
    );

    order.deliveredAt = Date.now();
  }

  order.orderStatus = requestedStatus;

  await order.save();

  return sendSuccess(res, {
    message: 'Order updated successfully',
    data: order,
  });
});

async function updateQuantity({
  productId,
  quantity,
  variantId,
  selectedColor,
  selectedSize,
}) {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const matchedVariant =
    product.variants?.find((variant) => {
      if (variantId && variant._id.toString() === String(variantId)) {
        return true;
      }

      return (
        variant.color === String(selectedColor || '').toLowerCase() &&
        variant.size === String(selectedSize || '').toUpperCase()
      );
    }) || null;

  if (matchedVariant) {
    if (matchedVariant.stock < quantity) {
      throw new AppError('Not enough variant stock available', 400);
    }

    matchedVariant.stock -= quantity;
  } else if (product.stock < quantity) {
    throw new AppError('Not enough stock available', 400);
  } else {
    product.stock -= quantity;
  }

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

  return sendSuccess(res, { message: 'Order deleted successfully' });
});
