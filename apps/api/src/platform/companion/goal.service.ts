import { z } from 'zod';
import { BadRequestError, NotFoundError, ConflictError } from '@/core/errors/app-error.js';
import { GoalRepository } from './goal.repository.js';
import { prisma } from '@/core/db/prisma.js';
import { GoalType } from '@prisma/client';
import type { UpgradeGoal } from '@prisma/client';
import { createRequire } from 'module';

// -------------------------------------------------------
// Static seed data (loaded once at module init)
// -------------------------------------------------------

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const characterMaterials: Record<
  string,
  any
> = require('../../games/genshin/static/character-materials.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const weaponMaterials: Record<
  string,
  any
> = require('../../games/genshin/static/weapon-materials.json');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const domainSchedule: any = require('../../games/genshin/static/domain-schedule.json');

// -------------------------------------------------------
// Zod validation
// -------------------------------------------------------

const TALENT_TYPES = ['normal', 'skill', 'burst'] as const;

const CreateGoalSchema = z
  .object({
    goalType: z.nativeEnum(GoalType),
    targetKey: z.string().min(1, 'targetKey is required'),
    fromPhase: z.number().int().min(0).max(5),
    toPhase: z.number().int().min(1).max(6),
    talentType: z.enum(TALENT_TYPES).nullable().default(null),
  })
  .superRefine((d, ctx) => {
    if (d.fromPhase >= d.toPhase) {
      ctx.addIssue({
        code: 'custom',
        path: ['fromPhase'],
        message: 'fromPhase must be less than toPhase',
      });
    }
    if (d.goalType === GoalType.CHARACTER_TALENT && d.talentType === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['talentType'],
        message: 'talentType is required for CHARACTER_TALENT goals',
      });
    }
    if (d.goalType !== GoalType.CHARACTER_TALENT && d.talentType !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['talentType'],
        message: 'talentType must be null for non-talent goals',
      });
    }
  });

type CreateGoalData = z.infer<typeof CreateGoalSchema>;

// -------------------------------------------------------
// Asia server weekday helper
// -------------------------------------------------------

/**
 * Returns the Asia server weekday index for "right now".
 * Asia daily reset = 20:00 UTC = 04:00 UTC+8.
 * After 20:00 UTC the server has rolled over to the next calendar day.
 * Returns 0 (Monday) through 6 (Sunday).
 */
function getAsiaServerWeekday(): number {
  const now = new Date();
  // Add 4h so that the 20:00 UTC boundary becomes midnight UTC
  const shifted = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  // getUTCDay() returns 0=Sunday, 1=Monday…6=Saturday
  // Remap to 0=Monday…6=Sunday
  const utcDay = shifted.getUTCDay();
  return utcDay === 0 ? 6 : utcDay - 1;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// -------------------------------------------------------
// Material aggregation helpers
// -------------------------------------------------------

type JsonRow = Record<string, unknown>;

function num(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function addToMap(map: Record<string, number>, key: string, qty: number): void {
  if (!key || qty <= 0) return;
  map[key] = (map[key] ?? 0) + qty;
}

function aggregateCharacterAscension(
  charData: JsonRow[],
  fromPhase: number,
  toPhase: number,
  materials: JsonRow,
): Record<string, number> {
  const result: Record<string, number> = {};
  const GEM_TIERS = ['Sliver', 'Fragment', 'Chunk', 'Gemstone'];
  const gem = str(materials['gem']);
  const boss = str(materials['boss']);
  const local = str(materials['local']);
  const comT1 = str(materials['commonT1']);
  const comT2 = str(materials['commonT2']);
  const comT3 = str(materials['commonT3']);

  for (const phase of charData) {
    const p = num(phase['phase']);
    if (p <= fromPhase || p > toPhase) continue;
    GEM_TIERS.forEach((tier) => {
      const qty = num(phase[`gem${tier}`]);
      if (qty > 0) addToMap(result, `${gem}${tier}`, qty);
    });
    addToMap(result, boss, num(phase['boss']));
    addToMap(result, local, num(phase['local']));
    addToMap(result, comT1, num(phase['commonT1']));
    addToMap(result, comT2, num(phase['commonT2']));
    addToMap(result, comT3, num(phase['commonT3']));
  }
  return result;
}

function aggregateCharacterTalent(
  talentCosts: JsonRow[],
  fromPhase: number,
  toPhase: number,
  talent: JsonRow,
): Record<string, number> {
  const result: Record<string, number> = {};
  const BOOK_TIERS = ['T1', 'T2', 'T3'];
  const book = str(talent['book']);
  const bossWeekly = str(talent['bossWeekly']);

  for (const cost of talentCosts) {
    const tier = num(cost['tier']);
    if (tier <= fromPhase || tier > toPhase) continue;
    BOOK_TIERS.forEach((t) => {
      const qty = num(cost[`book${t}`]);
      if (qty > 0) addToMap(result, `${book}Book${t}`, qty);
    });
    addToMap(result, str(cost['commonT1']) || 'Unknown', num(cost['commonT1']));
    addToMap(result, str(cost['commonT2']) || 'Unknown', num(cost['commonT2']));
    addToMap(result, str(cost['commonT3']) || 'Unknown', num(cost['commonT3']));
    addToMap(result, bossWeekly, num(cost['bossWeekly']));
    if (num(cost['crown']) > 0) addToMap(result, 'CrownOfInsight', num(cost['crown']));
  }
  return result;
}

function aggregateWeaponAscension(
  weapData: JsonRow[],
  fromPhase: number,
  toPhase: number,
  materials: JsonRow,
): Record<string, number> {
  const result: Record<string, number> = {};
  const matT1 = str(materials['matT1']);
  const matT2 = str(materials['matT2']);
  const matT3 = str(materials['matT3']);
  const comT1 = str(materials['commonT1']);
  const comT2 = str(materials['commonT2']);
  const comT3 = str(materials['commonT3']);
  const billet = str(materials['billet']);

  for (const phase of weapData) {
    const p = num(phase['phase']);
    if (p <= fromPhase || p > toPhase) continue;
    addToMap(result, matT1, num(phase['matT1']));
    addToMap(result, matT2, num(phase['matT2']));
    addToMap(result, matT3, num(phase['matT3']));
    addToMap(result, comT1, num(phase['commonT1']));
    addToMap(result, comT2, num(phase['commonT2']));
    addToMap(result, comT3, num(phase['commonT3']));
    addToMap(result, billet, num(phase['billet']));
  }
  return result;
}

function mergeInto(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, qty] of Object.entries(source)) {
    addToMap(target, key, qty);
  }
}

