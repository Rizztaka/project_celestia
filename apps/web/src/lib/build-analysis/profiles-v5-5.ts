import type { ReviewedCharacterProfile } from './identity';

export const v55Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000111,
    skillDepotId: 11101,
    referenceKey: 'Varesa',
    displayName: 'Varesa',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-varesa-info', 'kqm-varesa-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        talentPriorityGroups: [['normal'], ['burst'], ['skill']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['electroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Goblet: { atkPercent: 'team_buffs' },
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'LongNightsOath',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+100% Plunging Attack DMG Bonus; premier tailored set for her plunge playstyle)',
          },
          {
            referenceKey: 'ObsidianCodex',
            pieces: 4,
            tier: 1,
            label:
              "Best in Slot Alternative (+15% DMG and +40% CRIT Rate during Nightsoul's Blessing)",
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label:
              'Alternative with Furina (+15% Normal/Charged DMG & +36% CRIT Rate upon HP fluctuations)',
          },
          {
            referenceKey: 'DesertPavilionChronicle',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+40% Plunging Attack DMG Bonus upon landing Charged Attack)',
          },
          {
            referenceKey: 'LongNightsOath',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK or Plunge DMG)',
          },
          {
            referenceKey: 'ObsidianCodex',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Nightsoul DMG)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Electro DMG Bonus)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/varesa-quickguide/',
      playstyleSummary:
        '5-star Electro Catalyst warrior from the Collective of Plenty specializing as an on-field Plunge DPS. Varesa executes high-flying luchador aerial combat by using her Elemental Skill (Riding the Night-Rainbow) or Charged Attack to launch into the air and deliver devastating Plunging Attacks, reinforced by her unique Elemental Burst (Guardian Vent: Volcano Kablam) and Fiery Passion state. Her damage scales primarily from her Normal Attack talent (which governs plunging multipliers) and ATK%, making her a natural synergy partner with Xianyun, Iansan, Furina, and Chevreuse.',
      energyRequirements:
        'For standard 2 short Bursts (2 sQ) per rotation: 120%–145% in Double Electro (Iansan/Ororon) with Favonius, 115%–120% with Fischl, and 195%–200% in Solo Electro. For 1 short Burst (1 sQ) per rotation: baseline 100%–105% ER. Reaching 2 sQ is recommended only if reachable through natural substats; otherwise, bursting once every 2 rotations with 100% ER is higher DPS than forcing ER over offensive stats.',
      combatTips: [
        "Normal Attack Priority Invariant: Unlike most Catalyst on-fielders whose damage is governed by Skill stance multipliers, Varesa's enhanced plunging strikes scale directly from her Normal Attack talent. Normal Attack should be leveled first before Burst or Skill.",
        "Fiery Passion & Skill Reset Loop: Varesa's core loop centers on ECP ECP (Skill > Charged Attack conversion > Plunging Attack). Landing plunging strikes charges her Fiery Passion meter, granting additional enhanced Skill uses and enabling short Burst (sQ) detonations.",
        "Obsidian Codex CRIT Overcap Warning: Because Varesa ascends with CRIT Rate (19.2% + 5% base = 24.2%), the +40% CRIT Rate from 4pc Obsidian Codex brings her to 64.2% CRIT Rate before weapon or substat contributions. When running CRIT Rate weapons (Lost Prayer, Vivid Notions, Sacrificial Jade), 4pc Long Night's Oath is strongly preferred to avoid severe overcapping.",
        "Flexible Short Burst (sQ) Execution: Varesa's Burst can be executed as a fast short Burst (sQ) immediately following a Fiery Passion plunge to cash in explosive Electro damage without wasting field time.",
      ],
      weapons: [
        {
          name: 'Vivid Notions',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature Catalyst and undisputed Best-in-Slot. Provides 542 Base ATK, massive CRIT DMG secondary stat, and tailored passives that dramatically enhance Plunging Attack damage.',
        },
        {
          name: 'Reliquary of Truth',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Premier Stat Stick. High 608 Base ATK, 66.2% CRIT DMG, and universal offensive buffs.',
        },
        {
          name: "Kagura's Verity",
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Alternative. Stacks fully by mid-first rotation for +36% Skill DMG and +12% All Elemental DMG.',
        },
        {
          name: "Crane's Echoing Call",
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Plunge Catalyst. High Base ATK and plunge damage buffs; optimal if Xianyun is not already holding it.',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Premier 4★ Best-in-Slot. Provides 55.1% CRIT DMG and massive frontloaded buffs that rival 5★ options during burst windows.',
        },
        {
          name: 'Lost Prayer to the Sacred Winds',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes:
            "5★ Consistent Stat Stick. Provides 33.1% CRIT Rate and ramping Elemental DMG Bonus (best with 4pc Long Night's Oath to prevent CRIT overcapping).",
        },
        {
          name: 'Clash of Kings',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Battle Pass Alternative. High refinement Clash of Kings provides strong consistent damage second only to Widsith.',
        },
        {
          name: "Winter's Heavy Heart",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Alternative. Solid stat stick granting ATK% buffs when paired with Electro teammates.',
        },
        {
          name: 'Flowing Purity',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P Best-in-Slot. Grants All Elemental DMG Bonus upon clearing the Bond of Life with a dedicated healer.',
        },
        {
          name: 'Cashflow Supervision',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ CRIT Stat Stick. Provides 22.1% CRIT Rate and high base ATK.',
        },
        {
          name: "Tulaytullah's Remembrance",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ CRIT Stat Stick. High 674 Base ATK and 44.1% CRIT DMG.',
        },
        {
          name: "Surf's Up",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick. Provides 88.2% CRIT DMG.',
        },
        {
          name: 'Tome of the Eternal Flow',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick. Provides 88.2% CRIT DMG.',
        },
      ],
    },
  },
  {
    avatarId: 10000110,
    skillDepotId: 11001,
    referenceKey: 'Iansan',
    displayName: 'Iansan',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-iansan-info', 'kqm-iansan-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst'],
        talentPriorityGroups: [['burst']],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['atkPercent'],
          Circlet: ['atkPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'critRate'],
        sets: [
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+40% Teamwide Elemental DMG Bonus to Electro and reacted elements upon Nightsoul trigger; reduces personal ER needs via 2pc)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label:
              "Alternative (+20% Teamwide ATK on Burst; also increases Iansan's ATK to help reach her buff cap)",
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+6 Energy from Nightsoul Burst)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+20% ER)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
          {
            referenceKey: 'ShimenawasReminiscence',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/iansan-quickguide/',
      playstyleSummary:
        "4-star Electro Polearm fitness trainer from the Collective of Plenty specializing as a Flat ATK buffer and 4pc Scroll of the Hero of Cinder City support. Iansan provides a massive Flat ATK buff to the active on-field character with her Elemental Burst (Going the Distance!, 70 Energy, 18s CD), which scales dynamically with the on-field character's movement speed and displacement distance. Because she enters Nightsoul's Blessing with her Skill (One-Two Punch), she effortlessly triggers and maintains the 4pc Cinder City buff (+40% DMG bonus) while batterying teammates with Favonius Lance.",
      energyRequirements:
        'With Favonius Lance: 180%–210% in Solo Electro, 135%–155% in Double Electro (<20s rotations), and 100%–105% in extended >24s rotations (C1 reduces requirements by ~40%–50%). With non-ER weapons: 220%–270% Solo Electro, 155%–180% Double Electro. Reaching her ER target is mandatory because her ATK buff is strictly tied to her Burst.',
      combatTips: [
        "Burst Priority Invariant: Leveling Iansan's Burst directly raises the ceiling cap of her Flat ATK buff. Her Normal Attack and Elemental Skill contribute negligible personal damage and can be left at Level 1 without sacrificing team DPS.",
        "Dynamic Movement Scaling: Iansan's Burst buff scales with how far the on-field character moves. She synergizes extraordinarily well with mobile carries like Varesa (plunge jumps), Kinich (grapple loops), Chasca (flight strafing), Mualani (shark surf), and Xiao / Gaming (plunge bounces).",
        "Favonius Lance Synergy: Favonius Lance is Iansan's top 4★ weapon, providing high Base ATK, 30.6% ER, and neutral particles to satisfy both her 70-cost Burst and her carry's energy needs. Pair with a CRIT Rate circlet for reliable particle generation.",
        'Fast Rotation Execution (E C Q): Cast Skill (E), immediately land an enhanced Charged Attack (C) to trigger her A1 passive and apply Electro, then Burst (Q) and swap to your on-field carry.',
      ],
      weapons: [
        {
          name: 'Symphonist of Scents',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature Support BiS. Provides high Base ATK, unconditional ATK% buffs, and a potent team buff upon triggering healing effects.',
        },
        {
          name: 'Engulfing Lightning',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Premier ER Weapon. High 608 Base ATK, 55.1% ER, and converts excess Energy Recharge into ATK% to easily hit her buff cap while guaranteeing Burst uptime.',
        },
        {
          name: 'Calamity Queller',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ High ATK Stat Stick. Enormous 741 Base ATK and stacking off-field ATK% buffs maximize her Flat ATK ceiling when team ER is already satisfied.',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Premier Utility Best-in-Slot. High 565 Base ATK, 30.6% ER, and generates 6 Clear Energy particles on CRIT to battery both Iansan and her carry.',
        },
        {
          name: 'Vortex Vanquisher',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes:
            '5★ ATK Stat Stick. High 608 Base ATK and 49.6% ATK secondary stat help reach her buff cap when paired with shielder teams.',
        },
        {
          name: 'Skyward Spine',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes:
            '5★ Balanced Stat Stick. High 674 Base ATK, 36.8% ER, and +8% CRIT Rate to ease Favonius-like ER and CRIT requirements.',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick. High 608 Base ATK and HP-to-ATK conversion.',
        },
        {
          name: 'Lumidouce Elegy',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick. 608 Base ATK and passive ATK buffs.',
        },
        {
          name: 'Tamayuratei no Ohanashi',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Event F2P Alternative. High 565 Base ATK and 30.6% ER matching Favonius Lance without requiring CRIT Rate investment.',
        },
        {
          name: 'Missive Windspear',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Event F2P Alternative. Provides 510 Base ATK and up to +41.3% ATK upon triggering elemental reactions.',
        },
        {
          name: "Wavebreaker's Fin",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ High ATK 4-star. Exceptional 620 Base ATK and ATK% secondary stat help reach her buff cap.',
        },
        {
          name: "Prospector's Drill",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Alternative. High 565 Base ATK and ATK% / Energy secondary stats.',
        },
        {
          name: 'Lithic Spear',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Alternative. High 565 Base ATK with ATK% and CRIT Rate bonuses in Liyue-inclusive teams.',
        },
        {
          name: 'Prototype Starglitter',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes:
            '4★ Craftable F2P Alternative. Provides 510 Base ATK and 45.9% ER to help fulfill high Burst ER thresholds.',
        },
      ],
    },
  },
];
