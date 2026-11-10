import type { ReviewedCharacterProfile } from './identity';

export const v24Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000063,
    skillDepotId: 6301,
    referenceKey: 'Shenhe',
    displayName: 'Shenhe',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-shenhe'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['atkPercent'],
          Circlet: ['atkPercent', 'critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['energyRecharge', 'atkPercent', 'critRate', 'atk'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot for Team Damage (+20% Team ATK on Burst)' },
          { referenceKey: 'GladiatorsFinale', pieces: 2, tier: 1, label: 'Best in Slot Icy Quill Scaling (+18% ATK)' },
          { referenceKey: 'ShimenawasReminiscence', pieces: 2, tier: 1, label: 'Best in Slot Icy Quill Scaling (+18% ATK)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Alternative ER & ATK Hybrid (+20% ER)' },
          { referenceKey: 'BlizzardStrayer', pieces: 4, tier: 2, label: 'Alternative Freeze Sub-DPS (+40% Crit Rate)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['cryoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          { referenceKey: 'BlizzardStrayer', pieces: 4, tier: 1, label: 'Best in Slot Personal Damage in Freeze (+40% Crit Rate vs Frozen)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot Hybrid (+20% Team ATK and +20% Burst DMG)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/shenhe-quickguide/',
      playstyleSummary:
        'Premier Cryo specialist support and force multiplier. Through Spring Spirit Summoning (Skill), Shenhe grants Icy Quills to all party members, augmenting their Cryo attacks with Additive Base DMG scaled directly from Shenhe\'s current ATK. Divine Maiden\'s Deliverance (Burst) creates a circular frost field that continuously shreds Cryo and Physical RES of opponents, while her passives grant bonus Cryo DMG and amplify Skill, Burst, or Normal/Charged Attack damage across the team.',
      energyRequirements:
        '165%–175% ER in Double Cryo teams with Favonius Lance (180%–200% with non-ER weapons like Calamity Queller); 145%–155% in Triple Cryo teams. If Venti absorbs Cryo in his Burst, her requirement drops by ~30%–40% ER.',
      combatTips: [
        'Icy Quill mechanics: Spring Spirit Summoning grants 5 quills on Tap (10s CD) and 7 quills on Hold (15s CD). Each character in the team possesses their own separate quill count, and quills scale with the active character\'s Crit DMG, DMG Bonus, and enemy RES shred!',
        'In AoE situations, single attacks hitting multiple targets consume multiple quills simultaneously (e.g. hitting 5 enemies consumes 5 quills at once). Quills are therefore consumed rapidly in mob encounters and paced steadily against single bosses.',
        'A4 Passive (Spirit Communion Seal): Tap E grants party members +15% Elemental Skill and Burst DMG for 10s (ideal for Ayaka Burst); Hold E grants party members +15% Normal, Charged, and Plunging Attack DMG for 15s (ideal for Ganyu / Wriothesley).',
        'Divine Maiden\'s Deliverance (Burst) shreds Cryo and Physical RES by 6%–15% and grants active characters standing within the field +15% Cryo DMG Bonus (A1 Deific Embrace).',
      ],
      weapons: [
        {
          name: 'Calamity Queller',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes: 'Signature weapon and highest Base ATK polearm in the game (741). Its passive stacks ATK% continuously and doubles when Shenhe is off-field, maximizing the raw flat damage added by Icy Quills.',
        },
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes: 'Top generalist and team battery weapon. Combines a high 565 Base ATK with 30.6% ER and neutral energy particle generation on crit, heavily lowering ER requirements for both Shenhe and Ayaka.',
        },
        {
          name: 'Engulfing Lightning',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes: 'High Base ATK (608), 55.1% ER substat, and converts excess ER into ATK% to deliver both comfortable Burst uptime and strong quill scaling.',
        },
        {
          name: 'Skyward Spine',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'High 674 Base ATK, 36.8% ER substat, and +8% Crit Rate to assist with battery consistency.',
        },
        {
          name: 'Missive Windspear',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Event weapon providing 510 Base ATK, 41.3% ATK substat, and bonus flat ATK upon triggering an Elemental Reaction.',
        },
        {
          name: 'The Catch',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Solid 45.9% ER substat with bonus Crit Rate and Burst DMG% for personal Burst contribution.',
        },
      ],
    },
  },
  {
    avatarId: 10000064,
    skillDepotId: 6401,
    referenceKey: 'YunJin',
    displayName: 'Yun Jin',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-yunjin-infographic', 'kqm-yunjin-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['defPercent', 'energyRecharge'],
          Goblet: ['defPercent'],
          Circlet: ['defPercent', 'critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['energyRecharge', 'defPercent', 'critRate', 'def'],
        sets: [
          { referenceKey: 'HuskOfOpulentDreams', pieces: 4, tier: 1, label: 'Best in Slot (+54% DEF and +24% Geo DMG Bonus for maximum Normal Attack buff)' },
          { referenceKey: 'HuskOfOpulentDreams', pieces: 2, tier: 1, label: 'Best in Slot Hybrid (+20% DEF)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 1, label: 'Best in Slot Hybrid (+20% ER to meet high burst costs)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative in ATK-scaling teams (+20% Team ATK on Burst)' },
          { referenceKey: 'ArchaicPetra', pieces: 4, tier: 2, label: 'Alternative Support (+35% DMG Bonus of Crystallized element)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/yunjin-quickguide/',
      playstyleSummary:
        'Specialized Normal Attack hyper-buffer and Geo support. Cliffbreaker\'s Banner (Burst) activates Flying Cloud Flag Formation, infusing the active character\'s Normal Attacks with Additive Base DMG calculated strictly from Yun Jin\'s current DEF. She elevates rapid Normal Attack specialists like Yoimiya, Kamisato Ayato, Wanderer, and Noelle into devastating carries.',
      energyRequirements:
        'Very high 180%–240% ER as solo Geo without Favonius; ~160%–200% with R5 Favonius Lance or when paired with another Geo unit (Zhongli, Chiori, Xilonen).',
      combatTips: [
        'Level 90 is critical: Yun Jin\'s Additive Base DMG buff scales directly from her total DEF. Character base DEF increases substantially between Lv 80 and 90, making Level 90 one of her biggest damage upgrades.',
        'Flying Cloud Flag Formation trigger quota: Grants 30 hit triggers per character for 12 seconds. Fast Normal Attackers (Yoimiya, Ayato) expend these quickly to maximize single-target DPS.',
        'A4 Passive (Breaking Conventions): When the party contains 1 / 2 / 3 / 4 different Elemental Types, the Normal Attack DMG bonus granted by Flying Cloud Flag Formation is further increased by 2.5% / 5.0% / 7.5% / 11.5% of Yun Jin\'s DEF.',
        'Constellation 2 grants all party members +15% Normal Attack DMG for 12s upon casting Burst; Constellation 6 increases Normal Attack SPD by +12% during Flying Cloud Flag Formation.',
        'Opening Flourish (Skill): Can be tapped for quick strike or held to form a shield. Timing the release at the exact moment of taking damage executes a Perfect Parry, immediately dealing maximum Charge Level 2 Geo DMG and generating 3 Geo particles.',
      ],
      weapons: [
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes: 'Undisputed Best in Slot weapon. Combines 30.6% ER with neutral energy particle generation on crit, drastically lowering her and her team\'s ER requirements (aim for ~40%–50% Crit Rate).',
        },
        {
          name: 'Footprint of the Rainbow',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes: 'Craftable Natlan Polearm and the only polearm in the game with a DEF% secondary stat (51.7%). Best option for maximizing raw Normal Attack buff size if ER needs are met via artifacts.',
        },
        {
          name: 'Engulfing Lightning',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes: 'Massive 55.1% ER stat stick providing smooth and unconditional Burst uptime across all team compositions.',
        },
        {
          name: 'Rightful Reward',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes: 'Craftable Fontaine polearm with HP% substat that restores 16 flat Energy when Yun Jin receives healing (even off-field).',
        },
        {
          name: 'Prototype Starglitter',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Craftable polearm offering 45.9% ER substat as a reliable alternative to Favonius when Crit Rate is low.',
        },
      ],
    },
  },
];
