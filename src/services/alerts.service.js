const config = require('../config');
const logger = require('../logger');

const fetch =
  globalThis.fetch?.bind(globalThis) ||
  ((...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args)));

const hasSlack = Boolean(config.alerts.slackWebhookUrl);
const hasDiscord = Boolean(config.alerts.discordWebhookUrl);

const postWebhook = async (message) => {
  if (!hasSlack && !hasDiscord) {
    return;
  }

  const tasks = [];

  if (hasSlack) {
    tasks.push(
      fetch(config.alerts.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      })
    );
  }

  if (hasDiscord) {
    tasks.push(
      fetch(config.alerts.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      })
    );
  }

  try {
    await Promise.all(tasks);
  } catch (error) {
    logger.warn('Failed to deliver webhook alert', { error: error.message });
  }
};

const notifyEvent = (title, details = {}) => {
  const message = `🔔 ${title}\n\`\`\`\n${JSON.stringify(details, null, 2)}\n\`\`\``;
  logger.info(`Alert: ${title}`, details);
  return postWebhook(message);
};

const notifyError = (error, details = {}) =>
  notifyEvent('Backend error detected', {
    message: error.message || error,
    stack: error.stack,
    ...details
  });

const notifyLatency = (route, duration, details = {}) =>
  notifyEvent('High request latency', {
    route,
    duration,
    ...details
  });

module.exports = {
  notifyEvent,
  notifyError,
  notifyLatency
};

