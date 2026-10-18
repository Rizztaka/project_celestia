import { createHash } from 'node:crypto';

import express from 'express';
import supertest from 'supertest';
import { describe, expect, it } from 'vitest';

import { trustProxySchema } from '@/core/config/trust-proxy.js';

import { socketIdentity } from './request-admission.js';

describe('Ingress trust policy', () => {
  it.each([
    [undefined, false],
    ['false', false],
    ['true', true],
    ['1', 1],
    ['2', 2],
    ['0', 0],
    [' loopback, linklocal, uniquelocal ', 'loopback, linklocal, uniquelocal'],
    [' 10.0.0.0/8 ', '10.0.0.0/8'],
  ])('normalizes TRUST_PROXY=%s', (input, expected) => {
    expect(trustProxySchema.parse(input)).toBe(expected);
  });

  it.each([
    ['false', '127.0.0.1'],
    ['true', '198.51.100.8'],
    ['1', '192.0.2.2'],
    ['2', '198.51.100.8'],
    ['loopback', '192.0.2.2'],
    ['10.0.0.0/8', '127.0.0.1'],
  ])('resolves the identity through Express with %s', async (policy, expected) => {
    const app = express();
    app.set('trust proxy', trustProxySchema.parse(policy));
    app.get('/', (req, res) => res.json({ identity: socketIdentity(req) }));
    const response = await supertest(app)
      .get('/')
      .set('X-Forwarded-For', '198.51.100.8, 192.0.2.2');
    expect(response.body.identity).toBe(createHash('sha256').update(expected).digest('hex'));
  });

  it('rejects numeric hop counts that lose integer precision', () => {
    expect(trustProxySchema.safeParse('999999999999999999999').success).toBe(false);
  });
});
