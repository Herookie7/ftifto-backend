const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const { emitRiderLocation, emitOrderUpdate } = require('../realtime/emitter');
const { sendAnalyticsEvent } = require('../services/notifications.service');

const getAssignedOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const filters = {
    rider: req.user._id
  };

  if (status) {
    filters.orderStatus = status;
  } else {
    filters.orderStatus = { $in: ['assigned', 'picked', 'enroute'] };
  }

  const orders = await Order.find(filters)
    .populate('restaurant', 'name address location')
    .populate('customer', 'name phone')
    .sort({ createdAt: -1 });

  res.json(orders);
});

const updateRiderStatus = asyncHandler(async (req, res) => {
  const { available } = req.body;

  req.user.riderProfile = {
    ...req.user.riderProfile,
    available
  };

  await req.user.save();

  res.json(req.user);
});

const updateRiderLocation = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;

  const rider = await User.findById(req.user._id);

  rider.riderProfile = {
    ...rider.riderProfile,
    lastSeenAt: new Date(),
    location: {
      type: 'Point',
      coordinates
    }
  };

  await rider.save();

  emitRiderLocation(rider._id.toString(), {
    riderId: rider._id.toString(),
    location: rider.riderProfile.location
  });

  sendAnalyticsEvent('rider_location_update', {
    rider_id: rider._id.toString(),
    longitude: Array.isArray(coordinates) ? coordinates[0] : undefined,
    latitude: Array.isArray(coordinates) ? coordinates[1] : undefined,
    timestamp: rider.riderProfile.lastSeenAt?.toISOString?.()
  }).catch(() => {});

  res.json(rider);
});

const confirmPickup = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    rider: req.user._id
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = 'picked';
  order.isPickedUp = true;
  order.pickedAt = new Date();
  order.timeline.push({
    status: 'picked',
    note: 'Order picked up by rider',
    updatedBy: req.user._id
  });

  await order.save();

  emitOrderUpdate(order._id.toString(), {
    action: 'picked',
    order
  });

  res.json(order);
});

const confirmDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    rider: req.user._id
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = 'delivered';
  order.deliveredAt = new Date();
  order.paymentStatus = order.paymentStatus === 'pending' ? 'paid' : order.paymentStatus;
  order.timeline.push({
    status: 'delivered',
    note: 'Order delivered by rider',
    updatedBy: req.user._id
  });

  await order.save();

  emitOrderUpdate(order._id.toString(), {
    action: 'delivered',
    order
  });

  sendAnalyticsEvent('order_delivered', {
    order_id: order._id.toString(),
    rider_id: req.user._id.toString(),
    restaurant_id: order.restaurant.toString(),
    value: Number(order.orderAmount || 0)
  });

  res.json(order);
});

module.exports = {
  getAssignedOrders,
  updateRiderStatus,
  updateRiderLocation,
  confirmPickup,
  confirmDelivery
};

