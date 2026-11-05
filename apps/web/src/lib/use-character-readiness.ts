import type {
  CharacterReadinessRequestInput,
  CharacterReadinessResponse,
  MarginalInvestmentRequestInput,
  MarginalInvestmentResponse,
  ReadinessArtifactSlot,
  ReadinessTeamEnergyContext,
  ShowcaseCharacter,
} from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { fetchCharacterReadiness, fetchMarginalInvestment } from './api';
import { setIdentityForItem, weaponIdentity } from './build-analysis/equipment';
import { signature } from './build-analysis/signature';
import {
  canonicalCombatStat,
  canonicalEquipmentStat,
  isCombatPercent,
} from './build-analysis/units';
import type { CharacterObservation } from './observed-roster';

export interface ReadinessOptions {
  roleId?: string;
  encounterId?: string;
  difficulty?: 'dummy_benchmark' | 'overworld' | 'abyss_11' | 'abyss_12' | 'theater';
  teamEnergyContext?: ReadinessTeamEnergyContext;
  enabled?: boolean;
}

/**
 * Pure converter function to convert CharacterObservation or ShowcaseCharacter
 * into a typed CharacterReadinessRequestInput / MarginalInvestmentRequestInput.
 */
export function characterToReadinessInput(
  characterOrObservation: CharacterObservation | ShowcaseCharacter,
  options?: ReadinessOptions,
): CharacterReadinessRequestInput {
  const character: ShowcaseCharacter =
    'character' in characterOrObservation
      ? characterOrObservation.character
      : characterOrObservation;

  const characterKey = character.name.replace(/\s+/g, '') || character.key;

  const normalTalent = character.talents.find((t) => t.kind === 'normal') ?? character.talents[0];
  const skillTalent = character.talents.find((t) => t.kind === 'skill') ?? character.talents[1];
  const burstTalent = character.talents.find((t) => t.kind === 'burst') ?? character.talents[2];

  let weapon = null;
  if (character.weapon) {
    const known = weaponIdentity(character.weapon.id);
    const weaponKey = known?.referenceKey ?? character.weapon.name.replace(/\s+/g, '');
    weapon = {
      weaponKey: weaponKey || 'UnknownWeapon',
      level:
        character.weapon.level != null ? Math.max(1, Math.min(90, character.weapon.level)) : null,
      refinement:
        character.weapon.refinement != null
          ? Math.max(1, Math.min(5, character.weapon.refinement))
          : 1,
      weaponType: character.weaponType ?? undefined,
    };
  }

  const artifactSlots: ReadinessArtifactSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];
  const artifacts: Record<
    ReadinessArtifactSlot,
    {
      slot: ReadinessArtifactSlot;
      setKey: string | null;
      mainStatKey: string | null;
      level?: number | null;
      rarity?: number | null;
    } | null
  > = {
    flower: null,
    plume: null,
    sands: null,
    goblet: null,
    circlet: null,
  };

  for (const slot of artifactSlots) {
    const found = character.artifacts.find((a) => a.slot?.toLowerCase() === slot);
    if (found) {
      const set = setIdentityForItem(found.id);
      const mainStatKey = found.mainStat ? canonicalEquipmentStat(found.mainStat.id) : null;
      artifacts[slot] = {
        slot,
        setKey: set?.referenceKey ?? found.setName ?? null,
        mainStatKey: mainStatKey ?? null,
        level: found.level != null ? Math.max(0, Math.min(20, found.level)) : null,
        rarity: found.rarity != null ? Math.max(1, Math.min(5, found.rarity)) : null,
      };
    }
  }

  const stats: Record<string, number> = {};
  for (const s of character.stats) {
    const canonical = canonicalCombatStat(s.id);
    if (canonical) {
      const percent = isCombatPercent(s.id);
      stats[canonical] = percent ? s.value * 100 : s.value;
    }
  }

  const roleProfile =
    options?.roleId && options.roleId !== 'unspecified' && options.roleId !== 'general_checks'
      ? options.roleId
      : undefined;

  const targetEncounter = options?.encounterId
    ? {
        encounterId: options.encounterId,
        difficulty: options.difficulty ?? 'dummy_benchmark',
      }
    : undefined;

  return {
    character: {
      characterKey,
      level: character.level != null ? Math.max(1, Math.min(90, character.level)) : null,
      ascension: character.ascension != null ? Math.max(0, Math.min(6, character.ascension)) : null,
      constellation:
        character.constellation != null ? Math.max(0, Math.min(6, character.constellation)) : 0,
      talents: {
        normal: normalTalent?.baseLevel ?? null,
        skill: skillTalent?.baseLevel ?? null,
        burst: burstTalent?.baseLevel ?? null,
      },
      weapon,
      artifacts,
      stats,
    },
    roleProfile,
    targetEncounter,
    teamEnergyContext: options?.teamEnergyContext,
  };
}

