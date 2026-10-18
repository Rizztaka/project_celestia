import { createRequire } from 'node:module';

import {
  type AdviceDomain,
  type AdviceGoalInput,
  type GoalAdvice,
  goalIntentSchema,
} from '@celestia/api-contracts';
import { z } from 'zod';

import { stableFingerprint } from './catalog-trust.js';
import { domainSchedule } from './domain-schedule.js';
import { materialConversionGroups } from './material-conversion.js';

const key = z.string().regex(/^[A-Z][A-Za-z0-9]*$/);
const quantity = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const step = z
  .object({ phase: z.number().int().min(1).max(10), costs: z.record(quantity) })
  .strict();
const target = z.object({
  key,
  name: z.string().min(1),
  gameId: quantity,
  ascension: z.array(step).min(1).max(6),
});
const domain = z
  .object({
    domainKey: key,
    name: z.string().min(1),
    location: z.string().min(1),
    days: z.array(z.number().int().min(0).max(6)).min(1),
    drops: z.array(z.string().min(1)).min(1),
    dropKeys: z.array(key).min(1),
    resinPerClaim: quantity,
  })
  .strict();
const schema = z
  .object({
    version: z.literal(1),
    contentFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    source: z
      .object({
        repository: z.string().url(),
        commit: z.string().regex(/^[a-f0-9]{40}$/),
        reviewedOn: z.string(),
        authority: z.literal('community'),
        resinSource: z.string().url(),
        license: z.literal('MIT'),
        sourceHashes: z.record(z.string().regex(/^[a-f0-9]{64}$/)),
      })
      .strict(),
    excludedTargets: z.array(z.object({ file: z.string(), reason: z.string() }).strict()),
    materials: z.record(
      z
        .object({
          key,
          gameItemId: quantity,
          name: z.string().min(1),
          sources: z.array(z.string()),
          domainKey: key.nullable(),
        })
        .strict(),
    ),
    characters: z.record(
      target
        .extend({ talent: z.array(step).max(9), talentUnavailableReason: z.string().nullable() })
        .strict(),
    ),
    weapons: z.record(target.strict()),
    domains: z.record(domain),
  })
  .strict();

/** Exact per-step costs from a pinned community snapshot; no runtime remote fetch or guessed yields. */
export class GenshinProgressionCatalog {
  readonly data: z.infer<typeof schema>;
  readonly conversionGroups: string[][];
  constructor(input: unknown) {
    this.data = schema.parse(input);
    const { contentFingerprint, ...content } = this.data;
    if (stableFingerprint(content) !== contentFingerprint)
      throw new Error(
        'Progression catalog fingerprint mismatch; rebuild and validate the pinned snapshot.',
      );
    for (const collection of [this.data.characters, this.data.weapons]) {
      for (const [targetKey, entry] of Object.entries(collection)) {
        if (targetKey !== entry.key) throw new Error('Progression target key mismatch');
        const character = this.data.characters[targetKey];
        const tables = [
          entry.ascension,
          ...(collection === this.data.characters && character ? [character.talent] : []),
        ];
        for (const rows of tables) {
          const first = rows === entry.ascension ? 1 : 2;
          for (const [index, row] of rows.entries()) {
            if (row.phase !== first + index) throw new Error('Non-contiguous progression rows');
            for (const materialKey of Object.keys(row.costs)) {
              const reference = this.data.materials[materialKey];
              if (!reference || reference.key !== materialKey)
                throw new Error('Missing progression material');
            }
          }
        }
      }
    }
    for (const [domainKey, entry] of Object.entries(this.data.domains)) {
      if (
        entry.domainKey !== domainKey ||
        new Set(entry.days).size !== entry.days.length ||
        new Set(entry.dropKeys).size !== entry.dropKeys.length
      )
        throw new Error('Invalid domain identity or schedule');
      for (const materialKey of entry.dropKeys) {
        if (this.data.materials[materialKey]?.domainKey !== domainKey)
          throw new Error('Invalid domain material join');
      }
    }
    if (
      domainSchedule.length !== Object.keys(this.data.domains).length ||
      domainSchedule.some(
        (entry) =>
          stableFingerprint(entry) !== stableFingerprint(this.data.domains[entry.domainKey]),
      )
    )
      throw new Error(
        'Domain schedule differs from the pinned catalog; rebuild the offline schedule.',
      );
    const freeze = (value: unknown) => {
      if (value && typeof value === 'object') {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
      }
    };
    this.conversionGroups = materialConversionGroups(this.data);
    freeze(this.conversionGroups);
    freeze(this.data);
  }

