import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  analyzeCharacter,
  roleOptions,
} from '../../web/src/lib/build-analysis/character.calculator.ts';
import { sourceCurrent, sources } from '../../web/src/lib/build-analysis/coverage.ts';
import { explainFinding } from '../../web/src/lib/build-analysis/explainer.ts';
import { reviewedProfiles } from '../../web/src/lib/build-analysis/identity.ts';
import { normalizeObservation } from '../../web/src/lib/build-analysis/snapshot.ts';
import { teamContext } from '../../web/src/lib/build-analysis/team.calculator.ts';
import { RULE_PACK_VERSION } from '../../web/src/lib/build-analysis/types.ts';
import { normalizeEquipmentStat } from '../../web/src/lib/build-analysis/units.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';
const catalog = JSON.parse(
  readFileSync(
    new URL('../src/games/genshin/static/character-profiles.json', import.meta.url),
    'utf8',
  ),
);
const equipment = JSON.parse(
  readFileSync(
    new URL('../../web/src/lib/build-analysis/equipment-identity.json', import.meta.url),
    'utf8',
  ),
);
function inputFor(key) {
  const profile = reviewedProfiles.find((entry) => entry.referenceKey === key);
  const character = structuredClone(analysisFixture(uid).snapshot.characters[0]);
  Object.assign(character, {
    id: profile.avatarId,
    skillDepotId: profile.skillDepotId,
    key: `${profile.avatarId}:${profile.skillDepotId}`,
    name: profile.displayName,
    element: catalog[key].element,
    weaponType: catalog[key].weaponType,
  });
  character.weapon.id = Number(
    Object.entries(equipment.weapons).find(
      ([, weapon]) => weapon.weaponType === character.weaponType,
    )[0],
  );
  return {
    rulePackVersion: RULE_PACK_VERSION,
    uid,
    character: normalizeObservation({ uid, character, observedAt: '2026-10-25T10:00:00Z' }),
    roleId: 'unspecified',
    team: null,
    hypothesis: null,
  };
}
function mainStats(input, choices) {
  for (const [slot, stat] of Object.entries(choices)) {
    input.character.artifacts.find((artifact) => artifact.slot === slot).mainStat =
      normalizeEquipmentStat({ id: stat, name: stat, value: 1 });
  }
  return input;
}
const find = (analysis, rule) => analysis.findings.find((finding) => finding.ruleId === rule);
function party(input, members) {
  const characters = [input.character, ...members];
  input.team = teamContext(
    uid,
    characters.map((character) => ({ characterKey: character.key, roleId: 'unspecified' })),
    characters,
  );
  return input;
}

