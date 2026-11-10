import type { ReviewedCharacterProfile } from './identity';

export const v63Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000125,
    skillDepotId: 12501,
    referenceKey: 'Columbina',
    displayName: 'Columbina',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-columbina-info', 'kqm-columbina-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        talentPriorityGroups: [['normal', 'skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent', 'hydroDmg'],
          Circlet: ['critDmg', 'critRate', 'hpPercent'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { hpPercent: 'team_buffs' },
        },
        priorityStats: ['critRate', 'critDmg', 'hpPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'NightOfTheSkysUnveiling',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot by far for On-Field Lunar-Bloom DPS (+30% CRIT Rate & Lunar Reaction DMG at Ascendant Gleam)',
          },
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Support/DPS Hybrid (+20% ER, +60–120 Teamwide EM & +10% Lunar Reaction DMG)',
          },
          {
            referenceKey: 'AubadeOfMorningstarAndMoon',
            pieces: 4,
            tier: 2,
            label:
              'Alternative for High Personal Damage (+60% Lunar Reaction DMG in Ascendant Gleam)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+80 EM & up to +150 EM in reaction teams)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 2,
            label: 'Alternative for Lunar-Bloom personal reaction damage triggers',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+20% ER / +20% HP / +80 EM)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill', 'burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent', 'hydroDmg'],
          Circlet: ['critDmg', 'critRate', 'hpPercent'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { hpPercent: 'team_buffs' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'hpPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% ER, +60–120 Teamwide EM & +10% Lunar Reaction DMG for team DPS)',
          },
          {
            referenceKey: 'AubadeOfMorningstarAndMoon',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot for Off-Field Personal Damage in Ascendant Gleam (+60% Lunar Reaction DMG)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Support Alternative (+20% HP & continuous +20% Teamwide ATK via Skill hits)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 2,
            label: 'Alternative in Dendro Teams (-30% Dendro RES shred when no teammate holds it)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 2,
            label: 'Alternative in Nascent Gleam Teams (+70% Off-Field Skill DMG)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+20% ER / +20% HP / +80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/columbina-quickguide/',
      playstyleSummary:
        'Columbina is a 5-star Hydro Catalyst user who commands the Welkin Moon and Moonsign mechanics. She excels both as an on-field Lunar-Bloom driver dealing direct Lunar Reaction damage with enhanced Charged Attacks, and as a potent off-field Hydro sub-DPS and support whose Burst amplifies the DMG Bonus of all Lunar Reactions (Lunar-Charged, Lunar-Bloom, Lunar-Crystallize) across the team.',
      energyRequirements:
        'Bursting every rotation requires 140–180% ER depending on team Favonius procs and teammates. However, in personal DPS setups, Columbina should cast her Burst whenever it is available rather than sacrificing offensive HP% and CRIT stats to force high ER. Holding Nocturne\'s Curtain Call or Favonius Codex substantially alleviates ER needs.',
      combatTips: [
        'Burst When Available Invariant: Building excessive ER to force Bursting every rotation in personal DPS setups is a net damage loss compared to maximizing HP% and CRIT; cast Burst whenever naturally charged.',
        'Talent Priority: On-field DPS prioritizes NA = Skill >= Lv. 90 >= Burst. Off-field support prioritizes Skill = Burst > Lv. 90 >> NA (NA remains at Level 1).',
        'Moonsign & Ascendant Gleam: In Moonsign teams, Columbina provides continuous Hydro application and elevated reaction multipliers. Pair with Nod-Krai characters (Ineffa, Lauma, Zibai, Illuga) for full synergy.',
        'Sacrificial Jade Overcap Warning: With her innate CRIT Rate ascension and A1 passive, pairing with 4pc Night of the Sky\'s Unveiling (+30% CRIT Rate) risks severe overcapping when using CRIT Rate weapons like Sacrificial Jade.',
      ],
      weapons: [
        {
          name: "Nocturne's Curtain Call",
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (Energy refund passive, high HP% and CRIT DMG stats amplify personal and team damage)',
        },
        {
          name: 'Reliquary of Truth',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative for On-Field DPS (Abundant CRIT DMG, CRIT Rate and EM stat buffs)',
        },
        {
          name: 'Tome of the Eternal Flow',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Premier Stat Stick (88.2% CRIT DMG & HP-scaling bonuses for on-field playstyle)',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Premier Gacha BiS (55.1% CRIT DMG; EM and DMG% buffs provide massive frontloaded damage)',
        },
        {
          name: 'Prototype Amber',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P Utility BiS (HP% secondary stat, teamwide healing and flat energy refund upon Burst)',
        },
        {
          name: 'Sacrificial Jade',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Battle Pass BiS (High CRIT Rate, HP% and EM; watch for CRIT Rate overcapping with 4pc Sky\'s Unveiling)',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            '4★ Utility Battery BiS (45.9% ER & neutral energy particle generation to battery herself and team)',
        },
        {
          name: "Surf's Up",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (88.2% CRIT DMG and HP buffs for low ER setups)',
        },
        {
          name: "Nightweaver's Looking Glass",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Alternative (High EM and Lunar Reaction DMG% buffs for team support)',
        },
        {
          name: 'A Thousand Floating Dreams',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Team EM Alternative (265 EM & teamwide EM stat sharing)',
        },
        {
          name: "Kagura's Verity",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (66.2% CRIT DMG & Skill DMG bonuses)',
        },
        {
          name: 'Dawning Frost',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Gacha Alternative (Consistent damage output and valuable stats)',
        },
        {
          name: 'Blackmarrow Lantern',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P Alternative (EM secondary stat and Lunar Reaction DMG bonus in Ascendant Gleam)',
        },
        {
          name: 'Ash-Graven Drinking Horn',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Event F2P Alternative (HP% secondary stat and consistent AoE damage proc)',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 3,
          category: 'Utility',
          notes: '3★ Support Budget Option (+48% ATK buff to next active carry)',
        },
        {
          name: 'Magic Guide',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: '3★ F2P Stat Stick (187 EM & +24% DMG against enemies affected by Hydro)',
        },
      ],
    },
  },
  {
    avatarId: 10000126,
    skillDepotId: 12601,
    referenceKey: 'Zibai',
    displayName: 'Zibai',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-zibai-info', 'kqm-zibai-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['defPercent'],
          Goblet: ['defPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'team_buffs' },
        },
        priorityStats: ['critRate', 'critDmg', 'defPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'NightOfTheSkysUnveiling',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot by far (+80 EM & +30% CRIT Rate in Ascendant Gleam, +10% Teamwide Lunar Reaction DMG)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 2,
            label:
              'Alternative Placeholder (+54% DEF & +24% Geo DMG; significantly behind Sky\'s Unveiling)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label:
              'Transitional 2pc mix (2pc Husk of Opulent Dreams +30% DEF / +80 EM / +20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/zibai-quickguide/',
      playstyleSummary:
        'Zibai is a 5-star Geo sword hypercarry, the mythical White Horse Adeptus of Liyue. She utilizes her Elemental Skill to enter Lunar Phase Shift mode, converting Normal and Charged Attacks to non-overrideable Geo damage while consuming Phase Shift Radiance to unleash explosive Spirit Steed\'s Stride strikes that deal massive direct Lunar-Crystallize reaction damage.',
      energyRequirements:
        'In Triple Geo teams with Linnea, Zibai requires only 105–125% ER with 1 Favonius proc to Burst every rotation. In other teams with 130%+ ER requirements, prioritize DEF% and CRIT stats and use her Burst whenever naturally available without building dedicated ER.',
      combatTips: [
        'Normal Attack Level 1 Invariant: Zibai does NOT need Normal Attack talent levels; all Geo Normal Attack and Lunar-Crystallize scaling resides completely inside her Skill talent.',
        'Talent Priority: Skill > Character Level 90 = Burst (NA at Level 1). Level 90 is strongly recommended to maximize base DEF and Lunar-Crystallize reaction base damage.',
        'DEF% Goblet Invariant: A DEF% Goblet is strongly recommended over Geo DMG% or EM because both her direct Geo and direct Lunar-Crystallize hits scale with DEF.',
        'Four Skill Charges: Consuming all 4 Spirit Steed\'s Stride charges is paramount, as the Lunar-Crystallize strikes represent roughly 50% of her total damage output at C0.',
        'Ascendant Gleam & Teambuilding: Requires at least one Nod-Krai teammate (Columbina, Ineffa, Illuga) for Ascendant Gleam, one Geo teammate for Geo Resonance, and one Hydro teammate for continuous Lunar-Crystallize triggers.',
      ],
      weapons: [
        {
          name: 'Lightbearing Moonshard',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (CRIT DMG, DEF%, and massive Lunar-Crystallize DMG Bonus; significant leap over 4★ options)',
        },
        {
          name: 'Uraku Misugiri',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (88.2% CRIT DMG, DEF% bonus, and Normal Attack / Skill DMG multipliers)',
        },
        {
          name: 'Harbinger of Dawn',
          rarity: 3,
          tier: 1,
          category: 'F2P',
          notes:
            '3★ Premier F2P BiS (46.9% CRIT DMG & +28% CRIT Rate when above 90% HP; low Base ATK is completely irrelevant due to DEF scaling)',
        },
        {
          name: 'Light of Foliar Incision',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Stat Stick (88.2% CRIT DMG and +4% CRIT Rate; passive buffs regular Geo strikes)',
        },
        {
          name: 'Flute of Ezpitzal',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable Premier BiS (High DEF% secondary stat and DEF-scaling passive accessible to all players)',
        },
        {
          name: 'Peak Patrol Song',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (Massive DEF% secondary stat and minor teamwide Elemental DMG buff)',
        },
        {
          name: 'Splendor of Tranquil Waters',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (88.2% CRIT DMG secondary stat)',
        },
        {
          name: 'Cinnabar Spindle',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Event Alternative (DEF% secondary stat; only buffs small portion of Skill damage, trailing Flute of Ezpitzal)',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 3,
          category: 'Alternative',
          notes: '5★ Stat Stick (44.1% CRIT Rate; watch for overcapping with 4pc Sky\'s Unveiling)',
        },
      ],
    },
  },
  {
    avatarId: 10000127,
    skillDepotId: 12701,
    referenceKey: 'Illuga',
    displayName: 'Illuga',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-illuga-info', 'kqm-illuga-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst'],
        talentPriorityGroups: [['burst']],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery', 'critRate'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate', 'defPercent'],
        sets: [
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot with Zibai (+20% ER, +60–120 Teamwide EM & +10% Lunar Reaction DMG; maintains 100% uptime at C2+)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+120 Teamwide EM upon triggering reaction; premier buff for Zibai and Columbina)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+12% Geo and Hydro DMG for 15s upon triggering Lunar-Crystallize)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+20% Teamwide ATK for 12s on Burst when supporting ATK-scaling carries like Navia or Itto)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+80 EM / +20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/illuga-quickguide/',
      playstyleSummary:
        'Illuga is a 4-star Geo polearm buffer from Nod-Krai, youngest squad leader of the Nightmare Orioles. He serves as the dedicated support for Geo and Lunar-Crystallize damage dealers (especially Zibai, Navia, and Itto), providing an Additive Base DMG Bonus (akin to Shenhe\'s Icy Quills) scaled from his Elemental Mastery, alongside EM and Geo CRIT buffs.',
      energyRequirements:
        'At C0, Illuga requires 160–185% ER in Double Geo (155–175% in Triple Geo) with Zibai. C1 decreases ER requirements by 25–35% (down to 125–150%). Equipping Favonius Lance reduces ER requirements by an additional 15–30%.',
      combatTips: [
        'Nightingale\'s Song Additive Buff: Illuga\'s core buff grants Additive Base DMG to the active character\'s Geo and direct Lunar-Crystallize attacks based purely on his total EM. Maximize EM on all artifact slots.',
        'Talent Priority: Burst > Character Level 90 (at C2). Elemental Skill and Normal Attacks deal negligible damage and can remain at Level 1.',
        'C2 Constellation Value: At C0–C1, Illuga only maintains 8s of buff uptime on 4pc Silken Moon\'s Serenade. C2 grants off-field Geo damage, ensuring permanent 100% buff uptime.',
        'Favonius Lance & CRIT Rate: When holding Favonius Lance to battery the team, equip a CRIT Rate Circlet to ensure consistent particle procs.',
        'Columbina Synergy: Columbina is Illuga\'s premier Hydro teammate, enabling consistent Lunar-Crystallize triggers and Moonsign harmony.',
      ],
      weapons: [
        {
          name: "Dragon's Bane",
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Wish BiS (Highest EM of any Polearm at 221 EM; maximizes his Nightingale\'s Song EM-scaling additive buff)',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            '4★ Utility Battery BiS (30.6% ER & generates neutral energy particles on CRIT to smooth party rotations)',
        },
        {
          name: 'Frostbreath',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Battle Pass BiS (Generous ER secondary stat and regenerates party energy on Lunar-Crystallize triggers)',
        },
        {
          name: 'Kitain Cross Spear',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (110 EM secondary stat and refunds flat energy to significantly lower personal ER needs)',
        },
        {
          name: 'Song of the Vigil',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable Alternative (Craftable polearm viable at C2 with sufficient Hydro aura uptime)',
        },
        {
          name: 'Black Tassel',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: '3★ F2P Stat Stick (Accessible 3-star option)',
        },
      ],
    },
  },
];
