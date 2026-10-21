import { createHash } from 'node:crypto';

import { z } from 'zod';

export type Predicate =
  | { all: Predicate[] }
  | { any: Predicate[] }
  | { not: Predicate }
  | { kind: 'characterIs'; key: 'Keqing' }
  | { kind: 'weaponIs'; key: 'HarbingerOfDawn' }
  | { kind: 'hpAbove'; percent: 90 }
  | { kind: 'refinementKnown' };
const id = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
// Preflight bounds the tree before recursive schema parsing (including hostile depth).
const predicate: z.ZodType<Predicate> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(predicate).min(1).max(16) }).strict(),
    z.object({ any: z.array(predicate).min(1).max(16) }).strict(),
    z.object({ not: predicate }).strict(),
    z.object({ kind: z.literal('characterIs'), key: z.literal('Keqing') }).strict(),
    z.object({ kind: z.literal('weaponIs'), key: z.literal('HarbingerOfDawn') }).strict(),
    z.object({ kind: z.literal('hpAbove'), percent: z.literal(90) }).strict(),
    z.object({ kind: z.literal('refinementKnown') }).strict(),
  ]),
);
const packSchema = z
  .object({
    schemaVersion: z.literal(1),
    version: z.literal('k1-1'),
    contentHash: hash,
    review: z
      .object({
        reviewer: z.string().min(1).max(100),
        type: z.literal('agent'),
        date: z.literal('2026-10-19'),
        scope: z.string().min(1).max(1000),
      })
      .strict(),
    sources: z
      .array(
        z
          .object({
            id,
            url: z.string().url().startsWith('https://'),
            revision: z.string().regex(/^[a-f0-9]{40}$/),
            sha256: hash,
          })
          .strict(),
      )
      .min(2)
      .max(2),
    claims: z
      .array(
        z
          .object({
            id,
            review: z.literal('reviewed'),
            conflicted: z.literal(false),
            sourceIds: z.array(id).min(2).max(2),
            condition: predicate,
            effect: z
              .object({
                stat: z.literal('critRate'),
                unit: z.literal('percentage_points'),
                refinements: z.tuple([
                  z.literal(1),
                  z.literal(2),
                  z.literal(3),
                  z.literal(4),
                  z.literal(5),
                ]),
                values: z.tuple([
                  z.literal(14),
                  z.literal(17.5),
                  z.literal(21),
                  z.literal(24.5),
                  z.literal(28),
                ]),
              })
              .strict(),
          })
          .strict(),
      )
      .length(1),
    limitations: z.array(z.string().min(1).max(1000)).min(1).max(10),
    externalReading: z.literal('https://keqingmains.com/q/keqing-quickguide/'),
  })
  .strict();
export type KnowledgePack = z.infer<typeof packSchema>;
export const sourceDigests: Readonly<Record<string, string>> = {
  'genshin-db-harbinger': '90ed459a7126b086708e83dfc3d0ceee63637f41fcb8ec06edf0932201b662e3',
  'optimizer-harbinger': '3acd31920fcc0d7e515e544e730e822f4b70a19ce22a5fb073528743b11eaed4',
};
export function digest(value: unknown): string {
  // Stable across JSON object key order; arrays retain explicit evaluation order.
  const canonical = (input: unknown): unknown =>
    Array.isArray(input)
      ? input.map(canonical)
      : input && typeof input === 'object'
        ? Object.fromEntries(
            Object.entries(input)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, val]) => [key, canonical(val)]),
          )
        : input;
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}
export function validatePack(
  raw: unknown,
  sourceBytes?: Readonly<Record<string, Uint8Array>>,
): KnowledgePack {
  const stack = [{ value: raw, depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (++nodes > 512 || depth > 20) throw new Error('Knowledge pack exceeds size/depth bounds.');
    if (typeof value === 'string' && value.length > 2000)
      throw new Error('Oversized source string.');
    if (value && typeof value === 'object')
      for (const child of Object.values(value)) stack.push({ value: child, depth: depth + 1 });
  }
  const pack = packSchema.parse(raw);
  const ids = [...pack.sources, ...pack.claims].map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate knowledge ID.');
  for (const source of pack.sources) {
    if (sourceDigests[source.id] !== source.sha256) throw new Error('Unrecognized source hash.');
    if (
      sourceBytes &&
      (!sourceBytes[source.id] ||
        createHash('sha256').update(sourceBytes[source.id]).digest('hex') !== source.sha256)
    )
      throw new Error('Source bytes do not match hash.');
  }
  for (const claim of pack.claims) {
    if (
      new Set(claim.sourceIds).size !== 2 ||
      claim.sourceIds.some((ref) => !pack.sources.some((source) => source.id === ref))
    )
      throw new Error('Dangling or missing source reference.');
  }
  const { contentHash, ...content } = pack;
  if (digest(content) !== contentHash) throw new Error('Knowledge content hash mismatch.');
  return pack;
}
