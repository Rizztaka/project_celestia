import express, { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

const fixture = vi.hoisted(() => ({ read: vi.fn(async () => null) }));
vi.mock('@/core/config/env.js', () => ({
  env: { NODE_ENV: 'test', JWT_SECRET: 'deterministic-http-secret-never-used-outside-tests' },
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    user: { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id }) },
    session: { findFirst: async () => ({ id: 'session' }) },
  },
}));
vi.mock('./build-insights.repository.js', () => ({
  BuildInsightsRepository: class {
    readForUser = fixture.read;
  },
}));

import { AppError } from '@/core/errors/app-error.js';

import { buildInsightsRoutes } from './build-insights.routes.js';

const app = express();
app.use(buildInsightsRoutes);
// The harness translates the same domain/validation errors as the application.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next; // Express error middleware requires four arguments.
  res
    .status(error instanceof AppError ? error.statusCode : error instanceof ZodError ? 400 : 500)
    .json({ success: false });
});
const token = jwt.sign({ sid: 'session' }, 'deterministic-http-secret-never-used-outside-tests', {
  subject: 'owner-only',
});
describe('build insights HTTP boundary', () => {
  it('requires authentication before any equipment read', async () => {
    fixture.read.mockClear();
    expect((await supertest(app).get('/characters/Albedo/build-insights')).status).toBe(401);
    expect(fixture.read).not.toHaveBeenCalled();
  });
  it('serves an unowned profile and a hypothetical comparison without writes', async () => {
    fixture.read.mockClear();
    const response = await supertest(app)
      .get('/characters/Albedo/build-insights?artifactSet=DeepwoodMemories&pieces=4')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data.recorded).toBe(false);
    expect(
      response.body.data.comparison.find((c: { id: string }) => c.id === 'DeepwoodMemories-4')
        .state,
    ).toBe('conditional');
    expect(fixture.read).toHaveBeenCalledWith('owner-only', 'Albedo');
  });
  it('rejects invalid comparison parameters before reading equipment', async () => {
    fixture.read.mockClear();
    expect(
      (
        await supertest(app)
          .get('/characters/Albedo/build-insights?artifactSet=DeepwoodMemories')
          .set('Authorization', `Bearer ${token}`)
      ).status,
    ).toBe(400);
    expect(fixture.read).not.toHaveBeenCalled();
  });
});
