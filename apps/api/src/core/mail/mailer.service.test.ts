import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const settings = vi.hoisted(() => ({
  NODE_ENV: 'test',
  RESEND_API_KEY: undefined as string | undefined,
  MAIL_FROM: 'Celestia <synthetic@test.invalid>',
}));
const logs = vi.hoisted(() => ({ info: vi.fn(), error: vi.fn() }));
vi.mock('@/core/config/env.js', () => ({ env: settings }));
vi.mock('@/core/logger/logger.js', () => ({ logger: logs }));
import { MailerService } from './mailer.service.js';

beforeEach(() => {
  settings.NODE_ENV = 'test';
  settings.RESEND_API_KEY = undefined;
  vi.clearAllMocks();
});
afterEach(() => vi.unstubAllGlobals());
describe('pluggable account mail delivery', () => {
  it('logs development/test links without opening a network connection when credentials are missing', async () => {
    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    const mailer = new MailerService();
    await mailer.sendPasswordResetEmail(
      'synthetic@test.invalid',
      'http://localhost/reset?token=synthetic',
    );
    await mailer.sendVerificationEmail(
      'synthetic@test.invalid',
      'http://localhost/verify?token=synthetic',
    );
    expect(logs.info).toHaveBeenCalledTimes(2);
    expect(network).not.toHaveBeenCalled();
  });
  it('never logs production recovery links when delivery is not configured', async () => {
    settings.NODE_ENV = 'production';
    await expect(
      new MailerService().sendPasswordResetEmail(
        'synthetic@test.invalid',
        'https://app.test/reset?token=synthetic',
      ),
    ).rejects.toThrow('not configured');
    expect(logs.info).not.toHaveBeenCalled();
  });
  it('uses the configured provider with a deadline and no link logging', async () => {
    settings.NODE_ENV = 'production';
    settings.RESEND_API_KEY = 'synthetic-test-only';
    const network = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', network);
    await new MailerService().sendPasswordResetEmail(
      'synthetic@test.invalid',
      'https://app.test/reset?token=synthetic',
    );
    expect(network).toHaveBeenCalledOnce();
    const [url, request] = network.mock.calls[0]!;
    expect(url).toBe('https://api.resend.com/emails');
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(request.body).to).toEqual(['synthetic@test.invalid']);
    expect(logs.info).not.toHaveBeenCalled();
  });
});
