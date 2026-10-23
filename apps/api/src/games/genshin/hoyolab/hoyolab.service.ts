import type { HoyolabNotes, HoyolabRole, HoyolabStatus } from '@celestia/api-contracts';
import { z } from 'zod';

import { AppError } from '@/core/errors/app-error.js';

import { HoyolabProvider } from './hoyolab.provider.js';
import { HoyolabRepository } from './hoyolab.repository.js';
import { type HoyolabCookies, hoyolabServerSchema } from './hoyolab.schema.js';
import { HoyolabVault } from './hoyolab.vault.js';
const rolesSchema = z.array(
  z.object({
    uid: z.string().regex(/^\d{9,10}$/),
    server: hoyolabServerSchema,
    nickname: z.string(),
    level: z.number(),
  }),
);
const states = [
  'disconnected',
  'choose_account',
  'ready',
  'syncing',
  'reconnect',
  'verification',
  'unavailable',
] as const;
export class HoyolabService {
  constructor(
    private readonly repository = new HoyolabRepository(),
    private readonly provider: Pick<
      HoyolabProvider,
      'accounts' | 'snapshot'
    > = new HoyolabProvider(),
    private readonly vault: Pick<HoyolabVault, 'available' | 'open' | 'seal'> = new HoyolabVault(),
    private readonly clock = () => new Date(),
  ) {}
  get available() {
    return this.vault.available;
  }
  async status(userId: string): Promise<HoyolabStatus> {
    const empty: HoyolabStatus = {
      contractVersion: 1,
      available: this.available,
      connected: false,
      role: null,
      roles: [],
      syncedAt: null,
      nextSyncAt: null,
      state: this.available ? 'disconnected' : 'not_configured',
      notes: null,
      notesState: 'unavailable',
    };
    const row = await this.repository.read(userId);
    if (!row) return empty;
    const roles = rolesSchema.parse(row.roles);
    const role =
      roles.find((r) => r.uid === row.selectedUid && r.server === row.selectedServer) ?? null;
    return {
      ...empty,
      connected: !!row.encryptedSession,
      role,
      roles: row.encryptedSession ? roles : [],
      syncedAt: row.syncedAt?.toISOString() ?? null,
      nextSyncAt: row.nextSyncAt?.toISOString() ?? null,
      state: !this.available
        ? 'not_configured'
        : states.includes(row.state as (typeof states)[number])
          ? (row.state as (typeof states)[number])
          : 'unavailable',
      notes: row.notes as unknown as HoyolabNotes | null,
      notesState: row.notes ? 'ready' : 'unavailable',
    };
  }
  private configured() {
    if (!this.available)
      throw new AppError(
        'Account connection is being prepared. Your saved builds are still available.',
        503,
        'HOYOLAB_CONFIGURATION',
      );
  }
  async connect(userId: string, cookies: HoyolabCookies) {
    this.configured();
    const prior = await this.repository.read(userId);
    const encrypted = this.vault.seal(userId, cookies);
    const roles = await this.provider.accounts(cookies);
    await this.repository.connect(
      userId,
      encrypted,
      roles,
      this.clock(),
      prior?.generation ?? null,
    );
    return this.status(userId);
  }
  async select(userId: string, selected: Pick<HoyolabRole, 'uid' | 'server'>) {
    this.configured();
    const row = await this.repository.read(userId);
    if (!row?.encryptedSession)
      throw new AppError('Connect HoYoLAB first.', 409, 'HOYOLAB_RECONNECT');
    const roles = await this.provider.accounts(this.vault.open(userId, row.encryptedSession));
    const role = roles.find((r) => r.uid === selected.uid && r.server === selected.server);
    if (!role)
      throw new AppError(
        'Choose an account owned by the linked HoYoLAB session.',
        403,
        'HOYOLAB_ACCOUNT_MISMATCH',
      );
    await this.repository.select(userId, role, row.generation, this.clock());
    return this.status(userId);
  }
  async disconnect(userId: string) {
    await this.repository.disconnect(userId);
    return this.status(userId);
  }
  async sync(userId: string, automatic = false) {
    this.configured();
    const row = await this.repository.read(userId);
    if (!row?.encryptedSession || !row.selectedUid || !row.selectedServer)
      throw new AppError('Choose your linked Genshin account first.', 409, 'HOYOLAB_RECONNECT');
    const role = rolesSchema
      .parse(row.roles)
      .find((r) => r.uid === row.selectedUid && r.server === row.selectedServer);
    if (!role)
      throw new AppError('Reconnect HoYoLAB to choose this account.', 409, 'HOYOLAB_RECONNECT');
    const now = this.clock();
    if (row.lastAttemptAt && now.getTime() - row.lastAttemptAt.getTime() < 60_000) {
      if (automatic) return this.status(userId);
      throw new AppError('Please wait a minute before refreshing again.', 429, 'HOYOLAB_COOLDOWN');
    }
    const lease = await this.repository.claim(userId, row.generation, now, automatic);
    if (!lease) {
      if (automatic) return this.status(userId);
      throw new AppError('A refresh is already running. Please wait.', 409, 'HOYOLAB_BUSY');
    }
    try {
      const snapshot = await this.provider.snapshot(
        this.vault.open(userId, row.encryptedSession),
        role,
      );
      await this.repository.apply(userId, row.generation, lease, snapshot, this.clock());
    } catch (error) {
      const code = error instanceof AppError ? error.errorCode : 'HOYOLAB_UNAVAILABLE';
      await this.repository.failure(userId, row.generation, lease, code, this.clock());
      if (error instanceof AppError) throw error;
      throw new AppError(
        'HoYoLAB could not refresh. Your saved builds were kept.',
        502,
        'HOYOLAB_UNAVAILABLE',
      );
    }
    return this.status(userId);
  }
}
