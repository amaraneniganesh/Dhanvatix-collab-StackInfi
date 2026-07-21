import { Redis } from 'ioredis';

export const isRedisEnabled = !!process.env.REDIS_URL;

export const redisClient = isRedisEnabled 
  ? new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
  : ({} as Redis);

if (isRedisEnabled) {
  redisClient.on('connect', () => {
    console.log('Redis Connected Successfully');
  });

  let redisErrorLogged = false;
  redisClient.on('error', (err: any) => {
    if (!redisErrorLogged) {
      console.error('Redis Connection Error:', err.message);
      redisErrorLogged = true;
    }
  });
} else {
  console.log('Redis is disabled. Running in memory-only fallback mode.');
}
