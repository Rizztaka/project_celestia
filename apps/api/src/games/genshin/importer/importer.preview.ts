import { createHash, createHmac } from 'node:crypto';

import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '@/core/config/env.js';
import { ConflictError } from '@/core/errors/app-error.js';

const audience = 'celestia:genshin-import-preview:v1';
const claimsSchema = z.object({
  sub: z.string(),
  requestHash: z.string().length(64),
  stateHash: z.string().length(64),
});

// Also canonicalizes JSON fields returned in PostgreSQL's key order.
export function fingerprint(value: unknown): string {
  const canonical = JSON.stringify(value, (_key, item: unknown) => {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      return Object.fromEntries(
        Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      );
    }
    return item;
  });
  return createHash('sha256').update(canonical).digest('hex');
}
function previewKey(): Buffer {
  // Domain separation: a preview token can never authenticate as an access token.
  return createHmac('sha256', env.JWT_SECRET).update(audience).digest();
}
export function issuePreview(userId: string, requestHash: string, stateHash: string) {
  const expires = Math.floor(Date.now() / 1000) + 600;
  return {
    previewToken: jwt.sign({ requestHash, stateHash, exp: expires }, previewKey(), {
      algorithm: 'HS256',
      audience,
      issuer: audience,
      subject: userId,
    }),
    expiresAt: new Date(expires * 1000).toISOString(),
  };
}
export function verifyPreview(token: string, userId: string, requestHash: string): string {
  try {
    const claims = claimsSchema.parse(
      jwt.verify(token, previewKey(), {
        algorithms: ['HS256'],
        audience,
        issuer: audience,
      }),
    );
    if (claims.sub === userId && claims.requestHash === requestHash) return claims.stateHash;
  } catch {
    // Expired, altered and malformed tokens use the same recoverable response.
  }
  throw new ConflictError('This import preview is expired or changed. Preview your import again.');
}
