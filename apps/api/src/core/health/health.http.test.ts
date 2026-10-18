import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ query: vi.fn(), redis: vi.fn() }));
vi.mock('@/core/db/prisma.js', () => ({ prisma: { $queryRawUnsafe: mocks.query } }));
vi.mock('@/core/infra/redis.js', () => ({
  isRedisHealthy: mocks.redis,
  getRedisClient: () => undefined,
}));
vi.mock('@/core/config/env.js', () => ({ env: { NODE_ENV: 'test', REDIS_URL: undefined } }));

import { createApp } from '@/app.js';
import { env } from '@/core/config/env.js';

beforeEach(() => {
  mocks.query.mockReset().mockResolvedValue([{ '?column?': 1 }]);
  mocks.redis.mockReset().mockResolvedValue(true);
  env.REDIS_URL = undefined;
});
afterEach(() => vi.useRealTimers());

describe('Health endpoints', () => {
  it.each(['/api/v1/health', '/api/v1/health/live'])(
    'keeps %s independent of dependencies',
    async (path) => {
      mocks.query.mockRejectedValue(new Error('unavailable'));
      const result = await supertest(createApp()).get(path);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({
        status: 'ok',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      });
      expect(Number.isNaN(Date.parse(result.body.timestamp))).toBe(false);
      expect(result.headers['cache-control']).toBe('no-store');
      expect(mocks.query).not.toHaveBeenCalled();
    },
  );

  it('queries the database and reports unconfigured Redis as disabled', async () => {
    const result = await supertest(createApp()).get('/api/v1/health/ready');
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: 'ok', checks: { database: 'up', redis: 'disabled' } });
    expect(mocks.query).toHaveBeenCalledWith('SELECT 1');
    expect(mocks.redis).not.toHaveBeenCalled();
  });

  it('returns 503 without exposing database errors', async () => {
    mocks.query.mockRejectedValue(new Error('private database details'));
    const result = await supertest(createApp()).get('/api/v1/health/ready');
    expect(result.status).toBe(503);
    expect(result.body).toEqual({
      status: 'degraded',
      checks: { database: 'down', redis: 'disabled' },
    });
  });

  it.each([true, false])('reports configured Redis health %s', async (healthy) => {
    env.REDIS_URL = 'redis://127.0.0.1:6379';
    mocks.redis.mockResolvedValue(healthy);
    const result = await supertest(createApp()).get('/api/v1/health/ready');
    expect(result.status).toBe(healthy ? 200 : 503);
    expect(result.body.checks.redis).toBe(healthy ? 'up' : 'down');
  });

  it('bounds readiness latency when the database never settles', async () => {
    mocks.query.mockImplementation(() => new Promise(() => undefined));
    const result = await supertest(createApp()).get('/api/v1/health/ready');
    expect(result.status).toBe(503);
    expect(result.body.checks.database).toBe('down');
  });
});