// -------------------------------------------------------
// Public service types
// -------------------------------------------------------

export interface MaterialDelta {
  needed: Record<string, number>;
  inventory: Record<string, number>;
  delta: Record<string, number>;
}

export interface TodayDomain {
  domainKey: string;
  name: string;
  location: string;
  drops: string[];
  dropKeys: string[];
  relevantToGoals: boolean;
}

export interface TodayResult {
  serverDay: string;
  domains: TodayDomain[];
}

// -------------------------------------------------------
// GoalService
// -------------------------------------------------------

export class GoalService {
  private readonly repository: GoalRepository;

  constructor() {
    this.repository = new GoalRepository();
  }

  /**
   * Creates a new upgrade goal for the user after Zod validation.
   * Throws BadRequestError on invalid input.
   * Throws ConflictError if a duplicate goal already exists.
   */
  async createGoal(userId: string, rawInput: unknown): Promise<UpgradeGoal> {
    const result = CreateGoalSchema.safeParse(rawInput);
    if (!result.success) {
      throw new BadRequestError(result.error.errors[0]?.message ?? 'Invalid goal input');
    }

    const data: CreateGoalData = result.data;

    // Validate targetKey exists in static data
    if (
      data.goalType === GoalType.CHARACTER_ASCENSION ||
      data.goalType === GoalType.CHARACTER_TALENT
    ) {
      if (!characterMaterials[data.targetKey]) {
        throw new BadRequestError(
          `Character "${data.targetKey}" was not found in the static data. ` +
            `Check the spelling (e.g. "HuTao", "RaidenShogun"). ` +
            `Support for more characters will be added in a future update.`,
        );
      }
    } else if (data.goalType === GoalType.WEAPON_ASCENSION) {
      if (!weaponMaterials[data.targetKey]) {
        throw new BadRequestError(
          `Weapon "${data.targetKey}" was not found in the static data. ` +
            `Check the spelling (e.g. "StaffOfHoma", "EngulfingLightning"). ` +
            `Support for more weapons will be added in a future update.`,
        );
      }
    }

    try {
      return await this.repository.create(userId, {
        goalType: data.goalType,
        targetKey: data.targetKey,
        fromPhase: data.fromPhase,
        toPhase: data.toPhase,
        talentType: data.talentType,
      });
    } catch (error: unknown) {
      // Prisma unique constraint violation (P2002)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictError(
          `A goal for "${data.targetKey}" (${data.goalType}${
            data.talentType ? ` / ${data.talentType}` : ''
          }) already exists. Delete the existing goal first.`,
        );
      }
      throw error;
    }
  }

  async listGoals(userId: string): Promise<UpgradeGoal[]> {
    return this.repository.findAllByUserId(userId);
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const goal = await this.repository.findByIdAndUserId(goalId, userId);
    if (!goal) {
      throw new NotFoundError('Goal not found or does not belong to you.');
    }
    await this.repository.deleteById(goalId);
  }

  /**
   * Computes the full material delta across all active goals for the user.
   * Returns needed (total from goals), inventory (from GOOD import), and delta (needed - inventory).
   */
  async getMaterialDelta(userId: string): Promise<MaterialDelta> {
    const goals = await this.repository.findAllByUserId(userId);

    const needed: Record<string, number> = {};

    for (const goal of goals) {
      let goalMaterials: Record<string, number> = {};

      if (goal.goalType === GoalType.CHARACTER_ASCENSION) {
        const charData = characterMaterials[goal.targetKey];
        if (!charData) continue;
        goalMaterials = aggregateCharacterAscension(
          charData.ascension as JsonRow[],
          goal.fromPhase,
          goal.toPhase,
          charData.materials as JsonRow,
        );
      } else if (goal.goalType === GoalType.CHARACTER_TALENT) {
        const charData = characterMaterials[goal.targetKey];
        if (!charData) continue;
        goalMaterials = aggregateCharacterTalent(
          charData.talent.costs as JsonRow[],
          goal.fromPhase,
          goal.toPhase,
          charData.talent as JsonRow,
        );
      } else if (goal.goalType === GoalType.WEAPON_ASCENSION) {
        const weapData = weaponMaterials[goal.targetKey];
        if (!weapData) continue;
        goalMaterials = aggregateWeaponAscension(
          weapData.ascension as JsonRow[],
          goal.fromPhase,
          goal.toPhase,
          weapData.materials as JsonRow,
        );
      }

      mergeInto(needed, goalMaterials);
    }

    // Fetch the user's material inventory from the DB
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    const inventory: Record<string, number> = {};

    if (account) {
      const rows = await prisma.genshinMaterial.findMany({
        where: { accountId: account.id },
      });
      for (const row of rows) {
        inventory[row.itemKey] = row.quantity;
      }
    }

    // Compute delta: max(0, needed - inventory)
    const delta: Record<string, number> = {};
    for (const [key, qty] of Object.entries(needed)) {
      const have = inventory[key] ?? 0;
      const remaining = qty - have;
      delta[key] = remaining > 0 ? remaining : 0;
    }

    return { needed, inventory, delta };
  }

  /**
   * Returns today's open domains filtered by the user's active goals.
   * "Today" is determined by the Asia server day boundary (20:00 UTC).
   */
  async getTodayDomains(userId: string): Promise<TodayResult> {
    const todayIndex = getAsiaServerWeekday();
    const serverDay = DAY_NAMES[todayIndex]!;
    const isSunday = todayIndex === 6;

    const { needed } = await this.getMaterialDelta(userId);
    const neededKeys = new Set(Object.keys(needed));

    type DomainEntry = {
      domainKey: string;
      name: string;
      location: string;
      days: number[];
      drops: string[];
      dropKeys: string[];
      materialGroup?: string;
    };

    const mapDomain = (d: DomainEntry, drops: string[]): TodayDomain => ({
      domainKey: d.domainKey,
      name: d.name,
      location: d.location,
      drops,
      dropKeys: d.dropKeys,
      relevantToGoals: d.dropKeys.some((k) => neededKeys.has(k)),
    });

    const talentDomains: TodayDomain[] = (domainSchedule.talentDomains as DomainEntry[])
      .filter((d) => isSunday || d.days.includes(todayIndex))
      .map((d) => mapDomain(d, d.drops));

    const weaponDomains: TodayDomain[] = (domainSchedule.weaponDomains as DomainEntry[])
      .filter((d) => isSunday || d.days.includes(todayIndex))
      .map((d) => mapDomain(d, d.materialGroup ? [d.materialGroup] : d.drops));

    // Deduplicate by (domainKey + drops)
    const seen = new Set<string>();
    const domains: TodayDomain[] = [];
    for (const d of [...talentDomains, ...weaponDomains]) {
      const key = `${d.domainKey}-${d.drops.join(',')}`;
      if (!seen.has(key)) {
        seen.add(key);
        domains.push(d);
      }
    }

    return { serverDay, domains };
  }
}
