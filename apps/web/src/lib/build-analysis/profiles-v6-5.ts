import type { ReviewedCharacterProfile } from './identity';

export const v65Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000130,
    skillDepotId: 13001,
    referenceKey: 'Linnea',
    displayName: 'Linnea',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-linnea-info', 'kqm-linnea-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['defPercent', 'energyRecharge'],
          Goblet: ['defPercent', 'geoDmg'],
          Circlet: ['critRate', 'critDmg', 'defPercent'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { defPercent: 'team_buffs' },
        },
        priorityStats: ['critRate', 'critDmg', 'defPercent', 'energyRecharge', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+54% DEF & +24% Geo DMG; maximizes personal damage and A4 teamwide EM buff)',
          },
          {
            referenceKey: 'AubadeOfMorningstarAndMoon',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot in Ascendant Gleam (+60% Lunar Reaction DMG while off-field)',
          },
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Support Alternative (+20% ER, +60–120 Teamwide EM & +10% Lunar Reaction DMG)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label:
              'Support Alternative (+120 Teamwide EM upon reaction trigger)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label:
              'Support Alternative with ATK-scaling carries like Navia (+20% HP & continuous +20% Teamwide ATK)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label:
              'Transitional 2pc mix (2pc Husk +30% DEF / +80 EM / +20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/linnea-quickguide/',
      playstyleSummary:
        'Linnea is a 5-star Geo Bow user, a versatile off-field sub-DPS and Lunar-Crystallize support. By tapping her Elemental Skill, she summons Lumi in Super Power Form to unleash continuous off-field Geo strikes and direct Lunar-Crystallize hits, or repeatedly taps Skill for a devastating front-loaded Million Ton Crush. She provides near-permanent Geo RES Shred, teamwide EM buffs, and partywide healing via her Burst (ideal for Furina Fanfare stacking).',
      energyRequirements:
        '100% ER (baseline) when bursting every other rotation (recommended). Bursting every rotation requires 170–185% ER (~15–20% less per Favonius proc). If skipping her Burst to conserve field time, ER can safely be ignored.',
      combatTips: [
        'Burst Every Other Rotation Invariant: Building 170–185% ER to burst every rotation sacrifices substantial DEF% and CRIT; bursting every other rotation with 100% baseline ER is optimal for team DPS.',
        'Talent Priority (Skill > Character Level 90 >> Burst): Linnea\'s damage is overwhelmingly concentrated in her Elemental Skill companion Lumi. Level 90 is crucial for base DEF and Lunar-Crystallize damage. Burst provides healing, while Normal Attacks contribute zero utility and should remain at Level 1.',
        'DEF% Goblet Invariant: A DEF% Goblet is strongly recommended over Geo DMG% because her direct Lunar-Crystallize hits, team healing, and A4 EM buffs all scale with DEF.',
        'Moondrifts as Geo Constructs: The Moondrifts left behind by Lunar-Crystallize reactions count as Geo Constructs, triggering synergy with Zhongli\'s Stele resonances and Chiori\'s dolls.',
        'Columbina & Zibai Synergy: Columbina is Linnea\'s premier Hydro enabler, while Zibai acts as her top Geo hypercarry partner in Triple Geo compositions.',
      ],
      weapons: [
        {
          name: 'Golden Frostbound Oath',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (CRIT DMG, DEF% increase, personal Geo/Lunar-Crystallize DMG bonus and teamwide Moondrift buff)',
        },
        {
          name: 'Aqua Simulacra',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (88.2% CRIT DMG & universal off-field DMG% bonus)',
        },
        {
          name: 'Elegy for the End',
          rarity: 5,
          tier: 1,
          category: 'Utility',
          notes:
            '5★ Support BiS (55.1% ER, 60 EM & teamwide +100 EM, +20% ATK buff)',
        },
        {
          name: 'Slingshot',
          rarity: 3,
          tier: 1,
          category: 'F2P',
          notes:
            '3★ Free F2P BiS (31.2% CRIT Rate; low Base ATK is completely irrelevant due to pure DEF scaling, performing on par with non-signature 5★ bows)',
        },
        {
          name: 'The First Great Magic',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick (66.2% CRIT DMG and Movement SPD bonus)',
        },
        {
          name: 'Polar Star',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick (33.1% CRIT Rate and Skill/Burst buffs)',
        },
        {
          name: 'Skyward Harp',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick (674 Base ATK, 22.1% CRIT Rate and 20% CRIT DMG)',
        },
        {
          name: 'Snare Hook',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P Alternative (ER secondary stat and EM buff on reaction)',
        },
        {
          name: 'Favonius Warbow',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes:
            '4★ Utility Battery Alternative (61.3% ER and clear particles to lower party ER thresholds)',
        },
        {
          name: "Hunter's Path",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (44.1% CRIT Rate)',
        },
        {
          name: 'Song of Stillness',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable F2P Alternative (DMG% buff upon receiving healing)',
        },
        {
          name: 'Recurve Bow',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: '3★ F2P Stat Stick',
        },
      ],
    },
  },
];
