const admin = require('firebase-admin');
const { randomUUID } = require('crypto');
const config = require('../config');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { emitNotification } = require('../realtime/emitter');
const logger = require('../logger');

const fetch =
  globalThis.fetch?.bind(globalThis) ||
  ((...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args)));

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp || !config.notifications.firebase.projectId) {
    return firebaseApp;
  }

  const { projectId, clientEmail, privateKey } = config.notifications.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn('Firebase credentials missing. Push notifications disabled.');
    return undefined;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return firebaseApp;
};

const getMessaging = () => {
  initializeFirebase();

  try {
    return admin.messaging();
  } catch (error) {
    logger.error('Firebase messaging error', { error: error.message });
    return undefined;
  }
};

const buildMessagePayload = (tokensOrTopic, title, body, data) => {
  const base = {
    notification: { title, body },
    data: data || {}
  };

  if (Array.isArray(tokensOrTopic)) {
    return { tokens: tokensOrTopic, ...base };
  }

  return { topic: tokensOrTopic, ...base };
};

const sendMessage = async (tokensOrTopic, title, body, data) => {
  const messaging = getMessaging();

  if (!messaging) {
    return { success: false, message: 'Firebase messaging unavailable' };
  }

  const payload = buildMessagePayload(tokensOrTopic, title, body, data);

  try {
    if (payload.tokens) {
      const response = await messaging.sendEachForMulticast(payload);
      return { success: true, response };
    }

    const response = await messaging.send(payload);
    return { success: true, response };
  } catch (error) {
    logger.error('FCM send error', { error: error.message });
    return { success: false, error };
  }
};

const sendAnalyticsEvent = async (eventName, params = {}) => {
  const measurementId = config.analytics.measurementId;
  const apiSecret = config.analytics.apiSecret;

  if (!measurementId || !apiSecret) {
    return;
  }

  try {
    const endpoint = new URL('https://www.google-analytics.com/mp/collect');
    endpoint.searchParams.set('measurement_id', measurementId);
    endpoint.searchParams.set('api_secret', apiSecret);

    const payload = {
      client_id: params.clientId || randomUUID(),
      events: [
        {
          name: eventName,
          params: {
            engagement_time_msec: '100',
            ...params
          }
        }
      ]
    };

    await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    logger.warn('Analytics event dispatch failed', {
      eventName,
      error: error.message
    });
  }
};

const sendToUser = async (userId, title, body, data) => {
  const user = await User.findById(userId).select('pushTokens role');

  if (!user) {
    throw new ApiError(404, 'User not found for notification');
  }

  const tokens = user.pushTokens || [];

  if (!tokens.length) {
    return { success: false, message: 'No device tokens registered for user' };
  }

  const result = await sendMessage(tokens, title, body, data);

  emitNotification(user.role, {
    type: 'user',
    userId,
    title,
    body,
    data
  });

  return result;
};

const sendToTopic = async (topicKey, title, body, data) => {
  const topicName = config.notifications.topics[topicKey] || topicKey;
  const result = await sendMessage(topicName, title, body, data);

  emitNotification(topicKey, {
    type: 'topic',
    topic: topicName,
    title,
    body,
    data
  });

  return result;
};

// Enhanced notification functions
const sendSubscriptionExpiryNotification = async (subscription) => {
  const Subscription = require('../models/Subscription');
  const Restaurant = require('../models/Restaurant');
  
  const user = await User.findById(subscription.userId);
  if (!user || !user.notificationPreferences?.subscriptionExpiry) {
    return { success: false, message: 'User not found or notifications disabled' };
  }

  const restaurant = await Restaurant.findById(subscription.restaurantId);
  const remainingDays = Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  const title = 'Subscription Expiring Soon';
  const body = remainingDays > 0 
    ? `Your subscription for ${restaurant?.name || 'Tiffin Centre'} expires in ${remainingDays} day(s). Renew now to continue enjoying tiffin service!`
    : `Your subscription for ${restaurant?.name || 'Tiffin Centre'} has expired. Renew now to continue!`;

  return await sendToUser(user._id, title, body, {
    type: 'SUBSCRIPTION_EXPIRY',
    subscriptionId: subscription._id.toString(),
    remainingDays: remainingDays
  });
};

