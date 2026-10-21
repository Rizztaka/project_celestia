import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  artifactSlots,
  type CharacterEquipmentResponse,
  guideScenarioSchema,
} from '@celestia/api-contracts';
import { describe, expect, it, vi } from 'vitest';

import { calculateAdvice, evaluatePredicate, type Facts } from './guide-knowledge.calculator.js';
import { guideKnowledgePack as pack } from './guide-knowledge.data.js';
import { explainAdvice } from './guide-knowledge.explainer.js';
import { digest, type Predicate, validatePack } from './guide-knowledge.pack.js';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));
import { GuideKnowledgeService } from './guide-knowledge.service.js';

const receipt = {
  status: 'unknown' as const,
  importedAt: null,
  source: null,
  entryCount: null,
  scope: 'replacement_section' as const,
};
export function equipment(key = 'Keqing', refinement = 1): CharacterEquipmentResponse {
  return {
    contractVersion: 1,
    character: {
      characterKey: key,
      level: 80,
      ascension: 6,
      constellation: 0,
      talents: { normal: 1, skill: 1, burst: 1 },
      talentBasis: 'stored_convention_unknown',
    },
    weapon: {
      state: 'recorded_assigned',
      item: { weaponKey: 'HarbingerOfDawn', refinement, level: 80, ascension: 6, locked: false },
    },
    provenance: {
      characters: { ...receipt, scope: 'merged_entries' },
      weapons: receipt,
      artifacts: receipt,
    },
    artifacts: Object.fromEntries(
      artifactSlots.map((slot) => [
        slot,
        { state: 'unknown', item: null, reason: 'provenance_unknown' },
      ]),
    ) as CharacterEquipmentResponse['artifacts'],
    unrecognizedSlots: [],
    artifactRelationsConsistent: true,
  };
}
const scenario = (hp = 'unknown', extra = {}) =>
  guideScenarioSchema.parse({ contractVersion: '1', hp, ...extra });
