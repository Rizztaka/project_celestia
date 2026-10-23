import { createHash, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { performance } from 'node:perf_hooks';

import type { Request, RequestHandler, Response } from 'express';
import type { Redis } from 'ioredis';

import { env } from '@/core/config/env.js';
import {
  type RequestSafetyPolicy,
  requestSafetyPolicy,
  requestSafetySchema,
} from '@/core/config/request-safety.js';
import { AppError } from '@/core/errors/app-error.js';
import { getRedisClient } from '@/core/infra/redis.js';
import { accountDataPolicy } from '@/platform/account-data/account-data.policy.js';

import { boundedJson } from './bounded-json.js';

export function normalizeClientAddress(address: string | undefined): string {
  if (!address || address.length > 64) return 'unknown';
  // OS scope identifiers are irrelevant to identity on this directly bound listener.
  const value = address.split('%')[0]!;
  if (isIP(value) === 4) return value;
  if (isIP(value) !== 6) return 'unknown';
  const canonical = new URL(`http://[${value}]`).hostname.slice(1, -1);
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(canonical);
  if (!mapped) return canonical;
  const high = parseInt(mapped[1]!, 16),
    low = parseInt(mapped[2]!, 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const socketIdentity = (req: Request): string =>
  digest(normalizeClientAddress(req.ip || req.socket.remoteAddress));
const ownerIdentity = (req: Request): string => {
  if (!req.user) throw new AppError('Authentication is required.', 401, 'UNAUTHORIZED');
  return digest(req.user.id);
};
const seconds = (ms: number) => Math.max(1, Math.ceil(ms / 1000));

/** A debt-based token bucket: at most capacity entries; no active-debt eviction. */
export interface IRateStore {
  take(key: string): Promise<number | null> | number | null;
  readonly size?: number;
}

export class BoundedRateStore implements IRateStore {
  private readonly entries = new Map<string, number>();
  private lastNow = 0;
  constructor(
    private readonly policy: RequestSafetyPolicy['login'],
    private readonly clock: () => number = () => performance.now(),
  ) {}
  get size() {
    return this.entries.size;
  }
  take(key: string): number | null {
    const now = Math.max(this.lastNow, this.clock());
    this.lastNow = now;
    // Expired entries represent a full bucket; removing one grants no extra budget.
    let earliestExpiry = Infinity;
    for (const [identity, fullAt] of this.entries) {
      if (fullAt <= now) this.entries.delete(identity);
      else earliestExpiry = Math.min(earliestExpiry, fullAt);
    }
    const existing = this.entries.get(key);
    if (existing === undefined && this.entries.size >= this.policy.capacity) {
      return seconds(earliestExpiry - now);
    }
    const fullAt = Math.max(existing ?? now, now);
    const admittedAt = fullAt - (this.policy.burst - 1) * this.policy.refillMs;
    if (admittedAt > now) return seconds(admittedAt - now);
    this.entries.set(key, fullAt + this.policy.refillMs);
    return null;
  }
}

// One bounded sorted set per policy. Redis TIME avoids clock skew between replicas.
// Scores are the instant a bucket becomes full again, matching BoundedRateStore.
export const rateScript = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local burst, refill, capacity = tonumber(ARGV[2]), tonumber(ARGV[3]), tonumber(ARGV[4])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
local existing = redis.call('ZSCORE', KEYS[1], ARGV[1])
if not existing and redis.call('ZCARD', KEYS[1]) >= capacity then
  local earliest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  return math.max(1, math.ceil((tonumber(earliest[2]) - now) / 1000))
end
local fullAt = math.max(tonumber(existing) or now, now)
local admittedAt = fullAt - (burst - 1) * refill
if admittedAt > now then return math.max(1, math.ceil((admittedAt - now) / 1000)) end
redis.call('ZADD', KEYS[1], fullAt + refill, ARGV[1])
redis.call('PEXPIRE', KEYS[1], burst * refill)
return 0
`;

export class RedisRateStore implements IRateStore {
  private readonly fallback: BoundedRateStore;
  constructor(
    private readonly redis: Pick<Redis, 'eval' | 'status'>,
    private readonly policy: RequestSafetyPolicy['login'],
    private readonly scope: string,
    clock?: () => number,
    private readonly allowFallback = env.NODE_ENV !== 'production',
  ) {
    this.fallback = new BoundedRateStore(policy, clock);
  }
  async take(key: string): Promise<number | null> {
    if (this.redis.status === 'ready') {
      try {
        const retry = await this.redis.eval(
          rateScript,
          1,
          `celestia:rate:{${this.scope}}`,
          key,
          this.policy.burst,
          this.policy.refillMs,
          this.policy.capacity,
        );
        if (typeof retry !== 'number' || !Number.isSafeInteger(retry) || retry < 0)
          throw new Error('Invalid rate store result');
        return retry === 0 ? null : retry;
      } catch {
        // Local/test installs remain usable. Configured production fails closed.
      }
    }
    return this.allowFallback ? this.fallback.take(key) : 1;
  }
}

export class ConcurrencyPool {
  private readonly identities = new Map<string, number>();
  private active = 0;
  constructor(private readonly policy: RequestSafetyPolicy['authConcurrency']) {}
  get size() {
    return this.active;
  }
  acquire(key: string): (() => void) | null {
    const count = this.identities.get(key) ?? 0;
    if (this.active >= this.policy.global || count >= this.policy.perIdentity) return null;
    this.active++;
    this.identities.set(key, count + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      const remaining = this.identities.get(key)! - 1;
      if (remaining) this.identities.set(key, remaining);
      else this.identities.delete(key);
    };
  }
}

interface IConcurrencyPool {
  acquire(key: string): (() => void) | null | Promise<(() => void) | null>;
}

export const concurrencyScript = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
for i = 1, 2 do redis.call('ZREMRANGEBYSCORE', KEYS[i], '-inf', now) end
if redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[2]) or
   redis.call('ZCARD', KEYS[2]) >= tonumber(ARGV[3]) then return 0 end
for i = 1, 2 do
  redis.call('ZADD', KEYS[i], now + tonumber(ARGV[4]), ARGV[1])
  redis.call('PEXPIRE', KEYS[i], ARGV[4])
end
return 1
`;
const releaseScript = `
for i = 1, 2 do redis.call('ZREM', KEYS[i], ARGV[1]) end
return 1
`;
const renewScript = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
for i = 1, 2 do
  if redis.call('ZSCORE', KEYS[i], ARGV[1]) then
    redis.call('ZADD', KEYS[i], 'XX', now + tonumber(ARGV[2]), ARGV[1])
    redis.call('PEXPIRE', KEYS[i], ARGV[2])
  end
end
return 1
`;

/** Local caps plus renewable shared leases; crashed instances expire in 30 seconds. */
export class RedisConcurrencyPool implements IConcurrencyPool {
  private readonly local: ConcurrencyPool;
  constructor(
    private readonly redis: Pick<Redis, 'eval' | 'status'>,
    private readonly policy: RequestSafetyPolicy['authConcurrency'],
    private readonly scope: string,
    private readonly allowFallback = env.NODE_ENV !== 'production',
  ) {
    this.local = new ConcurrencyPool(policy);
  }
  async acquire(key: string): Promise<(() => void) | null> {
    const releaseLocal = this.local.acquire(key);
    if (!releaseLocal) return null;
    const keys = [
      `celestia:concurrency:{${this.scope}}:all`,
      `celestia:concurrency:{${this.scope}}:${key}`,
    ];
    const lease = randomUUID();
    let admitted: boolean;
    try {
      if (this.redis.status !== 'ready') throw new Error('Redis unavailable');
      admitted =
        (await this.redis.eval(
          concurrencyScript,
          2,
          ...keys,
          lease,
          this.policy.global,
          this.policy.perIdentity,
          30_000,
        )) === 1;
    } catch {
      if (this.allowFallback) return releaseLocal;
      releaseLocal();
      return null;
    }
    if (!admitted) {
      releaseLocal();
      return null;
    }
    let released = false;
    let renewing = false;
    const timer = setInterval(() => {
      if (renewing || released) return;
      renewing = true;
      void this.redis
        .eval(renewScript, 2, ...keys, lease, 30_000)
        .catch(() => undefined)
        .finally(() => {
          renewing = false;
        });
    }, 10_000);
    timer.unref();
    return () => {
      if (released) return;
      released = true;
      clearInterval(timer);
      releaseLocal();
      void this.redis.eval(releaseScript, 2, ...keys, lease).catch(() => undefined);
    };
  }
}

type Operation = (req: Request, res: Response) => unknown | Promise<unknown>;
function readBody(parse: RequestHandler, req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    const closed = () => finish(new AppError('Request body was incomplete.', 400, 'INVALID_BODY'));
    let done = false;
    const finish = (error?: unknown) => {
      if (done) return;
      done = true;
      req.off('aborted', closed);
      res.off('close', closed);
      if (error) reject(error);
      else resolve();
    };
    req.once('aborted', closed);
    res.once('close', closed);
    if (req.aborted || res.destroyed) return closed();
    try {
      parse(req, res, finish);
    } catch {
      finish(new Error('Unexpected JSON body reader failure.'));
    }
  });
}

function protect(
  store: IRateStore,
  pool: IConcurrencyPool,
  identity: (req: Request) => string,
  parse: RequestHandler,
  options: { responseMs?: number; sharedPool?: IConcurrencyPool; existingSubject?: boolean } = {},
) {
  return (operation: Operation): RequestHandler =>
    async (req, res, next) => {
      const key = identity(req);
      const retry = await store.take(key);
      const reject = (code: string, wait: number) => {
        res.setHeader('Retry-After', String(wait));
        next(
          new AppError(
            `Too many requests. Try again in ${wait} second${wait === 1 ? '' : 's'}.`,
            429,
            code,
          ),
        );
      };
      if (retry !== null) return reject('RATE_LIMITED', retry);
      const release = await pool.acquire(key);
      if (!release) return reject('REQUEST_BUSY', 1);
      const sharedRelease = await options.sharedPool?.acquire(socketIdentity(req));
      if (options.sharedPool && !sharedRelease) {
        release();
        return reject('REQUEST_BUSY', 1);
      }
      let workDone = false;
      let responseDone = res.writableFinished || res.destroyed;
      const cleanup = () => {
        if (!workDone || (options.responseMs && !responseDone)) return;
        clearTimeout(timer);
        res.off('finish', completed);
        res.off('close', completed);
        release();
        sharedRelease?.();
      };
      const completed = () => {
        responseDone = true;
        cleanup();
      };
      const timer = options.responseMs
        ? setTimeout(() => res.destroy(), options.responseMs)
        : undefined;
      timer?.unref();
      if (options.responseMs) {
        res.once('finish', completed);
        res.once('close', completed);
      }
      try {
        if (options.existingSubject) {
          const { requireExistingSubject } = await import('./auth.middleware.js');
          await requireExistingSubject(req.user!.id, req.authSessionId);
        }
        await readBody(parse, req, res);
        if (!req.aborted && !res.destroyed) await operation(req, res);
      } catch (error) {
        next(error);
      } finally {
        // Never release on response finish/close while a service promise is still running.
        workDone = true;
        cleanup();
      }
    };
}

export function createRequestSafety(
  policy: RequestSafetyPolicy = requestSafetyPolicy,
  clock?: () => number,
) {
  const checked = requestSafetySchema.parse(policy);
  const redis = getRedisClient();
  const rateStore = (scope: string, rate: RequestSafetyPolicy['login']): IRateStore =>
    redis ? new RedisRateStore(redis, rate, scope, clock) : new BoundedRateStore(rate, clock);
  const concurrency = (
    scope: string,
    limits: RequestSafetyPolicy['authConcurrency'],
  ): IConcurrencyPool =>
    redis ? new RedisConcurrencyPool(redis, limits, scope) : new ConcurrencyPool(limits);
  const auth = concurrency('auth', checked.authConcurrency);
  const imports = concurrency('import', checked.importConcurrency);
  return {
    ordinaryJson: boundedJson(checked.ordinaryBytes),
    login: protect(
      rateStore('login', checked.login),
      auth,
      socketIdentity,
      boundedJson(checked.authBytes),
    ),
    register: protect(
      rateStore('register', checked.register),
      auth,
      socketIdentity,
      boundedJson(checked.authBytes),
    ),
    import: protect(
      rateStore('import', checked.import),
      imports,
      ownerIdentity,
      boundedJson(checked.importBytes),
      { existingSubject: true },
    ),
    hoyolab: protect(
      rateStore('hoyolab', { ...checked.import, burst: 3, refillMs: 60000 }),
      concurrency('hoyolab', checked.importConcurrency),
      ownerIdentity,
      boundedJson(checked.authBytes),
      { existingSubject: true, responseMs: 240000 },
    ),
    accountData: protect(
      rateStore('account-data', accountDataPolicy.rate),
      concurrency('account-data', accountDataPolicy.concurrency),
      ownerIdentity,
      boundedJson(checked.authBytes),
      { sharedPool: auth, responseMs: accountDataPolicy.responseMs, existingSubject: true },
    ),
  };
}
export type RequestSafety = ReturnType<typeof createRequestSafety>;
