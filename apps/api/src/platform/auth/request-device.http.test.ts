import express from 'express';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';

import { requestDevice } from './request-device.js';

describe('Session device identity at the HTTP boundary', () => {
  it('ignores forged forwarding headers when no proxy is trusted', async () => {
    const app = express();
    app.get('/', (req, res) => res.json(requestDevice(req)));
    const response = await supertest(app)
      .get('/')
      .set('User-Agent', 'Synthetic device')
      .set('X-Forwarded-For', '198.51.100.8');
    expect(response.body.userAgent).toBe('Synthetic device');
    expect(['127.0.0.1', '::ffff:127.0.0.1', '::1']).toContain(response.body.ipAddress);
  });

  it('records the client behind trusted loopback ingress without trusting earlier forged hops', async () => {
    const app = express();
    app.set('trust proxy', 'loopback');
    app.get('/', (req, res) => res.json(requestDevice(req)));
    const response = await supertest(app)
      .get('/')
      .set('User-Agent', 'Synthetic device')
      .set('X-Forwarded-For', '198.51.100.8, 192.0.2.2, 127.0.0.1');
    expect(response.body).toEqual({ userAgent: 'Synthetic device', ipAddress: '192.0.2.2' });
  });
});