const facts: Facts = {
  characterKey: 'Keqing',
  weaponKey: 'HarbingerOfDawn',
  refinement: 1,
  hpPercent: null,
};
const yes: Predicate = { kind: 'characterIs', key: 'Keqing' };
const no: Predicate = { not: yes };
const unknown: Predicate = { kind: 'hpAbove', percent: 90 };
const predicates = { true: yes, false: no, unknown };
describe('K1 bounded knowledge and evaluator', () => {
  it('validates the reviewed production pack, excludes the research candidate and preserves source strings as inert data', async () => {
    const { retainedSources } = await import('../../../../../tooling/build-guide-knowledge.mjs');
    expect(validatePack(pack, retainedSources())).toEqual(pack);
    expect(() =>
      validatePack({ schemaVersion: 'research-draft-1', productionEligible: false }),
    ).toThrow();
    const changed = structuredClone(pack);
    changed.limitations.push('globalThis.executed = true; <script>throw new Error()</script>');
    const content = { ...changed } as Partial<typeof pack>;
    delete content.contentHash;
    changed.contentHash = digest(content);
    expect(validatePack(changed).limitations.at(-1)).toContain('globalThis.executed');
    expect((globalThis as Record<string, unknown>).executed).toBeUndefined();
  });
  it.each([
    [
      'schema',
      (p: typeof pack) => {
        p.schemaVersion = 2 as never;
      },
    ],
    [
      'duplicate ID',
      (p: typeof pack) => {
        p.sources[1].id = p.sources[0].id;
      },
    ],
    [
      'missing ID',
      (p: typeof pack) => {
        delete (p.claims[0] as Partial<(typeof p.claims)[0]>).id;
      },
    ],
    [
      'dangling reference',
      (p: typeof pack) => {
        p.claims[0].sourceIds[0] = 'absent';
      },
    ],
    [
      'missing source',
      (p: typeof pack) => {
        p.sources.pop();
      },
    ],
    [
      'unit',
      (p: typeof pack) => {
        p.claims[0].effect.unit = 'dps' as never;
      },
    ],
    [
      'range',
      (p: typeof pack) => {
        p.claims[0].effect.refinements[4] = 6 as never;
      },
    ],
    [
      'unreviewed',
      (p: typeof pack) => {
        p.claims[0].review = 'pending' as never;
      },
    ],
    [
      'conflicted',
      (p: typeof pack) => {
        p.claims[0].conflicted = true as never;
      },
    ],
    [
      'source hash',
      (p: typeof pack) => {
        p.sources[0].sha256 = 'f'.repeat(64);
      },
    ],
    [
      'content hash',
      (p: typeof pack) => {
        p.limitations[0] = 'changed';
      },
    ],
    [
      'arbitrary predicate',
      (p: typeof pack) => {
        p.claims[0].condition = { eval: 'process.exit()' } as never;
      },
    ],
    [
      'deep expression',
      (p: typeof pack) => {
        let node: Predicate = yes;
        for (let i = 0; i < 40; i++) node = { not: node };
        p.claims[0].condition = node;
      },
    ],
    [
      'large expression',
      (p: typeof pack) => {
        p.claims[0].condition = { all: Array(600).fill(yes) };
      },
    ],
  ])('rejects %s', (_name, mutate) => {
    const changed = structuredClone(pack);
    mutate(changed);
    expect(() => validatePack(changed)).toThrow();
  });
  it('retains the exact last valid pack on malformed candidate/source bytes', async () => {
    const { retainedSources, writeValidatedPack } =
      await import('../../../../../tooling/build-guide-knowledge.mjs');
    const directory = mkdtempSync(join(tmpdir(), 'celestia-k1-pack-'));
    const path = join(directory, 'pack.json');
    try {
      writeValidatedPack(pack, path);
      const before = readFileSync(path);
      expect(() => writeValidatedPack({}, path)).toThrow();
      expect(readFileSync(path)).toEqual(before);
      const bytes = retainedSources();
      bytes['optimizer-harbinger'] = Buffer.from('throw new Error("never execute")');
      expect(() => writeValidatedPack(pack, path, bytes)).toThrow();
      expect(readFileSync(path)).toEqual(before);
      writeValidatedPack(pack, path);
      expect(readFileSync(path)).toEqual(before);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
  for (const a of ['true', 'false', 'unknown'] as const)
    for (const b of ['true', 'false', 'unknown'] as const) {
      it(`evaluates all/any ${a}/${b}`, () => {
        expect(evaluatePredicate({ all: [predicates[a], predicates[b]] }, facts)).toBe(
          a === 'false' || b === 'false'
            ? 'false'
            : a === 'unknown' || b === 'unknown'
              ? 'unknown'
              : 'true',
        );
        expect(evaluatePredicate({ any: [predicates[a], predicates[b]] }, facts)).toBe(
          a === 'true' || b === 'true'
            ? 'true'
            : a === 'unknown' || b === 'unknown'
              ? 'unknown'
              : 'false',
        );
      });
    }
  it.each(['true', 'false', 'unknown'] as const)('negates %s', (value) => {
    expect(evaluatePredicate({ not: predicates[value] }, facts)).toBe(
      value === 'unknown' ? 'unknown' : value === 'true' ? 'false' : 'true',
    );
  });
  it('keeps contradictions false and traversal deterministic, including unresolved leaves', () => {
    const trace: { predicate: string; result: 'true' | 'false' | 'unknown' }[] = [];
    expect(evaluatePredicate({ all: [yes, no, unknown] }, facts, trace)).toBe('false');
    expect(trace.map((entry) => entry.result)).toEqual(['true', 'true', 'unknown']);
    expect(evaluatePredicate({ any: [yes, no, unknown] }, facts)).toBe('true');
    expect(digest({ z: 2, a: 1 })).toBe(digest({ a: 1, z: 2 }));
  });
  it.each([89, 90, 90.0001, 100])('strictly evaluates HP %s', (hpPercent) => {
    expect(evaluatePredicate(unknown, { ...facts, hpPercent })).toBe(
      hpPercent > 90 ? 'true' : 'false',
    );
  });
  it.each([
    [1, 14],
    [2, 17.5],
    [3, 21],
    [4, 24.5],
    [5, 28],
  ])('models R%s contribution without damage claims', (rank, amount) => {
    const result = calculateAdvice(pack, equipment('Keqing', rank), scenario('above_90'));
    expect(result).toMatchObject({
      conclusion: 'active',
      conditionalCritRatePp: amount,
      modeledCritRatePp: amount,
    });
    expect(
      calculateAdvice(pack, equipment('Keqing', rank), scenario('at_or_below_90')),
    ).toMatchObject({
      conclusion: 'inactive',
      conditionalCritRatePp: amount,
      modeledCritRatePp: 0,
    });
    expect(explainAdvice(result).join(' ')).toContain(
      'neither total character CRIT Rate nor a DPS gain',
    );
  });
  it('retains unknown HP and unknown refinement without assuming R5 or uptime', () => {
    expect(calculateAdvice(pack, equipment(), scenario())).toMatchObject({
      conclusion: 'conditional',
      conditionalCritRatePp: 14,
      modeledCritRatePp: null,
    });
    expect(calculateAdvice(pack, equipment('Keqing', 0), scenario('above_90'))).toMatchObject({
      conclusion: 'conditional',
      refinement: null,
      conditionalCritRatePp: null,
      modeledCritRatePp: null,
    });
  });
  it('separates absent, unrecorded and hypothetical ownership and unsupported coverage', () => {
    const absent = equipment();
    absent.weapon = { state: 'unknown', item: null, reason: 'provenance_unknown' };
    expect(calculateAdvice(pack, absent, scenario())).toMatchObject({
      basis: 'no_weapon_scenario',
      modeledCritRatePp: null,
    });
    const before = structuredClone(absent);
    expect(
      calculateAdvice(
        pack,
        absent,
        scenario('above_90', { example: 'harbinger', refinement: '5' }),
      ),
    ).toMatchObject({ basis: 'hypothetical', modeledCritRatePp: 28 });
    expect(absent).toEqual(before);
    absent.weapon = { state: 'unrecorded', item: null, reason: 'no_recorded_assignment' };
    expect(calculateAdvice(pack, absent, scenario()).basis).toBe('no_weapon_scenario');
    expect(calculateAdvice(pack, equipment('HuTao'), scenario('above_90'))).toMatchObject({
      conclusion: 'unsupported',
      coverage: 'unsupported',
      conditionalCritRatePp: null,
      modeledCritRatePp: null,
    });
  });
  it('uses owned service inputs, excludes unrelated progression/routine from advice and keeps explainer unable to mutate decisions', async () => {
    const snapshot = equipment();
    const read = vi.fn(async () => snapshot);
    const service = new GuideKnowledgeService({ read });
    const before = await service.read('owner', 'Keqing', { contractVersion: '1' });
    snapshot.character.level = 90;
    const after = await service.read('owner', 'Keqing', { contractVersion: '1' });
    expect(after).toEqual(before);
    expect(read).toHaveBeenLastCalledWith('owner', 'Keqing');
    const result = calculateAdvice(pack, snapshot, scenario());
    const copy = structuredClone(result);
    explainAdvice(result);
    expect(result).toEqual(copy);
    await expect(
      service.read('owner', 'Keqing', { contractVersion: '1', userId: 'foreign' }),
    ).rejects.toThrow();
  });
});
