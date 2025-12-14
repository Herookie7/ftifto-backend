const logger = require('../logger');
const config = require('../config');

// In-memory cache fallback
const memoryCache = new Map();
const memoryCacheTTL = new Map();

let redisClient = null;

/**
 * Initialize Redis client if available
 */
const initializeRedis = async () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    if (config.socket?.redisUrl) {
      const Redis = require('ioredis');
      redisClient = new Redis(config.socket.redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3
      });

      redisClient.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        redisClient = null; // Fall back to memory cache
      });

      redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      return redisClient;
    }
  } catch (error) {
    logger.warn('Redis not available, using in-memory cache', { error: error.message });
    redisClient = null;
  }

  return null;
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
const get = async (key) => {
  try {
    // Try Redis first
    if (redisClient) {
      const value = await redisClient.get(key);
      if (value) {
        logger.debug('Cache hit (Redis)', { key });
        return JSON.parse(value);
      }
    }

    // Fall back to memory cache
    if (memoryCache.has(key)) {
      const ttl = memoryCacheTTL.get(key);
      if (ttl && ttl > Date.now()) {
        logger.debug('Cache hit (Memory)', { key });
        return memoryCache.get(key);
      } else {
        // Expired, remove it
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
      }
    }

    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Cache get error', { key, error: error.message });
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} - Success status
 */
const set = async (key, value, ttlSeconds = 300) => {
  try {
    const serializedValue = JSON.stringify(value);

    // Try Redis first
    if (redisClient) {
      await redisClient.setex(key, ttlSeconds, serializedValue);
      logger.debug('Cache set (Redis)', { key, ttlSeconds });
      return true;
    }

    // Fall back to memory cache
    memoryCache.set(key, value);
    memoryCacheTTL.set(key, Date.now() + (ttlSeconds * 1000));
    logger.debug('Cache set (Memory)', { key, ttlSeconds });
    return true;
  } catch (error) {
    logger.error('Cache set error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
const del = async (key) => {
  try {
    // Try Redis first
    if (redisClient) {
      await redisClient.del(key);
      logger.debug('Cache delete (Redis)', { key });
    }

    // Also delete from memory cache
    memoryCache.delete(key);
    memoryCacheTTL.delete(key);
    logger.debug('Cache delete (Memory)', { key });
    return true;
  } catch (error) {
    logger.error('Cache delete error', { key, error: error.message });
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Key pattern (e.g., 'restaurants:*')
 * @returns {Promise<number>} - Number of keys deleted
 */
const delPattern = async (pattern) => {
  try {
    let deletedCount = 0;

    // Try Redis first
    if (redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        deletedCount = keys.length;
        logger.debug('Cache delete pattern (Redis)', { pattern, count: deletedCount });
      }
    }

    // Also delete from memory cache
    for (const key of memoryCache.keys()) {
      if (key.match(pattern.replace('*', '.*'))) {
        memoryCache.delete(key);
        memoryCacheTTL.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug('Cache delete pattern (Memory)', { pattern, count: deletedCount });
    }

    return deletedCount;
  } catch (error) {
    logger.error('Cache delete pattern error', { pattern, error: error.message });
    return 0;
  }
};

/**
 * Clear all cache
 * @returns {Promise<boolean>} - Success status
 */
const clear = async () => {
  try {
    // Try Redis first
    if (redisClient) {
      await redisClient.flushdb();
      logger.info('Cache cleared (Redis)');
    }

    // Clear memory cache
    memoryCache.clear();
    memoryCacheTTL.clear();
    logger.info('Cache cleared (Memory)');
    return true;
  } catch (error) {
    logger.error('Cache clear error', { error: error.message });
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {Promise<object>} - Cache stats
 */
const getStats = async () => {
  try {
    const stats = {
      type: redisClient ? 'Redis' : 'Memory',
      memoryCacheSize: memoryCache.size
    };

    if (redisClient) {
      const info = await redisClient.info('memory');
      stats.redisInfo = info;
    }

    return stats;
  } catch (error) {
    logger.error('Cache stats error', { error: error.message });
    return { type: 'Memory', memoryCacheSize: memoryCache.size };
  }
};

// Initialize Redis on module load
initializeRedis().catch(err => {
  logger.warn('Failed to initialize Redis', { error: err.message });
});

module.exports = {
  initializeRedis,
  get,
  set,
  del,
  delPattern,
  clear,
  getStats
};
