const state = {
  namespaces: {}
};

const registerNamespaces = (namespaces) => {
  state.namespaces = namespaces;
};

const emitOrderUpdate = (orderId, payload) => {
  if (!orderId || !state.namespaces.orders) {
    return;
  }

  state.namespaces.orders.to(orderId).emit('order:update', payload);

  // Bridge to GraphQL subscriptions
  try {
    const { bridgeOrderUpdate, bridgeOrderStatusChange } = require('../graphql/subscriptionBridge');
    const orderData = payload.order || payload;
    bridgeOrderUpdate(orderId, orderData);
    if (orderData.customer) {
      const customerId = orderData.customer._id || orderData.customer;
      bridgeOrderStatusChange(String(customerId), orderData);
    }
  } catch (error) {
    // GraphQL subscriptions not initialized yet - ignore
  }
};

const emitRiderLocation = (riderId, payload) => {
  if (!riderId || !state.namespaces.riders) {
    return;
  }

  state.namespaces.riders.to(riderId).emit('rider:location', payload);

  // Bridge to GraphQL subscriptions
  try {
    const { bridgeRiderLocation } = require('../graphql/subscriptionBridge');
    const locationData = payload.location ? { _id: riderId, location: payload.location } : { _id: riderId, location: { coordinates: [0, 0] } };
    bridgeRiderLocation(riderId, locationData);
  } catch (error) {
    // GraphQL subscriptions not initialized yet - ignore
  }
};

const emitNotification = (channel, payload) => {
  if (state.namespaces.orders) {
    state.namespaces.orders.emit('notification', { channel, ...payload });
  }

  if (state.namespaces.riders) {
    state.namespaces.riders.emit('notification', { channel, ...payload });
  }
};

module.exports = {
  registerNamespaces,
  emitOrderUpdate,
  emitRiderLocation,
  emitNotification
};

