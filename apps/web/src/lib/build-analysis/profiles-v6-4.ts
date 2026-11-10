import type { ReviewedCharacterProfile } from './identity';

export const v64Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000128,
    skillDepotId: 12801,
    referenceKey: 'Varka',
    displayName: 'Varka',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-varka-info', 'kqm-varka-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill'],
        talentPriorityGroups: [['skill']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['atkPercent', 'anemoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Goblet: { atkPercent: 'team_buffs' },
          Circlet: { critRate: 'team_buffs' },
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'ADayCarvedFromRisingWinds',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+40% ATK & +20% CRIT Rate upon completing Witch\'s Homework as a Hexerei character)',
          },
          {
            referenceKey: 'ShimenawasReminiscence',
            pieces: 4,
            tier: 2,
            label:
              'Competitive Alternative (+18% ATK & +50% Normal/Charged Attack DMG for 10s upon Skill cast)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label:
              'Competitive Alternative with Furina (+15% Normal/Charged DMG & +36% CRIT Rate)',
          },
          {
            referenceKey: 'DesertPavilionChronicle',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+15% Anemo DMG, +10% ATK SPD & +40% Normal/Charged/Plunge DMG)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label:
              'Transitional 2pc mix (+18% ATK / +15% Anemo DMG / +15% Normal & Charged DMG)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/varka-quickguide/',
      playstyleSummary:
        'Varka is a 5-star Anemo Claymore on-field DPS, the Grand Master of the Knights of Favonius. Wielding dual claymores during his Elemental Skill state, he unleashes relentless hybrid strikes dealing both Anemo and elemental damage matching his absorbed PHEC teammate element (Pyro, Hydro, Electro, or Cryo). His kit heavily synergizes with Hexerei teammates (completing Witch\'s Homework for massive CRIT/DMG bonuses) and a Double Anemo + Double PHEC team structure.',
      energyRequirements:
        '0% ER requirement (100% baseline). Varka does NOT build Energy Recharge because he does not use his Elemental Burst in optimal rotations. His Burst does not benefit from his A1 or A4 passives, rendering its damage negligible.',
      combatTips: [
        'Zero ER Invariant (No Burst): Varka does not build Energy Recharge and does not cast his Burst in standard rotations. All stat investment must be poured strictly into CRIT, ATK%, and situational EM.',
        'Talent Priority (Skill > Character Level 90 >> NA / Burst): Varka\'s dual-blade strikes and enhanced attacks scale almost exclusively from his Elemental Skill talent. His Burst and base Normal Attack contribute negligible damage and can remain at Level 1.',
        'Hexerei Teammate Synergy: Varka is a Hexerei character. Bringing an additional Hexerei teammate (Prune, Nicole, Durin) allows for two casts of his special Skill/Charged Attack during Sturm und Drang, and triggers full +20% CRIT Rate from 4pc A Day Carved From Rising Winds.',
        'Team Composition (Double Anemo + Double PHEC): To maximize his A1 passive, pair Varka with 1 Anemo teammate (Prune / Venti / Sucrose) and 2 teammates of the exact same PHEC element (e.g. Nicole + Durin / Bennett for Pyro; Furina + Xingqiu / Yelan for Hydro; Ororon / Fischl for Electro; Shenhe / Rosaria for Cryo).',
      ],
      weapons: [
        {
          name: 'Gest of the Mighty Wolf',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (ATK SPD, CRIT Rate, stacking DMG Bonus and extra CRIT DMG with Hexerei teammates)',
        },
        {
          name: 'Beacon of the Reed Sea',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (33.1% CRIT Rate, ATK% buffs on Skill hit & HP bonus)',
        },
        {
          name: 'Redhorn Stonethresher',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (88.2% CRIT DMG & Normal/Charged Attack DEF scaling)',
        },
        {
          name: 'A Thousand Blazing Suns',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (High Base ATK, CRIT stats and offensive passives)',
        },
        {
          name: 'Verdict',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (22.1% CRIT Rate, ATK% bonus and Skill DMG boost on Crystallize)',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Battle Pass BiS (27.6% CRIT Rate & up to +50% All DMG Bonus; rivals 5★ weapons at R5 with a shielder)',
        },
        {
          name: 'Blackcliff Slasher',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Shop F2P BiS (55.1% CRIT DMG secondary stat & ATK% passive)',
        },
        {
          name: 'Tidal Shadow',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (ATK% secondary stat and huge ATK% buff when healed)',
        },
        {
          name: 'The Unforged',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ ATK Stat Stick (Massive ATK% with a shielder)',
        },
        {
          name: "Wolf's Gravestone",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ High ATK Stat Stick (608 Base ATK and teamwide ATK% buff)',
        },
        {
          name: 'Fang of the Mountain King',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (CRIT Rate and Skill/Burst buffs)',
        },
        {
          name: 'Talking Stick',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Battle Pass Alternative (CRIT Rate and elemental infusion ATK% buff)',
        },
        {
          name: "Ultimate Overlord's Mega Magic Sword",
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Event F2P Alternative (ER secondary stat and Melusine quest ATK% buff)',
        },
        {
          name: 'Earthshaker',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable F2P Alternative (ATK% secondary stat and Double Pyro Skill DMG buff)',
        },
        {
          name: 'Blade of Atonement',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable F2P Alternative (Solid option in healerless teams)',
        },
        {
          name: 'Skyrider Greatsword',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: '3★ F2P Stat Stick (ATK% stacking passive for early game)',
        },
      ],
    },
  },
];
