import { readFileSync } from 'node:fs';

import { buildInsightQuerySchema, buildInsightsResponseSchema } from '@celestia/api-contracts';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));

import type { CharacterEquipmentRow } from '../../characters/character-equipment.repository.js';
import { ProfileReferenceService } from '../../characters/profile-reference.service.js';
import {
  all,
  atLeast,
  evaluateHarbinger,
  evaluateSet,
  pieceBounds,
} from './build-insights.calculator.js';
import { BuildInsightsService } from './build-insights.service.js';

function row(key = 'Albedo'): CharacterEquipmentRow {
  return {
    character: { characterKey: key, id: 'PRIVATE', accountId: 'PRIVATE' },
    weapon: { weaponKey: 'HarbingerOfDawn', refinement: 5 },
    artifacts: ['flower', 'plume', 'sands', 'goblet'].map((slotKey) => ({
      slotKey,
      setKey: 'DeepwoodMemories',
    })),
    receipts: [],
    weaponRelationConsistent: true,
    artifactRelationsConsistent: true,
  } as unknown as CharacterEquipmentRow;
}
describe('deterministic build rules', () => {
  it.each([
    [90, 'not_applicable', 0],
    [90.01, 'applies', 28],
    [null, 'conditional', null],
  ] as const)(
    'preserves strict HP threshold %s and separates potential from active bonus',
    (hp, state, active) => {
      const result = evaluateHarbinger(5, 'true', hp);
      expect(result.state).toBe(state);
      expect(result.values.potentialCritRatePp).toBe(28);
      expect(result.values.activeCritRatePp).toBe(active);
    },
  );
  it('keeps refinement and incompatible weapons authoritative', () => {
    expect(evaluateHarbinger(5, 'true', Number.NaN).state).toBe('conditional');
    expect(evaluateHarbinger(null, 'true', 100).state).toBe('conditional');
    expect(evaluateHarbinger(0, 'true', 100).values.potentialCritRatePp).toBeNull();
    expect(evaluateHarbinger(5, 'false', 100).state).toBe('not_applicable');
    expect(all(['unknown', 'false'])).toBe('false');
    expect(atLeast({ min: 2, max: 5 }, 4)).toBe('unknown');
  });
  it('does not assume missing assignments empty or count duplicate/invalid slots', () => {
    expect(pieceBounds([{ slot: 'flower', set: 'x' }], true, 'x')).toEqual({ min: 1, max: 5 });
    expect(
      pieceBounds(
        [
          { slot: 'flower', set: 'x' },
          { slot: 'flower', set: 'x' },
        ],
        true,
        'x',
      ),
    ).toEqual({ min: 0, max: 5 });
    expect(pieceBounds([{ slot: 'other', set: 'x' }], true, 'x')).toEqual({ min: 0, max: 5 });
    expect(pieceBounds([{ slot: 'flower', set: 'x' }], false, 'x')).toEqual({ min: 0, max: 5 });
  });
  it('binds Deepwood to hits and duration; eligibility alone never activates its four-piece', () => {
    const decisions = evaluateSet('DeepwoodMemories', { min: 4, max: 5 }, true);
    expect(decisions.find((d) => d.id === 'DeepwoodMemories-2')?.state).toBe('applies');
    expect(decisions.find((d) => d.id === 'DeepwoodMemories-4')).toMatchObject({
      state: 'conditional',
      conditions: expect.arrayContaining([
        { key: 'skill_or_burst_hits_opponent', truth: 'unknown' },
        { key: 'target_debuff_within_8_seconds', truth: 'unknown' },
      ]),
    });
    expect(
      evaluateSet('DeepwoodMemories', { min: 0, max: 1 }, true).find((d) => d.values.pieces === 4)
        ?.state,
    ).toBe('not_applicable');
  });
  it('separates Golden Troupe unconditional four-piece from field-dependent extra bonus', () => {
    const decisions = evaluateSet('GoldenTroupe', { min: 4, max: 4 }, true);
    expect(decisions.find((d) => d.id === 'GoldenTroupe-4')?.state).toBe('applies');
    expect(decisions.find((d) => d.id === 'GoldenTroupe-field-bonus')?.state).toBe('conditional');
  });
  it('never interprets unmodeled effects as executable rules', () => {
    expect(evaluateSet('NewSet', { min: 5, max: 5 }, false).map((d) => d.state)).toEqual([
      'applies',
      'reference',
    ]);
  });
});
describe('read-only source-backed service', () => {
  it('produces reproducible useful facts without assuming battle conditions or exposing private IDs', async () => {
    const repo = { readForUser: vi.fn(async () => row()) },
      svc = new BuildInsightsService(repo);
    const result = await svc.read('owner', 'Albedo', {});
    expect(result).toEqual(await svc.read('owner', 'Albedo', {}));
    expect(buildInsightsResponseSchema.safeParse(result).success).toBe(true);
    expect(result.cards.find((c) => c.id === 'weapon-compatibility')?.state).toBe('applies');
    expect(result.cards.find((c) => c.id === 'harbinger-hp-passive')?.state).toBe('conditional');
    expect(result.cards.find((c) => c.id === 'DeepwoodMemories-4')?.sourceText).toContain(
      'hit opponents',
    );
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
    expect(repo.readForUser).toHaveBeenCalledWith('owner', 'Albedo');
  });
  it('evaluates all catalog characters without an owned record, with explicit limitations', async () => {
    const index = JSON.parse(
      readFileSync(new URL('../../static/profile-reference/index.json', import.meta.url), 'utf8'),
    );
    const svc = new BuildInsightsService({ readForUser: async () => null });
    for (const key of Object.keys(index.characters)) {
      const response = await svc.read('owner', key, {});
      expect(response.recorded).toBe(false);
      expect(response.cards[0]!.state).toBe('unavailable');
      expect(buildInsightsResponseSchema.safeParse(response).success, key).toBe(true);
    }
    expect(Object.keys(index.characters).length).toBeGreaterThan(100);
  });
  it('isolates a hypothetical incompatible weapon and leaves the recorded build unchanged', async () => {
    const stored = row('Aino'),
      before = structuredClone(stored),
      svc = new BuildInsightsService({ readForUser: async () => stored });
    const result = await svc.read('owner', 'Aino', { weapon: 'HarbingerOfDawn', refinement: 5 });
    expect(result.comparison?.[0]?.state).toBe('not_applicable');
    expect(result.comparison).toHaveLength(1);
    expect(result.comparison?.every((c) => c.basis === 'hypothetical')).toBe(true);
    expect(stored).toEqual(before);
  });
  it('does not apply unreviewed rules after source drift', async () => {
    const refs = new ProfileReferenceService();
    const original = refs.artifact.bind(refs);
    vi.spyOn(refs, 'artifact').mockImplementation((key) => ({
      ...original(key),
      source: { ...original(key).source, sha256: 'a'.repeat(64) },
    }));
    const result = await new BuildInsightsService({ readForUser: async () => row() }, refs).read(
      'owner',
      'Albedo',
      {},
    );
    expect(result.cards.find((c) => c.id === 'DeepwoodMemories-effects')?.state).toBe('reference');
    expect(result.cards.some((c) => c.id === 'DeepwoodMemories-2')).toBe(false);
  });
  it('rejects ambiguous or impossible comparison requests', () => {
    for (const q of [
      { artifactSet: 'DeepwoodMemories' },
      { weapon: 'HarbingerOfDawn', artifactSet: 'DeepwoodMemories', pieces: 4 },
      { refinement: 5 },
      { weapon: 'x', refinement: 6 },
      { artifactSet: 'x', pieces: 0 },
      { unexpected: true },
    ])
      expect(buildInsightQuerySchema.safeParse(q).success).toBe(false);
  });
});
