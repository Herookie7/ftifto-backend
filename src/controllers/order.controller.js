const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { emitOrderUpdate } = require('../realtime/emitter');
const { sendAnalyticsEvent } = require('../services/notifications.service');
const auditLogger = require('../services/auditLogger');

const buildOrderQuery = (query) => {
  const filters = {};

  if (query.restaurant) {
    filters.restaurant = query.restaurant;
  }

  if (query.seller) {
    filters.seller = query.seller;
  }

  if (query.rider) {
    filters.rider = query.rider;
  }

  if (query.customer) {
    filters.customer = query.customer;
  }

  if (query.orderStatus) {
    filters.orderStatus = query.orderStatus;
  }

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === 'true';
  }

  if (query.search) {
    filters.orderId = { $regex: query.search, $options: 'i' };
  }

  if (query.startDate || query.endDate) {
    filters.createdAt = {};

    if (query.startDate) {
      filters.createdAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.createdAt.$lte = new Date(query.endDate);
    }
  }

  if (query.zone) {
    filters.zone = query.zone;
  }

  return filters;
};

const createOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationSummary = errors
      .array()
      .map((error) => `${error.param}:${error.msg}`)
      .slice(0, 10)
      .join(',');

    sendAnalyticsEvent('failed_order', {
      reason: 'validation_failed',
      validation_errors: validationSummary || undefined,
      customer_id: req.user?._id?.toString?.() ?? req.body.customer ?? undefined,
      restaurant_id: req.body.restaurant ?? undefined
    }).catch(() => {});

    return res.status(422).json({ errors: errors.array() });
  }

  const {
    restaurant: restaurantId,
    items,
    orderAmount,
    paidAmount,
    deliveryCharges,
    tipping,
    taxationAmount,
    paymentMethod,
    deliveryAddress,
    instructions
  } = req.body;

  const customerId = req.user?._id || req.body.customer;

  const toSafeString = (value) => {
    if (!value) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    return value.toString ? value.toString() : String(value);
  };

  const analyticsContext = {
    restaurant_id: toSafeString(restaurantId),
    customer_id: toSafeString(customerId),
    payment_method: paymentMethod || 'unknown'
  };

  const [restaurant, customer] = await Promise.all([
    Restaurant.findById(restaurantId),
    User.findById(customerId)
  ]);

  if (!restaurant) {
    sendAnalyticsEvent('failed_order', {
      ...analyticsContext,
      reason: 'restaurant_not_found'
    }).catch(() => {});

    res.status(404);
    throw new Error('Restaurant not found');
  }

  if (!customer) {
    sendAnalyticsEvent('failed_order', {
      ...analyticsContext,
      reason: 'customer_not_found'
    }).catch(() => {});

    res.status(404);
    throw new Error('Customer not found');
  }

  const customerIdStr = customerId.toString ? customerId.toString() : String(customerId);

  let order;
  try {
    order = await Order.create({
      restaurant: restaurantId,
      customer: customerId,
      seller: restaurant.owner,
      items,
      orderAmount,
      paidAmount,
      deliveryCharges,
      tipping,
      taxationAmount,
      paymentMethod,
      deliveryAddress,
      instructions,
      zone: restaurant.zone,
      timeline: [
        {
          status: 'pending',
          note: 'Order placed by customer',
          updatedBy: customerId
        }
      ]
    });
  } catch (error) {
    sendAnalyticsEvent('failed_order', {
      ...analyticsContext,
      reason: 'persistence_error',
      error_message: error.message
    }).catch(() => {});
    throw error;
  }

  emitOrderUpdate(order._id.toString(), {
    action: 'created',
    order
  });

  sendAnalyticsEvent('order_created', {
    order_id: order._id.toString(),
    restaurant_id: restaurantId,
    customer_id: customerIdStr,
    value: Number(order.orderAmount || 0)
  });

  res.status(201).json(order);

  auditLogger.logEvent({
    category: 'orders',
    action: 'created',
    userId: customerIdStr,
    entityId: order._id.toString(),
    entityType: 'order',
    metadata: {
      restaurantId: restaurantId ? restaurantId.toString() : undefined,
      orderAmount,
      paymentMethod
    }
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const filters = buildOrderQuery(req.query);

  const [orders, total] = await Promise.all([
    Order.find(filters)
      .populate('customer', 'name phone email')
      .populate('restaurant', 'name image address')
      .populate('rider', 'name username riderProfile.available')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit)),
    Order.countDocuments(filters)
  ]);

  res.json({
    total,
    page: Number(page),
    limit: Number(limit),
    results: orders
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name phone email')
    .populate('restaurant', 'name image address location')
    .populate('rider', 'name username riderProfile');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  res.json(order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const now = new Date();

  const previousStatus = order.orderStatus;
  order.orderStatus = status;
  order.timeline.push({
    status,
    note,
    updatedBy: req.user?._id,
    updatedAt: now
  });

  switch (status) {
    case 'accepted':
      order.acceptedAt = now;
      break;
    case 'preparing':
      order.preparationTime = req.body.preparationTime || order.preparationTime;
      break;
    case 'picked':
    case 'enroute':
      order.isPickedUp = true;
      order.pickedAt = now;
      break;
    case 'delivered':
      order.deliveredAt = now;
      order.paymentStatus = order.paymentStatus === 'pending' ? 'paid' : order.paymentStatus;
      break;
    case 'cancelled':
      order.isActive = false;
      order.cancelledAt = now;
      order.reason = note || order.reason;
      break;
    default:
      break;
  }

  await order.save();

  emitOrderUpdate(order._id.toString(), {
    action: 'status-updated',
    status,
    order
  });

  res.json(order);

  auditLogger.logEvent({
    category: 'orders',
    action: 'status_change',
    userId: req.user?._id ? req.user._id.toString() : undefined,
    entityId: order._id.toString(),
    entityType: 'order',
    metadata: {
      previousStatus,
      newStatus: status,
      note
    }
  });
});

const assignRider = asyncHandler(async (req, res) => {
  const { riderId } = req.body;

  const [order, rider] = await Promise.all([
    Order.findById(req.params.id),
    User.findById(riderId)
  ]);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (!rider || rider.role !== 'rider') {
    res.status(400);
    throw new Error('Invalid rider');
  }

  order.rider = riderId;
  order.assignedAt = new Date();
  order.timeline.push({
    status: 'assigned',
    note: 'Rider assigned to order',
    updatedBy: req.user?._id
  });

  await order.save();

  emitOrderUpdate(order._id.toString(), {
    action: 'rider-assigned',
    riderId,
    order
  });

  res.json(order);

  auditLogger.logEvent({
    category: 'orders',
    action: 'rider_assigned',
    userId: req.user?._id ? req.user._id.toString() : undefined,
    entityId: order._id.toString(),
    entityType: 'order',
    metadata: {
      riderId
    }
  });
});

const getActiveOrders = asyncHandler(async (req, res) => {
  const { restaurantId, actions } = req.query;

  const activeStatuses = actions?.length
    ? actions.split(',')
    : ['pending', 'accepted', 'preparing', 'ready', 'picked', 'enroute'];

  const filters = {
    orderStatus: { $in: activeStatuses }
  };

  if (restaurantId) {
    filters.restaurant = restaurantId;
  }

  const orders = await Order.find(filters)
    .populate('customer', 'name phone')
    .populate('restaurant', 'name image address location')
    .populate('rider', 'name username riderProfile.available')
    .sort({ createdAt: -1 });

  res.json({
    totalCount: orders.length,
    orders
  });
});

const getRestaurantOrders = asyncHandler(async (req, res) => {
  const restaurantId = req.params.restaurantId;
  const { search } = req.query;

  const filters = {
    restaurant: restaurantId
  };

  if (search) {
    filters.orderId = { $regex: search, $options: 'i' };
  }

  const orders = await Order.find(filters)
    .populate('customer', 'name phone email')
    .populate('rider', 'name username riderProfile.available')
    .sort({ createdAt: -1 });

  res.json(orders);
});

const captureOrderFeedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.review = {
    rating,
    comment
  };
  order.timeline.push({
    status: 'reviewed',
    note: 'Customer submitted feedback',
    updatedBy: req.user?._id
  });

  await order.save();

  emitOrderUpdate(order._id.toString(), {
    action: 'reviewed',
    review: order.review,
    order
  });

  res.json(order);
});

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  assignRider,
  getActiveOrders,
  getRestaurantOrders,
  captureOrderFeedback
};

