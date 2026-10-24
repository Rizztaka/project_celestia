import type { Element, NormalizedStat, StatUnit } from './types';

/**
 * Reviewed stat classification.
 *
 * Two distinct unit systems arrive through the same public contract:
 *  - combat (`fightPropMap`) percentages are *ratios*, so 0.5 means 50%;
 *  - equipment (`reliquaryMainstat` / `reliquarySubstats` / `weaponStats`) percentages
 *    are already *percentage points*, so 46.6 means 46.6%.
 * Comparing the raw numbers across those systems is a unit error, so every value is
 * normalised once, here, into an explicit unit. Nothing downstream re-derives units
 * from formatted strings.
 */

/** Combat stat IDs the parser formats as percentages; the raw value is a ratio. */
const combatPercentIds = new Set<string>([
  '3',
  '6',
  '9',
  '11',
  '20',
  '22',
  '23',
  '26',
  '27',
  '29',
  '30',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '80',
  '81',
]);

/** Equipment stat IDs the parser formats as percentages; the raw value is percentage points. */
const equipmentPercentIds = new Set<string>([
  'FIGHT_PROP_HP_PERCENT',
  'FIGHT_PROP_ATTACK_PERCENT',
  'FIGHT_PROP_DEFENSE_PERCENT',
  'FIGHT_PROP_CRITICAL',
  'FIGHT_PROP_CRITICAL_HURT',
  'FIGHT_PROP_CHARGE_EFFICIENCY',
  'FIGHT_PROP_HEAL_ADD',
  'FIGHT_PROP_PHYSICAL_ADD_HURT',
  'FIGHT_PROP_FIRE_ADD_HURT',
  'FIGHT_PROP_ELEC_ADD_HURT',
  'FIGHT_PROP_WATER_ADD_HURT',
  'FIGHT_PROP_WIND_ADD_HURT',
  'FIGHT_PROP_ICE_ADD_HURT',
  'FIGHT_PROP_ROCK_ADD_HURT',
  'FIGHT_PROP_GRASS_ADD_HURT',
]);

/** Canonical keys rules may reference. Both unit systems map onto the same vocabulary. */
export type CanonicalStatId =
  | 'maxHp'
  | 'atk'
  | 'def'
  | 'critRate'
  | 'critDmg'
  | 'energyRecharge'
  | 'elementalMastery'
  | 'healingBonus'
  | 'hpPercent'
  | 'atkPercent'
  | 'defPercent'
  | 'physicalDmg'
  | 'anemoDmg'
  | 'geoDmg'
  | 'electroDmg'
  | 'dendroDmg'
  | 'hydroDmg'
  | 'pyroDmg'
  | 'cryoDmg';

const combatStatIds: Record<string, CanonicalStatId> = {
  '2000': 'maxHp',
  '2001': 'atk',
  '2002': 'def',
  '20': 'critRate',
  '22': 'critDmg',
  '23': 'energyRecharge',
  '28': 'elementalMastery',
  '26': 'healingBonus',
  '3': 'hpPercent',
  '6': 'atkPercent',
  '9': 'defPercent',
  '30': 'physicalDmg',
  '44': 'anemoDmg',
  '45': 'geoDmg',
  '41': 'electroDmg',
  '43': 'dendroDmg',
  '42': 'hydroDmg',
  '40': 'pyroDmg',
  '46': 'cryoDmg',
};

const equipmentStatIds: Record<string, CanonicalStatId> = {
  FIGHT_PROP_HP: 'maxHp',
  FIGHT_PROP_ATTACK: 'atk',
  FIGHT_PROP_DEFENSE: 'def',
  FIGHT_PROP_HP_PERCENT: 'hpPercent',
  FIGHT_PROP_ATTACK_PERCENT: 'atkPercent',
  FIGHT_PROP_DEFENSE_PERCENT: 'defPercent',
  FIGHT_PROP_CRITICAL: 'critRate',
  FIGHT_PROP_CRITICAL_HURT: 'critDmg',
  FIGHT_PROP_CHARGE_EFFICIENCY: 'energyRecharge',
  FIGHT_PROP_ELEMENT_MASTERY: 'elementalMastery',
  FIGHT_PROP_HEAL_ADD: 'healingBonus',
  FIGHT_PROP_PHYSICAL_ADD_HURT: 'physicalDmg',
  FIGHT_PROP_WIND_ADD_HURT: 'anemoDmg',
  FIGHT_PROP_ROCK_ADD_HURT: 'geoDmg',
  FIGHT_PROP_ELEC_ADD_HURT: 'electroDmg',
  FIGHT_PROP_GRASS_ADD_HURT: 'dendroDmg',
  FIGHT_PROP_WATER_ADD_HURT: 'hydroDmg',
  FIGHT_PROP_FIRE_ADD_HURT: 'pyroDmg',
  FIGHT_PROP_ICE_ADD_HURT: 'cryoDmg',
};

