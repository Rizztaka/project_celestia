import { z } from 'zod';

const password = z
  .string()
  .min(1, 'Enter your current password.')
  .max(128, 'Password is too long.')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password is too long.');
export const exportRequestSchema = z.object({ requestVersion: z.literal(1), password }).strict();
export const deleteRequestSchema = exportRequestSchema
  .extend({
    confirmation: z.literal('DELETE MY CELESTIA ACCOUNT', {
      errorMap: () => ({ message: 'Type DELETE MY CELESTIA ACCOUNT to confirm.' }),
    }),
  })
  .strict();
export const accountDataQuerySchema = z.object({}).strict();
