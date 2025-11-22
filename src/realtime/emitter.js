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
};

const emitRiderLocation = (riderId, payload) => {
  if (!riderId || !state.namespaces.riders) {
    return;
  }

  state.namespaces.riders.to(riderId).emit('rider:location', payload);
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

