import type { ReviewedCharacterProfile } from './identity';

export const v16Profiles: ReviewedCharacterProfile[] = [
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
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (-40% Elemental RES on Swirl, +60% Swirl DMG)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team +120 EM on Reaction)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+80 EM and high EM stacking)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['energyRecharge', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (-40% Elemental RES and +40% Elemental DMG bonus to party)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/kazuha-quickguide/',
      playstyleSummary:
        'Premier Anemo crowd-control grouper, elemental buffer, and Swirl sub-DPS. Casts Chihayaburu (Skill) to suck enemies and loose objects in, launching into the air before performing Midare Ranzan (infused plunging attack), and unleashes Kazuha Slash (Burst) for expansive elemental infusion and continuous AoE Swirls.',
      energyRequirements:
        "160% - 180% ER with Favonius Sword or Sacrificial Sword; 180% - 200%+ ER with non-ER weapons (Iron Sting, Freedom-Sworn, Xiphos' Moonlight).",
      combatTips: [
        'A4 Passive (Po-Fu-Seng-Kou): Upon triggering Swirl, grants all party members 0.04% Elemental DMG bonus for every point of Elemental Mastery Kazuha possesses for 8s (e.g. 1000 EM = +40% Elemental DMG Bonus). Can buff multiple elements simultaneously!',
        'Double Swirl Technique: In reaction teams (e.g. Childe International / Xiangling), apply Hydro, then tap E near Gouba to swirl both Hydro (from enemy) and Pyro (from Gouba) in a single Skill cast, buffing both elements and shredding both RES with 4pc VV!',
        'A1 Passive & Plunge: If Chihayaburu contacts Hydro/Pyro/Cryo/Electro while rising, Midare Ranzan plunge converts into that element dealing 200% ATK damage. Plunge damage scales with the Normal Attack talent.',
        "Absorption Priority: Pyro > Hydro > Electro > Cryo. Keep this hierarchy in mind when planning which element Kazuha's Burst will absorb in elemental soup compositions.",
        'Full EM Scaling: Swirl damage scales purely on Character Level (reaching level 90 is a ~34% damage increase over level 80) and Elemental Mastery, bypassing traditional ATK/Crit scaling.',
      ],
      weapons: [
        {
          name: 'Freedom-Sworn',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Signature 5-star sword; 198 EM, +10% DMG, and triggers team-wide +20% ATK and +16% Normal/Charged/Plunging DMG buff',
        },
        {
          name: "Xiphos' Moonlight",
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '165 EM; converts EM into personal and party Energy Recharge (e.g. +36% personal ER and +12% team ER at R1 with 1000 EM)',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            'Top utility choice; 61.3% ER and party white particles, lowering ER requirements for the entire team',
        },
        {
          name: 'Iron Sting',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            'Craftable F2P weapon providing 165 EM and stacking all-damage bonus upon dealing elemental DMG',
        },
        {
          name: 'Toukabou Shigure',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: 'Event sword; 165 EM and single-target damage increase',
        },
        {
          name: 'Sacrificial Sword',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '61.3% ER with Skill cooldown reset, providing a second jump for double grouping suction and particle generation',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Fishing sword; 45.9% ER, +16% Skill Crit Rate (triggers Favonius-like reliability), and extra ER after Skill',
        },
        {
          name: 'Dark Iron Sword',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes:
            'Accessible 3-star weapon from Liyue NPC Chen the Sharp; provides 141 EM and ATK buff on Electro reactions',
        },
      ],
    },
  },
];
