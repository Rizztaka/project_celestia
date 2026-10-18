import { createRequire } from 'node:module';

import { z } from 'zod';

import { stableFingerprint } from '../../companion/catalog-trust.js';

const require = createRequire(import.meta.url);
const key = z.string().regex(/^[A-Z][A-Za-z0-9]*$/);
const point = z
  .object({
    id: z.string().regex(/^\d+-\d+$/),
    x: z.number().finite().min(-50000).max(50000),
    y: z.number().finite().min(-50000).max(50000),
    landmark: z.string().min(1).max(100),
  })
  .strict();
const source = z
  .object({
    repository: z.string().url(),
    commit: z.string().regex(/^[a-f0-9]{40}$/),
    file: z.string(),
    local: z.string(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
const domain = z
  .object({
    domainKey: key,
    name: z.string().min(1),
    location: z.string().min(1),
    days: z.array(z.number().int().min(0).max(6)).min(1),
    drops: z.array(z.string()),
    dropKeys: z.array(key).min(1),
    resinPerClaim: z.literal(20),
  })
  .strict();
const schema = z
  .object({
    version: z.literal(1),
    reviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sources: z.object({ coordinates: source, yields: source }).strict(),
    progressionFingerprint: z.string(),
    contentFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    yields: z
      .object({
        talent: z.array(z.array(z.number().nonnegative()).length(3)).length(4),
        weapon: z.array(z.array(z.number().nonnegative()).length(4)).length(4),
      })
      .strict(),
    families: z
      .array(
        z
          .object({
            domain,
            kind: z.enum(['talent', 'weapon']),
            materialKeys: z.array(key).min(3).max(4),
          })
          .strict(),
      )
      .min(1),
    routes: z
      .array(
        z
          .object({
            key: z.string().min(1),
            name: z.string().min(1),
            kind: z.enum(['enemy', 'gathering']),
            materialKeys: z.array(key).min(1),
            points: z.array(point).min(1).max(2000),
          })
          .strict(),
      )
      .min(1),
    teleports: z.array(point).min(1),
  })
  .strict();
export function validateFarmingData(input: unknown) {
  const data = schema.parse(input);
  const { contentFingerprint, ...payload } = data;
  if (stableFingerprint(payload) !== contentFingerprint)
    throw new Error('Farming snapshot fingerprint mismatch.');
  const progression = require('../../static/progression-catalog.json');
  if (data.progressionFingerprint !== progression.contentFingerprint)
    throw new Error('Rebuild farming data after progression changes.');
  const consumed = new Set<string>();
  for (const family of data.families) {
    if (
      stableFingerprint(family.domain) !==
      stableFingerprint(progression.domains[family.domain.domainKey])
    )
      throw new Error('Farming domain differs from the progression catalog.');
    if (
      family.materialKeys.length !== (family.kind === 'talent' ? 3 : 4) ||
      new Set(family.materialKeys).size !== family.materialKeys.length ||
      JSON.stringify([...family.materialKeys].sort()) !==
        JSON.stringify([...family.domain.dropKeys].sort())
    )
      throw new Error('Invalid farming family.');
    for (const key of family.materialKeys) {
      if (
        consumed.has(key) ||
        !Object.hasOwn(progression.materials, key) ||
        progression.materials[key].category !==
          (family.kind === 'talent' ? 'talent_book' : 'weapon_material')
      )
        throw new Error('Ambiguous farming material.');
      consumed.add(key);
    }
  }
  const routed = new Set<string>();
  for (const route of data.routes) {
    if (new Set(route.points.map((p) => p.id)).size !== route.points.length)
      throw new Error('Duplicate route point.');
    for (const key of route.materialKeys) {
      if (routed.has(key) || !Object.hasOwn(progression.materials, key))
        throw new Error('Ambiguous route material.');
      routed.add(key);
    }
  }
  if (new Set(data.teleports.map((p) => p.id)).size !== data.teleports.length)
    throw new Error('Duplicate teleport.');
  return data;
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export const farmingData = freeze(validateFarmingData(require('../../static/farming-data.json')));
