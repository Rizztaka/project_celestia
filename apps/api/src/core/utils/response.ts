/**
 * Standardized API response factories.
 *
 * All API responses must use one of these two shapes, as defined in
 * DEVELOPMENT_GUIDE.md. Using these helpers ensures consistency and
 * means the response format can be updated in one place if it ever changes.
 *
 * Success shape:  { success: true,  data: T,   message: string }
 * Error shape:    { success: false, error: { code: string, message: string } }
 */

export const successResponse = <T>(data: T, message: string) => ({
  success: true as const,
  data,
  message,
});

export const errorResponse = (code: string, message: string) => ({
  success: false as const,
  error: { code, message },
});
