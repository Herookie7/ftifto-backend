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

module.exports = {
  sendToUser,
  sendToTopic,
  initializeFirebase,
  sendAnalyticsEvent
};

