import { app } from '@/app.js';
import { env } from '@/core/config/env.js';
import { disconnectDatabase } from '@/core/db/prisma.js';
import { markDraining } from '@/core/health/health.controller.js';
import { disconnectRedis } from '@/core/infra/redis.js';
import { createShutdownHandler } from '@/core/infra/shutdown.js';
import { logger } from '@/core/logger/logger.js';

import { startHoyolabRefresh } from './games/genshin/hoyolab/hoyolab.scheduler.js';

const stopHoyolabRefresh = startHoyolabRefresh();
const PORT = parseInt(env.PORT, 10);

const server = app.listen(PORT, () => {
  logger.info(`Project Celestia API is running on port ${PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = createShutdownHandler({
  server,
  drain: markDraining,
  disconnect: [stopHoyolabRefresh, disconnectDatabase, disconnectRedis],
  logger,
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
