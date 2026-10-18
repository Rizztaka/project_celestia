import { createHash, randomBytes } from 'node:crypto';

import type { SessionInfo } from '@celestia/api-contracts';
import jwt from 'jsonwebtoken';

import { env } from '@/core/config/env.js';
import { UnauthorizedError } from '@/core/errors/app-error.js';

import { SessionRepository } from './session.repository.js';

export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');
export const REFRESH_SECONDS = 30 * 24 * 60 * 60;
export interface DeviceInfo {
  userAgent?: string;
  ipAddress?: string;
}

export class SessionService {
  constructor(
    private readonly repository = new SessionRepository(),
    private readonly clock = () => new Date(),
  ) {}
  private tokens(session: { id: string; userId: string }, refreshToken: string) {
    const token = jwt.sign({ sid: session.id, kind: 'access' }, env.JWT_SECRET, {
      subject: session.userId,
      algorithm: 'HS256',
      expiresIn: '15m',
    });
    return { token, refreshToken, expiresIn: 900 };
  }
  async create(userId: string, device: DeviceInfo = {}, credential?: string) {
    const refreshToken = randomBytes(40).toString('hex');
    const session = await this.repository.create(
      {
        userId,
        tokenHash: hashToken(refreshToken),
        userAgent: device.userAgent?.slice(0, 500) ?? null,
        ipAddress: device.ipAddress?.slice(0, 64) ?? null,
        expiresAt: new Date(this.clock().getTime() + REFRESH_SECONDS * 1000),
      },
      credential,
    );
    if (!session) throw new UnauthorizedError('Account credentials changed. Sign in again.');
    return this.tokens(session, refreshToken);
  }
  async refresh(value: string) {
    if (!/^[a-f0-9]{80}$/.test(value))
      throw new UnauthorizedError('Session expired. Sign in again.');
    const refreshToken = randomBytes(40).toString('hex');
    const now = this.clock();
    const session = await this.repository.rotate(
      hashToken(value),
      hashToken(refreshToken),
      now,
      new Date(now.getTime() + REFRESH_SECONDS * 1000),
    );
    if (!session) throw new UnauthorizedError('Session expired. Sign in again.');
    return this.tokens(session, refreshToken);
  }
  revoke(userId: string, options: { only?: string; except?: string } = {}) {
    return this.repository.revoke(userId, this.clock(), options);
  }
  async list(userId: string, current: string): Promise<SessionInfo[]> {
    return (await this.repository.list(userId, this.clock())).map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString(),
      lastRefreshedAt: session.updatedAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: session.id === current,
    }));
  }
}
