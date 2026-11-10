import type { ReviewedCharacterProfile } from './identity';

export const v60Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000119,
    skillDepotId: 11901,
    referenceKey: 'Lauma',
    displayName: 'Lauma',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-lauma-info', 'kqm-lauma-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill', 'burst']],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery', 'critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate', 'critDmg'],
        sets: [
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% ER, +60-120 Teamwide EM & +10% Lunar Reaction DMG; premier support set in Moonsign teams)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot for Dendro Teams (-30% Dendro RES Shred with near-100% off-field uptime)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+80 EM & up to +150 EM for maximized personal EM scaling and Burst buffs)',
          },
          {
            referenceKey: 'NightOfTheSkysUnveiling',
            pieces: 4,
            tier: 2,
            label:
              'Alternative for Ascendant Gleam (+10% Lunar Reaction DMG & direct Lunar-Bloom burst damage)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+80 EM / +80 EM / +20% ER combinations)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill', 'burst']],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery', 'dendroDmg'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['elementalMastery', 'critRate', 'critDmg', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'NightOfTheSkysUnveiling',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+10% Lunar Reaction DMG & high personal damage in Ascendant Gleam)',
          },
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Support / Sub-DPS hybrid (+20% ER, +60-120 Team EM)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 2,
            label: 'Alternative (-30% Dendro RES shred)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+80 EM & up to +150 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/lauma-quickguide/',
      playstyleSummary:
        "Lauma is a 5-star Dendro Catalyst off-field support and sub-DPS. She provides consistent off-field Dendro application, teamwide elemental resistance shred (benefiting both Dendro/Hydro DPS and Hyperbloom/Bloom/Burgeon/Lunar-Bloom reactions), and increases the party's Moonsign level.",
      energyRequirements:
        '170-210% as Solo Dendro (2 Skills per Burst); 140-175% with 2nd Dendro (2 Skills); 210-225% with 2nd Dendro (1 Skill); 160-165% with Nefer + Dendro teammate.',
      combatTips: [
        'Skill and Burst Priority (Skill = Burst > Character Level 90 >> NA): Both her Skill (Aura of Vernal Bloom) and Burst contribute significantly to team buffs and Dendro application. Character Level 90 is recommended for transformative reaction damage, while Normal Attacks should remain at Level 1.',
        "Universal RES Shred & Team Synergies: Lauma's signature RES Shred applies to both Hydro and Dendro, benefiting Hyperbloom, Nilou Bloom, Burgeon, and direct Dendro/Hydro DPS units (Columbina, Nahida, Neuvillette).",
        'Prototype Amber Healing Enabler: In teams without a dedicated healer (e.g. Columbina + Nahida), equipping Prototype Amber on Lauma or teammates provides steady partywide sustain without sacrificing much utility.',
        "Moonsign Elevation: As a Nod-Krai character, Lauma raises the party Moonsign level, supercharging 4pc Silken Moon's Serenade to grant 120 EM and +10% Lunar Reaction DMG.",
      ],
      weapons: [
        {
          name: "Nightweaver's Looking Glass",
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature Catalyst and undisputed Best-in-Slot. Grants massive EM bonuses and elevates party Bloom, Hyperbloom, Burgeon, and Lunar-Bloom damage with 100% uptime.',
        },
        {
          name: 'Etherlight Spindlelute',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Version 6.0 Event Weapon BiS. Provides generous ER secondary stats and flat EM, performing remarkably close to her 5★ signature.',
        },
        {
          name: 'A Thousand Floating Dreams',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Top Alternative. Massive 265 EM stat stick and partywide EM buffs when ER needs are satisfied.',
        },
        {
          name: "Starcaller's Watch",
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ High EM Stat Stick (265 EM) that supercharges her personal reaction damage.',
        },
        {
          name: 'Sunny Morning Sleep-In',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Massive EM Stat Stick (up to 417 EM via passives).',
        },
        {
          name: 'Blackmarrow Lantern',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS. Shines in teams where Lauma owns Bloom reactions or deals direct Lunar-Bloom damage.',
        },
        {
          name: 'Fruit of Fulfillment',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable ER Alternative with stacking EM on reaction triggers.',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes:
            '4★ Battery Utility. Satisfies high ER requirements and batteries Energy-hungry teammates with neutral particles.',
        },
        {
          name: 'Prototype Amber',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable Pseudo-Healer Utility. Reduces personal ER requirements while providing partywide HP recovery upon Burst.',
        },
        {
          name: 'Sacrificial Jade',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Battle Pass Alternative for Quickbloom teams, offering CRIT Rate and EM.',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 3,
          category: 'Alternative',
          notes: '4★ Stat Stick with 55.1% CRIT DMG and a chance of potent EM song buffs.',
        },
      ],
    },
  },
  {
    avatarId: 10000120,
    skillDepotId: 12001,
    referenceKey: 'Flins',
    displayName: 'Flins',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-flins-info', 'kqm-flins-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['atkPercent', 'elementalMastery', 'electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
          Goblet: { elementalMastery: 'reaction_context' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'NightOfTheSkysUnveiling',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+30% CRIT Rate & +10% Lunar Reaction DMG at Ascendant Gleam; undisputed best set by a wide margin)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label:
              'Alternative with Furina (+15% Normal/Charged DMG & +36% CRIT Rate; requires dedicated healer)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label:
              "Alternative (+80 EM & up to +150 EM or +14% ATK; excellent placeholder while farming 4pc Sky's Unveiling)",
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 4,
            tier: 2,
            label:
              'Niche Alternative with Fischl (Reduces normal Skill cooldown to boost Oz uptime; avoid at C1+)',
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
      sourceUrl: 'https://keqingmains.com/q/flins-quickguide/',
      playstyleSummary:
        'Flins is a 5-star Electro polearm on-field DPS centered around the Lunar-Charged reaction. At Ascendant Gleam (Moonsign Level 2), his special Burst and enhanced Skill attacks unleash devastating AoE Electro and lunar strikes.',
      energyRequirements:
        '110-135% at C0; 115-145% at C1; ~25-30% lower ER requirement when equipped with signature weapon Bloodsoaked Ruins (due to flat 12-energy refund).',
      combatTips: [
        'Elemental Burst Priority (Burst > Level 90 >> Skill / NA): His primary damage output is concentrated in his enhanced Burst detonations and Lunar-Charged reactions. Character Level 90 is crucial for maximizing reaction base damage, while Normal Attack talent can remain at Level 1.',
        "Nod-Krai Teammate Requirement: Flins's Lunar-Charged kit requires at least one Nod-Krai teammate (Ineffa, Aino, or Lauma) to reach Ascendant Gleam (Moonsign Level 2) and unleash his maximum damage potential.",
        'Columbina Synergy: Columbina is his premier Hydro teammate, enabling continuous Hydro application and Lunar-Charged triggers.',
        "Staff of the Scarlet Sands CRIT Warning: When running Staff of the Scarlet Sands (44.1% CRIT Rate) alongside 4pc Night of the Sky's Unveiling (+30% CRIT Rate), be cautious not to overcap on CRIT Rate from substats.",
      ],
      weapons: [
        {
          name: 'Bloodsoaked Ruins',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature Polearm and undisputed Best-in-Slot. High Base ATK, CRIT stats, Lunar-Charged DMG bonus, and refunds 12 Energy per rotation to slash ER requirements by 25-30%.',
        },
        {
          name: 'Staff of the Scarlet Sands',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Premier Alternative. Massive 44.1% CRIT Rate and converts EM to Flat ATK; pairs exceptionally with EM sands/goblet in Lunar-Charged teams.',
        },
        {
          name: 'Deathmatch',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Battle Pass BiS. 36.8% CRIT Rate and massive single-target ATK buffs allow R5 Deathmatch to compete directly with 5★ options.',
        },
        {
          name: "Prospector's Shovel",
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS. High ATK% secondary stat and up to +48% Lunar-Charged DMG at R5 in Ascendant Gleam.',
        },
        {
          name: 'Ballad of the Fjords',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Battle Pass Alternative. 27.6% CRIT Rate and +120-240 EM when team has at least 3 distinct elements.',
        },
        {
          name: "Sacrificer's Staff",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Alternative offering strong base stats and supportive/offensive passive utility.',
        },
        {
          name: 'Fractured Halo',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick offering high ATK and Lunar-Charged DMG% bonuses.',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Universal Stat Stick offering 66.2% CRIT DMG and HP-to-ATK conversion.',
        },
        {
          name: 'Symphonist of Scents',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick with high Base ATK and CRIT stats.',
        },
        {
          name: 'Lumidouce Elegy',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Balanced 33.1% CRIT Rate stat stick.',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick with 22.1% CRIT Rate; maintains stacks easily on-field.',
        },
        {
          name: 'Vortex Vanquisher',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ ATK Stat Stick; performs very well when shielded by Ineffa.',
        },
        {
          name: 'Skyward Spine',
          rarity: 5,
          tier: 3,
          category: 'Alternative',
          notes: '5★ ER Stat Stick offering 36.8% ER and +8% CRIT Rate for higher-ER scenarios.',
        },
        {
          name: 'Tamayuratei no Ohanashi',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: '4★ Event F2P Polearm providing 30.6% ER without requiring CRIT procs.',
        },
      ],
    },
  },
  {
    avatarId: 10000121,
    skillDepotId: 12101,
    referenceKey: 'Aino',
    displayName: 'Aino',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-aino-info', 'kqm-aino-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery'],
          Goblet: ['elementalMastery', 'hydroDmg'],
          Circlet: ['critRate', 'elementalMastery'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
          Sands: { energyRecharge: 'team_buffs' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% ER, +60-120 Teamwide EM & +10% Lunar Reaction DMG; premier teamwide buffer set)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative (+20% Teamwide ATK for 12s upon casting Burst)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot for Dendro Teams (-30% Dendro RES shred via continuous Burst hits)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+120 Teamwide EM upon triggering an elemental reaction on-field)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+40% Teamwide Elemental DMG bonus to Hydro and reacted elements)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+20% ER / +80 EM combinations)',
          },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
          Sands: { energyRecharge: 'team_buffs' },
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate'],
        sets: [
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% ER & +60-120 EM to whole team)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative for Reaction Damage (+80 EM & up to +150 EM)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 2,
            label: 'Alternative for Dendro reaction support',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/aino-quickguide/',
      playstyleSummary:
        "Aino is a 4-star Hydro Claymore support and off-field enabler freely available through the Nod-Krai Archon Quest. She applies consistent off-field AoE Hydro via her Elemental Burst, raises the team's Moonsign level (vital for Flins), and enables Overvape and Lunar-Charged compositions.",
      energyRequirements:
        '190-250%+ standard; 155-205% with Favonius Greatsword; ~40% less with C4; <160% with 2 Skills per Burst.',
      combatTips: [
        "Zero Talent Investment Invariant: Aino's utility comes entirely from her Burst's Hydro application, Moonsign passive, and A4 EM-scaling transformative reactions. Her talent multipliers scale from ATK and contribute negligible damage; all three talents (NA, Skill, Burst) can comfortably stay at Level 1.",
        'Favonius Greatsword Priority: Favonius Greatsword is her undisputed Best-in-Slot weapon, neutralizing her steep 190-250% ER requirements while generating clear particles to battery energy-hungry teammates.',
        "Moonsign Elevation for Flins: Aino increases the team's Moonsign Level by 1, allowing Flins to activate Ascendant Gleam (Level 2) and gain his full 30% CRIT Rate and Lunar-Charged bonuses.",
        'Overvape Enabler with Ineffa: When paired with Ineffa, Aino maintains consistent Electro-Charged/Lunar-Charged auras that allow Pyro on-field carries (Arlecchino, Mavuika, Bennett) to trigger simultaneous Overloaded and Vaporize (Overvape).',
      ],
      weapons: [
        {
          name: 'Favonius Greatsword',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Undisputed Best-in-Slot. 61.3% ER and 6 Clear Energy particles on CRIT neutralize her steep 190-250% ER needs while baterying party carries.',
        },
        {
          name: 'Makhaira Aquamarine',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Top Support Alternative. Provides EM to Aino and shares a Flat ATK buff to the entire party based on her EM.',
        },
        {
          name: 'Forest Regalia',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P Support. Provides 30.6% ER and drops an empowerment leaf upon Bloom reactions granting up to 120 EM.',
        },
        {
          name: 'Flame-Forged Insight',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Event-Limited F2P. Huge EM secondary stat and flat Energy refund passives make it exceptional for reaction damage.',
        },
        {
          name: 'Master Key',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable Claymore offering both EM and ER to support her rotations.',
        },
        {
          name: 'Sacrificial Greatsword',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ ER Claymore with Skill cooldown reset to generate double particles.',
        },
        {
          name: 'Katsuragikiri Nagamasa',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes:
            '4★ Craftable ER Claymore providing 45.9% ER and flat energy refund upon Skill hits.',
        },
      ],
    },
  },
];
