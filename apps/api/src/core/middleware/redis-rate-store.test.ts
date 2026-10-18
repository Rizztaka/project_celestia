import { describe, expect, it, vi } from 'vitest';

import { RedisRateStore } from './request-admission.js';

const policy = { burst: 2, refillMs: 1000, capacity: 2 };
describe('Redis admission store', () => {
  it('shares the same policy key across instances and separates route budgets', async () => {
    const redis = {
      status: 'ready' as const,
      eval: vi.fn().mockResolvedValueOnce(0).mockResolvedValueOnce(3),
    };
    const first = new RedisRateStore(redis, policy, 'login');
    const second = new RedisRateStore(redis, policy, 'login');
    expect(await first.take('owner')).toBeNull();
    expect(await second.take('owner')).toBe(3);
    expect(redis.eval.mock.calls[0]!.slice(1)).toEqual([
      1,
      'celestia:rate:{login}',
      'owner',
      2,
      1000,
      2,
    ]);
    expect(redis.eval.mock.calls[1]!.slice(1)).toEqual(redis.eval.mock.calls[0]!.slice(1));
    redis.eval.mockResolvedValue(0);
    await new RedisRateStore(redis, policy, 'register').take('owner');
    expect(redis.eval.mock.calls[2]![2]).toBe('celestia:rate:{register}');
  });

  it.each(['ready', 'reconnecting'] as const)(
    'falls back to the bounded local bucket on %s failures',
    async (status) => {
      const redis = { status, eval: vi.fn().mockRejectedValue(new Error('offline')) };
      let now = 0;
      const store = new RedisRateStore(redis, policy, 'login', () => now, true);
      expect(await store.take('a')).toBeNull();
      expect(await store.take('a')).toBeNull();
      expect(await store.take('a')).toBe(1);
      now = 1000;
      expect(await store.take('a')).toBeNull();
    },
  );

  it('fails closed in production when configured Redis is unavailable', async () => {
    const redis = { status: 'reconnecting' as const, eval: vi.fn() };
    const store = new RedisRateStore(redis, policy, 'login', undefined, false);
    expect(await store.take('a')).toBe(1);
    expect(redis.eval).not.toHaveBeenCalled();
  });

  it.each([NaN, -1, 'invalid', null, undefined, 0.5])(
    'does not admit invalid Redis responses: %s',
    async (result) => {
      const redis = { status: 'ready' as const, eval: vi.fn().mockResolvedValue(result) };
      expect(await new RedisRateStore(redis, policy, 'login', undefined, false).take('a')).toBe(1);
    },
  );
});
