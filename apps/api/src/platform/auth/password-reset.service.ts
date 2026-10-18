import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

import bcrypt from 'bcryptjs';

import { env } from '@/core/config/env.js';
import { UnauthorizedError } from '@/core/errors/app-error.js';
import { logger } from '@/core/logger/logger.js';
import { type AccountMailer, MailerService } from '@/core/mail/mailer.service.js';

import { PasswordResetRepository } from './password-reset.repository.js';
import { hashToken } from './session.service.js';

export const RESET_MESSAGE = 'If an account exists, a reset email has been sent.';
export class PasswordResetService {
  constructor(
    private readonly repository = new PasswordResetRepository(),
    private readonly mailer: AccountMailer = new MailerService(),
    private readonly clock = () => new Date(),
    private readonly wait: (ms: number) => Promise<unknown> = sleep,
  ) {}
  async forgot(email: string) {
    const started = performance.now();
    // Both paths generate the same entropy; mail requests have a bounded timeout.
    const token = randomBytes(32).toString('hex');
    try {
      const user = await this.repository.findByEmail(email);
      if (user) {
        const now = this.clock();
        await this.repository.issue(
          user.id,
          hashToken(token),
          new Date(now.getTime() + 15 * 60000),
          now,
          'reset',
        );
        await this.mailer.sendPasswordResetEmail(
          user.email,
          `${env.WEB_ORIGIN ?? 'http://localhost:5173'}/reset-password?token=${token}`,
        );
      }
    } catch {
      logger.error('Password recovery request could not be delivered.');
    }
    // Fixed response floor exceeds the 4-second mail timeout. Never expose lookup/delivery results.
    await this.wait(Math.max(0, 4500 - (performance.now() - started)));
    return RESET_MESSAGE;
  }
  async reset(token: string, newPassword: string) {
    const password = await bcrypt.hash(newPassword, 12);
    if (!(await this.repository.consume(hashToken(token), this.clock(), 'reset', password)))
      throw new UnauthorizedError('This reset link is invalid or expired. Request a new link.');
  }
  async sendVerification(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user || user.emailVerifiedAt) return;
    const token = randomBytes(32).toString('hex');
    const now = this.clock();
    await this.repository.issue(
      user.id,
      hashToken(token),
      new Date(now.getTime() + 24 * 60 * 60000),
      now,
      'verification',
    );
    try {
      await this.mailer.sendVerificationEmail(
        user.email,
        `${env.WEB_ORIGIN ?? 'http://localhost:5173'}/verify-email?token=${token}`,
      );
    } catch {
      logger.error('Verification email could not be delivered.');
    }
  }
  async verify(token: string) {
    if (!(await this.repository.consume(hashToken(token), this.clock(), 'verification')))
      throw new UnauthorizedError(
        'This verification link is invalid or expired. Request a new link.',
      );
  }
}
