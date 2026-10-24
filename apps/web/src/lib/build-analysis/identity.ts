import type { BuildRoleId } from './types';
import type { CanonicalStatId } from './units';
export interface ReviewedRole {
  id: BuildRoleId;
  talentPriority: ('normal' | 'skill' | 'burst')[];
  mainStats: Partial<Record<'Sands' | 'Goblet' | 'Circlet', CanonicalStatId[]>>;
  priorityStats: CanonicalStatId[];
  sets: { referenceKey: string; pieces: 2 | 4 }[];
}
export interface ReviewedCharacterProfile {
  avatarId: number;
  skillDepotId: number;
  referenceKey: string;
  displayName: string;
  roles: ReviewedRole[];
  evidenceIds: string[];
}
const furina: Omit<ReviewedRole, 'id'> = {
  talentPriority: ['burst', 'skill'],
  mainStats: {
    Sands: ['hpPercent', 'energyRecharge'],
    Goblet: ['hpPercent', 'hydroDmg'],
    Circlet: ['critRate', 'critDmg'],
  },
  priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'maxHp'],
  sets: [{ referenceKey: 'GoldenTroupe', pieces: 4 }],
};
const sucrose: Omit<ReviewedRole, 'id'> = {
  talentPriority: ['skill', 'burst', 'normal'],
  mainStats: {
    Sands: ['elementalMastery'],
    Goblet: ['elementalMastery'],
    Circlet: ['elementalMastery'],
  },
  priorityStats: ['elementalMastery', 'energyRecharge'],
  sets: [{ referenceKey: 'ViridescentVenerer', pieces: 4 }],
};
const xilonen: Omit<ReviewedRole, 'id'> = {
  talentPriority: ['skill', 'burst'],
  mainStats: {
    Sands: ['defPercent', 'energyRecharge'],
    Goblet: ['defPercent'],
    Circlet: ['defPercent', 'healingBonus'],
  },
  priorityStats: ['energyRecharge', 'def'],
  sets: [{ referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4 }],
};
// Interrupted draft profiles without evidence are not executable. These four kits
// were reviewed against the sources in sources.json. Other kits retain generic checks.
export const reviewedProfiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000089,
    skillDepotId: 8901,
    referenceKey: 'Furina',
    displayName: 'Furina',
    roles: [
      { ...furina, id: 'party_buff' },
      { ...furina, id: 'off_field_damage' },
    ],
    evidenceIds: ['kqm-furina'],
  },
  {
    avatarId: 10000043,
    skillDepotId: 4301,
    referenceKey: 'Sucrose',
    displayName: 'Sucrose',
    roles: [
      { ...sucrose, id: 'reaction_trigger' },
      { ...sucrose, id: 'party_buff' },
    ],
    evidenceIds: ['kqm-sucrose'],
  },
  {
    avatarId: 10000114,
    skillDepotId: 11401,
    referenceKey: 'Skirk',
    displayName: 'Skirk',
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['cryoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atk'],
        sets: [
          { referenceKey: 'FinaleOfTheDeepGalleries', pieces: 4 },
          { referenceKey: 'MarechausseeHunter', pieces: 4 },
        ],
      },
    ],
    evidenceIds: ['kqm-skirk'],
  },
  {
    avatarId: 10000103,
    skillDepotId: 10301,
    referenceKey: 'Xilonen',
    displayName: 'Xilonen',
    roles: [
      { ...xilonen, id: 'resistance_shred' },
      { ...xilonen, id: 'healing_support' },
    ],
    evidenceIds: ['kqm-xilonen'],
  },
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
