const Redis = require('ioredis');

let client = null;

const connectRedis = async () => {
  try {
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });

    client.on('error', (err) => {
      // Only log once to avoid terminal spam
      if (!client.hasLoggedError) {
        console.warn(`💡 Note: Redis caching is currently disabled (could not connect to ${process.env.REDIS_URL || 'localhost:6379'})`);
        client.hasLoggedError = true;
      }
    });

    await client.connect().catch(() => {});
    if (client.status === 'ready') {
      console.log('✅ Redis connected');
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'development') {
      console.warn(`⚠️  Redis unavailable: ${err.message}`);
    }
  }
};

const get = async (key) => {
  if (!client || client.status !== 'ready') return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
};

const set = async (key, value, ttlSeconds = 60) => {
  if (!client || client.status !== 'ready') return;
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* non-fatal */ }
};

const del = async (key) => {
  if (!client || client.status !== 'ready') return;
  try {
    await client.del(key);
  } catch { /* non-fatal */ }
};

const delPattern = async (pattern) => {
  if (!client || client.status !== 'ready') return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
  } catch { /* non-fatal */ }
};

module.exports = { connectRedis, get, set, del, delPattern };
