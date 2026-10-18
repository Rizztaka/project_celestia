import { createRequire } from 'node:module';

import type { Redis } from 'ioredis';

import { env } from '@/core/config/env.js';
import { logger } from '@/core/logger/logger.js';

let client: Redis | undefined;
let stopping = false;
const loadRedis = createRequire(import.meta.url);

/** No connection or background retries unless Redis is explicitly configured. */
export function getRedisClient(): Redis | undefined {
  if (!env.REDIS_URL || stopping) return undefined;
  if (!client) {
    // Keep the Redis library off the unconfigured development/test import path.
    const { Redis: RedisClient } = loadRedis('ioredis') as typeof import('ioredis');
    client = new RedisClient(env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 1000,
      commandTimeout: 1000,
      retryStrategy: (attempt) => Math.min(attempt * 250, 5000),
    });
    // Connection errors can contain credentials/addresses; keep logs generic.
    client.on('error', () => logger.warn('Redis is unavailable'));
    void client.connect().catch(() => undefined);
  }
  return client;
}

export async function isRedisHealthy(): Promise<boolean> {
  const redis = getRedisClient();
  if (redis?.status !== 'ready') return false;
  try {
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  stopping = true;
  if (!client) return;
  try {
    if (client.status === 'ready') await client.quit();
  } finally {
    client.disconnect();
    client = undefined;
  }
}
