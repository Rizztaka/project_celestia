import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { syntheticShowcase } from './showcase.fixtures.js';
import { ShowcaseService } from './showcase.service.js';

const databaseAccess = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('Showcase must never access the database.');
  }),
);
vi.mock('@/core/db/prisma.js', () => ({
  prisma: new Proxy({}, { get: () => databaseAccess }),
}));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'synthetic-showcase-test-only-32-characters',
    TRUST_PROXY: false,
  },
}));
vi.mock('@/core/logger/logger.js', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
import { createApp } from '@/app.js';

describe('Showcase through the existing Express application', () => {
  it('serves public data, rejects UID injection, and never accesses or replaces stored account data', async () => {
    const transport = vi.fn(async () => new Response(JSON.stringify(syntheticShowcase())));
    const app = createApp({ showcaseService: new ShowcaseService(transport) });
    expect(
      (await request(app).get('/api/v1/games/genshin/showcase/800000001')).body.snapshot.characters,
    ).toHaveLength(1);
    const invalid = await request(app).get('/api/v1/games/genshin/showcase/abc');
    expect(invalid.status).toBe(400);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(databaseAccess).not.toHaveBeenCalled();
  });
});
