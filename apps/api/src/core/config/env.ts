import 'dotenv/config';

import { z } from 'zod';

import { normalizeOrigin } from './cors.js';
import { trustProxySchema } from './trust-proxy.js';

const optionalSecret = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('4000'),
    TRUST_PROXY: trustProxySchema,
    REDIS_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRY: z.string().default('15m'),
    WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
    API_ORIGIN: z.string().url().default('http://localhost:4000'),
    RESEND_API_KEY: optionalSecret,
    MAIL_FROM: z.string().min(1).default('Celestia <noreply@example.com>'),
    DISCORD_CLIENT_ID: optionalSecret,
    DISCORD_CLIENT_SECRET: optionalSecret,
    GOOGLE_CLIENT_ID: optionalSecret,
    GOOGLE_CLIENT_SECRET: optionalSecret,
    OPENROUTER_API_KEY: optionalSecret,
  })
  .superRefine((settings, ctx) => {
    for (const field of ['WEB_ORIGIN', 'API_ORIGIN'] as const) {
      try {
        normalizeOrigin(settings[field]);
        if (settings.NODE_ENV === 'production' && !settings[field].startsWith('https://'))
          throw new Error();
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: 'Configure an HTTP(S) origin without a path; production requires HTTPS.',
        });
      }
    }
  });

export const env = envSchema.parse(process.env);
