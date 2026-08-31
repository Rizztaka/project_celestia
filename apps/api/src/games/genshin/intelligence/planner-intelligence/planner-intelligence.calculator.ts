import type { UpgradeGoal } from '@prisma/client';
import { GoalType } from '@prisma/client';
import { createRequire } from 'module';

import type { CharacterRecommendation } from '../character-intelligence/character-intelligence.service.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const characterMaterials: Record<
  string,
  CharacterMaterial
> = require('../../static/character-materials.json');
const weaponMaterials: Record<
  string,
  WeaponMaterial
> = require('../../static/weapon-materials.json');
const domainSchedule: DomainSchedule = require('../../static/domain-schedule.json');

// -------------------------------------------------------
// Static data types
// -------------------------------------------------------

interface CharacterMaterial {
  talent: {
    book: string;
  };
}

interface WeaponMaterial {
  materialGroup: string;
}

interface DomainEntry {
  domainKey: string;
  name: string;
  days: number[]; // 0=Monday .. 5=Saturday (Sunday = all open)
  drops?: string[];
  materialGroup?: string;
}

interface DomainSchedule {
  talentDomains: DomainEntry[];
  weaponDomains: DomainEntry[];
}

// -------------------------------------------------------
// Public types
// -------------------------------------------------------

export interface ScoredGoal {
  goal: UpgradeGoal;
  totalScore: number;
  baseScore: number;
  timeGatedBonus: number;
  characterPriorityWeight: number;
  /** Resin cost per single domain/boss run */
  resinPerRun: number;
  /** Name of the domain or source to farm */
  sourceName: string;
  /** Whether the source is only available certain days (talent/weapon domains) */
  isTimeGated: boolean;
  /** Character key associated with this goal (for the explainer) */
  characterKey: string;
  /** Character intelligence score (lower = needs more work) */
  characterScore: number;
  /** The book or material group name (for the explainer) */
  resourceName: string;
}

export interface RouteItem {
  goalId: string;
  targetKey: string;
  goalType: GoalType;
  talentType: string | null;
  domainName: string;
  resinCost: number;
  runs: number;
  totalScore: number;
  isTimeGated: boolean;
  characterKey: string;
  characterScore: number;
  resourceName: string;
}

export interface PlannerCalculatorResult {
  route: RouteItem[];
  unallocatedResin: number;
}

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const BOSS_RESIN_COST = 40;
const DOMAIN_RESIN_COST = 20;
const MAX_RUNS_PER_GOAL = 5;
const BASE_SCORE = 50;
const TIME_GATE_BONUS = 20;
const SUNDAY = 6;

// -------------------------------------------------------
// Pure helpers
// -------------------------------------------------------

/**
 * Returns the talent book name required by a character.
 * Returns null if the character has no material profile.
 */
function getTalentBook(characterKey: string): string | null {
  const mat = characterMaterials[characterKey];
  return mat?.talent?.book ?? null;
}

/**
 * Returns the material group of a weapon.
 * Returns null if the weapon has no material profile.
 */
function getWeaponMaterialGroup(weaponKey: string): string | null {
  const mat = weaponMaterials[weaponKey];
  return mat?.materialGroup ?? null;
}

/**
 * Determines whether a talent book is farmable on the given UTC day.
 * dayOfWeek: 0=Monday, 1=Tuesday, … 5=Saturday, 6=Sunday.
 * On Sunday (6), all talent domains are open.
 */
function isTalentBookAvailableToday(bookName: string, dayOfWeek: number): boolean {
  if (dayOfWeek === SUNDAY) return true;
  return domainSchedule.talentDomains.some(
    (d) => d.drops?.includes(bookName) && d.days.includes(dayOfWeek),
  );
}

/**
 * Returns the domain name where a talent book drops today.
 */
function getTalentDomainName(bookName: string, dayOfWeek: number): string {
  if (dayOfWeek === SUNDAY) {
    const entry = domainSchedule.talentDomains.find((d) => d.drops?.includes(bookName));
    return entry?.name ?? 'Any Talent Domain';
  }
  const entry = domainSchedule.talentDomains.find(
    (d) => d.drops?.includes(bookName) && d.days.includes(dayOfWeek),
  );
  return entry?.name ?? 'Talent Domain';
}

/**
 * Determines whether a weapon material group is farmable on the given day.
 */
function isWeaponMaterialAvailableToday(materialGroup: string, dayOfWeek: number): boolean {
  if (dayOfWeek === SUNDAY) return true;
  return domainSchedule.weaponDomains.some(
    (d) => d.materialGroup === materialGroup && d.days.includes(dayOfWeek),
  );
}

/**
 * Returns the domain name where a weapon material group drops today.
 */
