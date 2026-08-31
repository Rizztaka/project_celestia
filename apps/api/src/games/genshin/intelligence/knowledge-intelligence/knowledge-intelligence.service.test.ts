import { describe, expect, it } from 'vitest';

import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import {
  detectArtifactHoarder,
  detectDiverseRoster,
  detectElementalSpecialist,
  detectMaxConstellation,
  detectTalentNeglector,
  runAllAnalyzers,
} from './knowledge-intelligence.calculator.js';
import { explainInsight } from './knowledge-intelligence.explainer.js';

// -------------------------------------------------------
// Fixtures
// -------------------------------------------------------

const ELEMENT_MAP: Record<string, string> = {
  HuTao: 'Pyro',
  Xiangling: 'Pyro',
  Bennett: 'Pyro',
  Diluc: 'Pyro',
  RaidenShogun: 'Electro',
  Fischl: 'Electro',
  Xingqiu: 'Hydro',
  Zhongli: 'Geo',
  Nahida: 'Dendro',
  KaedeharaKazuha: 'Anemo',
  Ganyu: 'Cryo',
};

function makeChar(overrides: Partial<CharacterInput> & { characterKey: string }): CharacterInput {
  return {
    level: 90,
    ascension: 6,
    constellation: 0,
    talentNormal: 8,
    talentSkill: 8,
    talentBurst: 8,
    equippedWeapon: null,
    ...overrides,
  };
}

// -------------------------------------------------------
// detectElementalSpecialist
// -------------------------------------------------------

describe('detectElementalSpecialist', () => {
  it('returns null when fewer than 2 fully built chars', () => {
    const roster = [makeChar({ characterKey: 'HuTao' })];
    expect(detectElementalSpecialist(roster, ELEMENT_MAP)).toBeNull();
  });

  it('returns null when no single element reaches 40%', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao' }), // Pyro
      makeChar({ characterKey: 'RaidenShogun' }), // Electro
      makeChar({ characterKey: 'Xingqiu' }), // Hydro
    ];
    expect(detectElementalSpecialist(roster, ELEMENT_MAP)).toBeNull();
  });

  it('returns ELEMENTAL_SPECIALIST when ≥40% are the same element', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao' }),
      makeChar({ characterKey: 'Xiangling' }),
      makeChar({ characterKey: 'Bennett' }),
      makeChar({ characterKey: 'RaidenShogun' }),
      makeChar({ characterKey: 'Fischl' }),
    ];
    const result = detectElementalSpecialist(roster, ELEMENT_MAP);
    expect(result).not.toBeNull();
    expect(result!.key).toBe('ELEMENTAL_SPECIALIST');
    expect(result!.subject).toBe('Pyro');
    expect(result!.value).toBe(60); // 3 of 5 = 60%
  });

  it('ignores non-fully-built characters (ascension < 6)', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao' }), // Pyro, ascension 6
      makeChar({ characterKey: 'Xiangling', ascension: 4 }), // Pyro, ascension 4 — ignored
      makeChar({ characterKey: 'RaidenShogun' }), // Electro, ascension 6
      makeChar({ characterKey: 'Fischl' }), // Electro, ascension 6
    ];
    // Only ascension-6 chars: HuTao(Pyro), Raiden(Electro), Fischl(Electro)
    // Electro = 2/3 = 66% — should trigger
    const result = detectElementalSpecialist(roster, ELEMENT_MAP);
    expect(result).not.toBeNull();
    expect(result!.subject).toBe('Electro');
    expect(result!.value).toBe(67);
  });
});

// -------------------------------------------------------
// detectTalentNeglector
// -------------------------------------------------------

describe('detectTalentNeglector', () => {
  it('returns null when no fully-ascended characters have low talents', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao', talentNormal: 8, talentSkill: 10, talentBurst: 9 }),
    ];
    expect(detectTalentNeglector(roster)).toBeNull();
  });

  it('detects a character with ascension 6 but all talents ≤ 4', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao', talentNormal: 3, talentSkill: 4, talentBurst: 2 }),
    ];
    const result = detectTalentNeglector(roster);
    expect(result).not.toBeNull();
    expect(result!.key).toBe('TALENT_NEGLECTOR');
    expect(result!.subject).toBe('HuTao');
    expect(result!.value).toBe(3); // avg of 3+4+2 = 3
  });

  it('picks the highest-level neglected character when multiple exist', () => {
    const roster = [
      makeChar({
        characterKey: 'HuTao',
        level: 80,
        talentNormal: 1,
        talentSkill: 1,
        talentBurst: 1,
      }),
      makeChar({
        characterKey: 'Bennett',
        level: 90,
        talentNormal: 2,
        talentSkill: 3,
        talentBurst: 2,
      }),
    ];
    const result = detectTalentNeglector(roster);
    expect(result!.subject).toBe('Bennett'); // level 90 > 80
  });
});

// -------------------------------------------------------
// detectArtifactHoarder
// -------------------------------------------------------

describe('detectArtifactHoarder', () => {
  it('returns null when fewer than 50 unequipped artifacts', () => {
    expect(detectArtifactHoarder(60, 20)).toBeNull(); // 40 unequipped
  });

  it('detects hoarder when > 50 unequipped', () => {
    const result = detectArtifactHoarder(120, 10);
    expect(result).not.toBeNull();
    expect(result!.key).toBe('ARTIFACT_HOARDER');
    expect(result!.value).toBe(110); // unequipped
    expect(result!.valueAlt).toBe(120); // total
  });

  it('triggers exactly at 51 unequipped', () => {
    expect(detectArtifactHoarder(60, 9)).not.toBeNull(); // 51 unequipped
  });
});

