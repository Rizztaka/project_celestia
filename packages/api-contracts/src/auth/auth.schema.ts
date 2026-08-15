import { z } from 'zod';

/**
 * Schema for the POST /auth/register endpoint.
 *
 * Intentionally separate from `createUserSchema` in the users domain.
 * They happen to share the same shape today, but auth registration
 * may evolve independently (e.g., adding a `confirmPassword` field,
 * or additional profile fields) without affecting the users domain.
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must not exceed 30 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

/**
 * Schema for the POST /auth/login endpoint.
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
