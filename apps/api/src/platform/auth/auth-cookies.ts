import type { Request, Response } from 'express';

import { corsAllowedOrigins, normalizeOrigin } from '@/core/config/cors.js';
import { env } from '@/core/config/env.js';
import { ForbiddenError } from '@/core/errors/app-error.js';

import { REFRESH_SECONDS } from './session.service.js';

export const REFRESH_COOKIE = 'celestia_refresh';
export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
};
export function readCookie(req: Request, name: string): string | undefined {
  const matches = (req.headers.cookie ?? '')
    .split(';')
    .map((value) => value.trim())
    .filter((value) => value.startsWith(name + '='));
  if (matches.length !== 1) return undefined;
  try {
    return decodeURIComponent(matches[0]!.slice(name.length + 1));
  } catch {
    return undefined;
  }
}
export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions, maxAge: REFRESH_SECONDS * 1000 });
}
export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
}
/** Cookie-authenticated writes require the configured frontend origin. Native clients use the body token. */
export function checkCookieOrigin(req: Request) {
  let allowed = false;
  try {
    allowed =
      !!req.headers.origin &&
      corsAllowedOrigins(env.NODE_ENV, process.env.CORS_ALLOWED_ORIGINS).has(
        normalizeOrigin(req.headers.origin),
      );
  } catch {
    /* Deny malformed or missing origins. */
  }
  if (!allowed) throw new ForbiddenError('Open Celestia to manage this session.');
}
