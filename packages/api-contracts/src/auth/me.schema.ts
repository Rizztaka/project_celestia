import { z } from 'zod';

/**
 * Schema for the response body of GET /api/v1/auth/me.
 *
 * The password field is intentionally excluded — it is stripped at the
 * service layer before this type is ever populated.
 *
 * This lives in api-contracts so both the Express API and the React
 * frontend can import the same type without duplicating it.
 */
export const meResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