function getWeaponDomainName(materialGroup: string, dayOfWeek: number): string {
  if (dayOfWeek === SUNDAY) {
    const entry = domainSchedule.weaponDomains.find((d) => d.materialGroup === materialGroup);
    return entry?.name ?? 'Any Weapon Domain';
  }
  const entry = domainSchedule.weaponDomains.find(
    (d) => d.materialGroup === materialGroup && d.days.includes(dayOfWeek),
  );
  return entry?.name ?? 'Weapon Domain';
}

// -------------------------------------------------------
// Pure public API
// -------------------------------------------------------

/**
 * Filters an `UpgradeGoal[]` to only those that can be progressed today.
 * Returns `ScoredGoal[]` with scoring data attached.
 *
 * @param goals - All upgrade goals for the user.
 * @param dayOfWeek - UTC day index: 0=Monday … 6=Sunday.
 * @param characterRankings - Output from CharacterIntelligenceService.
 */
export function filterAndScoreGoals(
  goals: UpgradeGoal[],
  dayOfWeek: number,
  characterRankings: CharacterRecommendation[],
): ScoredGoal[] {
  const scoreMap = new Map<string, number>(characterRankings.map((r) => [r.characterKey, r.score]));

  const result: ScoredGoal[] = [];

  for (const goal of goals) {
    let sourceName = '';
    let resinPerRun = 0;
    let isTimeGated = false;
    let characterKey = goal.targetKey;
    let resourceName = '';

    if (goal.goalType === GoalType.CHARACTER_ASCENSION) {
      // Boss drops are available every day
      sourceName = 'Boss (World Boss)';
      resinPerRun = BOSS_RESIN_COST;
      isTimeGated = false;
      resourceName = 'boss drops';
    } else if (goal.goalType === GoalType.CHARACTER_TALENT) {
      const bookName = getTalentBook(goal.targetKey);
      if (!bookName) continue; // No material profile — skip silently

      if (!isTalentBookAvailableToday(bookName, dayOfWeek)) continue;

      sourceName = getTalentDomainName(bookName, dayOfWeek);
      resinPerRun = DOMAIN_RESIN_COST;
      isTimeGated = dayOfWeek !== SUNDAY;
      resourceName = `Teachings of ${bookName}`;
    } else if (goal.goalType === GoalType.WEAPON_ASCENSION) {
      const matGroup = getWeaponMaterialGroup(goal.targetKey);
      if (!matGroup) continue; // No material profile — skip silently

      if (!isWeaponMaterialAvailableToday(matGroup, dayOfWeek)) continue;

      sourceName = getWeaponDomainName(matGroup, dayOfWeek);
      resinPerRun = DOMAIN_RESIN_COST;
      isTimeGated = dayOfWeek !== SUNDAY;
      resourceName = matGroup;
      // For weapon goals, characterKey is the weapon itself; score lookup yields undefined
      // so we default to 50 (neutral priority).
      characterKey = goal.targetKey;
    } else {
      continue;
    }

    // Score the goal
    const rawCharScore = scoreMap.get(characterKey) ?? 50;
    const characterPriorityWeight = 100 - rawCharScore; // higher score = lower farming priority

    const timeGatedBonus = isTimeGated ? TIME_GATE_BONUS : 0;
    const totalScore = BASE_SCORE + timeGatedBonus + characterPriorityWeight;

    result.push({
      goal,
      totalScore,
      baseScore: BASE_SCORE,
      timeGatedBonus,
      characterPriorityWeight,
      resinPerRun,
      sourceName,
      isTimeGated,
      characterKey,
      characterScore: rawCharScore,
      resourceName,
    });
  }

  return result;
}

/**
 * Allocates available resin across the scored goals, from highest to lowest priority.
 * Each goal can receive up to MAX_RUNS_PER_GOAL runs before moving to the next.
 *
 * @param scoredGoals - Output of `filterAndScoreGoals`, already sorted descending.
 * @param currentResin - Projected current resin (0–200).
 */
export function allocateResin(
  scoredGoals: ScoredGoal[],
  currentResin: number,
): PlannerCalculatorResult {
  const sorted = [...scoredGoals].sort((a, b) => b.totalScore - a.totalScore);

  const route: RouteItem[] = [];
  let remainingResin = currentResin;

  for (const sg of sorted) {
    if (remainingResin <= 0) break;

    const maxAffordableRuns = Math.floor(remainingResin / sg.resinPerRun);
    const runs = Math.min(maxAffordableRuns, MAX_RUNS_PER_GOAL);
    if (runs === 0) continue;

    const resinCost = runs * sg.resinPerRun;
    remainingResin -= resinCost;

    route.push({
      goalId: sg.goal.id,
      targetKey: sg.goal.targetKey,
      goalType: sg.goal.goalType,
      talentType: sg.goal.talentType,
      domainName: sg.sourceName,
      resinCost,
      runs,
      totalScore: sg.totalScore,
      isTimeGated: sg.isTimeGated,
      characterKey: sg.characterKey,
      characterScore: sg.characterScore,
      resourceName: sg.resourceName,
    });
  }

  return {
    route,
    unallocatedResin: remainingResin,
  };
}