const sendRemainingTiffinsNotification = async (subscription) => {
  const Restaurant = require('../models/Restaurant');
  
  const user = await User.findById(subscription.userId);
  if (!user || !user.notificationPreferences?.remainingTiffins) {
    return { success: false, message: 'User not found or notifications disabled' };
  }

  if (subscription.remainingTiffins > 5) {
    return { success: false, message: 'Tiffins remaining above threshold' };
  }

  const restaurant = await Restaurant.findById(subscription.restaurantId);
  const title = 'Low Tiffins Remaining';
  const body = `You have only ${subscription.remainingTiffins} tiffin(s) remaining in your subscription. Renew now to continue!`;

  return await sendToUser(user._id, title, body, {
    type: 'REMAINING_TIFFINS',
    subscriptionId: subscription._id.toString(),
    remainingTiffins: subscription.remainingTiffins
  });
};

const sendWalletLowBalanceNotification = async (userId, currentBalance) => {
  const user = await User.findById(userId);
  if (!user || !user.notificationPreferences?.walletLowBalance) {
    return { success: false, message: 'User not found or notifications disabled' };
  }

  const minimumBalance = 100;
  if (currentBalance >= minimumBalance) {
    return { success: false, message: 'Balance above threshold' };
  }

  const title = 'Low Wallet Balance';
  const body = `Your wallet balance is Rs. ${currentBalance.toFixed(2)}. Please top up to continue using wallet payments. Minimum balance required: Rs. ${minimumBalance}`;

  return await sendToUser(user._id, title, body, {
    type: 'WALLET_LOW_BALANCE',
    currentBalance: currentBalance,
    minimumBalance: minimumBalance
  });
};

const sendBirthdayWish = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.notificationPreferences?.birthdayWishes) {
    return { success: false, message: 'User not found or notifications disabled' };
  }

  const title = 'Happy Birthday! 🎉';
  const body = `Wishing you a very happy birthday! Enjoy special birthday offers on your tiffin orders today!`;

  return await sendToUser(user._id, title, body, {
    type: 'BIRTHDAY_WISH',
    date: new Date().toISOString()
  });
};

const sendAnniversaryWish = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.notificationPreferences?.anniversaryWishes) {
    return { success: false, message: 'User not found or notifications disabled' };
  }

  const title = 'Happy Anniversary! 🎊';
  const body = `Wishing you a very happy anniversary! Enjoy special anniversary offers on your tiffin orders today!`;

  return await sendToUser(user._id, title, body, {
    type: 'ANNIVERSARY_WISH',
    date: new Date().toISOString()
  });
};

const sendOfferNotification = async (userId, offerTitle, offerDescription) => {
  const user = await User.findById(userId);
  if (!user || !user.notificationPreferences?.offers) {
    return { success: false, message: 'User not found or notifications disabled' };
  }

  const title = offerTitle || 'New Offer Available!';
  const body = offerDescription || 'Check out our latest offers and promotions!';

  return await sendToUser(user._id, title, body, {
    type: 'OFFER',
    date: new Date().toISOString()
  });
};

// Batch notification functions for scheduled tasks
const checkAndNotifySubscriptionExpiry = async () => {
  const Subscription = require('../models/Subscription');
  const now = new Date();
  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + 3); // Notify 3 days before expiry

  // Find subscriptions expiring in next 3 days
  const expiringSubscriptions = await Subscription.find({
    status: 'ACTIVE',
    endDate: { $gte: now, $lte: soonDate }
  }).lean();

  const results = [];
  for (const subscription of expiringSubscriptions) {
    try {
      const result = await sendSubscriptionExpiryNotification(subscription);
      results.push({ subscriptionId: subscription._id, ...result });
    } catch (error) {
      logger.error('Subscription expiry notification error', {
        subscriptionId: subscription._id,
        error: error.message
      });
      results.push({ subscriptionId: subscription._id, success: false, error: error.message });
    }
  }

  return results;
};