describe('source-bound automatic role patterns', () => {
  it('provides an explicit reviewed default and independent source gate for every profile', () => {
    expect(reviewedProfiles.length).toBeGreaterThanOrEqual(12);
    for (const profile of reviewedProfiles) {
      expect(profile.roles.some((role) => role.id === profile.defaultRoleId)).toBe(true);
      expect(profile.evidenceIds.length).toBeGreaterThan(0);
      expect(profile.evidenceIds.every((id) => sourceCurrent(id))).toBe(true);
      const input = inputFor(profile.referenceKey);
      const before = structuredClone(input);
      const analysis = analyzeCharacter(input);
      expect(analysis).toMatchObject({
        roleAssumed: true,
        roleId: profile.defaultRoleId,
        coverage: { roleSupported: true },
      });
      expect(input).toEqual(before);
      expect(analyzeCharacter(input)).toEqual(analysis);
    }
  });
  it('retains source-guide versions without promoting old guides into 7.1 certification', () => {
    expect(sources.find((source) => source.id === 'kqm-fischl').sourceVersion).toBe('4.0');
    expect(sources.find((source) => source.id === 'kqm-escoffier').sourceVersion).toBe('7.1');
    expect(sources.find((source) => source.id === 'kqm-xiangling').sourceVersion).toBe('4.5');
  });
  it('disables automatic guidance when a new source changes or a form is not reviewed', () => {
    const input = inputFor('Nahida');
    const blocked = analyzeCharacter(input, { 'kqm-nahida': 'changed' });
    expect(blocked.coverage.roleSupported).toBe(false);
    expect(blocked.roleAssumed).toBe(false);
    expect(find(blocked, 'coverage').values.reason.code).toBe('source_changed');
    input.character.skillDepotId += 1;
    input.character.key = `${input.character.avatarId}:${input.character.skillDepotId}`;
    expect(analyzeCharacter(input).coverage.characterProfile).toBe(false);
    expect(analyzeCharacter(input).roleAssumed).toBe(false);
  });
  it('preserves explicit role selection and the existing changed-constellation exclusions', () => {
    const input = inputFor('Furina');
    input.roleId = 'off_field_damage';
    expect(analyzeCharacter(input)).toMatchObject({
      roleId: 'off_field_damage',
      roleAssumed: false,
    });
    input.character.constellation = 6;
    input.roleId = 'unspecified';
    expect(analyzeCharacter(input).coverage.roleSupported).toBe(false);
    const wrong = inputFor('Xingqiu');
    wrong.roleId = 'shield_support';
    expect(analyzeCharacter(wrong).coverage.roleSupported).toBe(false);
    expect(() =>
      analyzeCharacter({ ...wrong, rulePackVersion: 'public-build-analysis-1' }),
    ).toThrow('ANALYSIS_CONTEXT_MISMATCH');
  });
  it('lets a different playstyle explicitly opt out of automatic role assumptions', () => {
    const input = { ...inputFor('Bennett'), roleId: 'general_checks' };
    const result = analyzeCharacter(input);
    expect(result).toMatchObject({
      roleAssumed: false,
      roleId: 'general_checks',
      coverage: { roleSupported: false },
    });
    expect(find(result, 'coverage').values.reason.code).toBe('general_checks_selected');
    expect(result.findings.some((finding) => finding.ruleId.startsWith('main-stat-'))).toBe(false);
  });
  it('accepts the reviewed healing Bennett pattern and keeps buff scaling separate from observed stats', () => {
    const input = mainStats(inputFor('Bennett'), {
      Sands: 'FIGHT_PROP_CHARGE_EFFICIENCY',
      Goblet: 'FIGHT_PROP_HP_PERCENT',
      Circlet: 'FIGHT_PROP_HEAL_ADD',
    });
    const stats = structuredClone(input.character.stats);
    const result = analyzeCharacter(input);
    expect(result.roleId).toBe('healing_support');
    expect(find(result, 'main-stat-Goblet').status).toBe('fits');
    expect(explainFinding(find(result, 'bennett-buff-scaling')).explanation).toContain(
      'do not increase that buff',
    );
    expect(input.character.stats).toEqual(stats);
  });
  it('keeps reaction-specific EM choices conditional and avoids on-field talent advice for off-field builds', () => {
    for (const key of ['Xiangling', 'Fischl']) {
      const result = analyzeCharacter(
        mainStats(inputFor(key), { Sands: 'FIGHT_PROP_ELEMENT_MASTERY' }),
      );
      expect(find(result, 'main-stat-Sands')).toMatchObject({
        condition: 'true',
        status: 'depends_on_conditions',
      });
      expect(find(result, 'main-stat-Sands').values.context.code).toBe('reaction_context');
      expect(find(result, 'talent-priority').values.priority.code).not.toContain('normal');
    }
    const xingqiu = analyzeCharacter(
      mainStats(inputFor('Xingqiu'), { Sands: 'FIGHT_PROP_ELEMENT_MASTERY' }),
    );
    expect(find(xingqiu, 'main-stat-Sands').status).toBe('needs_attention');
  });
  it('does not impose a universal Nahida EM target and accepts both reviewed damage and EM slots', () => {
    const result = analyzeCharacter(
      mainStats(inputFor('Nahida'), {
        Sands: 'FIGHT_PROP_ELEMENT_MASTERY',
        Goblet: 'FIGHT_PROP_GRASS_ADD_HURT',
        Circlet: 'FIGHT_PROP_CRITICAL',
      }),
    );
    expect(find(result, 'main-stat-Goblet').status).toBe('fits');
    expect(find(result, 'main-stat-Circlet').status).toBe('fits');
    expect(explainFinding(find(result, 'nahida-em-context')).explanation).toContain(
      'not required for a good build',
    );
  });
  it('keeps Dahlia Favonius CRIT conditional and prioritizes only his Burst talent', () => {
    const result = analyzeCharacter(
      mainStats(inputFor('Dahlia'), { Circlet: 'FIGHT_PROP_CRITICAL' }),
    );
    expect(find(result, 'main-stat-Circlet').status).toBe('depends_on_conditions');
    expect(find(result, 'talent-priority').values.priority.code).toBe('burst');
    const mismatch = analyzeCharacter(
      mainStats(inputFor('Dahlia'), { Circlet: 'FIGHT_PROP_CRITICAL_HURT' }),
    );
    expect(find(mismatch, 'main-stat-Circlet').status).toBe('needs_attention');
  });
  it('checks Kazuha VV teammates without assuming a Swirl or a mandatory Burst rotation', () => {
    const input = inputFor('KaedeharaKazuha');
    input.character.artifacts = normalizeObservation({
      uid,
      observedAt: input.character.observedAt,
      character: analysisFixture(uid).snapshot.characters[1],
    }).artifacts;
    party(input, [
      inputFor('Nahida').character,
      inputFor('Xilonen').character,
      inputFor('Sucrose').character,
    ]);
    let result = analyzeCharacter(input);
    expect(find(result, 'vv-target').condition).toBe('false');
    expect(find(result, 'kazuha-energy').status).toBe('depends_on_conditions');
    party(input, [
      inputFor('Nahida').character,
      inputFor('Xilonen').character,
      inputFor('Furina').character,
    ]);
    result = analyzeCharacter(input);
    expect(find(result, 'vv-target')).toMatchObject({
      condition: 'true',
      status: 'depends_on_conditions',
      evidenceIds: ['kqm-kazuha'],
    });
  });
  it('distinguishes Escoffier maximum-party prerequisites from lower-bonus but valid mixed teams', () => {
    const input = inputFor('Escoffier');
    party(input, [
      inputFor('Skirk').character,
      inputFor('Furina').character,
      inputFor('Dahlia').character,
    ]);
    expect(find(analyzeCharacter(input), 'escoffier-party')).toMatchObject({
      condition: 'true',
      values: { matching: { value: 4 } },
    });
    party(input, [
      inputFor('Skirk').character,
      inputFor('Furina').character,
      inputFor('Xilonen').character,
    ]);
    expect(find(analyzeCharacter(input), 'escoffier-party')).toMatchObject({
      condition: 'false',
      status: 'depends_on_conditions',
      values: { matching: { value: 3 } },
    });
    input.team.members[3].character = null;
    input.team.members[3].element = null;
    expect(find(analyzeCharacter(input), 'escoffier-party').condition).toBe('unknown');
  });
  it('offers the new exact-form roles without changing unreviewed forms', () => {
    for (const key of [
      'Bennett',
      'Xiangling',
      'Xingqiu',
      'Fischl',
      'KaedeharaKazuha',
      'Nahida',
      'Escoffier',
      'Dahlia',
    ]) {
      const input = inputFor(key);
      expect(roleOptions({ id: input.character.avatarId, ...input.character })).not.toEqual([]);
    }
  });
  it('preserves Kazuha equal-priority talents instead of imposing a false ordering', () => {
    expect(
      find(analyzeCharacter(inputFor('KaedeharaKazuha')), 'talent-priority').values.priority.code,
    ).toBe('burst,normal = skill');
  });
  it('disables automatic and explicit tailored advice for conflicting observed builds', () => {
    const input = inputFor('Dahlia');
    input.character.observationConflict = true;
    for (const roleId of ['unspecified', 'shield_support']) {
      const analysis = analyzeCharacter({ ...input, roleId });
      expect(analysis.roleAssumed).toBe(false);
      expect(analysis.coverage.roleSupported).toBe(false);
      expect(find(analysis, 'coverage').values.reason.code).toBe('observation_conflict');
      expect(analysis.findings.every((finding) => finding.status === 'not_enough_data')).toBe(true);
    }
  });
});
