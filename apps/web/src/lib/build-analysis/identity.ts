import type { BuildRoleId } from './types';
import type { CanonicalStatId } from './units';
export interface ReviewedRole {
  id: BuildRoleId;
  talentPriority: ('normal' | 'skill' | 'burst')[];
  talentPriorityGroups?: ('normal' | 'skill' | 'burst')[][];
  mainStats: Partial<Record<'Sands' | 'Goblet' | 'Circlet', CanonicalStatId[]>>;
  priorityStats: CanonicalStatId[];
  sets: { referenceKey: string; pieces: 2 | 4 }[];
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
// Selected role patterns reviewed against sources.json; not complete kit/patch coverage.
export const reviewedProfiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000089,
    skillDepotId: 8901,
    referenceKey: 'Furina',
    displayName: 'Furina',
    defaultRoleId: 'party_buff',
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
    defaultRoleId: 'reaction_trigger',
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
    defaultRoleId: 'on_field_damage',
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
    defaultRoleId: 'resistance_shred',
    roles: [
      { ...xilonen, id: 'resistance_shred' },
      { ...xilonen, id: 'healing_support' },
    ],
    evidenceIds: ['kqm-xilonen'],
  },
  {
    avatarId: 10000032,
    skillDepotId: 3201,
    referenceKey: 'Bennett',
    displayName: 'Bennett',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-bennett'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['healingBonus', 'hpPercent'],
        },
        priorityStats: ['energyRecharge', 'maxHp'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4 },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4 },
          { referenceKey: 'Instructor', pieces: 4 },
        ],
      },
    ],
  },
  {
    avatarId: 10000023,
    skillDepotId: 2301,
    referenceKey: 'Xiangling',
    displayName: 'Xiangling',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-xiangling'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk', 'elementalMastery'],
        sets: [{ referenceKey: 'EmblemOfSeveredFate', pieces: 4 }],
      },
    ],
  },
  {
    avatarId: 10000025,
    skillDepotId: 2501,
    referenceKey: 'Xingqiu',
    displayName: 'Xingqiu',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-xingqiu'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk'],
        sets: [{ referenceKey: 'EmblemOfSeveredFate', pieces: 4 }],
      },
    ],
  },
  {
    avatarId: 10000031,
    skillDepotId: 3101,
    referenceKey: 'Fischl',
    displayName: 'Fischl',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-fischl'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk'],
        sets: [{ referenceKey: 'GoldenTroupe', pieces: 4 }],
      },
    ],
  },
  {
    avatarId: 10000047,
    skillDepotId: 4701,
    referenceKey: 'KaedeharaKazuha',
    displayName: 'Kaedehara Kazuha',
    defaultRoleId: 'resistance_shred',
    evidenceIds: ['kqm-kazuha'],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['burst', 'normal', 'skill'],
        talentPriorityGroups: [['burst'], ['normal', 'skill']],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['energyRecharge', 'elementalMastery'],
        sets: [{ referenceKey: 'ViridescentVenerer', pieces: 4 }],
      },
    ],
  },
  {
    avatarId: 10000073,
    skillDepotId: 7301,
    referenceKey: 'Nahida',
    displayName: 'Nahida',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-nahida'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery', 'dendroDmg'],
          Circlet: ['elementalMastery', 'critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate', 'critDmg'],
        sets: [{ referenceKey: 'DeepwoodMemories', pieces: 4 }],
      },
    ],
  },
  {
    avatarId: 10000112,
    skillDepotId: 11201,
    referenceKey: 'Escoffier',
    displayName: 'Escoffier',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-escoffier'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['cryoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Goblet: { atkPercent: 'team_buffs' } },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk'],
        sets: [
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4 },
          { referenceKey: 'GoldenTroupe', pieces: 4 },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4 },
          { referenceKey: 'NoblesseOblige', pieces: 4 },
        ],
      },
    ],
  },
  {
    avatarId: 10000115,
    skillDepotId: 11501,
    referenceKey: 'Dahlia',
    displayName: 'Dahlia',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-dahlia'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['burst'],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent', 'critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['energyRecharge', 'maxHp'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4 },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4 },
        ],
      },
    ],
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
