import { z } from 'zod';

// Opaque imported/legacy keys remain addressable. Always URL-encode and use SQL parameters.
export const characterKeySchema = z
  .string()
  .min(1)
  .max(200)
  // Control characters are deliberately forbidden in opaque imported keys.
  // eslint-disable-next-line no-control-regex
  .refine((key) => !/[\u0000-\u001f\u007f]/.test(key), 'Invalid character key');
export const artifactSlots = ['flower', 'plume', 'sands', 'goblet', 'circlet'] as const;
export type ArtifactSlot = (typeof artifactSlots)[number];
export interface EquipmentSectionReceipt {
  status: 'unknown' | 'imported';
  importedAt: string | null;
  source: string | null;
  entryCount: number | null;
  scope: 'merged_entries' | 'replacement_section';
}
export interface RecordedWeapon {
  weaponKey: string;
  level: number;
  ascension: number | null;
  refinement: number;
  locked: boolean | null;
}
export interface RecordedArtifact {
  setKey: string;
  slotKey: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  mainStatValue: number | null;
  subStats: { key: string; value: number }[] | null;
  locked: boolean | null;
}
export type EquipmentAssignment<T> =
  | { state: 'recorded_assigned'; item: T }
  | { state: 'unrecorded'; item: null; reason: 'no_recorded_assignment' }
  | { state: 'unknown'; item: null; reason: 'provenance_unknown' | 'inconsistent_relation' };
export interface CharacterEquipmentResponse {
  contractVersion: 1;
  character: {
    characterKey: string;
    level: number;
    ascension: number | null;
    constellation: number;
    talents: { normal: number; skill: number; burst: number };
    talentBasis: 'stored_convention_unknown' | 'hoyolab_displayed';
  };
  provenance: Record<'characters' | 'weapons' | 'artifacts', EquipmentSectionReceipt>;
  weapon: EquipmentAssignment<RecordedWeapon>;
  artifacts: Record<ArtifactSlot, EquipmentAssignment<RecordedArtifact>>;
  unrecognizedSlots: RecordedArtifact[];
  artifactRelationsConsistent: boolean;
}