  hasTarget(goalType: string, targetKey: string): boolean {
    const collection = goalType === 'WEAPON_ASCENSION' ? this.data.weapons : this.data.characters;
    return (
      ['CHARACTER_ASCENSION', 'CHARACTER_TALENT', 'WEAPON_ASCENSION'].includes(goalType) &&
      Object.hasOwn(collection, targetKey)
    );
  }

  getAdvice(goal: AdviceGoalInput): GoalAdvice {
    const intent = goalIntentSchema.safeParse({
      goalType: goal.goalType,
      targetKey: goal.targetKey,
      fromPhase: goal.fromPhase,
      toPhase: goal.toPhase,
      talentType: goal.talentType,
    });
    if (!intent.success)
      return {
        available: false,
        reason: 'Choose ascension phases 0–6 or base talent levels 1–10 with a talent slot.',
      };
    const character = this.data.characters[goal.targetKey];
    const entry =
      goal.goalType === 'WEAPON_ASCENSION' ? this.data.weapons[goal.targetKey] : character;
    if (!entry || !this.hasTarget(goal.goalType, goal.targetKey))
      return { available: false, reason: 'This target is not in the pinned progression catalog.' };
    const rows = goal.goalType === 'CHARACTER_TALENT' ? (character?.talent ?? []) : entry.ascension;
    if (!rows.length)
      return {
        available: false,
        reason: character?.talentUnavailableReason ?? 'These costs are unavailable.',
      };
    const selected = rows.filter((row) => row.phase > goal.fromPhase && row.phase <= goal.toPhase);
    if (selected.length !== goal.toPhase - goal.fromPhase)
      return {
        available: false,
        reason: `This target supports upgrades only through ${rows.at(-1)!.phase}.`,
      };
    const costs: Record<string, number> = {};
    for (const row of selected)
      for (const [materialKey, count] of Object.entries(row.costs))
        costs[materialKey] = (costs[materialKey] ?? 0) + count;
    const domainKeys = [
      ...new Set(
        Object.keys(costs).flatMap(
          (materialKey) => this.data.materials[materialKey]?.domainKey ?? [],
        ),
      ),
    ];
    const routes: AdviceDomain[] = domainKeys.map((domainKey) =>
      domainSchedule.find((entry) => entry.domainKey === domainKey)!,
    );
    const source = this.data.source;
    return {
      available: true,
      costs,
      sources: [
        {
          authority: 'community',
          reference: `${source.repository}/tree/${source.commit}`,
          localEvidence: 'docs/plans/production-readiness/sources.md',
          verifier: 'Pinned catalog normalization and source-join validation',
          reviewedOn: source.reviewedOn,
          observedOn: null,
          gameVersion: null,
        },
      ],
      routes,
      conversionGroups: this.conversionGroups,
      route:
        routes.length === 1
          ? { available: true, domain: routes[0]! }
          : {
              available: false,
              reason: routes.length
                ? 'This goal uses multiple material domains; see the Today plan for each source.'
                : 'These materials come from bosses, enemies or gathering rather than a weekday material domain.',
            },
    };
  }
}
const require = createRequire(import.meta.url);
export const progressionCatalog = new GenshinProgressionCatalog(
  require('../static/progression-catalog.json'),
);
