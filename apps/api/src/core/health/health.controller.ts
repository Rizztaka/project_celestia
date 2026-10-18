import type { RequestHandler } from 'express';

import { env } from '@/core/config/env.js';
import { prisma } from '@/core/db/prisma.js';
import { isRedisHealthy } from '@/core/infra/redis.js';

let draining = false;
export function markDraining(): void {
  draining = true;
}

export const liveness: RequestHandler = (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res
    .status(200)
    .json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
};

// A stalled database must not leave readiness requests hanging indefinitely.
let databaseProbe: Promise<boolean> | undefined;
async function databaseHealthy(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Coalesce probes: a stalled dependency cannot accumulate one query per poll.
    databaseProbe ??= Promise.resolve()
      .then(() => prisma.$queryRawUnsafe('SELECT 1'))
      .then(
        () => true,
        () => false,
      )
      .finally(() => {
        databaseProbe = undefined;
      });
    return await Promise.race([
      databaseProbe,
      new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), 2000);
        timer.unref();
      }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export const readiness: RequestHandler = async (_req, res) => {
  const [database, redis] = await Promise.all([
    databaseHealthy(),
    env.REDIS_URL ? isRedisHealthy() : Promise.resolve(null),
  ]);
  const healthy = database && redis !== false && !draining;
  res.setHeader('Cache-Control', 'no-store');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks: {
      database: database ? 'up' : 'down',
      redis: redis === null ? 'disabled' : redis ? 'up' : 'down',
    },
  });
};
