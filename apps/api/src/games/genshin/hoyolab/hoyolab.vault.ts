import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { AppError } from '@/core/errors/app-error.js';

import { type HoyolabCookies, hoyolabCookiesSchema } from './hoyolab.schema.js';
export function sessionKey(raw = process.env.HOYOLAB_SESSION_KEY): Buffer | null {
  if (!raw) return null;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32 || key.toString('base64') !== raw)
    throw new AppError('Account connection is not configured.', 503, 'HOYOLAB_CONFIGURATION');
  return key;
}
export class HoyolabVault {
  constructor(private readonly key = sessionKey()) {}
  get available() {
    return this.key !== null;
  }
  seal(userId: string, cookies: HoyolabCookies): string {
    if (!this.key)
      throw new AppError('Account connection is not configured.', 503, 'HOYOLAB_CONFIGURATION');
    const iv = randomBytes(12),
      cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(Buffer.from('celestia:hoyolab:v1:' + userId));
    const bytes = Buffer.concat([
      cipher.update(JSON.stringify(hoyolabCookiesSchema.parse(cookies)), 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      bytes.toString('base64url'),
    ].join('.');
  }
  open(userId: string, sealed: string): HoyolabCookies {
    try {
      if (!this.key) throw Error();
      const parts = sealed.split('.');
      if (parts.length !== 4 || parts[0] !== 'v1') throw Error();
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key,
        Buffer.from(parts[1]!, 'base64url'),
      );
      decipher.setAAD(Buffer.from('celestia:hoyolab:v1:' + userId));
      decipher.setAuthTag(Buffer.from(parts[2]!, 'base64url'));
      return hoyolabCookiesSchema.parse(
        JSON.parse(
          Buffer.concat([
            decipher.update(Buffer.from(parts[3]!, 'base64url')),
            decipher.final(),
          ]).toString('utf8'),
        ),
      );
    } catch {
      throw new AppError('Reconnect HoYoLAB to continue refreshing.', 409, 'HOYOLAB_RECONNECT');
    }
  }
}
