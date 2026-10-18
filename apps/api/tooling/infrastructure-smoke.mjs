import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { disposableTestDatabase } from '../src/core/db/disposable-test-database.ts';

// Never run against an ordinary database or a shared Redis database.
assert.ok(
  disposableTestDatabase(process.env),
  'A guarded disposable PostgreSQL database is required',
);
const url = new URL(process.env.REDIS_URL ?? '');
assert.ok(['redis:', 'rediss:'].includes(url.protocol));
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
assert.equal(url.pathname, '/15', 'Use the isolated CI Redis database 15');
assert.equal(url.search, '');
assert.equal(url.hash, '');

const { Redis } = await import('ioredis');
const { RedisRateStore, RedisConcurrencyPool } =
  await import('../src/core/middleware/request-admission.ts');
const { disconnectRedis, isRedisHealthy } = await import('../src/core/infra/redis.ts');
const { disconnectDatabase } = await import('../src/core/db/prisma.ts');
const clients = Array.from(
  { length: 2 },
  () =>
    new Redis(url.href, {
      connectTimeout: 1000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    }),
);
for (const client of clients) client.on('error', () => undefined);
const scope = `ci-${randomUUID()}`;
const rateKey = `celestia:rate:{${scope}}`;
const concurrencyKeys = ['all', 'a', 'b', 'c'].map(
  (key) => `celestia:concurrency:{${scope}}:${key}`,
);
const releases = [];
let server;
try {
  for (const client of clients) assert.equal(await client.ping(), 'PONG');
  const policy = { burst: 5, refillMs: 10_000, capacity: 1 };
  const stores = clients.map(
    (client) => new RedisRateStore(client, policy, scope, undefined, false),
  );
  const decisions = await Promise.all(
    Array.from({ length: 30 }, (_, i) => stores[i % 2].take('owner')),
  );
  assert.equal(decisions.filter((retry) => retry === null).length, 5);
  assert.ok(decisions.filter((retry) => retry !== null).every((retry) => retry > 0));
  assert.ok((await stores[1].take('another-owner')) > 0, 'Capacity must preserve active debt');
  assert.equal(await clients[0].zcard(rateKey), 1);
  assert.ok((await clients[0].pttl(rateKey)) > 0);

  const pools = clients.map(
    (client) => new RedisConcurrencyPool(client, { global: 2, perIdentity: 1 }, scope, false),
  );
  const first = await pools[0].acquire('a');
  assert.equal(typeof first, 'function');
  releases.push(first);
  assert.equal(await pools[1].acquire('a'), null);
  const second = await pools[1].acquire('b');
  assert.equal(typeof second, 'function');
  releases.push(second);
  assert.equal(await pools[0].acquire('c'), null);
  first();
  // Release is deliberately nonblocking on the request path.
  for (
    let attempt = 0;
    attempt < 100 && (await clients[0].zcard(concurrencyKeys[0])) > 1;
    attempt++
  )
    await new Promise((resolve) => setTimeout(resolve, 10));
  const third = await pools[0].acquire('c');
  assert.equal(typeof third, 'function');
  releases.push(third);

  const { createApp } = await import('../src/app.ts');
  for (let attempt = 0; attempt < 100 && !(await isRedisHealthy()); attempt++)
    await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(await isRedisHealthy(), true);
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/v1/health/ready`, {
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    checks: { database: 'up', redis: 'up' },
  });
  console.log(
    'Live Redis 7: shared budgets, bounded debt, shared concurrency, release and database/Redis readiness passed.',
  );
} finally {
  for (const release of releases) release();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  // Flush earlier release commands, then remove only this run's exact random keys.
  await Promise.all(clients.map((client) => client.ping().catch(() => undefined)));
  await clients[0].del(rateKey, ...concurrencyKeys).catch(() => undefined);
  for (const client of clients) client.disconnect();
  await Promise.allSettled([disconnectDatabase(), disconnectRedis()]);
}
