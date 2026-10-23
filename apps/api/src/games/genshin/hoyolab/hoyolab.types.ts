import type { HoyolabNotes, HoyolabRole } from '@celestia/api-contracts';
export interface SyncedWeapon {
  key: string;
  level: number;
  ascension: number | null;
  refinement: number;
}
export interface SyncedArtifact {
  key: string;
  slot: string;
  level: number;
  rarity: number;
  mainStatKey: string;
  mainStatValue: number;
  subStats: { key: string; value: number }[];
}
export interface SyncedCharacter {
  key: string;
  level: number;
  ascension: number | null;
  constellation: number;
  talents: { normal: number; skill: number; burst: number };
  weapon: SyncedWeapon;
  artifacts: SyncedArtifact[];
}
export interface HoyolabSnapshot {
  role: HoyolabRole;
  characters: SyncedCharacter[];
  notes: HoyolabNotes | null;
  observedAt: Date;
}
