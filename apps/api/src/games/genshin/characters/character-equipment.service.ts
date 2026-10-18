import {
  artifactSlots,
  type CharacterEquipmentResponse,
  characterKeySchema,
  type EquipmentAssignment,
  type EquipmentSectionReceipt,
  type RecordedArtifact,
} from '@celestia/api-contracts';
import type { GenshinArtifact } from '@prisma/client';
import { z } from 'zod';

import { BadRequestError, NotFoundError } from '@/core/errors/app-error.js';

import { GenshinCharacterEquipmentRepository } from './character-equipment.repository.js';

const subStatsSchema = z.array(z.object({ key: z.string(), value: z.number().finite() })).max(4);
function artifact(row: GenshinArtifact): RecordedArtifact {
  const subStats = subStatsSchema.safeParse(row.subStats);
  return {
    setKey: row.setKey,
    slotKey: row.slotKey,
    level: row.level,
    rarity: row.rarity,
    mainStatKey: row.mainStatKey,
    mainStatValue: null,
    subStats: subStats.success ? subStats.data : null,
    locked: row.locked,
  };
}
function absent<T>(receipt: EquipmentSectionReceipt, consistent: boolean): EquipmentAssignment<T> {
  if (!consistent) return { state: 'unknown', item: null, reason: 'inconsistent_relation' };
  return receipt.status === 'imported'
    ? { state: 'unrecorded', item: null, reason: 'no_recorded_assignment' }
    : { state: 'unknown', item: null, reason: 'provenance_unknown' };
}
export class GenshinCharacterEquipmentService {
  constructor(
    private readonly repository: Pick<
      GenshinCharacterEquipmentRepository,
      'readForUser'
    > = new GenshinCharacterEquipmentRepository(),
  ) {}

  async read(userId: string, rawKey: unknown): Promise<CharacterEquipmentResponse> {
    const parsed = characterKeySchema.safeParse(rawKey);
    if (!parsed.success) throw new BadRequestError('Invalid character key.');
    const row = await this.repository.readForUser(userId, parsed.data);
    if (!row) throw new NotFoundError('Character not found.');
    const receipt = (section: 'characters' | 'weapons' | 'artifacts'): EquipmentSectionReceipt => {
      const stored = row.receipts.find((entry) => entry.section === section);
      return {
        status: stored ? 'imported' : 'unknown',
        importedAt: stored ? new Date(stored.importedAt).toISOString() : null,
        source: stored?.source ?? null,
        entryCount: stored?.entryCount ?? null,
        scope: section === 'characters' ? 'merged_entries' : 'replacement_section',
      };
    };
    const provenance = {
      characters: receipt('characters'),
      weapons: receipt('weapons'),
      artifacts: receipt('artifacts'),
    };
    const character = row.character;
    const weapon = row.weapon;
    const artifacts = Object.fromEntries(
      artifactSlots.map((slot) => {
        const piece = row.artifacts.find((piece) => piece.slotKey === slot);
        return [
          slot,
          piece
            ? { state: 'recorded_assigned', item: artifact(piece) }
            : absent(provenance.artifacts, row.artifactRelationsConsistent),
        ];
      }),
    ) as CharacterEquipmentResponse['artifacts'];
    return {
      contractVersion: 1,
      character: {
        characterKey: character.characterKey,
        level: character.level,
        ascension: character.ascension,
        constellation: character.constellation,
        talents: {
          normal: character.talentNormal,
          skill: character.talentSkill,
          burst: character.talentBurst,
        },
        talentBasis: 'stored_convention_unknown',
      },
      provenance,
      weapon: weapon
        ? {
            state: 'recorded_assigned',
            item: {
              weaponKey: weapon.weaponKey,
              level: weapon.level,
              ascension: weapon.ascension,
              refinement: weapon.refinement,
              locked: weapon.locked,
            },
          }
        : absent(provenance.weapons, row.weaponRelationConsistent),
      artifacts,
      unrecognizedSlots: row.artifacts
        .filter((piece) => !artifactSlots.some((slot) => slot === piece.slotKey))
        .map(artifact),
      artifactRelationsConsistent: row.artifactRelationsConsistent,
    };
  }
}
