const { get, set } = require('../config/redis');

/**
 * Redis cache middleware
 * @param {number} ttl - cache TTL in seconds
 * @param {string|null} keyPrefix - optional key prefix override
 */
const cacheMiddleware = (ttl = 60, keyPrefix = null) => async (req, res, next) => {
  const cacheKey = keyPrefix
    ? `${keyPrefix}:${req.originalUrl}`
    : `cache:${req.originalUrl}`;

  const cached = await get(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=300`);
    return res.json(cached);
  }

  res.set('X-Cache', 'MISS');

  // Intercept json() to cache the response
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode === 200 && data && data.success !== false) {
      set(cacheKey, data, ttl).catch(() => {});
    }
    return originalJson(data);
  };

  next();
};

module.exports = { cacheMiddleware };
