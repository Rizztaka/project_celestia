import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { prisma } from '@/core/db/prisma.js';
import { BadRequestError } from '@/core/errors/app-error.js';

import { type GoodPayload, GoodPayloadSchema } from './importer.schema.js';

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
    const result = await prisma.$transaction(
      async (tx) => {
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

        // 3e. Bulk insert all weapons with pre-generated UUIDs
        const weaponsToInsert = [];
        const weaponLocations = []; // Map ID -> location

        for (const weapon of payload.weapons) {
          const weaponId = randomUUID();
          weaponsToInsert.push({
            id: weaponId,
            accountId,
            weaponKey: weapon.key,
            level: weapon.level,
            ascension: weapon.ascension,
            refinement: weapon.refinement,
            locked: weapon.lock,
          });
          if (weapon.location) {
            weaponLocations.push({ id: weaponId, location: weapon.location });
          }
        }

        if (weaponsToInsert.length > 0) {
          await tx.genshinWeapon.createMany({ data: weaponsToInsert });
        }

        // 3f. Bulk insert all artifacts with pre-generated UUIDs
        const artifactsToInsert = [];
        const artifactLocations = []; // Map ID -> location

        for (const artifact of payload.artifacts) {
          const artifactId = randomUUID();
          artifactsToInsert.push({
            id: artifactId,
            accountId,
            setKey: artifact.setKey,
            slotKey: artifact.slotKey,
            level: artifact.level,
            rarity: artifact.rarity,
            mainStatKey: artifact.mainStatKey,
            subStats: artifact.substats as unknown as Prisma.InputJsonValue,
            locked: artifact.lock,
          });
          if (artifact.location) {
            artifactLocations.push({ id: artifactId, location: artifact.location });
          }
        }

        if (artifactsToInsert.length > 0) {
          await tx.genshinArtifact.createMany({ data: artifactsToInsert });
        }

        // 3g. Resolve weapon equipment.
        //     We update the character's equippedWeaponId for each location match.
        for (const { id: weaponId, location } of weaponLocations) {
          const characterId = characterMap.get(location);
          if (!characterId) continue;
          await tx.genshinCharacter.update({
            where: { id: characterId },
            data: { equippedWeaponId: weaponId },
          });
        }

        // 3h. Resolve artifact equipment.
        for (const { id: artifactId, location } of artifactLocations) {
          const characterId = characterMap.get(location);
          if (!characterId) continue;
          await tx.genshinArtifact.update({
            where: { id: artifactId },
            data: { equippedCharacterId: characterId },
          });
        }

        // 3i. Replace the material inventory.
        await tx.genshinMaterial.deleteMany({ where: { accountId } });

        const materialEntries = Object.entries(payload.materials).filter(([, qty]) => qty > 0);
        const materialsToInsert = materialEntries.map(([itemKey, quantity]) => ({
          accountId,
          itemKey,
          quantity,
        }));

        if (materialsToInsert.length > 0) {
          await tx.genshinMaterial.createMany({ data: materialsToInsert });
        }

        return {
          charactersImported: payload.characters.length,
          weaponsImported: payload.weapons.length,
          artifactsImported: payload.artifacts.length,
          materialsImported: materialEntries.length,
        };
      },
      {
        maxWait: 10000, // wait up to 10s to acquire a connection
        timeout: 120000, // 2 minutes for the transaction to complete
      },
    );

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
