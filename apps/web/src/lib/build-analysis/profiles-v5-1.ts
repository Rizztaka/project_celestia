import type { ReviewedCharacterProfile } from './identity';

export const v51Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000103,
    skillDepotId: 10301,
    referenceKey: 'Xilonen',
    displayName: 'Xilonen',
    defaultRoleId: 'resistance_shred',
    evidenceIds: ['kqm-xilonen', 'kqm-xilonen-info', 'kqm-xilonen-guide'],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['defPercent', 'energyRecharge'],
          Goblet: ['defPercent'],
          Circlet: ['defPercent', 'healingBonus', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'defPercent', 'def'],
        sets: [
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+40% Teamwide Elemental DMG Bonus to active reaction elements & +6–12 Energy from Nightsoul Burst via A4; unrivaled support set)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+35% DMG Bonus to crystallized element; viable if another teammate holds Scroll)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label:
              'Alternative in Reaction Teams (+120 EM to all teammates upon triggering an Elemental Reaction)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label:
              'Alternative for ATK-scaling Teams (+20% Teamwide ATK on Burst; forces Burst every rotation)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 3,
            label: 'Transitional (+54% DEF & +24% Geo DMG Bonus; personal DEF benchmark)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+6 Energy from Nightsoul Burst)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+30% DEF)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+20% Energy Recharge)',
          },
        ],
      },
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['defPercent', 'energyRecharge'],
          Goblet: ['defPercent'],
          Circlet: ['healingBonus', 'defPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'defPercent', 'healingBonus', 'def', 'critRate'],
        sets: [
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+40% Teamwide Elemental DMG Bonus and +6–12 Energy from Nightsoul Burst via A4)',
          },
          {
            referenceKey: 'SongOfDaysPast',
            pieces: 4,
            tier: 2,
            label:
              'Alternative for Sustain (Converts high continuous single-target healing into flat active DMG)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 2,
            label:
              'Alternative for Sustain (Converts continuous healing into physical damage bubble explosions)',
          },
          {
            referenceKey: 'MaidenBeloved',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+15% Healing Bonus & +20% incoming healing)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+30% DEF)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+20% Energy Recharge)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/xilonen-quickguide/',
      playstyleSummary:
        "5-star Geo Sword smith of the Children of Echoes (Nanatzcayan) serving as a universal, premier elemental support and sustain unit. Activating Yohual's Scratch (Skill, 15s CD) shifts Xilonen into Blade Roller mode with 45 Nightsoul points and activates 3 Source Samplers. By default, all 3 Samplers are Geo; for every party member of Pyro, Hydro, Electro, or Cryo (PHEC), 1 Sampler transmutes to that element. While in Nightsoul's Blessing, performing 2 Normal Attacks (E N2) fills her Nightsoul gauge, activating all 3 Source Samplers to shred nearby enemies' corresponding Elemental RES by 36% (at Talent 10) for 15s both on- and off-field! When at least 2 PHEC teammates are present, her Elemental Burst (Ocelotlicue Point!, 60 Energy, 12s CD) provides powerful continuous single-target healing to the active character based on her Max DEF; with fewer than 2 PHEC teammates, her Burst instead fires 2 additional Geo AoE drum beats. Combined with 4pc Scroll of the Hero of Cinder City, Xilonen delivers unrivaled +40% Elemental DMG Bonus and -36% RES Shred to all active elements with just ~2 seconds of field time.",
      energyRequirements:
        'Burst costs 60 Energy with a 12s CD. When equipped with Favonius Sword or in Double Geo teams, Xilonen rarely needs additional ER (100%–130% is sufficient). In Solo Geo teams bursting every rotation without Favonius procs, ER requirements range from 170%–190% (if catching her Skill particles with E N2) or up to 205%–250% (if immediately swapping to feed particles). Because her Burst only provides healing, she can safely skip bursting or cast it every other rotation in teams with another sustain unit (e.g. Bennett, Zhongli) or self-sustaining carries (e.g. Clorinde, Neuvillette).',
      combatTips: [
        'Standard Fast E N2 Support Rotation: Press Skill then execute 2 Normal Attacks (E N2). The two roller blade kicks immediately generate the remaining Nightsoul points needed to reach maximum, activating all 3 Source Samplers for 15s of off-field RES Shred. This takes less than 2 seconds of field time before swapping to your main carry.',
        "Sample Transmutation Rules (PHEC Requirement): Xilonen's Source Samplers begin as Geo. For each Pyro, Hydro, Electro, or Cryo character in the party, 1 Sampler transforms into that element. With at least two PHEC teammates, Xilonen's Burst provides continuous DEF-scaling healing. In Triple Geo or Mono Geo teams (fewer than 2 PHEC), Samplers stay Geo and her Burst converts into Geo damage nukes.",
        '3,200 DEF Benchmark (Peak Patrol Song): If using her signature weapon Peak Patrol Song, Xilonen caps its +25.6% teamwide Elemental DMG buff at 3,200 DEF. At Level 80/90, reaching 3,200 DEF requires only two DEF% main stats (or one DEF% main stat with ~9 median DEF% substats) without compromising ER needs.',
        "Scroll of the Hero of Cinder City Synergy: As a Natlan character who enters Nightsoul's Blessing and triggers Crystallize/Nightsoul Bursts, Xilonen activates 4pc Cinder City with 100% reliability, providing +40% Elemental DMG Bonus to all reaction elements across a 20s window.",
        "Normal Attack Unleveled Invariant: Roller blade kick damage in Nightsoul's Blessing scales directly off her DEF and Skill parameters; her Normal Attack talent multiplier does not affect support utility or damage and should be left at Level 1.",
        "Climbing & Exploration Mobility: In exploration, Xilonen's Blade Roller state allows her to scale vertical cliffs at high speed and leap over precipices without consuming stamina, utilizing Phlogiston in Natlan.",
      ],
      weapons: [
        {
          name: 'Peak Patrol Song',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            "5★ Signature weapon and premier Best-in-Slot. Provides 542 Base ATK and an enormous 82.7% DEF secondary stat. Activating Nightsoul's Blessing grants +8% All Elemental DMG Bonus to all nearby party members for each 1,000 DEF (up to +25.6% All Elemental DMG Bonus at 3,200 DEF). Easily capped with 1–2 DEF% main stats.",
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            "4★ Premier Utility Best-in-Slot. Provides 61.3% Energy Recharge and generates 6 Clear Energy particles on CRIT (100% proc chance at R5). Completely solves Xilonen's and the entire party's Energy requirements with minimal field time. Pair with a CRIT Rate circlet or CRIT substats.",
        },
        {
          name: 'Freedom-Sworn',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes:
            '5★ Support Alternative. Provides 198 Elemental Mastery and grants the entire party +20% ATK and +16% Normal, Charged, and Plunging Attack DMG upon triggering 2 Elemental Reactions (Crystallize). Requires triggering 2 Crystallizes during her field time.',
        },
        {
          name: 'Flute of Ezpitzal',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Natlan Craftable BiS F2P Alternative. Provides 69.0% DEF secondary stat and increases DEF by an additional +32% (at R5) upon using an Elemental Skill. Superb accessible stat stick to maximize healing output and reach DEF thresholds without relying on gacha.',
        },
        {
          name: "Xiphos' Moonlight",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Alternative. Provides 165 Elemental Mastery and converts EM into Energy Recharge for Xilonen and nearby teammates (sharing 30% of the buff). Viable in reaction teams when building some EM.',
        },
        {
          name: 'Skyward Blade',
          rarity: 5,
          tier: 3,
          category: 'Utility',
          notes:
            '5★ High ER stat stick (55.1% ER) with 4% CRIT Rate to help with Burst uptime when Favonius is occupied by another teammate.',
        },
        {
          name: 'Sacrificial Sword',
          rarity: 4,
          tier: 3,
          category: 'Utility',
          notes:
            '4★ ER stat stick (61.3% ER) providing substantial Energy Recharge, though the Skill reset is generally redundant due to her 15s Skill CD matching standard rotation lengths.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes:
            '4★ F2P Fontaine Fishing Sword. Provides 45.9% Energy Recharge and +16% CRIT Rate to her Elemental Skill, with additional ER after casting Skill.',
        },
        {
          name: 'Skyrider Sword',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes:
            '3★ Budget F2P Alternative. Highly accessible weapon providing 51.7% Energy Recharge with low leveling resource costs.',
        },
        {
          name: 'Cinnabar Spindle',
          rarity: 4,
          tier: 3,
          category: 'Alternative',
          notes:
            '4★ Event Exclusive DEF Stat Stick (69.0% DEF). Bolsters DEF for healing scaling and Peak Patrol benchmarks if already owned.',
        },
      ],
    },
  },
];
