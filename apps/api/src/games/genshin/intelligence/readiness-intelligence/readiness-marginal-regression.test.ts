import type {
  CharacterReadinessRequestInput,
  MarginalInvestmentRequestInput,
  ReadinessArtifactSlot,
} from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import {
  calculateCharacterAscensionCosts,
  calculateMarginalInvestment,
  calculateTalentUpgradeCosts,
  calculateWeaponAscensionCosts,
} from '../marginal-investment/marginal-investment.calculator.js';
import { calculateReadiness, resolveRoleBenchmark } from './readiness-intelligence.calculator.js';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

describe('M2 Contextual Readiness & Marginal Investment Hardening Regression Tests', () => {
  // -------------------------------------------------------------------------
  // 1. Null talents producing no talent upgrade candidates
  // -------------------------------------------------------------------------
  it('never generates talent upgrade candidates for null/unrecorded talents', () => {
    const input: MarginalInvestmentRequestInput = {
      character: {
        characterKey: 'Xiangling',
        level: 80,
        ascension: 5,
        talents: {
          normal: null,
          skill: null,
          burst: null,
        },
        weapon: {
          weaponKey: 'TheCatch',
          level: 90,
        },
        artifacts: {
          flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp', level: 20 },
          plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk', level: 20 },
          sands: {
            slot: 'sands',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'energyRecharge',
            level: 20,
          },
          goblet: {
            slot: 'goblet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'pyroDmg',
            level: 20,
          },
          circlet: {
            slot: 'circlet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'critRate',
            level: 20,
          },
        },
        stats: { energyRecharge: 220, atk: 1400 },
      },
      roleProfile: 'off_field_damage',
    };

    const result = calculateMarginalInvestment(input);

    const talentCandidates = result.rankedUpgrades.filter((u) => u.category === 'talent');
    expect(talentCandidates).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 2. Missing Sands producing no fabricated ER Sands score delta
  // -------------------------------------------------------------------------
  it('missing Sands produces no fabricated ER Sands score delta or candidate', () => {
    const input: MarginalInvestmentRequestInput = {
      character: {
        characterKey: 'Xiangling',
        level: 80,
        ascension: 5,
        talents: {
          normal: 1,
          skill: 8,
          burst: 8,
        },
        weapon: {
          weaponKey: 'TheCatch',
          level: 90,
        },
        artifacts: {
          flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp', level: 20 },
          plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk', level: 20 },
          sands: null, // MISSING SANDS SLOT
          goblet: {
            slot: 'goblet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'pyroDmg',
            level: 20,
          },
          circlet: {
            slot: 'circlet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'critRate',
            level: 20,
          },
        },
        stats: { energyRecharge: 120 }, // Severe ER deficit
      },
      roleProfile: 'off_field_damage',
    };

    const result = calculateMarginalInvestment(input);

    // No artifact candidates should be created for the missing sands
    const sandsCandidates = result.rankedUpgrades.filter(
      (u) => u.target === 'sands' || (u.category === 'artifact_main_stat' && u.target === 'sands'),
    );
    expect(sandsCandidates).toHaveLength(0);

    // Metadata flags missing sands as unavailable acquisition requirement
    expect(result.metadata.missingSandsForEr).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 3. Unknown character/weapon producing unavailable costs rather than guesses
  // -------------------------------------------------------------------------
  it('unknown character or weapon produces unavailable costs rather than guessed fallbacks', () => {
    // Unknown character talent costs
    const charTalentCosts = calculateTalentUpgradeCosts('NonExistentCharacter_XYZ', 1, 8);
    expect(charTalentCosts).toBeNull();

    // Unknown character ascension costs
    const charAscCosts = calculateCharacterAscensionCosts('NonExistentCharacter_XYZ', 1, 4);
    expect(charAscCosts).toBeNull();

    // Unknown weapon ascension costs
    const weaponCosts = calculateWeaponAscensionCosts('NonExistentWeapon_ABC', 1, 5);
    expect(weaponCosts).toBeNull();

    // Marginal investment with unknown character omits guessed candidates
    const input: MarginalInvestmentRequestInput = {
      character: {
        characterKey: 'NonExistentCharacter_XYZ',
        level: 80,
        ascension: 5,
        talents: {
          normal: 6,
          skill: 6,
          burst: 6,
        },
        weapon: {
          weaponKey: 'NonExistentWeapon_ABC',
          level: 70,
        },
      },
      roleProfile: 'generic_dps',
    };

    const result = calculateMarginalInvestment(input);
    expect(result.metadata.unsupportedProgressionTargets).toContain('NonExistentCharacter_XYZ');
    expect(result.metadata.unsupportedProgressionTargets).toContain('NonExistentWeapon_ABC');

    // All upgrades must have verified non-empty costs or be omitted
    for (const u of result.rankedUpgrades) {
      if (
        u.category === 'talent' ||
        u.category === 'weapon_level' ||
        u.category === 'character_ascension'
      ) {
        expect(u.costs.length).toBeGreaterThan(0);
      }
    }
  });

  // -------------------------------------------------------------------------
  // 4. Missing weapon/artifact levels remaining unknown
  // -------------------------------------------------------------------------
  it('missing weapon/artifact levels remain unknown and result in insufficient_data', () => {
    const input: CharacterReadinessRequestInput = {
      character: {
        characterKey: 'Xiangling',
        level: null, // Unknown character level
        ascension: null, // Unknown ascension
        talents: { normal: 1, skill: 8, burst: 8 },
        weapon: {
          weaponKey: 'TheCatch',
          level: null, // Unknown weapon level
        },
        artifacts: {
          flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp', level: null },
          plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk', level: null },
          sands: {
            slot: 'sands',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'energyRecharge',
            level: null,
          },
          goblet: {
            slot: 'goblet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'pyroDmg',
            level: null,
          },
          circlet: {
            slot: 'circlet',
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'critRate',
            level: null,
          },
        },
        stats: { energyRecharge: 220, atk: 1400 },
      },
      roleProfile: 'off_field_damage',
    };

    const result = calculateReadiness(input);

    expect(result.status).toBe('insufficient_data');
    expect(result.dimensions.weapon.status).toBe('insufficient_data');
    expect(result.dimensions.weapon.missingReasons).toContain('unrecorded_weapon_level');
    expect(result.missingData.some((m) => m.reason === 'unrecorded_character_level')).toBe(true);
    expect(result.missingData.some((m) => m.reason === 'unrecorded_character_ascension')).toBe(
      true,
    );
  });

  // -------------------------------------------------------------------------
  // 5. No-role input not becoming generic support
  // -------------------------------------------------------------------------
  it('no-role input does not silently fall back to generic_support', () => {
    // For an unknown character with no role profile provided:
    const benchmark = resolveRoleBenchmark('UnknownHero_999', undefined);
    expect(benchmark).toBeNull();

    const input: CharacterReadinessRequestInput = {
      character: {
        characterKey: 'UnknownHero_999',
        level: 80,
        ascension: 5,
        talents: { normal: 8, skill: 8, burst: 8 },
        weapon: { weaponKey: 'TheCatch', level: 90 },
      },
      // roleProfile is omitted
    };

    const result = calculateReadiness(input);
    expect(result.status).toBe('insufficient_data');
    expect(result.metadata.roleId).toBe('unspecified');
    expect(result.metadata.roleId).not.toBe('generic_support');
    expect(result.missingData.some((m) => m.reason === 'unspecified_role_profile')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. Team, rotation, and encounter inputs affecting readiness
  // -------------------------------------------------------------------------
  it('team, rotation, and encounter inputs measurably affect readiness', () => {
    const baseBuild = {
      characterKey: 'Xiangling',
      level: 80,
      ascension: 5,
      talents: { normal: 1, skill: 8, burst: 8 },
      weapon: { weaponKey: 'TheCatch', level: 90 },
      artifacts: {
        flower: {
          slot: 'flower' as ReadinessArtifactSlot,
          setKey: 'EmblemOfSeveredFate',
          mainStatKey: 'hp',
          level: 20,
        },
        plume: {
          slot: 'plume' as ReadinessArtifactSlot,
          setKey: 'EmblemOfSeveredFate',
          mainStatKey: 'atk',
          level: 20,
        },
        sands: {
          slot: 'sands' as ReadinessArtifactSlot,
          setKey: 'EmblemOfSeveredFate',
          mainStatKey: 'energyRecharge',
          level: 20,
        },
        goblet: {
          slot: 'goblet' as ReadinessArtifactSlot,
          setKey: 'EmblemOfSeveredFate',
          mainStatKey: 'pyroDmg',
          level: 20,
        },
        circlet: {
          slot: 'circlet' as ReadinessArtifactSlot,
          setKey: 'EmblemOfSeveredFate',
          mainStatKey: 'critRate',
          level: 20,
        },
      },
      stats: { energyRecharge: 220, atk: 1400 },
    };

    // 1. Particles per rotation effect: high particles (20) vs low particles (5)
    const highParticlesResult = calculateReadiness({
      character: baseBuild,
      roleProfile: 'off_field_damage',
      teamEnergyContext: {
        particlesPerRotation: 20,
        rotationLengthSeconds: 20,
      },
    });

    const lowParticlesResult = calculateReadiness({
      character: baseBuild,
      roleProfile: 'off_field_damage',
      teamEnergyContext: {
        particlesPerRotation: 5,
        rotationLengthSeconds: 20,
      },
    });

    expect(highParticlesResult.metadata.effectiveErThreshold).toBeLessThan(
      lowParticlesResult.metadata.effectiveErThreshold,
    );

    // 2. Rotation length effect: short (15s) vs long (25s)
    const shortRotationResult = calculateReadiness({
      character: baseBuild,
      roleProfile: 'off_field_damage',
      teamEnergyContext: {
        rotationLengthSeconds: 15,
      },
    });

    const longRotationResult = calculateReadiness({
      character: baseBuild,
      roleProfile: 'off_field_damage',
      teamEnergyContext: {
        rotationLengthSeconds: 25,
      },
    });

    expect(shortRotationResult.metadata.effectiveErThreshold).toBeGreaterThan(
      longRotationResult.metadata.effectiveErThreshold,
    );

    // 3. Encounter minCharacterLevel effect: level 80 vs encounter requiring level 90
    const readyEncounter = calculateReadiness({
      character: baseBuild, // level 80
      roleProfile: 'off_field_damage',
      targetEncounter: {
        encounterId: 'overworld',
        minCharacterLevel: 80,
      },
    });

    const higherEncounter = calculateReadiness({
      character: baseBuild, // level 80
      roleProfile: 'off_field_damage',
      targetEncounter: {
        encounterId: 'abyss_12',
        minCharacterLevel: 90,
      },
    });

    expect(readyEncounter.status).toBe('ready_for_target');
    expect(higherEncounter.status).toBe('conditional'); // Level deficit prevents ready_for_target
  });

  // -------------------------------------------------------------------------
  // 7. Incomplete set data never produces a false ready_for_target result
  // -------------------------------------------------------------------------
  it('incomplete set data never produces a false ready_for_target result when set is required', () => {
    const input: CharacterReadinessRequestInput = {
      character: {
        characterKey: 'Xiangling',
        level: 90,
        ascension: 6,
        talents: { normal: 6, skill: 9, burst: 9 },
        weapon: { weaponKey: 'TheCatch', level: 90 },
        artifacts: {
          flower: { slot: 'flower', setKey: 'EmblemOfSeveredFate', mainStatKey: 'hp', level: 20 },
          plume: { slot: 'plume', setKey: 'EmblemOfSeveredFate', mainStatKey: 'atk', level: 20 },
          // sands, goblet, circlet are missing! (< 4 artifacts)
          sands: null,
          goblet: null,
          circlet: null,
        },
        stats: { energyRecharge: 220, atk: 1600 },
      },
      roleProfile: 'off_field_damage', // requires EmblemOfSeveredFate
    };

    const result = calculateReadiness(input);

    expect(result.dimensions.set_activation.status).toBe('insufficient_data');
    expect(result.status).not.toBe('ready_for_target');
    expect(result.status).toBe('insufficient_data');
  });

  // -------------------------------------------------------------------------
  // 8. Input objects remaining immutable
  // -------------------------------------------------------------------------
  it('keeps input objects strictly immutable across readiness and marginal calculators', () => {
    const input: MarginalInvestmentRequestInput = deepFreeze({
      character: {
        characterKey: 'Xiangling',
        level: 80,
        ascension: 5,
        constellation: 4,
        talents: {
          normal: 1,
          skill: 6,
          burst: 6,
        },
        weapon: {
          weaponKey: 'TheCatch',
          level: 80,
          refinement: 5,
        },
        artifacts: {
          flower: {
            slot: 'flower' as ReadinessArtifactSlot,
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'hp',
            level: 20,
          },
          plume: {
            slot: 'plume' as ReadinessArtifactSlot,
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'atk',
            level: 20,
          },
          sands: {
            slot: 'sands' as ReadinessArtifactSlot,
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'energyRecharge',
            level: 20,
          },
          goblet: {
            slot: 'goblet' as ReadinessArtifactSlot,
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'pyroDmg',
            level: 20,
          },
          circlet: {
            slot: 'circlet' as ReadinessArtifactSlot,
            setKey: 'EmblemOfSeveredFate',
            mainStatKey: 'critRate',
            level: 20,
          },
        },
        stats: { energyRecharge: 220, atk: 1400 },
      },
      roleProfile: 'off_field_damage',
      targetEncounter: {
        encounterId: 'abyss_12',
        minCharacterLevel: 80,
        minWeaponLevel: 80,
      },
      teamEnergyContext: {
        partyMembers: ['Xiangling', 'Bennett', 'Xingqiu', 'RaidenShogun'],
        particlesPerRotation: 18,
        sameElementCount: 2,
        favoniusWeaponCount: 1,
        rotationLengthSeconds: 20,
      },
    });

    // Neither function should throw when given deeply frozen inputs
    expect(() => calculateReadiness(input)).not.toThrow();
    expect(() => calculateMarginalInvestment(input)).not.toThrow();
  });
});
