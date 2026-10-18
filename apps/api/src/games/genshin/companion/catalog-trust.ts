import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

import type { AdviceGoalInput, GoalAdvice, RouteAdvice } from '@celestia/api-contracts';
import { z } from 'zod';

const require = createRequire(import.meta.url);
const integer = z.number().finite().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const key = z.string().regex(/^[A-Z][A-Za-z0-9_]*$/);
const keys = <T extends string>(names: readonly T[]) =>
  Object.fromEntries(names.map((name) => [name, key])) as Record<T, typeof key>;
const commonCosts = z.object({
  commonT1: integer,
  commonT2: integer,
  commonT3: integer,
  mora: integer,
});
const common = ['commonT1', 'commonT2', 'commonT3'] as const;
const gems = ['gemSliver', 'gemFragment', 'gemChunk', 'gemGemstone'] as const;
const weaponTiers = [
  'matT1',
  'matT2',
  'matT3',
  'matT4',
  'eliteT1',
  'eliteT2',
  'eliteT3',
  ...common,
] as const;
const ascensionSchema = z.object({
  materials: z.object(keys(['gem', 'boss', 'local', ...common])).strict(),
  ascension: z
    .array(
      commonCosts
        .extend({
          phase: integer,
          gemSliver: integer,
          gemFragment: integer,
          gemChunk: integer,
          gemGemstone: integer,
          boss: integer,
          local: integer,
        })
        .strict(),
    )
    .length(6),
});
const talentSchema = z.object({
  materials: z.object(keys(common)),
  talent: z.object({
    book: key,
    bossWeekly: key,
    costs: z.array(
      commonCosts
        .extend({
          tier: integer,
          bookT1: integer,
          bookT2: integer,
          bookT3: integer,
          bossWeekly: integer,
          crown: integer,
        })
        .strict(),
    ),
  }),
});
const weaponSchema = z.object({
  materialGroup: key,
  materials: z.object(keys(weaponTiers)).strict(),
  ascension: z
    .array(
      commonCosts
        .extend({
          phase: integer,
          matT1: integer,
          matT2: integer,
          matT3: integer,
          matT4: integer,
          eliteT1: integer,
          eliteT2: integer,
          eliteT3: integer,
        })
        .strict(),
    )
    .length(6),
});
const materialSchema = z
  .object({ key, name: z.string().min(1), gameItemId: integer.positive() })
  .strict();
const domainSchema = z
  .object({
    domainKey: key,
    name: z.string().min(1),
    location: z.string().min(1),
    days: z
      .array(integer.max(6))
      .nonempty()
      .refine((days) => new Set(days).size === days.length),
    drops: z.array(key).nonempty(),
    dropKeys: z.array(key).nonempty(),
    resinPerClaim: integer.positive(),
  })
  .strict();
const sourceSchema = z
  .object({
    authority: z.enum(['primary', 'owner']),
    reference: z.string().min(1),
    localEvidence: z.string().min(1),
    verifier: z.string().min(1),
    reviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    observedOn: z.string().nullable(),
    gameVersion: z.string().nullable(),
  })
  .strict();
const claimSchema = z
  .object({
    targetKey: key,
    goalType: z.enum(['CHARACTER_ASCENSION', 'CHARACTER_TALENT', 'WEAPON_ASCENSION']),
    from: integer.max(9),
    to: integer.min(1).max(10),
    materialReferences: z.enum(['canonical', 'local_keys']).default('canonical'),
    fields: z.array(z.string()).nonempty(),
    fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    sources: z.array(sourceSchema).nonempty(),
    conflicts: z.array(z.string()),
    routeFingerprint: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .nullable(),
    routeSources: z.array(sourceSchema),
  })
  .strict()
  .refine(
    (claim) =>
      claim.from < claim.to &&
      (claim.goalType === 'CHARACTER_TALENT' ? claim.from >= 1 : claim.to <= 6) &&
      (claim.materialReferences !== 'local_keys' ||
        claim.sources.every((source) => source.authority === 'owner')),
    'Unsupported claim range',
  );

export interface CatalogInput {
  characters: unknown;
  weapons: unknown;
  references: unknown;
  domains: unknown;
  manifest: unknown;
}

/** Recursively sorted object keys, unchanged array order, JSON numbers; SHA256 of UTF-8. */
export function stableFingerprint(value: unknown): string {
  function stable(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(stable);
    if (item !== null && typeof item === 'object') {
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => a.localeCompare(b, 'en'))
          .map(([k, v]) => [k, stable(v)]),
      );
    }
    return item;
  }
  return createHash('sha256')
    .update(JSON.stringify(stable(value)))
    .digest('hex');
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function contiguous(values: number[], start: number, end: number): boolean {
  return values.length === end - start + 1 && values.every((n, i) => n === start + i);
}
const unavailable = (reason: string): GoalAdvice => ({ available: false, reason });
const routeGap =
  'Route advice unavailable: source location, weekdays and resin per claim have not all been verified.';

