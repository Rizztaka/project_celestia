import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/core/errors/app-error.js';
import { errorResponse } from '@/core/utils/response.js';

import { pullSimulatorController } from './pull-simulator.controller.js';
import { pullSimulatorService } from './pull-simulator.service.js';
const input = {
  bannerId: 'banner_mavuika_phase1',
  count: 1,
  currentPity5: 0,
  currentPity4: 0,
  guaranteed5: false,
  guaranteed4: false,
};
function application() {
  const app = express();
  app.use(express.json());
  app.post('/simulate', pullSimulatorController.simulatePulls);
  // Same application error envelope; keep this controller test independent of infrastructure.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    const known = error instanceof AppError;
    res
      .status(known ? error.statusCode : 500)
      .json(
        errorResponse(
          known ? error.errorCode : 'INTERNAL_SERVER_ERROR',
          known ? error.message : 'An unexpected error occurred',
        ),
      );
  });
  return app;
}
describe('Pull simulator HTTP boundary', () => {
  afterEach(() => vi.restoreAllMocks());
  it.each([
    new Error('private internal detail'),
    null,
    { message: '' },
    { message: 42 },
    { message: 'private internal detail' },
  ])(
    'uses the structured error envelope without leaking unexpected thrown value %j',
    async (error) => {
      vi.spyOn(pullSimulatorService, 'simulatePulls').mockImplementation(() => {
        throw error;
      });
      const response = await request(application()).post('/simulate').send(input);
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      });
    },
  );
  it.each([
    { count: -1 },
    { count: 101 },
    { count: '10' },
    { currentPity5: 90 },
    { guaranteed5: 'false' },
    { userId: 'other-owner' },
  ])('rejects invalid body %j before simulation', async (overrides) => {
    const spy = vi.spyOn(pullSimulatorService, 'simulatePulls');
    const response = await request(application())
      .post('/simulate')
      .send({ ...input, ...overrides });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('UNPROCESSABLE_ENTITY');
    expect(spy).not.toHaveBeenCalled();
  });
  it('returns results in the standard success envelope', async () => {
    const response = await request(application()).post('/simulate').send(input);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.pulls).toHaveLength(1);
  });
});
