import { describe, expect, it } from 'vitest';

import { analyzeCharacter } from '../../web/src/lib/build-analysis/character.calculator.ts';
import { compareCharacter } from '../../web/src/lib/build-analysis/compare.ts';
import { setIdentityForItem } from '../../web/src/lib/build-analysis/equipment.ts';
import { explainFinding } from '../../web/src/lib/build-analysis/explainer.ts';
import {
  artifactInSlot,
  normalizeObservation,
  setPieceCount,
  talentTotal,
} from '../../web/src/lib/build-analysis/snapshot.ts';
import { analyzeTeam, teamContext } from '../../web/src/lib/build-analysis/team.calculator.ts';
import {
  normalizeCombatStat,
  normalizeEquipmentStat,
} from '../../web/src/lib/build-analysis/units.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';
function records() {
  const f = analysisFixture(uid);
  return f.snapshot.characters.map((character) =>
    normalizeObservation({ uid, character, observedAt: f.fetchedAt }),
  );
}
function input(index = 0, roleId = 'party_buff') {
  return {
    uid,
    character: records()[index],
    rulePackVersion: 'public-build-analysis-1',
    roleId,
    team: null,
    hypothesis: null,
  };
}
const finding = (result, rule) => result.findings.find((f) => f.ruleId === rule);
function selected(keys, roles) {
  return keys.map((characterKey, i) => ({ characterKey, roleId: roles?.[i] ?? 'unspecified' }));
}
describe('public build normalization', () => {
  it('normalizes ratio combat values and percentage-point gear once, preserving zero', () => {
    expect(normalizeCombatStat({ id: '20', name: 'rate', value: 0.65 })).toMatchObject({
      unit: 'ratio',
      percentPoints: 65,
      flat: null,
    });
    expect(
      normalizeEquipmentStat({ id: 'FIGHT_PROP_CRITICAL', name: 'rate', value: 7 }),
    ).toMatchObject({ unit: 'percentage_points', percentPoints: 7, flat: null });
    expect(normalizeCombatStat({ id: '28', name: 'EM', value: 0 })).toMatchObject({
      unit: 'flat',
      flat: 0,
      percentPoints: null,
    });
    expect(normalizeCombatStat({ id: 'unreviewed', name: 'unknown', value: 7 })).toMatchObject({
      unit: 'unknown',
      flat: null,
      percentPoints: null,
    });
  });
  it('never promotes a substat when mainStat is missing or infers a talent bonus', () => {
    const f = analysisFixture(uid);
    const c = f.snapshot.characters[0];
    c.artifacts[2].mainStat = null;
    const n = normalizeObservation({ uid, character: c, observedAt: f.fetchedAt });
    expect(n.artifacts[2].mainStat).toBeNull();
    expect(n.artifacts[2].substats).toHaveLength(2);
    expect(talentTotal(n.talents[0])).toBeNull();
  });
  it('does not count duplicate artifact slots as extra set pieces', () => {
    const f = analysisFixture(uid);
    const c = f.snapshot.characters[0];
    c.artifacts = Array.from({ length: 5 }, () => structuredClone(c.artifacts[0]));
    const n = normalizeObservation({ uid, character: c, observedAt: f.fetchedAt });
    expect(artifactInSlot(n, 'Flower')).toBeNull();
    expect(setPieceCount(n, 'GoldenTroupe')).toBe(0);
  });
  it('joins set identity by pinned numeric IDs, not fallback or misleading labels', () => {
    expect(setIdentityForItem(32543)).toMatchObject({ setId: 15032, referenceKey: 'GoldenTroupe' });
    expect(setIdentityForItem(76543)).toMatchObject({
      setId: 15002,
      referenceKey: 'ViridescentVenerer',
    });
    expect(setIdentityForItem(999999999)).toBeNull();
    const n = records()[0];
    expect(n.artifacts[0].setNameLabel).toContain('unresolved');
    expect(n.artifacts[0].set.referenceKey).toBe('GoldenTroupe');
  });
});
describe('reviewed character decisions', () => {
  it.each(['FIGHT_PROP_HP_PERCENT', 'FIGHT_PROP_WATER_ADD_HURT'])(
    'accepts Furina goblet alternative %s',
    (statId) => {
      const i = input();
      const result = compareCharacter(i, { kind: 'main_stat', slot: 'Goblet', statId });
      expect(finding(result.after, 'main-stat-Goblet').condition).toBe('true');
    },
  );
  it('finds a contextual Sucrose mismatch and changes it without mutating observed gear/stats', () => {
    const i = input(1, 'reaction_trigger');
    const before = JSON.stringify(i);
    const result = compareCharacter(i, {
      kind: 'main_stat',
      slot: 'Sands',
      statId: 'FIGHT_PROP_ELEMENT_MASTERY',
    });
    expect(finding(result.before, 'main-stat-Sands').condition).toBe('false');
    expect(finding(result.after, 'main-stat-Sands').condition).toBe('true');
    expect(result.changed).toHaveLength(1);
    expect(JSON.stringify(i)).toBe(before);
  });
  it('corrects the interrupted Skirk normal-talent priority and keeps bonus uncertainty', () => {
    const r = analyzeCharacter(input(2, 'on_field_damage'));
    const f = finding(r, 'talent-priority');
    expect(f.values.priority.code).toBe('skill,burst');
    expect(f.values.skill).toMatchObject({ base: 8, bonus: null });
    expect(explainFinding(f).explanation).toContain('Normal Attack');
    expect(r.findings.some((f) => f.ruleId === 'no-energy-burst')).toBe(true);
  });
  it('retains unknown equipment, missing main stats and unknown set bounds', () => {
    const i = input();
    i.character.artifacts = [];
    i.character.equipmentAvailable = false;
    i.character.weapon = null;
    const r = analyzeCharacter(i);
    expect(finding(r, 'set-profile').condition).toBe('unknown');
    expect(finding(r, 'main-stat-Sands').condition).toBe('unknown');
    expect(finding(r, 'weapon-type').condition).toBe('unknown');
  });
  it('flags only verified weapon incompatibility', () => {
    const i = input();
    i.character.weapon.itemId = 14403;
    expect(finding(analyzeCharacter(i), 'weapon-type').condition).toBe('false');
  });
  it('disables only changed-source profiles and supports generic metadata/constellation gaps', () => {
    expect(analyzeCharacter(input(), { 'kqm-furina': 'changed' }).coverage.roleSupported).toBe(
      false,
    );
    expect(
      analyzeCharacter(input(1, 'reaction_trigger'), { 'kqm-furina': 'changed' }).coverage
        .roleSupported,
    ).toBe(true);
    const i = input();
    i.character.constellation = 6;
    expect(analyzeCharacter(i).coverage.roleSupported).toBe(false);
    i.character.constellation = 0;
    i.character.metadataAvailable = false;
    expect(analyzeCharacter(i).coverage.characterProfile).toBe(false);
  });
  it('is reproducible, role-sensitive and never invents a numeric score', () => {
    const a = analyzeCharacter(input());
    expect(a).toEqual(analyzeCharacter(input()));
    expect(a.digest).not.toBe(analyzeCharacter(input(0, 'unspecified')).digest);
    expect(a).not.toHaveProperty('score');
    expect(() => analyzeCharacter({ ...input(), uid: '800000002' })).toThrow();
  });
  it('changes all set-dependent findings consistently in an isolated assumption', () => {
    const i = input(2, 'on_field_damage');
    i.character.artifacts[4].mainStat = normalizeEquipmentStat({
      id: 'FIGHT_PROP_ATTACK_PERCENT',
      name: 'ATK%',
      value: 46.6,
    });
    expect(finding(analyzeCharacter(i), 'main-stat-Circlet').condition).toBe('true');
    expect(
      finding(
        compareCharacter(i, { kind: 'set_pieces', setId: 15040, pieces: 4 }).after,
        'main-stat-Circlet',
      ).condition,
    ).toBe('false');
  });
});
describe('team context', () => {
  it('evaluates the Skirk party-bonus prerequisite positively, negatively and as unknown', () => {
    const r = records();
    const keys = [r[2].key, r[0].key, r[4].key, r[5].key];
    function evaluate(keys) {
      const s = selected(keys, ['on_field_damage']);
      const context = teamContext(uid, s, r);
      return finding(
        analyzeCharacter({ ...input(2, 'on_field_damage'), team: context }),
        'skirk-team',
      );
    }
    expect(evaluate(keys).condition).toBe('true');
    expect(evaluate([r[2].key, r[0].key, r[4].key, r[1].key]).condition).toBe('false');
    expect(evaluate(keys.slice(0, 3)).condition).toBe('unknown');
    expect(evaluate([r[2].key, r[4].key, '10000015:1501', '10000036:3601']).condition).toBe(
      'unknown',
    );
    const allCryo = r.map((c) => ({ ...c, element: 'Cryo' }));
    expect(
      finding(
        analyzeCharacter({
          ...input(2, 'on_field_damage'),
          team: teamContext(uid, selected(keys), allCryo),
        }),
        'skirk-team',
      ).condition,
    ).toBe('false');
  });
  it('checks the Xilonen two-sample boundary without treating one missing member as false', () => {
    const r = records();
    const c = input(3, 'healing_support');
    const check = (keys) =>
      finding(
        analyzeCharacter({ ...c, team: teamContext(uid, selected(keys), r) }),
        'xilonen-samples',
      ).condition;
    expect(check([r[3].key, r[0].key, r[2].key, r[1].key])).toBe('true');
    expect(check([r[3].key, r[0].key, r[1].key])).toBe('unknown');
    const geo = { ...r[5], element: 'Geo' };
    expect(
      finding(
        analyzeCharacter({
          ...c,
          team: teamContext(uid, selected([r[3].key, r[0].key, r[1].key, geo.key]), [
            ...r.slice(0, 5),
            geo,
          ]),
        }),
        'xilonen-samples',
      ).condition,
    ).toBe('false');
  });
  it('changes a supported set interaction with teammates and retains its combat conditions', () => {
    const r = records();
    const base = input(2, 'on_field_damage');
    const withF = analyzeCharacter({
      ...base,
      team: teamContext(uid, selected([r[2].key, r[0].key, r[4].key, r[5].key]), r),
    });
    const withoutF = analyzeCharacter({
      ...base,
      team: teamContext(uid, selected([r[2].key, r[1].key, r[4].key, r[5].key]), r),
    });
    expect(finding(withF, 'skirk-hunter').condition).toBe('true');
    expect(finding(withoutF, 'skirk-hunter').condition).toBe('false');
    expect(finding(withF, 'skirk-hunter').status).toBe('depends_on_conditions');
  });
  it('uses exactly the same character findings in standalone context and team analysis', () => {
    const r = records();
    const s = selected(
      r.slice(0, 4).map((c) => c.key),
      ['party_buff', 'reaction_trigger', 'on_field_damage', 'healing_support'],
    );
    const t = analyzeTeam(uid, s, r);
    const context = teamContext(uid, s, r);
    t.members.forEach((m) =>
      expect(m.analysis).toEqual(
        analyzeCharacter({
          rulePackVersion: 'public-build-analysis-1',
          uid,
          character: r.find((c) => c.key === m.characterKey),
          roleId: m.roleId,
          team: context,
          hypothesis: null,
        }),
      ),
    );
    expect(t).toEqual(analyzeTeam(uid, s, r));
  });
  it('labels mixed timestamps and preserves supported work despite a missing member', () => {
    const r = records();
    r[0].observedAt = '2026-10-23T10:00:00.000Z';
    const t = analyzeTeam(uid, selected([r[0].key, r[1].key, r[2].key, '10000015:1501']), r);
    expect(t.mixedObservationTimes).toBe(true);
    expect(t.missingMembers).toEqual(['10000015:1501']);
    expect(t.members).toHaveLength(3);
    expect(analyzeTeam('800000002', selected([r[0].key]), r).members).toHaveLength(0);
  });
  it('rejects duplicate forms, Traveler variants, invalid roles and oversized lineups', () => {
    const r = records();
    expect(() => teamContext(uid, selected([r[0].key, r[0].key]), r)).toThrow();
    expect(() => teamContext(uid, selected(['10000005:504', '10000007:704']), r)).toThrow();
    expect(() => teamContext(uid, selected([r[0].key], ['reaction_trigger']), r)).toThrow();
    expect(() => teamContext(uid, selected(r.map((c) => c.key)), r)).toThrow();
    expect(() => teamContext(uid, selected(['invalid-key']), r)).toThrow();
  });
});
