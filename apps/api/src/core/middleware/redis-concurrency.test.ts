import { afterEach, describe, expect, it, vi } from 'vitest';

import { RedisConcurrencyPool } from './request-admission.js';

afterEach(() => vi.useRealTimers());
const policy = { global: 2, perIdentity: 1 };
describe('Distributed concurrency leases', () => {
  it('acquires shared leases, retains local caps, renews and releases idempotently', async () => {
    vi.useFakeTimers();
    const redis = { status: 'ready' as const, eval: vi.fn().mockResolvedValue(1) };
    const pool = new RedisConcurrencyPool(redis, policy, 'auth');
    const release = await pool.acquire('a');
    expect(release).toBeTypeOf('function');
    expect(await pool.acquire('a')).toBeNull();
    expect(redis.eval.mock.calls[0]!.slice(1, 4)).toEqual([
      2,
      'celestia:concurrency:{auth}:all',
      'celestia:concurrency:{auth}:a',
    ]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(redis.eval).toHaveBeenCalledTimes(2);
    release!();
    release!();
    expect(redis.eval).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(redis.eval).toHaveBeenCalledTimes(3);
    const next = await pool.acquire('a');
    expect(next).toBeTypeOf('function');
    next!();
  });
  it('does not fall back when the shared pool explicitly denies admission', async () => {
    const redis = { status: 'ready' as const, eval: vi.fn().mockResolvedValue(0) };
    const pool = new RedisConcurrencyPool(redis, policy, 'auth', true);
    expect(await pool.acquire('a')).toBeNull();
    redis.eval.mockResolvedValue(1);
    const release = await pool.acquire('a');
    expect(release).toBeTypeOf('function');
    release!();
  });
  it.each([true, false])('uses local fallback only when permitted: %s', async (fallback) => {
    const redis = { status: 'reconnecting' as const, eval: vi.fn() };
    const pool = new RedisConcurrencyPool(redis, policy, 'auth', fallback);
    const release = await pool.acquire('a');
    if (fallback) {
      expect(release).toBeTypeOf('function');
      expect(await pool.acquire('a')).toBeNull();
      release!();
    } else expect(release).toBeNull();
    expect(redis.eval).not.toHaveBeenCalled();
  });
});
