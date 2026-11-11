import { createRequire } from 'node:module';

import {
  type CharacterReadinessRequestInput,
  characterReadinessRequestSchema,
  type ReadinessArtifactInput,
  type ReadinessArtifactSlot,
  type ReadinessCharacterTalents,
  type ReadinessTargetEncounter,
  type ReadinessTeamEnergyContext,
  type ReadinessWeaponInput,
  type RoleBenchmarkProfile,
} from '@celestia/api-contracts';

import {
  type Artifact,
  resolveCharacterKey,
} from '../../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { normalizeStatKey } from './readiness-intelligence.calculator.js';

const require = createRequire(import.meta.url);
const CHARACTER_ELEMENTS: Record<string, string> = require('../../static/character-elements.json');

// ---------------------------------------------------------------------------
// Input Structural Interfaces (Strict ESM, Zero `any`)
// ---------------------------------------------------------------------------

export interface SubStatEntry {
  key?: string;
  name?: string;
  id?: string;
  value: number;
  formatted?: string;
}

export interface AuthenticatedArtifactRecord {
  id?: string;
  accountId?: string;
  setKey?: string | null;
  slotKey?: string | null;
  slot?: string | null;
  level?: number | null;
  rarity?: number | null;
  mainStatKey?: string | null;
  mainStatValue?: number | null;
  subStats?: unknown;
  locked?: boolean | null;
  equippedCharacterId?: string | null;
}

export interface AuthenticatedCharacterRecord {
  id?: string;
  characterKey: string;
  level?: number | null;
  ascension?: number | null;
  constellation?: number | null;
  talentNormal?: number | null;
  talentSkill?: number | null;
  talentBurst?: number | null;
  equippedWeapon?: {
    id?: string;
    weaponKey: string;
    level?: number | null;
    ascension?: number | null;
    refinement?: number | null;
    weaponType?: string;
  } | null;
  stats?: Record<string, number>;
}

export interface ShowcaseTalentRecord {
  id?: string;
  label?: string;
  kind?: 'normal' | 'skill' | 'burst' | null;
  baseLevel: number;
  bonusLevel?: number | null;
}

export interface ShowcaseWeaponRecord {
  id?: number;
  name?: string;
  key?: string;
  weaponKey?: string;
  level?: number | null;
  ascension?: number | null;
  refinement?: number | null;
  weaponType?: string;
}

export interface ShowcaseArtifactRecord {
  id?: number;
  name?: string;
  slot?: string | null;
  slotKey?: string | null;
  setName?: string | null;
  setKey?: string | null;
  level?: number | null;
  rarity?: number | null;
  mainStat?: {
    id?: string;
    name?: string;
    key?: string;
    value?: number;
    formatted?: string;
  } | null;
  mainStatKey?: string | null;
  stats?: ReadonlyArray<SubStatEntry>;
}

export interface ShowcaseCharacterRecord {
  key: string;
  id?: number | null;
  skillDepotId?: number | null;
  name?: string | null;
  element?: string | null;
  weaponType?: string | null;
  level?: number | null;
  ascension?: number | null;
  constellation?: number | null;
  talents?: ReadonlyArray<ShowcaseTalentRecord> | ReadinessCharacterTalents | null;
  weapon?: ShowcaseWeaponRecord | null;
  artifacts?: ReadonlyArray<ShowcaseArtifactRecord> | null;
  stats?: ReadonlyArray<SubStatEntry> | Record<string, number> | null;
}

export interface TeamMemberEnergyInput {
  characterKey: string;
  element?: string | null;
  weaponKey?: string | null;
  equippedWeapon?: {
    weaponKey?: string | null;
    name?: string | null;
    key?: string | null;
  } | null;
  weapon?: {
    weaponKey?: string | null;
    name?: string | null;
    key?: string | null;
  } | null;
}

export interface TeamEnergyBuildOptions {
  partyMembers?: ReadonlyArray<string | TeamMemberEnergyInput>;
  particlesPerRotation?: number;
  favoniusWeaponCount?: number;
  sameElementCount?: number;
  rotationLengthSeconds?: number;
  estimatedErRequirement?: number;
  roster?: ReadonlyArray<
    CharacterWithWeapon | AuthenticatedCharacterRecord | TeamMemberEnergyInput
  >;
  showcaseCharacters?: ReadonlyArray<ShowcaseCharacterRecord>;
  characterElements?: Record<string, string>;
}

export type TeamContextParam =
  ReadonlyArray<string | TeamMemberEnergyInput> | TeamEnergyBuildOptions | undefined;

