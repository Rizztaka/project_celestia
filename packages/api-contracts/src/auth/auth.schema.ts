import { z } from 'zod';

export const newPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Password must not exceed 72 UTF-8 bytes',
  );
const emailSchema = z.string().trim().email('Invalid email address format').max(254).toLowerCase();

/**
 * Schema for the POST /auth/register endpoint.
 *
 * Intentionally separate from `createUserSchema` in the users domain.
 * They happen to share the same shape today, but auth registration
 * may evolve independently (e.g., adding a `confirmPassword` field,
 * or additional profile fields) without affecting the users domain.
 */
export const registerSchema = z.object({
  email: emailSchema,
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must not exceed 30 characters'),
  password: newPasswordSchema,
});

/**
 * Schema for the POST /auth/login endpoint.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();
const opaqueToken = z.string().regex(/^[a-f0-9]{64}$/);
export const resetPasswordSchema = z
  .object({ token: opaqueToken, newPassword: newPasswordSchema })
  .strict();
export const verifyEmailSchema = z.object({ token: opaqueToken }).strict();
export const refreshTokenSchema = z
  .object({
    refreshToken: z
      .string()
      .regex(/^[a-f0-9]{80}$/)
      .optional(),
  })
  .strict();
export const oauthProviderSchema = z.enum(['discord', 'google']);
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastRefreshedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
