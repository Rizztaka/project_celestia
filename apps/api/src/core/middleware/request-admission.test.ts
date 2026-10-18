import { describe, expect, it } from 'vitest';

import { requestSafetyPolicy } from '@/core/config/request-safety.js';

import {
  BoundedRateStore,
  ConcurrencyPool,
  createRequestSafety,
  normalizeClientAddress,
} from './request-admission.js';

describe('Bounded request admission', () => {
  it('allows the burst, refills exactly on the boundary and never exceeds the burst', () => {
    let now = 0;
    const store = new BoundedRateStore({ burst: 2, refillMs: 6000, capacity: 2 }, () => now);
    expect(store.take('a')).toBeNull();
    expect(store.take('a')).toBeNull();
    expect(store.take('a')).toBe(6);
    now = 5999;
    expect(store.take('a')).toBe(1);
    now = 6000;
    expect(store.take('a')).toBeNull();
    expect(store.take('a')).toBe(6);
    now = 100_000;
    expect(store.take('a')).toBeNull();
    expect(store.take('a')).toBeNull();
    expect(store.take('a')).toBe(6);
  });
  it('cannot churn active penalties out of capacity; expires only fully replenished entries', () => {
    let now = 0;
    const store = new BoundedRateStore({ burst: 2, refillMs: 1000, capacity: 1 }, () => now);
    store.take('a');
    store.take('a');
    for (let i = 0; i < 10000; i++) expect(store.take(`churn-${i}`)).toBe(2);
    expect(store.size).toBe(1);
    now = 1000;
    expect(store.take('b')).toBe(1);
    expect(store.take('a')).toBeNull();
    now = 2999;
    expect(store.take('b')).toBe(1);
    now = 3000;
    expect(store.take('b')).toBeNull();
    expect(store.size).toBe(1);
  });
  it('does not extend penalties for denied attempts or refill on a backward clock', () => {
    let now = 5000;
    const store = new BoundedRateStore({ burst: 1, refillMs: 1000, capacity: 2 }, () => now);
    store.take('a');
    now = 0;
    expect(store.take('a')).toBe(1);
    now = 6000;
    expect(store.take('a')).toBeNull();
    expect(store.take('b')).toBeNull();
  });
  it.each([
    ['::ffff:127.0.0.1', '127.0.0.1'],
    ['0:0:0:0:0:ffff:7f00:0001', '127.0.0.1'],
    ['127.0.0.1', '127.0.0.1'],
    ['2001:0DB8:0:0:0:0:0:1', '2001:db8::1'],
    ['fe80::1%3', 'fe80::1'],
    [undefined, 'unknown'],
    ['', 'unknown'],
    ['malformed', 'unknown'],
    ['a'.repeat(1000), 'unknown'],
  ])('normalizes direct peer %s', (input, expected) => {
    expect(normalizeClientAddress(input)).toBe(expected);
  });
  it('caps total and per-identity work and releases idempotently with no queue', () => {
    const pool = new ConcurrencyPool({ global: 2, perIdentity: 1 });
    const a = pool.acquire('a')!;
    expect(pool.acquire('a')).toBeNull();
    const b = pool.acquire('b')!;
    expect(pool.acquire('c')).toBeNull();
    a();
    a();
    expect(pool.size).toBe(1);
    const c = pool.acquire('c')!;
    b();
    c();
    expect(pool.size).toBe(0);
  });
  it.each([0, -1, Infinity, NaN, 1.5, 1e12])('rejects invalid policy values %s', (burst) => {
    expect(() =>
      createRequestSafety({
        ...requestSafetyPolicy,
        login: { ...requestSafetyPolicy.login, burst },
      }),
    ).toThrow();
  });
});