export interface ReadinessAdapterOptions {
  roleProfile?: string | RoleBenchmarkProfile;
  targetEncounter?: ReadinessTargetEncounter;
  roster?: ReadonlyArray<
    CharacterWithWeapon | AuthenticatedCharacterRecord | TeamMemberEnergyInput
  >;
  showcaseCharacters?: ReadonlyArray<ShowcaseCharacterRecord>;
  characterElements?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Normalization & Deterministic Main Stat Tables
// ---------------------------------------------------------------------------

const LOWERCASE_PARTICLES = new Set(['of', 'the', 'in', 'to', 'from', 'and', 'for', 'on', 'a']);

/**
 * Deterministic 5-star Lv.20 main stat values used when an authenticated GOOD
 * artifact row records `mainStatKey` without an explicit `mainStatValue`.
 */
const FIVE_STAR_LV20_MAIN_STATS: Readonly<Record<string, number>> = Object.freeze({
  hp: 4780,
  maxHp: 4780,
  atk: 311,
  hpPercent: 46.6,
  atkPercent: 46.6,
  defPercent: 58.3,
  energyRecharge: 51.8,
  elementalMastery: 187,
  critRate: 31.1,
  critDmg: 62.2,
  healingBonus: 35.9,
  pyroDmg: 46.6,
  hydroDmg: 46.6,
  cryoDmg: 46.6,
  electroDmg: 46.6,
  anemoDmg: 46.6,
  geoDmg: 46.6,
  dendroDmg: 46.6,
  physicalDmg: 58.3,
});

const FOUR_STAR_LV16_RATIO = 0.75;

export function normalizeArtifactSlot(
  rawSlot: string | null | undefined,
): ReadinessArtifactSlot | null {
  if (!rawSlot || typeof rawSlot !== 'string') return null;
  const cleaned = rawSlot.trim().toLowerCase();
  switch (cleaned) {
    case 'flower':
    case 'bracer':
    case 'equip_bracer':
      return 'flower';
    case 'plume':
    case 'feather':
    case 'necklace':
    case 'equip_necklace':
      return 'plume';
    case 'sands':
    case 'eon':
    case 'hourglass':
    case 'shoes':
    case 'equip_shoes':
      return 'sands';
    case 'goblet':
    case 'cup':
    case 'chalice':
    case 'ring':
    case 'equip_ring':
      return 'goblet';
    case 'circlet':
    case 'crown':
    case 'hat':
    case 'mask':
    case 'dress':
    case 'equip_dress':
      return 'circlet';
    default:
      return null;
  }
}

export function normalizeSetKey(rawSet: string | null | undefined): string | null {
  if (!rawSet || typeof rawSet !== 'string') return null;
  const trimmed = rawSet.trim();
  if (!trimmed) return null;

  if (/^[A-Za-z0-9_]+$/.test(trimmed)) {
    return trimmed;
  }

  const normalizedApostrophes = trimmed.replace(/['’]/g, '');
  const words = normalizedApostrophes.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (words.length === 0) return null;

  return words
    .map((word) => {
      const lower = word.toLowerCase();
      if (LOWERCASE_PARTICLES.has(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

export function normalizeWeaponKeyString(rawWeapon: string | null | undefined): string | null {
  if (!rawWeapon || typeof rawWeapon !== 'string') return null;
  const trimmed = rawWeapon.trim();
  if (!trimmed) return null;
  if (/^[A-Za-z0-9_]+$/.test(trimmed)) {
    return trimmed;
  }
  const normalizedApostrophes = trimmed.replace(/['’]/g, '');
  const words = normalizedApostrophes.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

/**
 * Normalizes GOOD stat keys (`enerRech_`, `critRate_`, `hp_`, `eleMas`, `pyro_dmg_`),
 * Enka fight prop IDs (`FIGHT_PROP_CHARGE_EFFICIENCY`, `23`, `2000`),
 * human-readable stat labels (`Energy Recharge`, `Pyro DMG Bonus`, `Max HP`),
 * and camelCase keys into canonical readiness calculator stat keys.
 */
export function normalizeArtifactStatKey(rawKey: string | null | undefined): string | null {
  if (!rawKey || typeof rawKey !== 'string') return null;
  const trimmed = rawKey.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const compact = lower.replace(/[^a-z0-9%]/g, '');

  switch (compact) {
    case '23':
    case 'er':
    case 'er%':
    case 'enerrech':
    case 'energyrecharge':
    case 'energyrecharge%':
    case 'fightpropchargeefficiency':
      return 'energyRecharge';

    case '28':
    case 'em':
    case 'elemas':
    case 'elementalmastery':
    case 'fightpropelementmastery':
      return 'elementalMastery';

    case '20':
    case 'cr':
    case 'critrate':
    case 'critrate%':
    case 'fightpropcritical':
      return 'critRate';

    case '22':
    case 'cd':
    case 'critdmg':
    case 'critdmg%':
    case 'fightpropcriticalhurt':
      return 'critDmg';

    case '26':
    case 'heal':
    case 'healingbonus':
    case 'healingbonus%':
    case 'fightprophealadd':
      return 'healingBonus';

    case '3':
    case 'hp%':
    case 'hppercent':
    case 'fightprophppercent':
      return 'hpPercent';
    case '1':
    case 'basehp':
    case 'fightpropbasehp':
      return 'baseHp';
    case '2':
    case 'addedhp':
      return 'addedHp';
    case '2000':
    case 'maxhp':
      return 'maxHp';
    case 'hp':
    case 'fightprophp':
      return trimmed.endsWith('_') ? 'hpPercent' : 'hp';

    case '6':
    case 'atk%':
    case 'atkpercent':
    case 'fightpropattackpercent':
      return 'atkPercent';
    case '4':
    case 'baseatk':
    case 'fightpropbaseattack':
      return 'baseAtk';
    case '5':
    case 'addedatk':
      return 'addedAtk';
    case '2001':
    case 'atk':
    case 'attack':
    case 'fightpropattack':
      return trimmed.endsWith('_') ? 'atkPercent' : 'atk';

    case '9':
    case 'def%':
    case 'defpercent':
    case 'fightpropdefensepercent':
      return 'defPercent';
    case '7':
    case 'basedef':
    case 'fightpropbasedefense':
      return 'baseDef';
    case '8':
    case 'addeddef':
      return 'addedDef';
    case '2002':
    case 'def':
    case 'defense':
    case 'fightpropdefense':
      return trimmed.endsWith('_') ? 'defPercent' : 'def';

    case '40':
    case 'pyrodmg':
    case 'pyrodmg%':
    case 'pyrodmgbonus':
    case 'pyrodmgbonus%':
    case 'fightpropfireaddhurt':
      return 'pyroDmg';
    case '41':
    case 'electrodmg':
    case 'electrodmg%':
    case 'electrodmgbonus':
    case 'electrodmgbonus%':
    case 'fightpropelecaddhurt':
      return 'electroDmg';
    case '42':
    case 'hydrodmg':
    case 'hydrodmg%':
    case 'hydrodmgbonus':
    case 'hydrodmgbonus%':
    case 'fightpropwateraddhurt':
      return 'hydroDmg';
    case '43':
    case 'dendrodmg':
    case 'dendrodmg%':
    case 'dendrodmgbonus':
    case 'dendrodmgbonus%':
    case 'fightpropgrassaddhurt':
      return 'dendroDmg';
    case '44':
    case 'anemodmg':
    case 'anemodmg%':
    case 'anemodmgbonus':
    case 'anemodmgbonus%':
    case 'fightpropwindaddhurt':
      return 'anemoDmg';
    case '45':
    case 'geodmg':
    case 'geodmg%':
    case 'geodmgbonus':
    case 'geodmgbonus%':
    case 'fightproprockaddhurt':
      return 'geoDmg';
    case '46':
    case 'cryodmg':
    case 'cryodmg%':
    case 'cryodmgbonus':
    case 'cryodmgbonus%':
    case 'fightpropiceaddhurt':
      return 'cryoDmg';
    case '30':
    case 'physicaldmg':
    case 'physicaldmg%':
    case 'physicaldmgbonus':
    case 'physicaldmgbonus%':
    case 'fightpropphysicaladdhurt':
      return 'physicalDmg';

    default:
      return normalizeStatKey(trimmed);
  }
}

function clampInt(value: number | null | undefined, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function roundStat(value: number): number {
  return Math.round(value * 100) / 100;
}

function estimateMainStatContribution(
  normalizedMainStatKey: string,
  level: number | null,
  rarity: number | null,
): number | null {
  const maxVal = FIVE_STAR_LV20_MAIN_STATS[normalizedMainStatKey];
  if (maxVal === undefined) return null;

  const effectiveRarity = rarity ?? 5;
  const maxLevel = effectiveRarity >= 5 ? 20 : effectiveRarity === 4 ? 16 : 12;
  const effectiveLevel = level ?? maxLevel;
  const rarityMultiplier =
    effectiveRarity >= 5 ? 1.0 : effectiveRarity === 4 ? FOUR_STAR_LV16_RATIO : 0.5;
  const levelProgress = 0.15 + 0.85 * Math.min(1, Math.max(0, effectiveLevel / maxLevel));

  return roundStat(maxVal * rarityMultiplier * levelProgress);
}

function parseSubStatsList(rawSubStats: unknown): SubStatEntry[] {
  if (!rawSubStats) return [];
  if (Array.isArray(rawSubStats)) {
    const valid: SubStatEntry[] = [];
    for (const item of rawSubStats) {
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        const val = typeof rec.value === 'number' && Number.isFinite(rec.value) ? rec.value : null;
        if (val !== null) {
          valid.push({
            key: typeof rec.key === 'string' ? rec.key : undefined,
            name: typeof rec.name === 'string' ? rec.name : undefined,
            id: typeof rec.id === 'string' ? rec.id : undefined,
            value: val,
            formatted: typeof rec.formatted === 'string' ? rec.formatted : undefined,
          });
        }
      }
    }
    return valid;
  }
  if (typeof rawSubStats === 'object') {
    const entries: SubStatEntry[] = [];
    for (const [k, v] of Object.entries(rawSubStats as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        entries.push({ key: k, value: v });
      }
    }
    return entries;
  }
  return [];
}

function isFavoniusWeapon(weaponKeyOrName: string | null | undefined): boolean {
  if (!weaponKeyOrName || typeof weaponKeyOrName !== 'string') return false;
  return weaponKeyOrName.toLowerCase().includes('favonius');
}

function lookupElement(characterKey: string, elementMap: Record<string, string>): string | null {
  const direct = elementMap[characterKey];
  if (direct) return direct;
  const resolved = resolveCharacterKey(characterKey);
  if (elementMap[resolved]) return elementMap[resolved];
  return null;
}

// ---------------------------------------------------------------------------
// Team Energy Context Builder
// ---------------------------------------------------------------------------

export function buildTeamEnergyContext(params: {
  characterKey: string;
  equippedWeaponKey?: string | null;
  teamContext?: TeamContextParam;
  options?: ReadinessAdapterOptions;
}): ReadinessTeamEnergyContext | undefined {
  const { characterKey, equippedWeaponKey, teamContext, options } = params;
  if (!teamContext) return undefined;

  const elementMap = options?.characterElements ?? CHARACTER_ELEMENTS;
  const isArray = Array.isArray(teamContext);
  const rawMembers: ReadonlyArray<string | TeamMemberEnergyInput> = isArray
    ? (teamContext as ReadonlyArray<string | TeamMemberEnergyInput>)
    : ((teamContext as TeamEnergyBuildOptions).partyMembers ?? []);

  const explicitOptions: TeamEnergyBuildOptions = isArray
    ? {}
    : (teamContext as TeamEnergyBuildOptions);
  const rosterLookup = explicitOptions.roster ?? options?.roster ?? [];
  const showcaseLookup = explicitOptions.showcaseCharacters ?? options?.showcaseCharacters ?? [];

  if (
    rawMembers.length === 0 &&
    explicitOptions.particlesPerRotation === undefined &&
    explicitOptions.favoniusWeaponCount === undefined &&
    explicitOptions.sameElementCount === undefined &&
    explicitOptions.rotationLengthSeconds === undefined &&
    explicitOptions.estimatedErRequirement === undefined
  ) {
    return undefined;
  }

  const weaponByCharKey = new Map<string, string>();
  const elementByCharKey = new Map<string, string>();

  const targetResolvedKey = resolveCharacterKey(characterKey);
  if (equippedWeaponKey) {
    weaponByCharKey.set(targetResolvedKey, equippedWeaponKey);
  }

  for (const r of rosterLookup) {
    const key = resolveCharacterKey(r.characterKey);
    const wKey =
      'equippedWeapon' in r && r.equippedWeapon
        ? 'weaponKey' in r.equippedWeapon
          ? r.equippedWeapon.weaponKey
          : r.equippedWeapon.name
        : 'weaponKey' in r
          ? r.weaponKey
          : null;
    if (wKey) {
      weaponByCharKey.set(key, wKey);
    }
    if ('element' in r && typeof r.element === 'string') {
      elementByCharKey.set(key, r.element);
    }
  }

  for (const sc of showcaseLookup) {
    const key = resolveCharacterKey(sc.key, sc.id, sc.name);
    const wKey = sc.weapon?.weaponKey ?? sc.weapon?.key ?? sc.weapon?.name ?? null;
    if (wKey) {
      weaponByCharKey.set(key, wKey);
    }
    if (typeof sc.element === 'string') {
      elementByCharKey.set(key, sc.element);
    }
  }

  const partyMembers: string[] = [];
  for (const item of rawMembers) {
    if (typeof item === 'string') {
      const k = resolveCharacterKey(item);
      if (k && !partyMembers.includes(k)) {
        partyMembers.push(k);
      }
    } else if (item && typeof item === 'object' && typeof item.characterKey === 'string') {
      const k = resolveCharacterKey(item.characterKey);
      if (k && !partyMembers.includes(k)) {
        partyMembers.push(k);
      }
      const wKey =
        item.weaponKey ??
        item.equippedWeapon?.weaponKey ??
        item.equippedWeapon?.key ??
        item.equippedWeapon?.name ??
        item.weapon?.weaponKey ??
        item.weapon?.key ??
        item.weapon?.name ??
        null;
      if (wKey) {
        weaponByCharKey.set(k, wKey);
      }
      if (typeof item.element === 'string') {
        elementByCharKey.set(k, item.element);
      }
    }
  }

  const effectiveParty =
    partyMembers.length > 0
      ? partyMembers.includes(targetResolvedKey) || partyMembers.length >= 4
        ? partyMembers.slice(0, 4)
        : [targetResolvedKey, ...partyMembers].slice(0, 4)
      : [targetResolvedKey];

  const targetElement =
    elementByCharKey.get(targetResolvedKey) ?? lookupElement(targetResolvedKey, elementMap);

  let computedSameElementCount = 1;
  if (targetElement) {
    const matches = effectiveParty.filter((memberKey) => {
      const memberEl = elementByCharKey.get(memberKey) ?? lookupElement(memberKey, elementMap);
      return memberEl !== null && memberEl.toLowerCase() === targetElement.toLowerCase();
    }).length;
    computedSameElementCount = Math.max(1, Math.min(4, matches));
  }

  let computedFavoniusCount = 0;
  for (const memberKey of effectiveParty) {
    const wKey = weaponByCharKey.get(memberKey);
    if (isFavoniusWeapon(wKey)) {
      computedFavoniusCount += 1;
    }
  }
  computedFavoniusCount = Math.min(4, computedFavoniusCount);

  const sameElementCount =
    explicitOptions.sameElementCount !== undefined
      ? Math.max(0, Math.min(4, Math.trunc(explicitOptions.sameElementCount)))
      : computedSameElementCount;

  const favoniusWeaponCount =
    explicitOptions.favoniusWeaponCount !== undefined
      ? Math.max(0, Math.min(4, Math.trunc(explicitOptions.favoniusWeaponCount)))
      : computedFavoniusCount;

  const particlesPerRotation =
    explicitOptions.particlesPerRotation !== undefined
      ? Math.max(0, explicitOptions.particlesPerRotation)
      : 0;

  const rotationLengthSeconds =
    explicitOptions.rotationLengthSeconds !== undefined
      ? Math.max(5, Math.min(60, explicitOptions.rotationLengthSeconds))
      : 20;

  return {
    partyMembers: partyMembers.length > 0 ? partyMembers.slice(0, 4) : effectiveParty,
    particlesPerRotation,
    favoniusWeaponCount,
    sameElementCount,
    rotationLengthSeconds,
    ...(explicitOptions.estimatedErRequirement !== undefined
      ? { estimatedErRequirement: explicitOptions.estimatedErRequirement }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// 1. Authenticated Readiness Input Builder
// ---------------------------------------------------------------------------

/**
 * Builds a complete, schema-validated `CharacterReadinessRequestInput` from an
 * authenticated character record (`CharacterWithWeapon`), account artifacts (`Artifact[]`),
 * and optional team context.
 */
export function buildAuthenticatedReadinessInput(
  char: CharacterWithWeapon | AuthenticatedCharacterRecord,
  artifacts: ReadonlyArray<Artifact | AuthenticatedArtifactRecord> = [],
  teamMembers?: TeamContextParam,
  options?: ReadinessAdapterOptions,
): CharacterReadinessRequestInput {
  const characterKey = resolveCharacterKey(char.characterKey);

  // 1. Filter artifacts equipped on this character
  const equippedArtifacts = artifacts.filter((art) => {
    if (char.id !== undefined && char.id !== '') {
      return art.equippedCharacterId === char.id;
    }
    return art.equippedCharacterId === undefined || art.equippedCharacterId === null;
  });

  // 2. Map 5 canonical slots & aggregate observed mainstats and substats
  const mappedArtifacts: Record<ReadinessArtifactSlot, ReadinessArtifactInput | null> = {
    flower: null,
    plume: null,
    sands: null,
    goblet: null,
    circlet: null,
  };

  const aggregatedStats: Record<string, number> = {};
  if ('stats' in char && char.stats) {
    for (const [rawK, rawV] of Object.entries(char.stats)) {
      if (typeof rawV === 'number' && Number.isFinite(rawV)) {
        const normK = normalizeArtifactStatKey(rawK) ?? rawK;
        aggregatedStats[normK] = roundStat((aggregatedStats[normK] ?? 0) + rawV);
      }
    }
  }

  let hasObservedArtifactEr = false;

  for (const art of equippedArtifacts) {
    const rawSlot = 'slot' in art && art.slot ? art.slot : art.slotKey;
    const slot = normalizeArtifactSlot(rawSlot ?? null);
    if (!slot) continue;

    const setKey = normalizeSetKey(art.setKey ?? null);
    const normalizedMainStat = normalizeArtifactStatKey(art.mainStatKey ?? null);
    const level = clampInt(art.level, 0, 20);
    const rarity = clampInt(art.rarity, 1, 5);

    mappedArtifacts[slot] = {
      slot,
      setKey,
      mainStatKey: normalizedMainStat,
      level,
      rarity,
    };

    if (normalizedMainStat) {
      const explicitMainVal =
        'mainStatValue' in art &&
        typeof art.mainStatValue === 'number' &&
        Number.isFinite(art.mainStatValue)
          ? art.mainStatValue
          : estimateMainStatContribution(normalizedMainStat, level, rarity);

      if (explicitMainVal !== null) {
        const statBucketKey = normalizedMainStat === 'hp' ? 'maxHp' : normalizedMainStat;
        aggregatedStats[statBucketKey] = roundStat(
          (aggregatedStats[statBucketKey] ?? 0) + explicitMainVal,
        );
        if (statBucketKey === 'energyRecharge') {
          hasObservedArtifactEr = true;
        }
      }
    }

    const subStatsList = parseSubStatsList(art.subStats);
    for (const sub of subStatsList) {
      const rawSubKey = sub.key ?? sub.name ?? sub.id ?? null;
      const normSubKey = normalizeArtifactStatKey(rawSubKey);
      if (!normSubKey) continue;

      let value = sub.value;
      if (normSubKey === 'energyRecharge' && value > 0 && value < 5) {
        value = value * 100;
      }

      const bucketKey = normSubKey === 'hp' ? 'maxHp' : normSubKey;
      aggregatedStats[bucketKey] = roundStat((aggregatedStats[bucketKey] ?? 0) + value);
      if (bucketKey === 'energyRecharge') {
        hasObservedArtifactEr = true;
      }
    }
  }

  // If Energy Recharge was observed from artifact mainstat/substats as bonus percentage points,
  // include the character's 100% base ER so rotation_energy evaluates total ER% accurately.
  const charHasBaseEr = Boolean(
    'stats' in char &&
    char.stats &&
    typeof char.stats.energyRecharge === 'number' &&
    char.stats.energyRecharge >= 100,
  );
  if (
    hasObservedArtifactEr &&
    !charHasBaseEr &&
    aggregatedStats.energyRecharge !== undefined &&
    aggregatedStats.energyRecharge > 0
  ) {
    aggregatedStats.energyRecharge = roundStat(100 + aggregatedStats.energyRecharge);
  }

  // 3. Map weapon details (preserve null if unequipped)
  let weaponInput: ReadinessWeaponInput | null = null;
  if (char.equippedWeapon && char.equippedWeapon.weaponKey) {
    const wKey = normalizeWeaponKeyString(char.equippedWeapon.weaponKey);
    if (wKey) {
      weaponInput = {
        weaponKey: wKey,
        level: clampInt(char.equippedWeapon.level, 1, 90),
        refinement: clampInt(char.equippedWeapon.refinement, 1, 5) ?? 1,
        ...('weaponType' in char.equippedWeapon && char.equippedWeapon.weaponType
          ? { weaponType: char.equippedWeapon.weaponType }
          : {}),
      };
    }
  }

  // 4. Map talents (preserve null for unrecorded talents)
  const talents: ReadinessCharacterTalents = {
    normal: clampInt(char.talentNormal, 1, 15),
    skill: clampInt(char.talentSkill, 1, 15),
    burst: clampInt(char.talentBurst, 1, 15),
  };

  // 5. Compute team energy context when team members or context are provided
  const teamEnergyContext = buildTeamEnergyContext({
    characterKey,
    equippedWeaponKey: weaponInput?.weaponKey ?? null,
    teamContext: teamMembers,
    options,
  });

  const result: CharacterReadinessRequestInput = {
    character: {
      characterKey,
      level: clampInt(char.level, 1, 90),
      ascension: clampInt(char.ascension, 0, 6),
      constellation: clampInt(char.constellation, 0, 6) ?? 0,
      talents,
      weapon: weaponInput,
      artifacts: mappedArtifacts,
      stats: aggregatedStats,
    },
    ...(options?.roleProfile !== undefined ? { roleProfile: options.roleProfile } : {}),
    ...(options?.targetEncounter !== undefined ? { targetEncounter: options.targetEncounter } : {}),
    ...(teamEnergyContext !== undefined ? { teamEnergyContext } : {}),
  };

  characterReadinessRequestSchema.parse(result);
  return result;
}

// ---------------------------------------------------------------------------
// 2. Showcase Readiness Input Builder
// ---------------------------------------------------------------------------

function extractShowcaseTalents(
  rawTalents: ShowcaseCharacterRecord['talents'],
): ReadinessCharacterTalents {
  if (!rawTalents) {
    return { normal: null, skill: null, burst: null };
  }

  if (!Array.isArray(rawTalents)) {
    const obj = rawTalents as ReadinessCharacterTalents;
    return {
      normal: clampInt(obj.normal, 1, 15),
      skill: clampInt(obj.skill, 1, 15),
      burst: clampInt(obj.burst, 1, 15),
    };
  }

  if (rawTalents.length === 0) {
    return { normal: null, skill: null, burst: null };
  }

  const byKind = (kind: 'normal' | 'skill' | 'burst', fallbackIdx: number): number | null => {
    const matched = rawTalents.find((t) => t.kind === kind);
    if (matched && typeof matched.baseLevel === 'number') {
      return clampInt(matched.baseLevel, 1, 15);
    }
    if (rawTalents.every((t) => !t.kind) && rawTalents.length >= 3) {
      const positional = rawTalents[fallbackIdx];
      if (positional && typeof positional.baseLevel === 'number') {
        return clampInt(positional.baseLevel, 1, 15);
      }
    }
    return null;
  };

  return {
    normal: byKind('normal', 0),
    skill: byKind('skill', 1),
    burst: byKind('burst', 2),
  };
}

function normalizeShowcaseStatValue(normKey: string, value: number, rawId?: string): number {
  if (normKey === 'energyRecharge' && value > 0 && value < 5) {
    return roundStat(value * 100);
  }
  if (
    (normKey === 'critRate' ||
      normKey === 'critDmg' ||
      normKey === 'hpPercent' ||
      normKey === 'atkPercent' ||
      normKey === 'defPercent' ||
      normKey === 'healingBonus' ||
      normKey.endsWith('Dmg')) &&
    rawId &&
    /^\d+$/.test(rawId) &&
    value > 0 &&
    value < 5
  ) {
    return roundStat(value * 100);
  }
  return roundStat(value);
}

/**
 * Builds a complete, schema-validated `CharacterReadinessRequestInput` from a
 * public showcase character (`ShowcaseCharacter`) and optional team context.
 */
export function buildShowcaseReadinessInput(
  showcaseChar: ShowcaseCharacterRecord,
  teamMembers?: TeamContextParam,
  options?: ReadinessAdapterOptions,
): CharacterReadinessRequestInput {
  const characterKey = resolveCharacterKey(showcaseChar.key, showcaseChar.id, showcaseChar.name);

  // 1. Map showcase artifacts into the 5 canonical slots
  const mappedArtifacts: Record<ReadinessArtifactSlot, ReadinessArtifactInput | null> = {
    flower: null,
    plume: null,
    sands: null,
    goblet: null,
    circlet: null,
  };

  const fallbackArtifactStats: Record<string, number> = {};
  let hasFallbackArtifactEr = false;

  if (Array.isArray(showcaseChar.artifacts)) {
    for (const art of showcaseChar.artifacts) {
      const slot = normalizeArtifactSlot(art.slot ?? art.slotKey ?? null);
      if (!slot) continue;

      const setKey = normalizeSetKey(art.setKey ?? art.setName ?? null);
      const rawMainStat =
        art.mainStatKey ?? art.mainStat?.key ?? art.mainStat?.name ?? art.mainStat?.id ?? null;
      const mainStatKey = normalizeArtifactStatKey(rawMainStat);
      const level = clampInt(art.level, 0, 20);
      const rarity = clampInt(art.rarity, 1, 5);

      mappedArtifacts[slot] = {
        slot,
        setKey,
        mainStatKey,
        level,
        rarity,
      };

      if (mainStatKey) {
        const mainVal =
          typeof art.mainStat?.value === 'number' && Number.isFinite(art.mainStat.value)
            ? art.mainStat.value
            : null;
        if (mainVal !== null) {
          const bucket = mainStatKey === 'hp' ? 'maxHp' : mainStatKey;
          fallbackArtifactStats[bucket] = roundStat((fallbackArtifactStats[bucket] ?? 0) + mainVal);
          if (bucket === 'energyRecharge') {
            hasFallbackArtifactEr = true;
          }
        }
      }

      if (Array.isArray(art.stats)) {
        for (const st of art.stats) {
          if (
            art.mainStat &&
            st.id &&
            art.mainStat.id === st.id &&
            st.value === art.mainStat.value
          ) {
            continue;
          }
          const normKey = normalizeArtifactStatKey(st.key ?? st.name ?? st.id ?? null);
          if (!normKey || typeof st.value !== 'number' || !Number.isFinite(st.value)) continue;
          const bucket = normKey === 'hp' ? 'maxHp' : normKey;
          fallbackArtifactStats[bucket] = roundStat(
            (fallbackArtifactStats[bucket] ?? 0) + st.value,
          );
          if (bucket === 'energyRecharge') {
            hasFallbackArtifactEr = true;
          }
        }
      }
    }
  }

  if (
    hasFallbackArtifactEr &&
    fallbackArtifactStats.energyRecharge !== undefined &&
    fallbackArtifactStats.energyRecharge > 0 &&
    fallbackArtifactStats.energyRecharge < 100
  ) {
    fallbackArtifactStats.energyRecharge = roundStat(100 + fallbackArtifactStats.energyRecharge);
  }

  // 2. Map showcase character combat stats into normalized Record<string, number>
  const normalizedStats: Record<string, number> = {};
  if (Array.isArray(showcaseChar.stats) && showcaseChar.stats.length > 0) {
    for (const entry of showcaseChar.stats) {
      if (!entry || typeof entry.value !== 'number' || !Number.isFinite(entry.value)) {
        continue;
      }
      const rawIdentifier = entry.key ?? entry.name ?? entry.id ?? null;
      const normKey =
        (entry.id ? normalizeArtifactStatKey(entry.id) : null) ??
        normalizeArtifactStatKey(rawIdentifier);
      if (!normKey) continue;

      const bucketKey = normKey === 'hp' ? 'maxHp' : normKey;
      normalizedStats[bucketKey] = normalizeShowcaseStatValue(bucketKey, entry.value, entry.id);
    }
  } else if (
    showcaseChar.stats &&
    typeof showcaseChar.stats === 'object' &&
    !Array.isArray(showcaseChar.stats)
  ) {
    for (const [k, v] of Object.entries(showcaseChar.stats)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        const normKey = normalizeArtifactStatKey(k) ?? k;
        const bucketKey = normKey === 'hp' ? 'maxHp' : normKey;
        normalizedStats[bucketKey] = normalizeShowcaseStatValue(bucketKey, v);
      }
    }
  } else if (Object.keys(fallbackArtifactStats).length > 0) {
    Object.assign(normalizedStats, fallbackArtifactStats);
  }

  // 3. Map showcase talents into { normal, skill, burst }
  const talents = extractShowcaseTalents(showcaseChar.talents);

  // 4. Map showcase weapon (preserve null if unequipped)
  let weaponInput: ReadinessWeaponInput | null = null;
  if (showcaseChar.weapon) {
    const rawWKey =
      showcaseChar.weapon.weaponKey ?? showcaseChar.weapon.key ?? showcaseChar.weapon.name ?? null;
    const normalizedWKey = normalizeWeaponKeyString(rawWKey);
    if (normalizedWKey) {
      weaponInput = {
        weaponKey: normalizedWKey,
        level: clampInt(showcaseChar.weapon.level, 1, 90),
        refinement: clampInt(showcaseChar.weapon.refinement, 1, 5) ?? 1,
        ...(showcaseChar.weapon.weaponType ? { weaponType: showcaseChar.weapon.weaponType } : {}),
      };
    }
  }

  // 5. Compute team energy context if team context is provided
  const teamEnergyContext = buildTeamEnergyContext({
    characterKey,
    equippedWeaponKey: weaponInput?.weaponKey ?? null,
    teamContext: teamMembers,
    options,
  });

  const result: CharacterReadinessRequestInput = {
    character: {
      characterKey,
      level: clampInt(showcaseChar.level, 1, 90),
      ascension: clampInt(showcaseChar.ascension, 0, 6),
      constellation: clampInt(showcaseChar.constellation, 0, 6) ?? 0,
      talents,
      weapon: weaponInput,
      artifacts: mappedArtifacts,
      stats: normalizedStats,
    },
    ...(options?.roleProfile !== undefined ? { roleProfile: options.roleProfile } : {}),
    ...(options?.targetEncounter !== undefined ? { targetEncounter: options.targetEncounter } : {}),
    ...(teamEnergyContext !== undefined ? { teamEnergyContext } : {}),
  };

  characterReadinessRequestSchema.parse(result);
  return result;
}
