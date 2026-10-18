import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { pullSimulatorController } from './pull-simulator.controller.js';
import { pullSimulatorService } from './pull-simulator.service.js';

describe('Pull simulator error responses', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [new Error('Unknown banner'), 'Unknown banner'],
    [{ message: 'Invalid pull count' }, 'Invalid pull count'],
    [null, 'Unknown error occurred in simulation'],
    [{ message: '' }, 'Unknown error occurred in simulation'],
    [{ message: 42 }, 'Unknown error occurred in simulation'],
  ])('returns a JSON error for thrown value %j', async (error, message) => {
    vi.spyOn(pullSimulatorService, 'simulatePulls').mockImplementation(() => {
      throw error;
    });
    const app = express();
    app.use(express.json());
    app.post('/simulate', pullSimulatorController.simulatePulls);

    const response = await request(app).post('/simulate').send({ bannerId: 'example' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, error: message });
  });
});