export function readinessQueryKey(
  characterKey: string,
  buildSignature: string,
  roleId: string,
  encounterId: string,
) {
  return ['character-readiness', characterKey, buildSignature, roleId, encounterId] as const;
}

export function marginalInvestmentQueryKey(
  characterKey: string,
  buildSignature: string,
  roleId: string,
  encounterId: string,
) {
  return ['marginal-investment', characterKey, buildSignature, roleId, encounterId] as const;
}

/**
 * Hook to evaluate character readiness for an encounter and role.
 * Queries are cached by character key, build signature, role, and encounter.
 */
export function useCharacterReadiness(
  characterOrObservation: CharacterObservation | ShowcaseCharacter | null | undefined,
  options?: ReadinessOptions,
) {
  const roleId = options?.roleId;
  const encounterId = options?.encounterId;
  const difficulty = options?.difficulty;
  const teamEnergyContext = options?.teamEnergyContext;

  const input = useMemo(() => {
    if (!characterOrObservation) return null;
    return characterToReadinessInput(characterOrObservation, {
      roleId,
      encounterId,
      difficulty,
      teamEnergyContext,
    });
  }, [characterOrObservation, roleId, encounterId, difficulty, teamEnergyContext]);

  const charKey = input?.character.characterKey ?? '';
  const buildSig = useMemo(() => (input ? signature(input.character) : ''), [input]);
  const roleKey = roleId ?? 'unspecified';
  const targetEncounterId = encounterId ?? 'training_dummy';

  return useQuery<CharacterReadinessResponse>({
    queryKey: readinessQueryKey(charKey, buildSig, roleKey, targetEncounterId),
    queryFn: ({ signal }) => {
      if (!input) throw new Error('No character input provided');
      return fetchCharacterReadiness(input, signal);
    },
    enabled: (options?.enabled ?? true) && !!input,
    staleTime: 60_000,
  });
}

/**
 * Hook to evaluate marginal investment upgrade paths.
 * Queries are cached by character key, build signature, role, and encounter.
 */
export function useMarginalInvestment(
  characterOrObservation: CharacterObservation | ShowcaseCharacter | null | undefined,
  options?: ReadinessOptions,
) {
  const roleId = options?.roleId;
  const encounterId = options?.encounterId;
  const difficulty = options?.difficulty;
  const teamEnergyContext = options?.teamEnergyContext;

  const input = useMemo(() => {
    if (!characterOrObservation) return null;
    return characterToReadinessInput(characterOrObservation, {
      roleId,
      encounterId,
      difficulty,
      teamEnergyContext,
    }) as MarginalInvestmentRequestInput;
  }, [characterOrObservation, roleId, encounterId, difficulty, teamEnergyContext]);

  const charKey = input?.character.characterKey ?? '';
  const buildSig = useMemo(() => (input ? signature(input.character) : ''), [input]);
  const roleKey = roleId ?? 'unspecified';
  const targetEncounterId = encounterId ?? 'training_dummy';

  return useQuery<MarginalInvestmentResponse>({
    queryKey: marginalInvestmentQueryKey(charKey, buildSig, roleKey, targetEncounterId),
    queryFn: ({ signal }) => {
      if (!input) throw new Error('No character input provided');
      return fetchMarginalInvestment(input, signal);
    },
    enabled: (options?.enabled ?? true) && !!input,
    staleTime: 60_000,
  });
}
