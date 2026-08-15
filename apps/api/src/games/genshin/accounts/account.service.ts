import type { GenshinAccount } from '@prisma/client';

import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';

import { GenshinAccountRepository } from './account.repository.js';

export interface CreateAccountInput {
  userId: string;
  uid?: string;
  nickname?: string;
  adventureRank?: number;
  worldLevel?: number;
}

export interface UpdateAccountInput {
  uid?: string;
  nickname?: string;
  adventureRank?: number;
  worldLevel?: number;
}

export class GenshinAccountService {
  private accountRepository: GenshinAccountRepository;

  constructor() {
    this.accountRepository = new GenshinAccountRepository();
  }

  /**
   * Creates a Genshin account for a user.
   * Throws ConflictError if the user already has an account.
   * (Phase 2 enforces one Genshin account per user.)
   */
  async createAccount(input: CreateAccountInput): Promise<GenshinAccount> {
    const existing = await this.accountRepository.findByUserId(input.userId);
    if (existing) {
      throw new ConflictError('A Genshin account already exists for this user.');
    }

    return this.accountRepository.create({
      user: { connect: { id: input.userId } },
      uid: input.uid,
      nickname: input.nickname,
      adventureRank: input.adventureRank,
      worldLevel: input.worldLevel,
    });
  }

  /**
   * Returns a user's Genshin account.
   * Throws NotFoundError if the user has not linked a Genshin account yet.
   */
  async getAccountByUserId(userId: string): Promise<GenshinAccount> {
    const account = await this.accountRepository.findByUserId(userId);
    if (!account) {
      throw new NotFoundError('Genshin account not found.');
    }
    return account;
  }

  /**
   * Updates optional account metadata (UID, nickname, AR, WL).
   * Throws NotFoundError if the account does not exist.
   */
  async updateAccount(userId: string, input: UpdateAccountInput): Promise<GenshinAccount> {
    const account = await this.accountRepository.findByUserId(userId);
    if (!account) {
      throw new NotFoundError('Genshin account not found.');
    }
    return this.accountRepository.update(account.id, input);
  }
}
