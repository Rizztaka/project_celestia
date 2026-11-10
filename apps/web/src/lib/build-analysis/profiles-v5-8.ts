import type { ReviewedCharacterProfile } from './identity';

export const v58Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000116,
    skillDepotId: 11601,
    referenceKey: 'Ineffa',
    displayName: 'Ineffa',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-ineffa-info', 'kqm-ineffa-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['atkPercent', 'elementalMastery', 'electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
          Goblet: { elementalMastery: 'reaction_context', electroDmg: 'reaction_context' },
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'AubadeOfMorningstarAndMoon',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+80 EM & massive Lunar Reaction DMG% self-buff; premier set in Ascendant Gleam teams)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label:
              'Alternative BiS (+80 EM & up to +150 EM or +14% ATK; excellent general placeholder in non-Moonsign teams)',
          },
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 2,
            label:
              'Alternative Support (+60-120 Teamwide EM & +10% Lunar Reaction DMG; run when no teammate holds it)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label:
              'Alternative Shield Support (+20% HP & continuous +20% Teamwide ATK via Birgitta automated strikes)',
          },
          {
            referenceKey: 'NightOfTheSkysUnveiling',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+10% Lunar Reaction DMG & on-field quickswap burst bonus)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 4,
            tier: 3,
            label:
              'Transitional (+15% Electro DMG & Lunar-Charged DMG bonus; 4pc cooldown reduction is secondary)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+18% ATK / +80 EM / +20% ER combinations)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/ineffa-quickguide/',
      playstyleSummary:
        'Ineffa is a 5-star Electro polearm off-field DPS and defensive shielder. She converts party Electro-Charged reactions into Lunar-Charged, a special lunar reaction whose damage scales with team participants, her ATK, and character level. Her automated assistant Birgitta deals relentless off-field Electro damage while providing an Optical Flow Shield Barrier.',
      energyRequirements:
        '100% in general (bursting every other rotation). Ineffa does not need ER when bursting every other rotation (~36-40s). Only build 120-140% ER if running Kitain or a second Electro to burst every rotation (18-20s) for A4 EM buff uptime.',
      combatTips: [
        'Standard E Q Combo: Cast Skill (E) to summon Birgitta and gain Optical Flow Shield Barrier, then immediately Burst (Q) to trigger A4 EM buff and deploy rocket punches before swapping to carry.',
        'Extended Rotation Stagger (E > Team > Q): On longer rotation teams (>25s), cast Skill at start, rotate teammates, then cast Burst to reset Birgitta duration to 100%.',
        'Level 90 Invariant: Lunar-Charged is a transformative-style lunar reaction scaling dramatically with character level. Level 90 is mandatory to maximize her team damage output.',
        'ATK Ceiling Goal (2000 ATK): Her A4 passive grants active party members bonus EM equal to 6% of Ineffa\'s ATK, and her A1 / A3 passives scale Lunar-Charged base damage directly from ATK.',
        'Overvape & Electro-Charged Conversion: Ineffa allows Pyro DPS units (e.g. Mavuika, Arlecchino, Hu Tao) to trigger simultaneous Overloaded and Vaporize (Overvape) due to continuous dual-aura preservation.',
        'Normal Attack Unleveled Invariant: All Birgitta attacks and Lunar-Charged reactions scale from Skill, A1/A3 passives, and character level; her Normal Attack should remain at Level 1.',
      ],
      weapons: [
        {
          name: 'Fractured Halo',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Signature BiS (+40% Lunar-Charged DMG Bonus & +24% ATK for 20s upon shield generation, whether shield holds or breaks; ~30-35% ahead of alternatives)',
        },
        {
          name: 'Staff of the Scarlet Sands',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            'Second-best option; 44.1% CRIT Rate & converts EM to Flat ATK (makes EM sands/goblet exceptionally strong)',
        },
        {
          name: 'Bloodsoaked Ruins',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            'High-end 5★ stat stick; refunds 12 Energy per rotation to wipe out ER requirements, plus short Lunar-Charged DMG buff',
        },
        {
          name: 'Deathmatch',
          rarity: 4,
          tier: 2,
          category: 'BiS',
          notes:
            'Premier 4★ BP BiS; 36.8% CRIT Rate and strong single-target ATK buffs rival 5★ alternatives at R5',
        },
        {
          name: 'Ballad of the Fjords',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            'Competitive 4★ BP Alternative; 27.6% CRIT Rate & +120-240 EM when team has at least 3 distinct elements',
        },
        {
          name: "Prospector's Shovel",
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Premier F2P Craftable BiS; ATK% secondary stat and up to +48% Lunar-Charged DMG Bonus at R5 in Ascendant Gleam',
        },
        {
          name: "Sacrificer's Staff",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'High base stats and supportive/offensive secondary utility',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '66.2% CRIT DMG stat stick & HP-to-ATK conversion',
        },
        {
          name: 'Calamity Queller',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes:
            'Massive 741 Base ATK and off-field ATK% buffs effortlessly max out her 2000 ATK goal for A4 EM sharing',
        },
        {
          name: 'Lumidouce Elegy',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'Balanced 33.1% CRIT Rate stat stick',
        },
        {
          name: 'Symphonist of Scents',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High Base ATK and CRIT stats with ATK% party buffs',
        },
        {
          name: 'Skyward Spine',
          rarity: 5,
          tier: 3,
          category: 'Alternative',
          notes:
            'Provides 36.8% ER & +8% CRIT Rate; useful in high-ER solo Electro burst-every-rotation scenarios',
        },
        {
          name: 'Vortex Vanquisher',
          rarity: 5,
          tier: 3,
          category: 'Alternative',
          notes:
            'Solid ATK% stat stick, especially when Ineffa takes quick on-field hits to build stacks',
        },
        {
          name: 'Kitain Cross Spear',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes:
            'Craftable F2P; 110 EM and refunds 15 flat energy per rotation to completely eliminate ER requirements',
        },
        {
          name: 'Missive Windspear',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: 'Event F2P; 41.3% ATK & +96 EM on triggering an elemental reaction',
        },
      ],
    },
  },
];