// -------------------------------------------------------
// detectMaxConstellation
// -------------------------------------------------------

describe('detectMaxConstellation', () => {
  it('returns null when no C6 characters', () => {
    const roster = [makeChar({ characterKey: 'HuTao', constellation: 5 })];
    expect(detectMaxConstellation(roster)).toBeNull();
  });

  it('detects a C6 character', () => {
    const roster = [makeChar({ characterKey: 'Bennett', constellation: 6 })];
    const result = detectMaxConstellation(roster);
    expect(result).not.toBeNull();
    expect(result!.key).toBe('MAX_CONSTELLATION');
    expect(result!.subject).toBe('Bennett');
    expect(result!.value).toBe(1);
  });

  it('reports correct count when multiple C6 characters exist', () => {
    const roster = [
      makeChar({ characterKey: 'Bennett', constellation: 6 }),
      makeChar({ characterKey: 'Xiangling', constellation: 6 }),
    ];
    const result = detectMaxConstellation(roster);
    expect(result!.value).toBe(2);
  });
});

// -------------------------------------------------------
// detectDiverseRoster
// -------------------------------------------------------

describe('detectDiverseRoster', () => {
  it('returns null when fewer than 5 unique elements', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao', ascension: 4 }),
      makeChar({ characterKey: 'RaidenShogun', ascension: 4 }),
      makeChar({ characterKey: 'Xingqiu', ascension: 4 }),
    ];
    expect(detectDiverseRoster(roster, ELEMENT_MAP)).toBeNull();
  });

  it('detects diverse roster with ≥5 elements', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao', ascension: 4 }), // Pyro
      makeChar({ characterKey: 'RaidenShogun', ascension: 4 }), // Electro
      makeChar({ characterKey: 'Xingqiu', ascension: 4 }), // Hydro
      makeChar({ characterKey: 'Zhongli', ascension: 4 }), // Geo
      makeChar({ characterKey: 'Nahida', ascension: 4 }), // Dendro
      makeChar({ characterKey: 'KaedeharaKazuha', ascension: 4 }), // Anemo
    ];
    const result = detectDiverseRoster(roster, ELEMENT_MAP);
    expect(result).not.toBeNull();
    expect(result!.key).toBe('DIVERSE_ROSTER');
    expect(result!.value).toBeGreaterThanOrEqual(5);
  });
});

// -------------------------------------------------------
// runAllAnalyzers integration
// -------------------------------------------------------

describe('runAllAnalyzers', () => {
  it('returns empty array when roster is empty', () => {
    const result = runAllAnalyzers([], ELEMENT_MAP, 0, 0);
    expect(result).toHaveLength(0);
  });

  it('returns multiple triggered insights for a rich account', () => {
    const roster = [
      makeChar({ characterKey: 'HuTao' }),
      makeChar({ characterKey: 'Xiangling' }),
      makeChar({ characterKey: 'Bennett', constellation: 6 }),
      makeChar({ characterKey: 'Diluc', talentNormal: 1, talentSkill: 2, talentBurst: 1 }),
    ];
    const result = runAllAnalyzers(roster, ELEMENT_MAP, 200, 15);
    // Should trigger: ELEMENTAL_SPECIALIST (Pyro 75%), MAX_CONSTELLATION, TALENT_NEGLECTOR, ARTIFACT_HOARDER
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.some((i) => i.key === 'ELEMENTAL_SPECIALIST')).toBe(true);
    expect(result.some((i) => i.key === 'MAX_CONSTELLATION')).toBe(true);
  });
});

// -------------------------------------------------------
// explainInsight
// -------------------------------------------------------

describe('explainInsight', () => {
  it('generates a valid explanation for ELEMENTAL_SPECIALIST', () => {
    const explanation = explainInsight({ key: 'ELEMENTAL_SPECIALIST', subject: 'Pyro', value: 60 });
    expect(explanation.title).toContain('Pyro');
    expect(explanation.body).toContain('60%');
    expect(explanation.iconKey).toBe('ELEMENTAL_SPECIALIST');
  });

  it('generates a valid explanation for TALENT_NEGLECTOR', () => {
    const explanation = explainInsight({
      key: 'TALENT_NEGLECTOR',
      subject: 'HuTao',
      value: 3,
      valueAlt: 1,
    });
    expect(explanation.body).toContain('Hu Tao');
    expect(explanation.body).toContain('3');
    expect(explanation.iconKey).toBe('TALENT_NEGLECTOR');
  });

  it('generates a valid explanation for ARTIFACT_HOARDER', () => {
    const explanation = explainInsight({
      key: 'ARTIFACT_HOARDER',
      subject: 'artifacts',
      value: 110,
      valueAlt: 120,
    });
    expect(explanation.body).toContain('110');
    expect(explanation.iconKey).toBe('ARTIFACT_HOARDER');
  });

  it('generates a valid explanation for MAX_CONSTELLATION', () => {
    const explanation = explainInsight({ key: 'MAX_CONSTELLATION', subject: 'Bennett', value: 1 });
    expect(explanation.body).toContain('C6');
    expect(explanation.iconKey).toBe('MAX_CONSTELLATION');
  });

  it('generates a valid explanation for DIVERSE_ROSTER', () => {
    const explanation = explainInsight({
      key: 'DIVERSE_ROSTER',
      subject: 'Anemo, Cryo, Dendro, Electro, Pyro',
      value: 5,
    });
    expect(explanation.body).toContain('5');
    expect(explanation.iconKey).toBe('DIVERSE_ROSTER');
  });
});
