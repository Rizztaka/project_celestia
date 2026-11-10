import type { ReviewedCharacterProfile } from './identity';

export const v13Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000026,
    skillDepotId: 2601,
    referenceKey: 'Xiao',
    displayName: 'Xiao',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-xiao'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['anemoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atk', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'VermillionHereafter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+66% ATK from continuous HP drain)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (with Furina / HP fluctuation: +36% Crit Rate)',
          },
          {
            referenceKey: 'DesertPavilionChronicle',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+15% Anemo, +40% Plunge DMG after CA)',
          },
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Anemo DMG)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
          },
          {
            referenceKey: 'ShimenawasReminiscence',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
          },
          {
            referenceKey: 'VermillionHereafter',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/xiao/',
      playstyleSummary:
        'High-mobility aerial hypercarry who activates Bane of All Evil (Burst) to continuously execute devastating high-plunge Anemo AoE attacks while rapidly losing HP. Relies on an Anemo battery and off-field supports (Faruzan, Xianyun, Furina, Zhongli).',
      energyRequirements:
        '120% - 140% ER with a dedicated Anemo battery catching particles (Faruzan, Xianyun, Sucrose); up to 160%+ in solo Anemo or battery-less teams.',
      combatTips: [
        'Plunging Attack damage multiplier scales directly from his Normal Attack talent, NOT his Burst; level Normal Attack equal to or before Burst.',
        'Pre-funneling: Cast Elemental Skill (E) twice immediately BEFORE activating Elemental Burst (Q) to catch the Anemo energy particles during the burst startup animation.',
        'Xiao does NOT generate energy particles with his Elemental Skill during the duration of Bane of All Evil.',
        'High Plunge vs Low Plunge: Always aim for high plunges to maximize damage area and damage scaling.',
        'Collision plunge (jet combo): Performing a Normal Attack right before jumping into a plunge (N1CJP) causes collision damage on the descent against tall or single targets.',
      ],
      weapons: [
        {
          name: 'Primordial Jade Winged-Spear',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Xiao signature polearm; provides 22.1% Crit Rate, ramps up ATK with every hit, and grants +12% all-DMG at max stacks',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Massive 66.2% Crit DMG with unconditional HP-to-ATK scaling, doubling its ATK bonus when Xiao drops below 50% HP',
        },
        {
          name: 'Calamity Queller',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'Huge base ATK, high ATK% substat, and unconditional all-elemental DMG bonus',
        },
        {
          name: 'Staff of the Scarlet Sands',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'Massive 44.1% Crit Rate eases artifact balancing',
        },
        {
          name: 'Deathmatch',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            'Battle Pass polearm; huge 36.8% Crit Rate with consistent ATK/DEF buffs in both single-target and multi-target',
        },
        {
          name: 'Lithic Spear',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            'Strong ATK% and Crit Rate scaling when teamed with Liyue allies (e.g., Xianyun, Zhongli, Faruzan)',
        },
        {
          name: 'Blackcliff Pole',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            'Starglitter shop F2P option providing 55.1% Crit DMG and stacking ATK after defeating enemies',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 3,
          category: 'Utility',
          notes: 'Sacrifices personal damage for extreme energy comfort and team clear consistency',
        },
        {
          name: 'White Tassel',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: 'Accessible 3-star weapon providing 23.4% Crit Rate',
        },
      ],
    },
  },
  {
    avatarId: 10000046,
    skillDepotId: 4601,
    referenceKey: 'HuTao',
    displayName: 'Hu Tao',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-hutao'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        mainStats: {
          Sands: ['hpPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'maxHp', 'hpPercent'],
        sets: [
          {
            referenceKey: 'CrimsonWitchOfFlames',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+15% Pyro DMG and +15% Vaporize reaction DMG)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (with Furina / HP fluctuation: +36% Crit Rate, +15% Normal/Charged)',
          },
          {
            referenceKey: 'ShimenawasReminiscence',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative (+50% Charged Attack DMG; costs 15 Energy)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+80 EM and high ATK/EM bonus in rainbow comps)',
          },
          {
            referenceKey: 'CrimsonWitchOfFlames',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Pyro DMG)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+20% HP)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+20% HP)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl:
        'https://kqm-uploads.keqingmains.com/wp-content/uploads/2025/07/Hu_Tao_5.7_-_icedsquid.png',
      playstyleSummary:
        'Premier single-target Pyro hypercarry specialized in Vaporize Charged Attack combos. Sacrifices 30% current HP to enter Paramita Papilio (Skill), gaining enormous ATK based on Max HP, Pyro infusion, and applying Blood Blossom damage over time.',
      energyRequirements:
        "100% - 130% ER if casting Spirit Soother (Burst) every rotation; ~100% (baseline) if bursting every other rotation or using 4pc Shimenawa's Reminiscence.",
      combatTips: [
        'Charged Attack multiplier comes directly from Normal Attack talent: prioritize leveling Normal Attack >= Skill > Burst.',
        'Jump-canceling at C0: To conserve stamina and prevent overshooting past targets, jump right as the Charged Attack damage registers (N1CJ).',
        'Dash-canceling at C1: C1 removes the stamina cost from Charged Attacks in Paramita Papilio, allowing fluid dash-cancels (N1CD) for higher DPS, more attacks per rotation, and iframe evasion.',
        'Sanguine Rouge (A4 Passive): Hu Tao gains +33% Pyro DMG bonus when her HP is 50% or lower; maintain low HP when possible unless paired with Furina.',
        'Flutter By (A1 Passive): When Paramita Papilio ends, all other party members gain +12% Crit Rate for 8 seconds.',
        'EM Thresholds: In Vaporize teams, Elemental Mastery is as valuable or more valuable than HP% and Crit until ~200-300 EM; use EM Sands if running Staff of Homa or HP weapons without an EM buffer.',
      ],
      weapons: [
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Unrivaled signature polearm; provides 66.2% Crit DMG, +20% HP, and ATK scaling based on HP that doubles below 50% HP',
        },
        {
          name: 'Staff of the Scarlet Sands',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '44.1% Crit Rate; converts EM into enormous flat ATK, rivaling Homa in high-EM Vaporize setups',
        },
        {
          name: 'Ballad of the Fjords',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            'Battle Pass polearm; 27.6% Crit Rate and +120~240 EM when party contains at least 3 different elemental types',
        },
        {
          name: "Dragon's Bane",
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            'Top F2P/gacha 4-star; 221 EM substat with +20%~36% DMG bonus against enemies affected by Hydro or Pyro',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High base ATK, 22.1% Crit Rate, and stacking ATK/DMG bonuses',
        },
        {
          name: 'Deathmatch',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Massive 36.8% Crit Rate helps balance artifact stats',
        },
        {
          name: 'White Tassel',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes:
            'Accessible 3-star option providing 23.4% Crit Rate and Normal Attack damage bonus',
        },
      ],
    },
  },
];