const elementDamage: Record<Element, CanonicalStatId> = {
  Anemo: 'anemoDmg',
  Geo: 'geoDmg',
  Electro: 'electroDmg',
  Dendro: 'dendroDmg',
  Hydro: 'hydroDmg',
  Pyro: 'pyroDmg',
  Cryo: 'cryoDmg',
};

export function elementDamageStat(element: Element): CanonicalStatId {
  return elementDamage[element];
}

/** Main-stat keys a role may accept on each slot. */
export const slotStatVocabulary: Record<string, readonly CanonicalStatId[]> = {
  Sands: ['hpPercent', 'atkPercent', 'defPercent', 'elementalMastery', 'energyRecharge'],
  Goblet: [
    'hpPercent',
    'atkPercent',
    'defPercent',
    'elementalMastery',
    'physicalDmg',
    'anemoDmg',
    'geoDmg',
    'electroDmg',
    'dendroDmg',
    'hydroDmg',
    'pyroDmg',
    'cryoDmg',
  ],
  Circlet: [
    'hpPercent',
    'atkPercent',
    'defPercent',
    'elementalMastery',
    'critRate',
    'critDmg',
    'healingBonus',
  ],
};

export function isCombatPercent(statId: string) {
  return combatPercentIds.has(statId);
}

export function isEquipmentPercent(statId: string) {
  return equipmentPercentIds.has(statId);
}

export function canonicalCombatStat(statId: string): CanonicalStatId | null {
  return combatStatIds[statId] ?? null;
}

export function canonicalEquipmentStat(statId: string): CanonicalStatId | null {
  return equipmentStatIds[statId] ?? null;
}

/**
 * Normalise one combat stat. Percent-like combat rows are ratios and are converted to
 * percentage points exactly once; every other row is flat.
 */
export function normalizeCombatStat(stat: {
  id: string;
  name: string;
  value: number;
}): NormalizedStat {
  const percent = isCombatPercent(stat.id);
  const knownFlat = [
    '1',
    '2',
    '4',
    '5',
    '7',
    '8',
    '10',
    '28',
    '1010',
    '2000',
    '2001',
    '2002',
    '2003',
  ].includes(stat.id);
  return {
    id: stat.id,
    name: stat.name,
    raw: stat.value,
    unit: percent ? 'ratio' : knownFlat ? 'flat' : 'unknown',
    percentPoints: percent ? stat.value * 100 : null,
    flat: knownFlat ? stat.value : null,
  };
}

/** Normalise one equipment stat, whose percentages are already percentage points. */
export function normalizeEquipmentStat(stat: {
  id: string;
  name: string;
  value: number;
}): NormalizedStat {
  const percent = isEquipmentPercent(stat.id);
  const knownFlat = [
    'FIGHT_PROP_HP',
    'FIGHT_PROP_ATTACK',
    'FIGHT_PROP_BASE_ATTACK',
    'FIGHT_PROP_DEFENSE',
    'FIGHT_PROP_ELEMENT_MASTERY',
  ].includes(stat.id);
  return {
    id: stat.id,
    name: stat.name,
    raw: stat.value,
    unit: percent ? 'percentage_points' : knownFlat ? 'flat' : 'unknown',
    percentPoints: percent ? stat.value : null,
    flat: knownFlat ? stat.value : null,
  };
}

/**
 * Read a normalised value in percentage points regardless of which unit system produced
 * it. Ratios are multiplied by 100 here so callers never guess.
 */
export function percentPointsOf(stat: NormalizedStat): number | null {
  if (stat.unit === 'ratio') return stat.raw * 100;
  if (stat.unit === 'percentage_points') return stat.raw;
  return null;
}

export function unitOf(stat: NormalizedStat): StatUnit {
  return stat.unit;
}
