import type { CharacterEquipmentResponse, ProfileReferenceEntry } from '@celestia/api-contracts';

export type ProfileState = 'bright' | 'dark' | 'unknown';
export function constellationState(count: number | undefined, required: number): ProfileState {
  if (count === undefined || !Number.isInteger(count) || count < 0 || count > 6) return 'unknown';
  return count >= required ? 'bright' : 'dark';
}
export function talentValue(entry: ProfileReferenceEntry, data?: CharacterEquipmentResponse) {
  const slot =
    entry.kind === 'normal'
      ? 'normal'
      : entry.kind === 'skill'
        ? 'skill'
        : entry.kind === 'burst'
          ? 'burst'
          : null;
  return slot ? data?.character.talents[slot] : undefined;
}
export function setEligibility(
  count: number,
  required: number,
  data?: CharacterEquipmentResponse,
): ProfileState {
  if (!data?.artifactRelationsConsistent) return 'unknown';
  if (count >= required) return 'bright';
  return Object.values(data.artifacts).every((a) => a.state === 'recorded_assigned')
    ? 'dark'
    : 'unknown';
}
export const statNames: Record<string, string> = {
  critRate_: 'CRIT Rate',
  critDMG_: 'CRIT DMG',
  enerRech_: 'Energy Recharge',
  eleMas: 'Elemental Mastery',
  hp_: 'HP%',
  atk_: 'ATK%',
  def_: 'DEF%',
  hp: 'Flat HP',
  atk: 'Flat ATK',
  def: 'Flat DEF',
  pyro_dmg_: 'Pyro DMG',
  hydro_dmg_: 'Hydro DMG',
  electro_dmg_: 'Electro DMG',
  cryo_dmg_: 'Cryo DMG',
  anemo_dmg_: 'Anemo DMG',
  geo_dmg_: 'Geo DMG',
  dendro_dmg_: 'Dendro DMG',
  phys_dmg_: 'Physical DMG',
  physical_dmg_: 'Physical DMG',
  heal_: 'Healing Bonus',
};
export const statLabel = (key: string) => statNames[key] ?? (key || 'Unnamed stat');
export const statValue = (key: string, value: number) =>
  `${value}${key in statNames && key.endsWith('_') ? '%' : ''}`;