export class GenshinCatalogTrust {
  constructor(private readonly input: CatalogInput) {}

  hasTarget(goalType: string, targetKey: string): boolean {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(targetKey)) return false;
    const catalog = goalType === 'WEAPON_ASCENSION' ? this.input.weapons : this.input.characters;
    return (
      Object.hasOwn(record(catalog), targetKey) && typeof record(catalog)[targetKey] === 'object'
    );
  }

  getAdvice(goal: AdviceGoalInput): GoalAdvice {
    const talent = goal.goalType === 'CHARACTER_TALENT';
    if (
      !['CHARACTER_ASCENSION', 'CHARACTER_TALENT', 'WEAPON_ASCENSION'].includes(goal.goalType) ||
      !Number.isInteger(goal.fromPhase) ||
      !Number.isInteger(goal.toPhase) ||
      goal.fromPhase < (talent ? 1 : 0) ||
      goal.toPhase > (talent ? 10 : 6) ||
      goal.fromPhase >= goal.toPhase ||
      (talent
        ? !['normal', 'skill', 'burst'].includes(goal.talentType ?? '')
        : goal.talentType !== null)
    ) {
      return unavailable(
        'Unsupported goal range. Ascension supports phases 0–6; base talents support levels 1–10 with a selected talent.',
      );
    }
    if (!this.hasTarget(goal.goalType, goal.targetKey)) {
      return unavailable('This target has no verified costs in the supported catalog.');
    }
    const manifest = z.array(claimSchema).safeParse(this.input.manifest);
    if (!manifest.success) return unavailable('Catalog evidence is invalid or missing.');
    const claims = manifest.data.filter(
      (entry) => entry.targetKey === goal.targetKey && entry.goalType === goal.goalType,
    );
    // Prefer the narrower historical primary slice over a full-range owner claim.
    const covering = claims
      .filter((entry) => entry.from <= goal.fromPhase && entry.to >= goal.toPhase)
      .sort((a, b) => a.to - a.from - (b.to - b.from));
    if (covering[1] && covering[0]!.to - covering[0]!.from === covering[1].to - covering[1].from)
      return unavailable('Ambiguous catalog evidence covers these costs.');
    const claim = covering[0];
    if (!claim) return unavailable('No primary or owner evidence covers these upgrade costs.');
    if (claim.conflicts.length > 0)
      return unavailable(`Unresolved source conflict: ${claim.conflicts.join('; ')}`);
    try {
      const projected = this.project(
        goal.targetKey,
        goal.goalType,
        claim.from,
        claim.to,
        claim.materialReferences,
      );
      const raw = record(
        record(goal.goalType === 'WEAPON_ASCENSION' ? this.input.weapons : this.input.characters)[
          goal.targetKey
        ],
      );
      const materials = record(raw.materials);
      const fields =
        goal.goalType === 'CHARACTER_TALENT'
          ? [
              'talent.book',
              `talent.costs[tier=${claim.from + 1}..${claim.to}]`,
              ...(projected.steps.some(
                (step) => (step.costs[record(raw.talent).bossWeekly as string] ?? 0) > 0,
              )
                ? ['talent.bossWeekly']
                : []),
              ...common
                .filter((field) =>
                  projected.references.some((reference) => reference.key === materials[field]),
                )
                .map((field) => `materials.${field}`),
              'material-references[consumed keys]',
            ]
          : goal.goalType === 'WEAPON_ASCENSION'
            ? [
                'materialGroup',
                `ascension[phase=${claim.from + 1}..${claim.to}]`,
                ...weaponTiers.map((field) => `materials.${field}`),
                'material-references[consumed keys]',
              ]
            : [
                `ascension[phase=${claim.from + 1}..${claim.to}]`,
                ...['gem', 'boss', 'local', ...common].map((field) => `materials.${field}`),
                'material-references[consumed keys]',
              ];
      if (
        claim.fields.length !== fields.length ||
        new Set(claim.fields).size !== fields.length ||
        fields.some((field) => !claim.fields.includes(field))
      ) {
        return unavailable(
          'Source field coverage does not match the exact consumed costs and dependencies.',
        );
      }
      if (stableFingerprint(projected) !== claim.fingerprint)
        return unavailable(
          'Verified costs or required material references changed; review the evidence again.',
        );
      const costs: Record<string, number> = {};
      for (const step of projected.steps) {
        if (step.phase <= goal.fromPhase || step.phase > goal.toPhase) continue;
        for (const [material, count] of Object.entries(step.costs))
          costs[material] = (costs[material] ?? 0) + count;
      }
      let route: RouteAdvice = { available: false, reason: routeGap };
      const rawDomain = record(this.input.domains)[`${goal.targetKey}:${goal.goalType}`];
      if (claim.routeFingerprint && claim.routeSources.length > 0) {
        const parsed = domainSchema.safeParse(rawDomain);
        if (
          !parsed.success ||
          parsed.data.dropKeys.some((k) => !projected.references.some((r) => r.key === k)) ||
          !parsed.data.drops.includes(projected.group) ||
          stableFingerprint({
            domain: parsed.success ? parsed.data : rawDomain,
            costFingerprint: claim.fingerprint,
          }) !== claim.routeFingerprint
        ) {
          route = {
            available: false,
            reason:
              'The verified route or its material joins changed; route advice is unavailable.',
          };
        } else route = { available: true, domain: parsed.data };
      }
      const conversionGroups =
        goal.goalType === 'WEAPON_ASCENSION'
          ? []
          : [
              common.map((field) => materials[field] as string),
              gems.map((field) => `${materials.gem}${field.slice(3)}`),
              ...('book' in record(raw.talent)
                ? [
                    [
                      `TeachingsOf${record(raw.talent).book}`,
                      `GuideTo${record(raw.talent).book}`,
                      `PhilosophiesOf${record(raw.talent).book}`,
                    ],
                  ]
                : []),
            ];
      return { available: true, costs, sources: claim.sources, route, conversionGroups };
    } catch {
      return unavailable(
        'Catalog costs, phase rows or required material references are invalid or missing.',
      );
    }
  }

  /** Owner claims bind local keys without inventing missing game IDs or source verification. */
  project(
    targetKey: string,
    goalType: string,
    from: number,
    to: number,
    materialReferences: 'canonical' | 'local_keys' = 'canonical',
  ) {
    const raw = record(
      goalType === 'WEAPON_ASCENSION' ? this.input.weapons : this.input.characters,
    )[targetKey];
    const references = record(this.input.references);
    const steps: { phase: number; costs: Record<string, number> }[] = [];
    let group = '';
    const add = (costs: Record<string, number>, material: string, quantity: number) => {
      if (quantity > 0) costs[material] = (costs[material] ?? 0) + quantity;
    };
    if (goalType === 'CHARACTER_TALENT') {
      const data = talentSchema.parse(raw);
      const rows = data.talent.costs;
      if (
        !contiguous(
          rows.map((row) => row.tier),
          2,
          10,
        )
      )
        throw new Error('Talent rows');
      group = data.talent.book;
      for (const row of rows.filter((row) => row.tier > from && row.tier <= to)) {
        const costs: Record<string, number> = {};
        add(costs, `TeachingsOf${group}`, row.bookT1);
        add(costs, `GuideTo${group}`, row.bookT2);
        add(costs, `PhilosophiesOf${group}`, row.bookT3);
        add(costs, data.talent.bossWeekly, row.bossWeekly);
        add(costs, 'CrownOfInsight', row.crown);
        for (const field of common) add(costs, data.materials[field]!, row[field]!);
        add(costs, 'Mora', row.mora);
        steps.push({ phase: row.tier, costs });
      }
    } else if (goalType === 'CHARACTER_ASCENSION') {
      const data = ascensionSchema.parse(raw);
      if (
        !contiguous(
          data.ascension.map((row) => row.phase),
          1,
          6,
        )
      )
        throw new Error('Phases');
      for (const row of data.ascension.filter((row) => row.phase > from && row.phase <= to)) {
        const costs: Record<string, number> = {};
        for (const field of gems) add(costs, `${data.materials.gem}${field.slice(3)}`, row[field]!);
        for (const field of ['boss', 'local', ...common] as const)
          add(costs, data.materials[field]!, row[field]!);
        add(costs, 'Mora', row.mora);
        steps.push({ phase: row.phase, costs });
      }
    } else {
      const data = weaponSchema.parse(raw);
      if (
        !contiguous(
          data.ascension.map((row) => row.phase),
          1,
          6,
        )
      )
        throw new Error('Phases');
      group = data.materialGroup;
      for (const row of data.ascension.filter((row) => row.phase > from && row.phase <= to)) {
        const costs: Record<string, number> = {};
        for (const field of weaponTiers) add(costs, data.materials[field]!, row[field]!);
        add(costs, 'Mora', row.mora);
        steps.push({ phase: row.phase, costs });
      }
    }
    const consumed = [...new Set(steps.flatMap((step) => Object.keys(step.costs)))].sort();
    const joined = consumed.map((material) => {
      if (materialReferences === 'local_keys') return { key: key.parse(material) };
      const reference = materialSchema.parse(references[material]);
      if (reference.key !== material) throw new Error('Material key mismatch');
      return reference;
    });
    return { targetKey, goalType, from, to, group, steps, references: joined };
  }
}

export const catalogInput: CatalogInput = {
  characters: require('../static/character-materials.json'),
  weapons: require('../static/weapon-materials.json'),
  references: require('../static/material-references.json'),
  domains: require('../static/advice-domains.json'),
  manifest: require('../static/catalog-evidence.json'),
};
export const genshinCatalog = new GenshinCatalogTrust(catalogInput);
