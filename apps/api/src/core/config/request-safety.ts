import { z } from 'zod';

const positive = (max: number) => z.number().int().positive().max(max);
const rateSchema = z.object({
  burst: positive(1000),
  refillMs: positive(86_400_000),
  capacity: positive(100_000),
});
const concurrencySchema = z.object({ global: positive(100), perIdentity: positive(100) });
export const requestSafetySchema = z.object({
  ordinaryBytes: positive(1_048_576),
  authBytes: positive(65_536),
  importBytes: positive(16_777_216),
  login: rateSchema,
  register: rateSchema,
  import: rateSchema,
  authConcurrency: concurrencySchema,
  importConcurrency: concurrencySchema,
});
export type RequestSafetyPolicy = z.infer<typeof requestSafetySchema>;

// Application support defaults, not provider protection or an operator-approved policy.
// No environment overrides: changes require a reviewed deployment of this policy.
export const requestSafetyPolicy: Readonly<RequestSafetyPolicy> = {
  ordinaryBytes: 65_536,
  authBytes: 8_192,
  importBytes: 4_194_304,
  login: { burst: 10, refillMs: 6_000, capacity: 2_048 },
  register: { burst: 3, refillMs: 300_000, capacity: 2_048 },
  import: { burst: 6, refillMs: 10_000, capacity: 1_024 },
  authConcurrency: { global: 4, perIdentity: 2 },
  importConcurrency: { global: 2, perIdentity: 1 },
};
