import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

import {
  characterKeySchema,
  contextualEffectSchema,
  contextualReviewSchema,
  contextualRoles,
  contextualSourceSchema,
} from '@celestia/api-contracts';
import { z } from 'zod';

import { digest } from './guide-knowledge.pack.js';

export const factKeys = [
  'role',
  'burst',
  'set.MarechausseeHunter',
  'set.GoldenTroupe',
  'set.ViridescentVenerer',
  'mh.hpChange',
  'mh.onField',
  'mh.stacks',
  'mh.window',
  'gt.field',
  'vv.swirl',
  'vv.elementMatches',
  'vv.targetElement',
  'vv.onField',
  'vv.window',
  'team.fischl',
  'team.fischlAscension',
  'team.activeSelected',
  'team.oz',
  'team.electroReaction',
] as const;
export type FactKey = (typeof factKeys)[number];
export type ContextPredicate =
  | { op: 'all' | 'any'; args: ContextPredicate[] }
  | { op: 'not'; arg: ContextPredicate }
  | { op: 'known'; fact: FactKey }
  | { op: 'equals'; fact: FactKey; value: string | number | boolean }
  | { op: 'atLeast'; fact: FactKey; value: number };
const fact = z.enum(factKeys);
const predicate: z.ZodType<ContextPredicate> = z.lazy(() =>
  z.union([
    z.object({ op: z.enum(['all', 'any']), args: z.array(predicate).min(1).max(16) }).strict(),
    z.object({ op: z.literal('not'), arg: predicate }).strict(),
    z.object({ op: z.literal('known'), fact }).strict(),
    z
      .object({
        op: z.literal('equals'),
        fact,
        value: z.union([z.string().max(80), z.number().finite(), z.boolean()]),
      })
      .strict(),
    z.object({ op: z.literal('atLeast'), fact, value: z.number().int().min(0).max(6) }).strict(),
  ]),
);
const id = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
const claimBase = {
  id,
  order: z.number().int().min(0).max(1000),
  subjects: z.array(characterKeySchema).min(1).max(8),
  topic: z.enum([
    'talents',
    'energy',
    'team',
    'MarechausseeHunter',
    'GoldenTroupe',
    'ViridescentVenerer',
  ]),
  status: z.enum(['active', 'excluded']),
  conflicted: z.boolean(),
  support: z.enum(['reviewed_scope', 'unsupported_scope']),
  review: contextualReviewSchema.extend({ type: z.enum(['agent', 'human']) }),
  sourceIds: z.array(id).min(1).max(12),
  eligibility: predicate,
  condition: predicate,
  effect: contextualEffectSchema,
  excludedReason: z.string().min(1).max(500).nullable(),
};
const claim = z.discriminatedUnion('kind', [
  z.object({ ...claimBase, kind: z.literal('mechanical') }).strict(),
  z.object({ ...claimBase, kind: z.literal('editorial') }).strict(),
]);
const schema = z
  .object({
    schemaVersion: z.literal(2),
    version: z.string().regex(/^k2-\d+$/),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    subjects: z
      .array(
        z
          .object({
            key: characterKeySchema,
            roles: z.array(z.enum(contextualRoles)).min(1).max(5),
            externalReading: z
              .array(
                z
                  .object({
                    label: z.string().min(1).max(100),
                    url: z.string().url().startsWith('https://'),
                  })
                  .strict(),
              )
              .max(4),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    sources: z.array(contextualSourceSchema).min(1).max(32),
    claims: z.array(claim).min(1).max(80),
    limitations: z.array(z.string().min(1).max(1000)).min(1).max(12),
  })
  .strict();
export type ContextualPack = z.infer<typeof schema>;
export type ContextualClaim = ContextualPack['claims'][number];
const require = createRequire(import.meta.url);
export const contextualSourceRegistry = z
  .array(contextualSourceSchema)
  .parse(require('../../static/contextual-sources.json'));
function boundTree(raw: unknown, maxNodes: number, maxDepth: number) {
  const pending = [{ value: raw, depth: 0 }];
  let count = 0;
  while (pending.length) {
    const { value, depth } = pending.pop()!;
    if (++count > maxNodes || depth > maxDepth)
      throw new Error('Contextual expression exceeds bounds.');
    if (typeof value === 'string' && value.length > 2000)
      throw new Error('Oversized contextual string.');
    if (value && typeof value === 'object') {
      const children = Object.values(value);
      if (children.length + pending.length + count > maxNodes)
        throw new Error('Oversized contextual graph.');
      for (const child of children) pending.push({ value: child, depth: depth + 1 });
    }
  }
}
export function validateContextualPack(
  raw: unknown,
  bytes?: Readonly<Record<string, Uint8Array>>,
  registry: unknown = contextualSourceRegistry,
): ContextualPack {
  boundTree(raw, 16000, 24);
  if (raw && typeof raw === 'object' && 'claims' in raw && Array.isArray(raw.claims))
    for (const item of raw.claims) {
      if (item && typeof item === 'object') {
        boundTree(item.condition, 256, 16);
        boundTree(item.eligibility, 256, 16);
      }
    }
  const pack = schema.parse(raw);
  const trusted = z.array(contextualSourceSchema).min(1).max(32).parse(registry);
  const unique = (values: string[]) => new Set(values).size === values.length;
  if (
    !unique(pack.claims.map((entry) => entry.id)) ||
    !unique(pack.sources.map((entry) => entry.id)) ||
    !unique(pack.subjects.map((entry) => entry.key)) ||
    !unique(trusted.map((entry) => entry.id)) ||
    trusted.length !== pack.sources.length
  )
    throw new Error('Duplicate contextual ID.');
  for (const source of pack.sources) {
    const expected = trusted.find((entry) => entry.id === source.id);
    if (!expected || digest(source) !== digest(expected))
      throw new Error('Unrecognized contextual source/hash.');
    if (
      bytes &&
      (!bytes[source.id] ||
        createHash('sha256').update(bytes[source.id]).digest('hex') !== source.sha256)
    )
      throw new Error('Contextual source byte hash mismatch.');
  }
  for (const entry of pack.claims) {
    const validatePredicate = (node: ContextPredicate): void => {
      if ('args' in node) return node.args.forEach(validatePredicate);
      if (node.op === 'not') return validatePredicate(node.arg);
      if (node.op === 'known') return;
      const numeric =
        node.fact.startsWith('set.') || ['mh.stacks', 'team.fischlAscension'].includes(node.fact);
      const choices: Partial<Record<FactKey, readonly string[]>> = {
        role: contextualRoles,
        burst: ['unknown', 'use', 'skip'],
        'mh.window': ['within_5s', 'expired'],
        'vv.window': ['within_10s', 'expired'],
        'gt.field': ['off_field', 'returned_under_2s_with_bonus', 'on_field_at_least_2s'],
        'vv.targetElement': ['pyro', 'hydro', 'electro', 'cryo', 'anemo', 'geo', 'dendro'],
      };
      if (
        node.op === 'atLeast'
          ? !numeric
          : numeric ||
            (choices[node.fact]
              ? !choices[node.fact]!.includes(String(node.value))
              : typeof node.value !== 'boolean')
      )
        throw new Error('Contextual predicate fact/value type mismatch.');
    };
    validatePredicate(entry.eligibility);
    validatePredicate(entry.condition);
    if (
      !unique(entry.sourceIds) ||
      !unique(entry.subjects) ||
      entry.sourceIds.some((ref) => !pack.sources.some((source) => source.id === ref)) ||
      entry.subjects.some((key) => !pack.subjects.some((subject) => subject.key === key))
    )
      throw new Error('Dangling contextual reference.');
    const mechanical = ['crit_rate', 'damage_bonus', 'resistance_reduction'].includes(
      entry.effect.kind,
    );
    if (mechanical !== (entry.kind === 'mechanical'))
      throw new Error('Claim/effect kind mismatch.');
    if (
      entry.status === 'active' &&
      (entry.review.state !== 'reviewed' ||
        entry.conflicted ||
        entry.support !== 'reviewed_scope' ||
        entry.excludedReason !== null)
    )
      throw new Error('Unreviewed/conflicted active contextual claim.');
    if (entry.status === 'excluded' && !entry.excludedReason)
      throw new Error('Excluded claim requires coverage reason.');
  }
  const { contentHash, ...content } = pack;
  if (contentHash !== digest(content)) throw new Error('Contextual content hash mismatch.');
  return pack;
}
