import {
  forgotPasswordSchema,
  oauthProviderSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@celestia/api-contracts';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { env } from '@/core/config/env.js';
import { UnauthorizedError } from '@/core/errors/app-error.js';
import { successResponse } from '@/core/utils/response.js';

import {
  checkCookieOrigin,
  clearRefreshCookie,
  cookieOptions,
  readCookie,
  REFRESH_COOKIE,
  setRefreshCookie,
} from './auth-cookies.js';
import { OAuthService } from './oauth/oauth.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { requestDevice } from './request-device.js';
import { SessionService } from './session.service.js';

export class SecurityController {
  private sessions = new SessionService();
  private recovery = new PasswordResetService();
  private oauth = new OAuthService();
  refresh = async (req: Request, res: Response) => {
    const body = refreshTokenSchema.parse(req.body ?? {});
    const cookie = readCookie(req, REFRESH_COOKIE);
    if (cookie) checkCookieOrigin(req);
    const value = cookie ?? body.refreshToken;
    if (!value) throw new UnauthorizedError('Sign in to continue.');
    try {
      const { refreshToken, ...tokens } = await this.sessions.refresh(value);
      setRefreshCookie(res, refreshToken);
      res.json(
        successResponse(
          { ...tokens, ...(req.headers.origin ? {} : { refreshToken }) },
          'Session refreshed.',
        ),
      );
    } catch (error) {
      clearRefreshCookie(res);
      throw error;
    }
  };
  logout = async (req: Request, res: Response) => {
    await this.sessions.revoke(req.user!.id, { only: req.authSessionId! });
    clearRefreshCookie(res);
    res.json(successResponse(null, 'Signed out.'));
  };
  logoutAll = async (req: Request, res: Response) => {
    await this.sessions.revoke(req.user!.id);
    clearRefreshCookie(res);
    res.json(successResponse(null, 'All sessions signed out.'));
  };
  logoutOthers = async (req: Request, res: Response) => {
    await this.sessions.revoke(req.user!.id, { except: req.authSessionId! });
    res.json(successResponse(null, 'Other devices signed out.'));
  };
  list = async (req: Request, res: Response) => {
    res.json(
      successResponse(
        await this.sessions.list(req.user!.id, req.authSessionId!),
        'Active sessions.',
      ),
    );
  };
  forgot = async (req: Request, res: Response) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const message = await this.recovery.forgot(email);
    res.json(successResponse(null, message));
  };
  reset = async (req: Request, res: Response) => {
    const data = resetPasswordSchema.parse(req.body);
    await this.recovery.reset(data.token, data.newPassword);
    clearRefreshCookie(res);
    res.json(successResponse(null, 'Password reset. Sign in with your new password.'));
  };
  verify = async (req: Request, res: Response) => {
    await this.recovery.verify(verifyEmailSchema.parse(req.body).token);
    res.json(successResponse(null, 'Email verified.'));
  };
  resend = async (req: Request, res: Response) => {
    await this.recovery.sendVerification(req.user!.id);
    res.json(successResponse(null, 'If verification is needed, an email has been sent.'));
  };
  providers = (_req: Request, res: Response) => {
    res.json(successResponse(this.oauth.providers(), 'Available sign-in providers.'));
  };
  start = (req: Request, res: Response) => {
    const provider = oauthProviderSchema.parse(req.params.provider);
    const result = this.oauth.start(
      provider,
      req.user ? { userId: req.user.id, sessionId: req.authSessionId! } : undefined,
    );
    res.cookie(`celestia_oauth_${provider}`, result.cookie, { ...cookieOptions, maxAge: 600000 });
    if (req.method === 'POST')
      res.json(successResponse({ url: result.url }, 'Connect your account.'));
    else res.redirect(result.url);
  };
  callback = async (req: Request, res: Response) => {
    const provider = oauthProviderSchema.parse(req.params.provider);
    const cookie = readCookie(req, `celestia_oauth_${provider}`);
    res.clearCookie(`celestia_oauth_${provider}`, cookieOptions);
    const web = env.WEB_ORIGIN ?? 'http://localhost:5173';
    try {
      const query = z
        .object({
          code: z.string().min(1).max(2048),
          state: z.string().min(16).max(256),
          iss: z.string().optional(),
        })
        .parse(req.query);
      if (
        query.iss &&
        query.iss !==
          (provider === 'discord' ? 'https://discord.com' : 'https://accounts.google.com')
      )
        throw new UnauthorizedError();
      if (!cookie) throw new UnauthorizedError();
      const user = await this.oauth.finish(provider, query.code, query.state, cookie);
      const tokens = await this.sessions.create(user.id, requestDevice(req));
      setRefreshCookie(res, tokens.refreshToken);
      res.redirect(`${web}/auth/callback`);
    } catch {
      res.redirect(`${web}/login?oauth=failed`);
    }
  };
}
