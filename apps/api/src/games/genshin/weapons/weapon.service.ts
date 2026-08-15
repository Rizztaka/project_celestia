import type { GenshinWeapon } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import { GenshinWeaponRepository } from './weapon.repository.js';

export interface AddWeaponInput {
  weaponKey: string; // e.g. "StaffOfHoma", "EngulfingLightning"
  level: number; // 1–90
  ascension: number; // 0–6
  refinement: number; // 1–5
  locked?: boolean;
}

export interface UpdateWeaponInput {
  level?: number;
  ascension?: number;
  refinement?: number;
  locked?: boolean;
}

export class GenshinWeaponService {
  private weaponRepository: GenshinWeaponRepository;

  constructor() {
    this.weaponRepository = new GenshinWeaponRepository();
  }

  /**
   * Adds a weapon to the account's inventory.
   * Note: duplicate weaponKeys are allowed — a player can own multiple
   * copies of the same weapon (e.g., two R1 copies of a 4-star).
   */
  async addWeapon(accountId: string, input: AddWeaponInput): Promise<GenshinWeapon> {
    return this.weaponRepository.create({
      account: { connect: { id: accountId } },
      weaponKey: input.weaponKey,
      level: input.level,
      ascension: input.ascension,
      refinement: input.refinement,
      locked: input.locked ?? false,
    });
  }

  /**
   * Returns all weapons in the account's inventory.
   */
  async getWeapons(accountId: string): Promise<GenshinWeapon[]> {
    return this.weaponRepository.findByAccountId(accountId);
  }

  /**
   * Public read API for the HTTP layer (Milestone 2E).
   *
   * Accepts a userId (from the JWT) rather than an accountId, handling the
   * user→account resolution internally.
   *
   * Returns an empty array — never throws — when the user has no Genshin
   * account yet. An empty inventory is a valid state.
   */
  async getWeaponsForUser(userId: string): Promise<GenshinWeapon[]> {
    const account = await prisma.genshinAccount.findUnique({
      where: { userId },
    });
    if (!account) return [];
    return this.weaponRepository.findByAccountId(account.id);
  }

  /**
   * Returns a single weapon by ID, scoped to the account.
   * NotFoundError is returned whether the weapon doesn't exist or belongs to
   * another account (anti-enumeration).
   */
  async getWeaponById(accountId: string, weaponId: string): Promise<GenshinWeapon> {
    const weapon = await this.weaponRepository.findById(weaponId);
    if (!weapon || weapon.accountId !== accountId) {
      throw new NotFoundError('Weapon not found.');
    }
    return weapon;
  }

  /**
   * Updates a weapon's progression values.
   * Throws NotFoundError if not found or if it belongs to another account.
   */
  async updateWeapon(
    accountId: string,
    weaponId: string,
    input: UpdateWeaponInput,
  ): Promise<GenshinWeapon> {
    await this.getWeaponById(accountId, weaponId);
    return this.weaponRepository.update(weaponId, input);
  }

  /**
   * Removes a weapon from inventory.
   * Throws NotFoundError if not found or if it belongs to another account.
   */
  async removeWeapon(accountId: string, weaponId: string): Promise<GenshinWeapon> {
    await this.getWeaponById(accountId, weaponId);
    return this.weaponRepository.delete(weaponId);
  }
}
