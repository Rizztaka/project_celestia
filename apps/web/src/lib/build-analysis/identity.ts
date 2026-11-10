import { v1Profiles } from './profiles-v1';
import { v11Profiles } from './profiles-v1-1';
import { v12Profiles } from './profiles-v1-2';
import { v13Profiles } from './profiles-v1-3';
import { v14Profiles } from './profiles-v1-4';
import { v15Profiles } from './profiles-v1-5';
import { v16Profiles } from './profiles-v1-6';
import { v20Profiles } from './profiles-v2-0';
import { v21Profiles } from './profiles-v2-1';
import { v22Profiles } from './profiles-v2-2';
import { v23Profiles } from './profiles-v2-3';
import { v24Profiles } from './profiles-v2-4';
import { v25Profiles } from './profiles-v2-5';
import { v26Profiles } from './profiles-v2-6';
import { v27Profiles } from './profiles-v2-7';
import { v28Profiles } from './profiles-v2-8';
import { v30Profiles } from './profiles-v3-0';
import { v31Profiles } from './profiles-v3-1';
import { v32Profiles } from './profiles-v3-2';
import { v33Profiles } from './profiles-v3-3';
import { v34Profiles } from './profiles-v3-4';
import { v35Profiles } from './profiles-v3-5';
import { v36Profiles } from './profiles-v3-6';
import { v37Profiles } from './profiles-v3-7';
import { v40Profiles } from './profiles-v4-0';
import { v41Profiles } from './profiles-v4-1';
import { v42Profiles } from './profiles-v4-2';
import { v43Profiles } from './profiles-v4-3';
import { v44Profiles } from './profiles-v4-4';
import { v45Profiles } from './profiles-v4-5';
import { v46Profiles } from './profiles-v4-6';
import { v47Profiles } from './profiles-v4-7';
import { v48Profiles } from './profiles-v4-8';
import { v50Profiles } from './profiles-v5-0';
import { v51Profiles } from './profiles-v5-1';
import { v52Profiles } from './profiles-v5-2';
import { v53Profiles } from './profiles-v5-3';
import { v54Profiles } from './profiles-v5-4';
import { v55Profiles } from './profiles-v5-5';
import { v56Profiles } from './profiles-v5-6';
import { v57Profiles } from './profiles-v5-7';
import { v58Profiles } from './profiles-v5-8';
import { v60Profiles } from './profiles-v6-0';
import { v61Profiles } from './profiles-v6-1';
import { v62Profiles } from './profiles-v6-2';
import { v63Profiles } from './profiles-v6-3';
import { v64Profiles } from './profiles-v6-4';
import { v65Profiles } from './profiles-v6-5';
import { v66Profiles } from './profiles-v6-6';
import { v67Profiles } from './profiles-v6-7';
import { v70Profiles } from './profiles-v7-0';
import { v71Profiles } from './profiles-v7-1';
import type { BuildRoleId } from './types';
import type { CanonicalStatId } from './units';

export interface WeaponRecommendation {
  name: string;
  rarity: 3 | 4 | 5;
  tier: 1 | 2 | 3; // 1: Best-in-Slot, 2: Competitive Alternative, 3: F2P / Budget
  category: 'BiS' | 'Alternative' | 'Utility' | 'F2P';
  notes?: string;
}

export interface ReviewedSetOption {
  referenceKey: string;
  pieces: 2 | 4;
  tier?: 1 | 2 | 3; // 1: Best-in-Slot, 2: Alternative, 3: Transitional
  label?: string; // e.g. "Best in Slot", "Alternative (~94%)"
  notes?: string;
}

export interface CharacterGuideDetails {
  sourceUrl: string;
  playstyleSummary: string;
  energyRequirements: string;
  combatTips: string[];
  weapons: WeaponRecommendation[];
}

export interface ReviewedRole {
  id: BuildRoleId;
  talentPriority: ('normal' | 'skill' | 'burst')[];
  talentPriorityGroups?: ('normal' | 'skill' | 'burst')[][];
  mainStats: Partial<Record<'Sands' | 'Goblet' | 'Circlet', CanonicalStatId[]>>;
  priorityStats: CanonicalStatId[];
  sets: ReviewedSetOption[];
  conditionalMainStats?: Partial<
    Record<
      'Sands' | 'Goblet' | 'Circlet',
      Partial<Record<CanonicalStatId, 'reaction_context' | 'favonius_proc' | 'team_buffs'>>
    >
  >;
}

export interface ReviewedCharacterProfile {
  avatarId: number;
  skillDepotId: number;
  referenceKey: string;
  displayName: string;
  roles: ReviewedRole[];
  evidenceIds: string[];
  defaultRoleId: BuildRoleId;
  guide?: CharacterGuideDetails;
}


// All Version 1.0 through 2.0 verified profiles plus post-launch meta anchors reviewed against sources.json
export const reviewedProfiles: ReviewedCharacterProfile[] = [
  ...v1Profiles,
  ...v11Profiles,
  ...v12Profiles,
  ...v13Profiles,
  ...v14Profiles,
  ...v15Profiles,
  ...v16Profiles,
  ...v20Profiles,
  ...v21Profiles,
  ...v22Profiles,
  ...v23Profiles,
  ...v24Profiles,
  ...v25Profiles,
  ...v26Profiles,
  ...v27Profiles,
  ...v28Profiles,
  ...v30Profiles,
  ...v31Profiles,
  ...v32Profiles,
  ...v33Profiles,
  ...v34Profiles,
  ...v35Profiles,
  ...v36Profiles,
  ...v37Profiles,
  ...v40Profiles,
  ...v41Profiles,
  ...v42Profiles,
  ...v43Profiles,
  ...v44Profiles,
  ...v45Profiles,
  ...v46Profiles,
  ...v47Profiles,
  ...v48Profiles,
  ...v50Profiles,
  ...v51Profiles,
  ...v52Profiles,
  ...v53Profiles,
  ...v54Profiles,
  ...v55Profiles,
  ...v56Profiles,
  ...v57Profiles,
  ...v58Profiles,
  ...v60Profiles,
  ...v61Profiles,
  ...v62Profiles,
  ...v63Profiles,
  ...v64Profiles,
  ...v65Profiles,
  ...v66Profiles,
  ...v67Profiles,
  ...v70Profiles,
  ...v71Profiles,
];

export function profileForCharacter(avatarId: number, skillDepotId: number | null) {
  return (
    reviewedProfiles.find((p) => p.avatarId === avatarId && p.skillDepotId === skillDepotId) ?? null
  );
}

export function reviewedRole(profile: ReviewedCharacterProfile, roleId: string) {
  return profile.roles.find((r) => r.id === roleId) ?? null;
}

export function formIdentity(character: { avatarId: number }) {
  return [10000005, 10000007].includes(character.avatarId)
    ? 'traveler'
    : `avatar:${character.avatarId}`;
}
