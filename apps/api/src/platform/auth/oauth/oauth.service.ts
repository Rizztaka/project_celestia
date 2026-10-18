import { randomBytes, timingSafeEqual } from 'node:crypto';

import type { OAuthProvider } from '@celestia/api-contracts';
import { Discord, generateCodeVerifier, generateState, Google, OAuth2Tokens } from 'arctic';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '@/core/config/env.js';
import { AppError, UnauthorizedError } from '@/core/errors/app-error.js';

import { OAuthRepository } from './oauth.repository.js';

const stateSchema = z.object({
  provider: z.enum(['discord', 'google']),
  purpose: z.literal('oauth'),
  state: z.string().min(16),
  verifier: z.string().min(32),
  link: z.object({ userId: z.string().min(1), sessionId: z.string().min(1) }).optional(),
});
export class OAuthService {
  constructor(private readonly repository = new OAuthRepository()) {}
  providers() {
    return {
      discord: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
      google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    };
  }
  private client(provider: OAuthProvider) {
    if (!this.providers()[provider])
      throw new AppError('This sign-in provider is not configured yet.', 503, 'OAUTH_UNAVAILABLE');
    const redirect = `${env.API_ORIGIN ?? 'http://localhost:4000'}/api/v1/auth/oauth/${provider}/callback`;
    return provider === 'discord'
      ? new Discord(env.DISCORD_CLIENT_ID!, env.DISCORD_CLIENT_SECRET!, redirect)
      : new Google(env.GOOGLE_CLIENT_ID!, env.GOOGLE_CLIENT_SECRET!, redirect);
  }
  start(provider: OAuthProvider, link?: { userId: string; sessionId: string }) {
    const state = generateState(),
      verifier = generateCodeVerifier();
    const url = this.client(provider).createAuthorizationURL(
      state,
      verifier,
      provider === 'discord' ? ['identify', 'email'] : ['openid', 'profile', 'email'],
    );
    const cookie = jwt.sign(
      { purpose: 'oauth', provider, state, verifier, ...(link ? { link } : {}) },
      env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '10m' },
    );
    return { url: url.toString(), cookie };
  }
  async finish(provider: OAuthProvider, code: string, state: string, cookie: string) {
    let saved: z.infer<typeof stateSchema>;
    try {
      saved = stateSchema.parse(jwt.verify(cookie, env.JWT_SECRET, { algorithms: ['HS256'] }));
      const left = Buffer.from(saved.state),
        right = Buffer.from(state);
      if (
        saved.provider !== provider ||
        left.length !== right.length ||
        !timingSafeEqual(left, right)
      )
        throw new Error();
    } catch {
      throw new UnauthorizedError('The sign-in request expired. Please start again.');
    }
    this.client(provider); // Validate configuration before contacting the fixed provider endpoint.
    // Arctic 3.x's exchange method has no AbortSignal parameter. Keep its URL/PKCE
    // helpers and token parser, with a bounded standard OAuth code exchange here.
    const exchange = await fetch(
      provider === 'discord'
        ? 'https://discord.com/api/oauth2/token'
        : 'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          code_verifier: saved.verifier,
          client_id: provider === 'discord' ? env.DISCORD_CLIENT_ID! : env.GOOGLE_CLIENT_ID!,
          client_secret:
            provider === 'discord' ? env.DISCORD_CLIENT_SECRET! : env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${env.API_ORIGIN ?? 'http://localhost:4000'}/api/v1/auth/oauth/${provider}/callback`,
        }),
      },
    );
    if (!exchange.ok) throw new UnauthorizedError('The sign-in code could not be confirmed.');
    const tokenData = z
      .object({
        access_token: z.string().min(1),
        token_type: z.string().refine((value) => value.toLowerCase() === 'bearer'),
      })
      .passthrough()
      .parse(await exchange.json());
    const tokens = new OAuth2Tokens(tokenData);
    const response = await fetch(
      provider === 'discord'
        ? 'https://discord.com/api/users/@me'
        : 'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new UnauthorizedError('The provider could not confirm your account.');
    const raw: unknown = await response.json();
    const identity =
      provider === 'discord'
        ? (() => {
            const data = z
              .object({
                id: z.string().min(1).max(128),
                email: z.string().email().max(254),
                username: z.string(),
                verified: z.boolean(),
              })
              .parse(raw);
            return {
              id: data.id,
              email: data.email.toLowerCase(),
              username: data.username,
              verified: data.verified,
            };
          })()
        : (() => {
            const data = z
              .object({
                sub: z.string().min(1).max(128),
                email: z.string().email().max(254),
                name: z.string().optional(),
                email_verified: z.boolean(),
              })
              .parse(raw);
            return {
              id: data.sub,
              email: data.email.toLowerCase(),
              username: data.name ?? 'traveler',
              verified: data.email_verified,
            };
          })();
    const password = await bcrypt.hash(randomBytes(40).toString('hex'), 12);
    return this.repository.resolve(provider, identity, password, saved.link);
  }
}
