// Bridge between Socket.IO and GraphQL Subscriptions
// Store active subscription channels
const activeSubscriptions = {
  orders: new Map(),
  riderLocations: new Map(),
  orderStatus: new Map(),
  chatMessages: new Map(),
  zoneOrders: new Map(),
  assignedRider: new Map(),
  restaurantOrders: new Map()
};

// Bridge Socket.IO events to GraphQL subscriptions
const bridgeOrderUpdate = (orderId, orderData) => {
  const channels = activeSubscriptions.orders.get(orderId);
  if (channels) {
    channels.forEach(channel => {
      channel.push(orderData);
    });
  }
};

const bridgeRiderLocation = (riderId, locationData) => {
  const channels = activeSubscriptions.riderLocations.get(riderId);
  if (channels) {
    channels.forEach(channel => {
      channel.push(locationData);
    });
  }
};

const bridgeOrderStatusChange = (userId, orderData) => {
  const channels = activeSubscriptions.orderStatus.get(userId);
  if (channels) {
    channels.forEach(channel => {
      channel.push({ userId, origin: 'app', order: orderData });
    });
  }
};

const bridgeChatMessage = (orderId, messageData) => {
  const key = orderId != null ? String(orderId) : orderId;
  const channels = activeSubscriptions.chatMessages.get(key);
  if (channels) {
    channels.forEach(channel => {
      channel.push(messageData);
    });
  }
};

const bridgeZoneOrder = (zoneId, orderData) => {
  const channels = activeSubscriptions.zoneOrders.get(zoneId);
  if (channels) {
    channels.forEach(channel => {
      channel.push(orderData);
    });
  }
};

const bridgeAssignedRider = (riderId, orderData) => {
  const channels = activeSubscriptions.assignedRider.get(String(riderId));
  if (channels) {
    channels.forEach(channel => {
      channel.push(orderData);
    });
  }
};

const bridgePlaceOrder = (restaurantId, orderData) => {
  const channels = activeSubscriptions.restaurantOrders.get(restaurantId);
  if (channels) {
    channels.forEach(channel => {
      channel.push(orderData);
    });
  }
};

// Create a channel for async iteration
const createChannel = () => {
  const queue = [];
  const resolvers = [];

  return {
    push: (value) => {
      if (resolvers.length > 0) {
        const resolve = resolvers.shift();
        resolve({ value, done: false });
      } else {
        queue.push(value);
      }
    },
    async next() {
      if (queue.length > 0) {
        return { value: queue.shift(), done: false };
      }
      return new Promise(resolve => {
        resolvers.push(resolve);
      });
    },
    return: () => {
      resolvers.forEach(resolve => resolve({ done: true }));
      resolvers.length = 0;
      queue.length = 0;
      return { done: true };
    }
  };
};

// Register subscription
const registerSubscription = (type, id) => {
  const map = activeSubscriptions[type];
  const channel = createChannel();
  const key = id != null ? String(id) : id;

  if (!map.has(key)) {
    map.set(key, new Set());
  }
  map.get(key).add(channel);

  // Return channel and cleanup function
  return {
    channel,
    cleanup: () => {
      const channels = map.get(key);
      if (channels) {
        channels.delete(channel);
        channel.return();
        if (channels.size === 0) {
          map.delete(key);
        }
      }
    }
  };
};

module.exports = {
  registerSubscription,
  bridgeOrderUpdate,
  bridgeRiderLocation,
  bridgeOrderStatusChange,
  bridgeChatMessage,
  bridgeZoneOrder,
  bridgeAssignedRider,
  bridgePlaceOrder
};

