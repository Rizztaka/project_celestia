import { GenshinCharacterRepository } from './character.repository.js';
import type { CharacterWithWeapon } from './character.repository.js';
import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';
import { prisma } from '@/core/db/prisma.js';
import type { GenshinCharacter } from '@prisma/client';

export interface AddCharacterInput {
  characterKey: string; // e.g. "hutao", "raiden_shogun"
  level: number; // 1–90
  ascension: number; // 0–6
  constellation: number; // 0–6
  talentNormal: number; // 1–10 (base, before C3/C5)
  talentSkill: number; // 1–10
  talentBurst: number; // 1–10
}

export interface UpdateCharacterInput {
  level?: number;
  ascension?: number;
  constellation?: number;
  talentNormal?: number;
  talentSkill?: number;
  talentBurst?: number;
}

export class GenshinCharacterService {
  private characterRepository: GenshinCharacterRepository;

  constructor() {
    this.characterRepository = new GenshinCharacterRepository();
  }

  /**
   * Adds a character to the account's roster.
   * Throws ConflictError if the account already has that characterKey.
   */
  async addCharacter(accountId: string, input: AddCharacterInput): Promise<GenshinCharacter> {
    const existing = await this.characterRepository.findByKey(accountId, input.characterKey);
    if (existing) {
      throw new ConflictError(`Character "${input.characterKey}" already exists in this roster.`);
    }

    return this.characterRepository.create({
      account: { connect: { id: accountId } },
      characterKey: input.characterKey,
      level: input.level,
      ascension: input.ascension,
      constellation: input.constellation,
      talentNormal: input.talentNormal,
      talentSkill: input.talentSkill,
      talentBurst: input.talentBurst,
    });
  }

  /**
   * Returns all characters in the account's roster.
   */
  async getCharacters(accountId: string): Promise<GenshinCharacter[]> {
    return this.characterRepository.findByAccountId(accountId);
  }

  /**
   * Public read API for the HTTP layer (Milestone 2D).
   *
   * Accepts a userId (from the JWT) rather than an accountId, handling the
   * user→account resolution internally.
   *
   * Returns an empty array — never throws — when the user has no Genshin
   * account yet. An empty roster is a valid state (user registered but
   * has not imported). A 404 at this level would be incorrect.
   */
  async getCharactersForUser(userId: string): Promise<CharacterWithWeapon[]> {
    const account = await prisma.genshinAccount.findUnique({
      where: { userId },
    });
    if (!account) return [];
    return this.characterRepository.findByAccountIdWithWeapon(account.id);
  }

  /**
   * Returns a single character by ID, scoped to the account.
   * Returns NotFoundError if the ID does not exist OR belongs to a different account.
   * (Anti-enumeration: we never reveal whether another account's data exists.)
   */
  async getCharacterById(accountId: string, characterId: string): Promise<GenshinCharacter> {
    const character = await this.characterRepository.findById(characterId);
    if (!character || character.accountId !== accountId) {
      throw new NotFoundError('Character not found.');
    }
    return character;
  }

  /**
   * Updates a character's progression values.
   * Throws NotFoundError if not found or if the character belongs to another account.
   */
  async updateCharacter(
    accountId: string,
    characterId: string,
    input: UpdateCharacterInput,
  ): Promise<GenshinCharacter> {
    // Verify ownership before mutating
    await this.getCharacterById(accountId, characterId);
    return this.characterRepository.update(characterId, input);
  }

  /**
   * Removes a character from the roster.
   * Throws NotFoundError if not found or if the character belongs to another account.
   */
  async removeCharacter(accountId: string, characterId: string): Promise<GenshinCharacter> {
    // Verify ownership before deleting
    await this.getCharacterById(accountId, characterId);
    return this.characterRepository.delete(characterId);
  }
}
