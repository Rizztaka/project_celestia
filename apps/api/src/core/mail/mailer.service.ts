import { env } from '@/core/config/env.js';
import { logger } from '@/core/logger/logger.js';

export interface AccountMailer {
  sendPasswordResetEmail(email: string, resetUrl: string): Promise<void>;
  sendVerificationEmail(email: string, verificationUrl: string): Promise<void>;
}
export class MailerService implements AccountMailer {
  private async send(email: string, url: string, subject: string) {
    if (!env.RESEND_API_KEY) {
      if (env.NODE_ENV !== 'production') {
        logger.info({ url }, subject + ' (development mail delivery)');
        return;
      }
      throw new Error('Account email delivery is not configured.');
    }
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(4000),
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [email],
        subject,
        text: `${subject}\n\nOpen this link in Celestia:\n${url}\n\nIf you did not request this email, you can ignore it.`,
      }),
    });
    if (!response.ok) throw new Error('Account email could not be delivered.');
  }
  sendPasswordResetEmail(email: string, resetUrl: string) {
    return this.send(email, resetUrl, 'Reset your Celestia password');
  }
  sendVerificationEmail(email: string, verificationUrl: string) {
    return this.send(email, verificationUrl, 'Verify your Celestia email');
  }
}
