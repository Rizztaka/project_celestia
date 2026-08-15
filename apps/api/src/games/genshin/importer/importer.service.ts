import { prisma } from '@/core/db/prisma.js';
import { BadRequestError } from '@/core/errors/app-error.js';
import { GoodPayloadSchema, type GoodPayload } from './importer.schema.js';
import { ZodError } from 'zod';
import type { Prisma } from '@prisma/client';

export interface ImportResult {
  charactersImported: number;
  weaponsImported: number;
  artifactsImported: number;
  materialsImported: number;
}

export class GenshinImportService {
  /**
   * Parses a GOOD-format JSON string and imports the account data.
   *
   * Characters are upserted (existing records updated, missing ones untouched).
   * Weapons and artifacts are fully replaced on every import.
   * All DB operations run inside a single interactive Prisma transaction.
   *
   * Throws BadRequestError if the JSON is invalid or fails schema validation.
   */
  async importAccount(userId: string, rawJson: string): Promise<ImportResult> {
    // -------------------------------------------------------
    // Step 1 — Validate the GOOD payload
    // -------------------------------------------------------
    const payload = this.parseAndValidate(rawJson);

    // -------------------------------------------------------
    // Step 2 — Find or create the user's GenshinAccount
    // -------------------------------------------------------
    let account = await prisma.genshinAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await prisma.genshinAccount.create({
        data: { user: { connect: { id: userId } } },
      });
    }

    const { id: accountId } = account;

    // -------------------------------------------------------
    // Step 3 — Execute all DB work inside a single transaction
    //
    // Using the interactive form (async callback) instead of the
    // batch form ([op1, op2, ...]) because we need to chain results
    // across steps (e.g., character IDs from step 3d are needed
    // when resolving equipment in steps 3g and 3h).
    //
    // If any step throws, PostgreSQL rolls back the entire transaction
    // and the database is left in its pre-import state.
    // -------------------------------------------------------
    const result = await prisma.$transaction(async (tx) => {
      // 3a. Clear equippedWeaponId on all existing characters for this account.
      //     Required before deleting weapons: GenshinCharacter.equippedWeaponId
      //     is a FK to GenshinWeapon. Deleting weapons while a character still
      //     references them causes a FK constraint violation.
      await tx.genshinCharacter.updateMany({
        where: { accountId },
        data: { equippedWeaponId: null },
      });

      // 3b. Delete all weapons for this account (Replace strategy).
      await tx.genshinWeapon.deleteMany({ where: { accountId } });

      // 3c. Delete all artifacts for this account (Replace strategy).
      //     FK is on the artifact side, so deleting artifacts is always safe.
      await tx.genshinArtifact.deleteMany({ where: { accountId } });

      // 3d. Upsert characters.
      //     Characters missing from the payload are left untouched — a player
      //     can never lose a character they have pulled; omissions from GOOD
      //     exports are always scanner artifacts, not real data loss.
      const characterMap = new Map<string, string>(); // characterKey → DB id

      for (const char of payload.characters) {
        const upserted = await tx.genshinCharacter.upsert({
          where: {
            accountId_characterKey: {
              accountId,
              characterKey: char.key,
            },
          },
          create: {
            accountId,
            characterKey: char.key,
            level: char.level,
            ascension: char.ascension,
            constellation: char.constellation,
            talentNormal: char.talent.auto,
            talentSkill: char.talent.skill,
            talentBurst: char.talent.burst,
          },
          update: {
            level: char.level,
            ascension: char.ascension,
            constellation: char.constellation,
            talentNormal: char.talent.auto,
            talentSkill: char.talent.skill,
            talentBurst: char.talent.burst,
          },
        });

        characterMap.set(char.key, upserted.id);
      }

      // 3e. Insert all weapons and track their DB IDs alongside GOOD locations.
      const weaponResults: Array<{ id: string; location: string }> = [];

      for (const weapon of payload.weapons) {
        const created = await tx.genshinWeapon.create({
          data: {
            accountId,
            weaponKey: weapon.key,
            level: weapon.level,
            ascension: weapon.ascension,
            refinement: weapon.refinement,
            locked: weapon.lock,
          },
        });
        weaponResults.push({ id: created.id, location: weapon.location });
      }

      // 3f. Insert all artifacts and track their DB IDs alongside GOOD locations.
      const artifactResults: Array<{ id: string; location: string }> = [];

      for (const artifact of payload.artifacts) {
        const created = await tx.genshinArtifact.create({
          data: {
            accountId,
            setKey: artifact.setKey,
            slotKey: artifact.slotKey,
            level: artifact.level,
            rarity: artifact.rarity,
            mainStatKey: artifact.mainStatKey,
            // ArtifactSubStat[] must be cast because our typed interface
            // lacks the index signature Prisma's Json type requires.
            subStats: artifact.substats as unknown as Prisma.InputJsonValue,
            locked: artifact.lock,
          },
        });
        artifactResults.push({ id: created.id, location: artifact.location });
      }

      // 3g. Resolve weapon equipment.
      //     For each weapon with a non-empty location, link it to the character
      //     by updating the character's equippedWeaponId.
      //     If the location references a character not in this GOOD payload,
      //     the weapon is silently left unequipped.
      for (const { id: weaponId, location } of weaponResults) {
        if (!location) continue;
        const characterId = characterMap.get(location);
        if (!characterId) continue;
        await tx.genshinCharacter.update({
          where: { id: characterId },
          data: { equippedWeaponId: weaponId },
        });
      }

      // 3h. Resolve artifact equipment.
      //     Same approach as weapons: link artifact → character via location field.
      for (const { id: artifactId, location } of artifactResults) {
        if (!location) continue;
        const characterId = characterMap.get(location);
        if (!characterId) continue;
        await tx.genshinArtifact.update({
          where: { id: artifactId },
          data: { equippedCharacterId: characterId },
        });
      }

      // 3i. Replace the material inventory.
      //     Materials are fully replaced on every import (delete-all then insert),
      //     matching the strategy used for weapons and artifacts.
      //     Only items with quantity > 0 are stored to keep the table compact.
      await tx.genshinMaterial.deleteMany({ where: { accountId } });

      const materialEntries = Object.entries(payload.materials).filter(([, qty]) => qty > 0);

      for (const [itemKey, quantity] of materialEntries) {
        await tx.genshinMaterial.create({
          data: { accountId, itemKey, quantity },
        });
      }

      return {
        charactersImported: payload.characters.length,
        weaponsImported: payload.weapons.length,
        artifactsImported: payload.artifacts.length,
        materialsImported: materialEntries.length,
      };
    });

    return result;
  }

  /**
   * Parses and validates the raw JSON string against the GOOD schema.
   * Throws BadRequestError with a user-friendly message on failure.
   * Private — callers always go through importAccount().
   */
  private parseAndValidate(rawJson: string): GoodPayload {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new BadRequestError('Invalid GOOD format: the provided string is not valid JSON.');
    }

    try {
      return GoodPayloadSchema.parse(parsed);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const path = firstIssue?.path.join('.') ?? 'unknown field';
        const message = firstIssue?.message ?? 'Validation failed.';
        throw new BadRequestError(`Invalid GOOD format: ${path} — ${message}`);
      }
      throw new BadRequestError('Invalid GOOD format: validation failed.');
    }
  }
}