const checkAndNotifyLowTiffins = async () => {
  const Subscription = require('../models/Subscription');

  // Find subscriptions with low remaining tiffins (5 or less)
  const lowTiffinSubscriptions = await Subscription.find({
    status: 'ACTIVE',
    remainingTiffins: { $lte: 5, $gt: 0 }
  }).lean();

  const results = [];
  for (const subscription of lowTiffinSubscriptions) {
    try {
      const result = await sendRemainingTiffinsNotification(subscription);
      results.push({ subscriptionId: subscription._id, ...result });
    } catch (error) {
      logger.error('Remaining tiffins notification error', {
        subscriptionId: subscription._id,
        error: error.message
      });
      results.push({ subscriptionId: subscription._id, success: false, error: error.message });
    }
  }

  return results;
};

const checkAndNotifyLowWalletBalance = async () => {
  const threshold = 100; // Rs. 100 minimum

  // Find users with wallet balance below threshold
  const users = await User.find({
    'customerProfile.currentWalletAmount': { $lt: threshold, $gt: 0 },
    'customerProfile.currentWalletAmount': { $exists: true }
  }).select('_id customerProfile').lean();

  const results = [];
  for (const user of users) {
    try {
      const balance = user.customerProfile?.currentWalletAmount || 0;
      const result = await sendWalletLowBalanceNotification(user._id, balance);
      results.push({ userId: user._id, ...result });
    } catch (error) {
      logger.error('Wallet low balance notification error', {
        userId: user._id,
        error: error.message
      });
      results.push({ userId: user._id, success: false, error: error.message });
    }
  }

  return results;
};

const checkAndSendBirthdayWishes = async () => {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  // Find users with birthday today
  const users = await User.find({
    birthday: { $exists: true, $ne: null }
  }).select('_id birthday').lean();

  const results = [];
  for (const user of users) {
    if (!user.birthday) continue;
    
    const birthday = new Date(user.birthday);
    if (birthday.getMonth() === todayMonth && birthday.getDate() === todayDate) {
      try {
        const result = await sendBirthdayWish(user._id);
        results.push({ userId: user._id, ...result });
      } catch (error) {
        logger.error('Birthday wish notification error', {
          userId: user._id,
          error: error.message
        });
        results.push({ userId: user._id, success: false, error: error.message });
      }
    }
  }

  return results;
};

const checkAndSendAnniversaryWishes = async () => {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  // Find users with anniversary today
  const users = await User.find({
    anniversary: { $exists: true, $ne: null }
  }).select('_id anniversary').lean();

  const results = [];
  for (const user of users) {
    if (!user.anniversary) continue;
    
    const anniversary = new Date(user.anniversary);
    if (anniversary.getMonth() === todayMonth && anniversary.getDate() === todayDate) {
      try {
        const result = await sendAnniversaryWish(user._id);
        results.push({ userId: user._id, ...result });
      } catch (error) {
        logger.error('Anniversary wish notification error', {
          userId: user._id,
          error: error.message
        });
        results.push({ userId: user._id, success: false, error: error.message });
      }
    }
  }

  return results;
};

module.exports = {
  sendToUser,
  sendToTopic,
  initializeFirebase,
  sendAnalyticsEvent,
  sendSubscriptionExpiryNotification,
  sendRemainingTiffinsNotification,
  sendWalletLowBalanceNotification,
  sendBirthdayWish,
  sendAnniversaryWish,
  sendOfferNotification,
  checkAndNotifySubscriptionExpiry,
  checkAndNotifyLowTiffins,
  checkAndNotifyLowWalletBalance,
  checkAndSendBirthdayWishes,
  checkAndSendAnniversaryWishes
};

