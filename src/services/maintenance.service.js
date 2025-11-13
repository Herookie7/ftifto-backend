const Redis = require('ioredis');
const config = require('../config');
const logger = require('../logger');

const DEFAULT_STATE = {
  enabled: false,
  readOnly: config.maintenance.readOnlyByDefault,
  message: config.maintenance.defaultMessage,
  updatedBy: null,
  updatedAt: null
};

const CACHE_TTL_MS = config.maintenance.cacheTtlMs || 5000;
const STATE_KEY = config.maintenance.redisKey || 'ftifto:maintenance';

let redisClient;
let cachedState = { ...DEFAULT_STATE };
let cacheExpiresAt = 0;

const ensureRedisClient = () => {
  if (!config.socket.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(config.socket.redisUrl);
    redisClient.on('error', (error) => {
      logger.error('Maintenance Redis error', { error: error.message });
    });
    redisClient.on('connect', () => {
      logger.info('Maintenance Redis connection established');
    });
  }

  return redisClient;
};

const normalizeState = (state = {}) => {
  const normalized = { ...DEFAULT_STATE, ...state };
  normalized.enabled = Boolean(state.enabled);
  normalized.readOnly =
    typeof state.readOnly === 'boolean' ? state.readOnly : DEFAULT_STATE.readOnly;
  normalized.message = state.message || DEFAULT_STATE.message;
  normalized.updatedBy = state.updatedBy || null;
  normalized.updatedAt = state.updatedAt || null;
  return normalized;
};

const refreshCache = (state) => {
  cachedState = state;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return cachedState;
};

const getState = async () => {
  const now = Date.now();
  if (cachedState && cacheExpiresAt > now) {
    return cachedState;
  }

  const client = ensureRedisClient();
  if (!client) {
    return refreshCache({ ...cachedState });
  }

  try {
    const payload = await client.get(STATE_KEY);
    if (!payload) {
      return refreshCache({ ...DEFAULT_STATE, updatedAt: null });
    }

    const parsed = normalizeState(JSON.parse(payload));
    return refreshCache(parsed);
  } catch (error) {
    logger.warn('Failed to load maintenance state from Redis', { error: error.message });
    return refreshCache({ ...cachedState });
  }
};

const setState = async (partialState) => {
  const nextState = normalizeState({
    ...cachedState,
    ...partialState,
    updatedAt: new Date().toISOString()
  });

  const client = ensureRedisClient();

  if (client) {
    try {
      await client.set(STATE_KEY, JSON.stringify(nextState));
    } catch (error) {
      logger.error('Failed to persist maintenance state to Redis', { error: error.message });
    }
  }

  return refreshCache(nextState);
};

const clearMaintenance = async (updatedBy) => {
  const client = ensureRedisClient();
  if (client) {
    try {
      await client.del(STATE_KEY);
    } catch (error) {
      logger.error('Failed to clear maintenance state from Redis', { error: error.message });
    }
  }

  return refreshCache({
    ...DEFAULT_STATE,
    updatedBy: updatedBy || null,
    updatedAt: new Date().toISOString()
  });
};

const toggleMaintenance = async ({ enabled, message, readOnly, updatedBy }) => {
  if (!enabled) {
    return clearMaintenance(updatedBy);
  }

  return setState({
    enabled: true,
    readOnly: typeof readOnly === 'boolean' ? readOnly : DEFAULT_STATE.readOnly,
    message: message || DEFAULT_STATE.message,
    updatedBy: updatedBy || null
  });
};

const isMaintenanceActive = async () => {
  const state = await getState();
  return Boolean(state.enabled);
};

const shutdown = async () => {
  if (redisClient) {
    await redisClient
      .quit()
      .catch((error) => logger.warn('Error closing maintenance Redis client', { error: error.message }));
    redisClient = null;
  }
};

const _resetCache = () => {
  cachedState = { ...DEFAULT_STATE };
  cacheExpiresAt = 0;
};

module.exports = {
  getState,
  setState,
  toggleMaintenance,
  isMaintenanceActive,
  shutdown,
  _resetCache
};


