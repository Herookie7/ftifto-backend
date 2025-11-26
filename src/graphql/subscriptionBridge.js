// Bridge between Socket.IO and GraphQL Subscriptions
// Store active subscription channels
const activeSubscriptions = {
  orders: new Map(),
  riderLocations: new Map(),
  orderStatus: new Map(),
  chatMessages: new Map()
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
  const channels = activeSubscriptions.chatMessages.get(orderId);
  if (channels) {
    channels.forEach(channel => {
      channel.push(messageData);
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
  
  if (!map.has(id)) {
    map.set(id, new Set());
  }
  map.get(id).add(channel);

  // Return channel and cleanup function
  return {
    channel,
    cleanup: () => {
      const channels = map.get(id);
      if (channels) {
        channels.delete(channel);
        channel.return();
        if (channels.size === 0) {
          map.delete(id);
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
  bridgeChatMessage
};

