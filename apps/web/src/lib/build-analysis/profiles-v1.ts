import type { ReviewedCharacterProfile } from './identity';

export const v1Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000005,
    skillDepotId: 504,
    referenceKey: 'TravelerAnemo',
    displayName: 'Anemo Traveler',
    defaultRoleId: 'resistance_shred',
    evidenceIds: ['kqm-anemo-traveler'],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery', 'anemoDmg'],
          Circlet: ['elementalMastery', 'critRate'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'critRate'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (40% Resistance Shred)',
          },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative (Team EM Buff)' },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team ATK Buff)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['anemoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/anemo-traveler/',
      playstyleSummary:
        'Quickswap Swirl support providing 40% elemental RES shred via 4pc VV, grouping small enemies with Tornado, and absorbing elements.',
      energyRequirements:
        '180% - 210% ER in solo Anemo teams; ~140% - 160% with a second Anemo unit or Favonius Sword.',
      combatTips: [
        'Hold Elemental Skill to gather enemies before releasing for higher damage and particle generation.',
        'Burst Tornado can be infused with Pyro/Hydro/Electro/Cryo; position carefully so the tornado does not push enemies out of melee range.',
        'Favonius Sword reliably batteries team energy with high Crit Rate.',
      ],
      weapons: [
        {
          name: 'Freedom-Sworn',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Exceptional EM substat and team ATK/normal attack damage buff on elemental trigger',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Best overall utility weapon for meeting high team energy requirements',
        },
        {
          name: 'Sacrificial Sword',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Allows double skill cast for extra crowd control, particles, and Swirl damage',
        },
        {
          name: 'Iron Sting',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Craftable EM sword, ideal for maximizing Swirl transformative damage',
        },
        {
          name: 'Skyward Blade',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High base ATK and high ER substat for consistent burst uptime',
        },
      ],
    },
  },
  {
    avatarId: 10000005,
    skillDepotId: 506,
    referenceKey: 'TravelerGeo',
    displayName: 'Geo Traveler',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-geo-traveler'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Skill Quickswap)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Support / Team ATK)',
          },
          { referenceKey: 'ArchaicPetra', pieces: 2, tier: 2, label: 'Alternative 2pc (+15% Geo)' },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [{ referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot' }],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/geo-traveler/',
      playstyleSummary:
        'High-damage quickswap Geo construct generator and team battery. Burst grants +10% Crit Rate and stagger resistance to allies inside the circle.',
      energyRequirements: '130% - 160% ER with a second Geo unit; 170%+ in solo Geo teams.',
      combatTips: [
        'Aim Starfell Sword (E) slightly away from under large bosses so the meteorite detonates immediately or does not elevate enemies unreachable for melee carries.',
        'C1 Wake of Earth grants party members +10% Crit Rate within the barrier.',
        'Geo constructs resonate with Zhongli Stele for continuous AoE Geo damage.',
      ],
      weapons: [
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Massive Crit Rate and flat ATK conversion from HP',
        },
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High base ATK with generous Crit DMG and elemental DMG bonus',
        },
        {
          name: 'Festering Desire',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Incredible skill DMG% bonus and ER substat',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Premier particle battery for teammates with low Geo energy generation',
        },
        {
          name: 'Amenoma Kageuchi',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: 'Craftable sword that refunds flat energy after burst',
        },
      ],
    },
  },
  {
    avatarId: 10000021,
    skillDepotId: 2101,
    referenceKey: 'Amber',
    displayName: 'Amber',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-amber'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['pyroDmg', 'atkPercent'],
          Circlet: ['critRate'],
        },
        priorityStats: ['energyRecharge', 'critRate'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (40-cost Burst Buffer)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative (120 EM Team Buff)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critDmg', 'critRate'],
        },
        priorityStats: ['critDmg', 'elementalMastery', 'atkPercent', 'critRate'],
        sets: [
          {
            referenceKey: 'WanderersTroupe',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Charged Attack)',
          },
          { referenceKey: 'ShimenawasReminiscence', pieces: 4, tier: 2, label: 'Alternative' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/amber-quickguide/',
      playstyleSummary:
        'Fast 40-cost Burst support wielding Elegy of the End and Noblesse Oblige, or sniper Melt DPS with weakspot-targeted Aimed Shots.',
      energyRequirements: '~130% - 160% ER with Favonius or Elegy; Burst cost is just 40.',
      combatTips: [
        'Baron Bunny taunts enemies and provides Cryo-shield melting through rapid 6-hit Burst rain.',
        'C6 grants the entire team +15% ATK and +15% movement speed for 10s upon casting Burst.',
        'Excellent shield breaker against Cryo shields in Abyss and Fatui skirmishers.',
      ],
      weapons: [
        {
          name: 'Elegy for the End',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Triggers buff almost instantly on Amber multi-hit Burst, granting team 100 EM and 20% ATK',
        },
        {
          name: 'Favonius Warbow',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Reliable party-wide particle battery on weakspot hits',
        },
        {
          name: 'Aqua Simulacra',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Highest damage ceiling for Charged Shot carry playstyle',
        },
        {
          name: 'Prototype Crescent',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Craftable bow that boosts ATK% upon hitting weak points',
        },
        {
          name: "Sharpshooter's Oath",
          rarity: 3,
          tier: 2,
          category: 'F2P',
          notes: 'Incredible 3-star F2P option for guaranteed weakspot crits',
        },
      ],
    },
  },
  {
    avatarId: 10000015,
    skillDepotId: 1501,
    referenceKey: 'Kaeya',
    displayName: 'Kaeya',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-kaeya'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Burst Uptime & DMG)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Freeze Teams)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team Buffer)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Skill focused)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['physicalDmg', 'cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent'],
        sets: [
          { referenceKey: 'PaleFlame', pieces: 4, tier: 1, label: 'Best in Slot (Physical)' },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Cryo Infusion)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/kaeya-quickguide/',
      playstyleSummary:
        'High-frequency off-field Cryo applicator via circling icicles (Glacial Waltz), rapid Cryo battery, or Reverse Melt sub-DPS.',
      energyRequirements:
        '130% - 150% ER with a second Cryo unit; 180% - 200% as solo Cryo off-field sub-DPS.',
      combatTips: [
        'Glacial Waltz icicles track the active character closely, making Kaeya ideal for close-range melee carries like Xiangling, Hu Tao, or Diluc.',
        'Frostgnaw generates 2.67 Cryo particles on a short 6s cooldown, making him a premier Cryo battery.',
        'C2 extends Burst duration by 2.5s per enemy defeated (up to 15s max), enabling 100% burst uptime in multi-target Abyss chambers.',
      ],
      weapons: [
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Universal top-tier sword offering Crit DMG and all-elemental DMG%',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Crit Rate eases artifact balancing significantly',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Best utility weapon for battery duties and team energy smoothness',
        },
        {
          name: "Lion's Roar",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Excels in Reverse Melt teams with Pyro aura',
        },
        {
          name: 'Amenoma Kageuchi',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: 'Craftable sword that alleviates ER requirements',
        },
      ],
    },
  },
  {
    avatarId: 10000006,
    skillDepotId: 601,
    referenceKey: 'Lisa',
    displayName: 'Lisa',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-lisa'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['electroDmg', 'elementalMastery'],
          Circlet: ['critRate', 'elementalMastery'],
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (Support)' },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Burst ER & DMG)',
          },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative (Team EM)' },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['electroDmg', 'elementalMastery'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'critRate', 'critDmg'],
        sets: [
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Hyperbloom/Aggravate)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Pure Hyperbloom)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Cooldown Reset)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/lisa-quickguide/',
      playstyleSummary:
        'Burst support providing a unique 15% DEF shred via A4 Passive (Static Electricity Field), Thrilling Tales buffer, or Catalyze/Hyperbloom trigger.',
      energyRequirements:
        '200% - 250% ER in off-field Burst support without Raiden/battery; 160% - 180% with an Electro battery.',
      combatTips: [
        'Lightning Rose (Q) delivers continuous Electro pulses over 15 seconds that shred enemy DEF by 15% for 10s.',
        'Can equip Thrilling Tales of Dragon Slayers (TTDS) for an easy 48% ATK buff to your hypercarry.',
        'Holding Skill (Violet Arc) provides massive damage and 5 particles but leaves Lisa vulnerable without a shield.',
      ],
      weapons: [
        {
          name: 'A Thousand Floating Dreams',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Provides massive EM to Lisa and party-wide EM buffs',
        },
        {
          name: "Kagura's Verity",
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Highest personal damage ceiling for on-field Aggravate',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 1,
          category: 'Utility',
          notes: 'Premier 3-star support weapon granting +48% ATK to next switched unit',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Vital ER substat and white particles for team energy battery',
        },
        {
          name: 'Hakushin Ring',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Craftable catalyst granting elemental damage bonuses upon triggering Electro reactions',
        },
      ],
    },
  },
  {
    avatarId: 10000014,
    skillDepotId: 1401,
    referenceKey: 'Barbara',
    displayName: 'Barbara',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-barbara'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent'],
          Circlet: ['healingBonus', 'hpPercent'],
        },
        priorityStats: ['maxHp', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Healing & Physical Foam Damage)',
          },
          { referenceKey: 'MaidenBeloved', pieces: 4, tier: 2, label: 'Alternative (Max Healing)' },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Reaction Support)',
          },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery', 'healingBonus'],
        },
        priorityStats: ['elementalMastery', 'maxHp', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Bloom DMG)',
          },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 1, label: 'Best in Slot (EM Stacking)' },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Hybrid Bloom/Heal)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/barbara-quickguide/',
      playstyleSummary:
        'Burst and continuous off-field Hydro healer via Melody Loop, or high-EM on-field driver in Nilou Bloom and Electro-Charged comps.',
      energyRequirements:
        '160% - 180% ER if relying on Burst panic heals; non-issue if primarily relying on Skill and TTDS rotation.',
      combatTips: [
        'Skill Melody Loop applies Wet status to the active character periodically; beware of getting Frozen against Cryo enemies.',
        'Equipping Thrilling Tales of Dragon Slayers allows Barbara to deliver an immense 48% ATK buff to your carry every 20 seconds.',
        'In Bloom teams, hugging enemies with Melody Loop applies Hydro in an aura that spawns Dendro cores rapidly.',
      ],
      weapons: [
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 1,
          category: 'Utility',
          notes: 'Best support catalyst in the game for buffing ATK hypercarries',
        },
        {
          name: 'Prototype Amber',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            'Craftable catalyst providing HP% and teamwide flat energy/HP restoration on Burst',
        },
        {
          name: 'Everlasting Moonglow',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'High HP substat and healing bonus with burst-driven normal attack energy refund',
        },
        {
          name: 'Sacrificial Fragments',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'High EM for Bloom driver and resets Skill cooldown',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Generates clear particles with Crit Rate on field',
        },
      ],
    },
  },
  {
    avatarId: 10000034,
    skillDepotId: 3401,
    referenceKey: 'Noelle',
    displayName: 'Noelle',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-noelle'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['defPercent'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'defPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (with Furina)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (General Geo Carry)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+35% Normal ATK DMG)',
          },
          {
            referenceKey: 'RetracingBolide',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+40% Normal/Charged DMG)',
          },
        ],
      },
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['defPercent'],
          Goblet: ['defPercent'],
          Circlet: ['defPercent', 'healingBonus'],
        },
        priorityStats: ['defPercent', 'def'],
        sets: [{ referenceKey: 'HuskOfOpulentDreams', pieces: 4, tier: 1, label: 'Best in Slot' }],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/noelle-quickguide/',
      playstyleSummary:
        'Sweeping Time Geo carry who converts DEF into massive ATK with expansive melee range, while simultaneously shielding and healing the entire party (especially potent with Furina).',
      energyRequirements:
        '120% - 140% ER with Favonius battery (Gorou/Albedo/Geo Traveler/Navia); Noelle herself generates 0 particles with Skill.',
      combatTips: [
        'Noelle Skill does NOT generate elemental particles on cast or hit. A Geo battery (like Gorou, Albedo, or Geo Traveler) is mandatory.',
        'Sweeping Time (Q) snapshots DEF upon cast and persists even when swapping off-field, allowing flexible mid-rotation support buffs.',
        'C6 Sweeping Time adds an additional 50% DEF to ATK conversion and extends duration by 1s per kill (up to +10s).',
      ],
      weapons: [
        {
          name: 'Redhorn Stonethresher',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Enormous 88.2% Crit DMG with massive Normal/Charged ATK damage scale from DEF',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            'BP Claymore offering Crit Rate and up to 50% all-damage bonus, perfectly protected by shields',
        },
        {
          name: 'Whiteblind',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Craftable claymore offering immense DEF% and ATK% stacking on normal/charged hits',
        },
        {
          name: 'Favonius Greatsword',
          rarity: 4,
          tier: 3,
          category: 'Utility',
          notes: 'Solves Noelle self-energy drought at the cost of personal damage',
        },
      ],
    },
  },
  {
    avatarId: 10000032,
    skillDepotId: 3201,
    referenceKey: 'Bennett',
    displayName: 'Bennett',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-bennett'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent', 'pyroDmg'],
          Circlet: ['healingBonus', 'critRate', 'hpPercent'],
        },
        priorityStats: ['energyRecharge', 'maxHp', 'critRate'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% Team ATK on Burst)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative (120 EM Reaction Teams)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Nightsoul Teams)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'energyRecharge'],
        sets: [{ referenceKey: 'CrimsonWitchOfFlames', pieces: 4, tier: 1, label: 'Best in Slot' }],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/bennett-quickguide/',
      playstyleSummary:
        'Premier support character providing an immense flat ATK buff based strictly on Base ATK, rapid Pyro particle generation via Tap Skill, and potent continuous healing.',
      energyRequirements:
        '200% - 240% ER for comfortable, burst-off-cooldown uptime; ~180% with Raiden Shogun or double Pyro.',
      combatTips: [
        'Fantastic Voyage ATK buff scales EXCLUSIVELY off Bennett Base ATK (Character Base ATK + Weapon Base ATK). Artifact ATK% has ZERO impact on the buff.',
        'C1 Fantastic Voyage removes the 70% HP restriction and adds an extra 20% Base ATK bonus.',
        'C6 infuses melee normal/charged attacks with Pyro (+15% Pyro DMG). Great for Pyro carries, but changes synergies with physical/infusion-sensitive carries.',
        'Always tap Skill rather than charging it for optimal energy and rotation efficiency.',
      ],
      weapons: [
        {
          name: 'Aquila Favonia',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Highest Base ATK (674) among standard 5-stars, maximizing Fantastic Voyage buff',
        },
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Ties highest Base ATK (674) with massive personal offensive stats',
        },
        {
          name: 'Skyward Blade',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'High Base ATK (608) combined with crucial ER substat',
        },
        {
          name: 'Sapwood Blade',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            'Craftable sword with high Base ATK (565), ER substat, and Leaf of Consciousness EM drop',
        },
        {
          name: 'The Alley Flash',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Highest 4-star Base ATK (620)',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Unmatched battery potential for energy-hungry teammates like Xiangling',
        },
      ],
    },
  },
  {
    avatarId: 10000020,
    skillDepotId: 2001,
    referenceKey: 'Razor',
    displayName: 'Razor',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-razor'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['physicalDmg', 'elementalMastery'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge', 'elementalMastery'],
        sets: [
          { referenceKey: 'PaleFlame', pieces: 4, tier: 1, label: 'Best in Slot (Physical)' },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Physical Alternative)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Rainbow EM Driver)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Burgeon/Hyperbloom)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/razor-quickguide/',
      playstyleSummary:
        'High attack-speed Claymore carry who excels either as a traditional Physical hypercarry with Superconduct, or as a full-EM Rainbow driver triggering Overload, Hyperbloom, and Burgeon simultaneously inside Bennett C6 field.',
      energyRequirements: '110% - 130% ER; Electro Sigils and Burst refund provide self-battery.',
      combatTips: [
        'Lightning Fang increases Normal ATK speed and grants interruption immunity while dealing companion Electro attacks.',
        'Tap Skill produces Electro Sigils (up to 3) granting 20% ER each; hold Skill consumes them to generate flat energy.',
        'In Rainbow Razor teams (Bennett C6 + Xingqiu + Nahida), build triple EM to trigger massive Hyperbloom and Burgeon damage simultaneously.',
      ],
      weapons: [
        {
          name: 'Song of Broken Pines',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Highest Base ATK claymore with Physical DMG% and team ATK/Attack Speed buff',
        },
        {
          name: "Wolf's Gravestone",
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Huge raw ATK% and party ATK buff below 30% HP',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Massive damage bonus and Crit Rate scaling',
        },
        {
          name: 'Mailed Flower',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Top choice for full-EM Rainbow Razor driver',
        },
        {
          name: 'Prototype Archaic',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Reliable craftable F2P physical claymore',
        },
      ],
    },
  },
  {
    avatarId: 10000024,
    skillDepotId: 2401,
    referenceKey: 'Beidou',
    displayName: 'Beidou',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-beidou'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Damage & ER)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team Buffer)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Counter Focused)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Electro)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/beidou-quickguide/',
      playstyleSummary:
        'Queen of 2-to-multiple target content. Stormbreaker discharges bouncing lightning chains across enemies on active normal and charged attacks, with damage reduction and interruption resistance.',
      energyRequirements: '140% - 160% ER with Fischl as battery; 180% - 220% as solo Electro.',
      combatTips: [
        'Stormbreaker (Q) discharges bounce up to 5 times (at C2), making Beidou damage scaling absurdly high against exactly 2 to 3 targets.',
        'Perfect parry with Tidecaller (E) instantly generates the maximum 4 Electro particles and deals huge burst damage.',
        'Pair almost universally with Fischl to solve her high 80-cost Burst energy requirements.',
      ],
      weapons: [
        {
          name: "Wolf's Gravestone",
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Immense ATK scaling benefits snapshotting on Stormbreaker',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Unbelievable personal damage output; stacks can be maintained while off-field',
        },
        {
          name: 'Akuoumaru',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Huge Burst DMG% bonus scaling with total party energy capacity',
        },
        {
          name: 'Luxurious Sea-Lord',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Strong event weapon boosting Burst damage',
        },
        {
          name: 'Favonius Greatsword',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Essential if running Beidou as solo Electro to meet high ER requirements',
        },
      ],
    },
  },
  {
    avatarId: 10000031,
    skillDepotId: 3101,
    referenceKey: 'Fischl',
    displayName: 'Fischl',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-fischl'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+70% Skill DMG off-field)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Aggravate teams)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Electro)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/fischl/',
      playstyleSummary:
        'Premier off-field Electro sub-DPS and battery. Oz continuously attacks targets and triggers the devastating A4 Passive (Undone Be Thy Sinful Hex) on Electro-related reactions with no internal cooldown (ICD).',
      energyRequirements: '100% - 120% ER; Oz generates abundant Electro particles continuously.',
      combatTips: [
        'Alternate Skill and Burst on successive rotations to maintain near 100% Oz field uptime.',
        'A4 Passive strikes with 80% ATK whenever the on-field character triggers an Electro-related reaction; pairs astronomically well with Dendro (Quicken/Aggravate).',
        'Oz snapshots ATK and buffs upon summoning; cast Skill or Burst while standing inside Bennett field or while buffs are active.',
      ],
      weapons: [
        {
          name: 'Polar Star',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Crit Rate with elemental skill and burst DMG buffs',
        },
        {
          name: 'Aqua Simulacra',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Massive Crit DMG and unconditional 20% all-DMG bonus',
        },
        {
          name: 'The Stringless',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Incredible 4-star option; high EM and up to 48% unconditional Skill/Burst DMG%',
        },
        {
          name: 'Skyward Harp',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'High Base ATK, Crit Rate, and Crit DMG',
        },
        {
          name: 'Fading Twilight',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Free event bow offering ER and cycling damage buffs',
        },
      ],
    },
  },
  {
    avatarId: 10000023,
    skillDepotId: 2301,
    referenceKey: 'Xiangling',
    displayName: 'Xiangling',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-xiangling'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'elementalMastery', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Uptime & Massive Burst DMG)',
          },
          {
            referenceKey: 'CrimsonWitchOfFlames',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Vaporize/Melt)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Support role)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/xiangling-quickguide/',
      playstyleSummary:
        'The undisputed queen of off-field Pyro damage. Pyronado has zero ICD, snapshots all buffs upon casting, and vaporizes on nearly every revolution when paired with Hydro.',
      energyRequirements:
        '180% - 220% ER with Bennett funneling particles; 240%+ without Bennett or in solo Pyro.',
      combatTips: [
        'Pyronado snapshots buffs (Bennett ATK buff, snapshot potions) at the moment of casting; always cast Burst while standing inside Bennett Fantastic Voyage.',
        'Pyronado has NO Internal Cooldown (ICD) on elemental application, allowing it to Vaporize or Melt every single hit.',
        'Walk clockwise around enemies to maximize the number of Pyronado hits as it rotates counterclockwise.',
        'Funnel particles from Bennett Tap Skill directly into Xiangling by switching to her to catch the particles.',
      ],
      weapons: [
        {
          name: 'Staff of the Scarlet Sands',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Huge Crit Rate and transforms EM into flat ATK for immense Vaporize damage',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Massive Crit DMG and ATK scaling',
        },
        {
          name: 'Engulfing Lightning',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Converts ER into ATK, solving energy needs while scaling Emblem 4pc',
        },
        {
          name: 'The Catch',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            'The undisputed best free weapon; obtainable via Inazuma fishing; gives ER, Burst Crit Rate, and Burst DMG%',
        },
        {
          name: "Dragon's Bane",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Tremendous EM and DMG% bonus against enemies affected by Hydro or Pyro',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Safest weapon for comfortable energy generation across the team',
        },
      ],
    },
  },
  {
    avatarId: 10000025,
    skillDepotId: 2501,
    referenceKey: 'Xingqiu',
    displayName: 'Xingqiu',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-xingqiu'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Burst Uptime & DMG)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team ATK Buff)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Hydro)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/xingqiu-quickguide/',
      playstyleSummary:
        'Legendary off-field Hydro enabler. Rain Swords track active normal attacks to deliver rapid Hydro application, substantial single-target damage, up to 29%+ damage reduction, and stagger resistance.',
      energyRequirements:
        '170% - 200% with Sacrificial Sword (R3+); 200% - 240% without Sacrificial Sword or with a low-refinement weapon.',
      combatTips: [
        'Sacrificial Sword is effectively Xingqiu signature weapon; its reset allows casting his high-damage Skill twice, generating 10 Hydro particles and fully filling his Burst.',
        'Raincutter swords fire on Normal Attack animations (even if the attack does not connect), making it easy to apply Hydro continuously.',
        'Rain Swords provide up to 29% damage reduction and prevent active characters from being interrupted or knocked down.',
        'C6 increases sword rain waves to 2-3-5 blades and regenerates 3 flat energy on the 5-blade strike, lowering ER requirements by ~30%.',
      ],
      weapons: [
        {
          name: 'Sacrificial Sword',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            'Uncontested best-in-slot 4-star weapon for Xingqiu; double skill cast batteries burst completely',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Highest damage ceiling when energy requirements are covered by Raiden/double Hydro',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Excellent alternative if Sacrificial Sword is not at R3+ or is on another unit',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Fontaine fishing sword granting ER and Skill Crit Rate',
        },
      ],
    },
  },
  {
    avatarId: 10000036,
    skillDepotId: 3601,
    referenceKey: 'Chongyun',
    displayName: 'Chongyun',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-chongyun'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (40-cost Burst Buffer)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Burst DMG)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Cryo)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate'],
        },
        priorityStats: ['energyRecharge', 'critRate'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/chongyun-quickguide/',
      playstyleSummary:
        'Quickswap burst nuker and Cryo infusion support. His Frost Field infuses melee weapons with Cryo and grants 8% ATK speed, while his 40-cost Burst drops 3 (4 at C6) massive spirit blades that can each Melt independently on Pyro aura.',
      energyRequirements: '120% - 140% ER; Burst cost is just 40.',
      combatTips: [
        'Cloud-Parting Star (Q) drops 3 blades (4 at C6). If applied to a strong Pyro aura (Bennett burst or Xiangling), all blades can trigger Reverse Melt for huge burst damage.',
        'Frost Field (E) infuses Sword, Claymore, and Polearm normal/charged attacks with Cryo; take care not to override Physical hypercarries.',
        'C2 Chongyun reduces elemental skill and burst cooldowns by 15% for characters inside the Frost Field.',
      ],
      weapons: [
        {
          name: "Wolf's Gravestone",
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High ATK enhances triple/quad Melt burst nukes',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Massive Crit Rate and damage bonus across all hits',
        },
        {
          name: 'Akuoumaru',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Significant burst damage bonus based on team energy costs',
        },
        {
          name: 'Luxurious Sea-Lord',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Boosts burst damage by up to 24% with added AoE fish strike',
        },
        {
          name: 'Sacrificial Greatsword',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Resets skill cooldown and supplies energy',
        },
      ],
    },
  },
  {
    avatarId: 10000027,
    skillDepotId: 2701,
    referenceKey: 'Ningguang',
    displayName: 'Ningguang',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-ningguang'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'NighttimeWhispersInTheEchoingWoods',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+50% Geo DMG)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 2,
            tier: 1,
            label: 'Best in Slot 2pc (+15% Geo)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 1,
            label: 'Best in Slot 2pc (+18% ATK)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+20% Burst)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate'],
        },
        priorityStats: ['energyRecharge', 'critRate'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/ningguang-quickguide/',
      playstyleSummary:
        'Single-target Geo artillery carry or fast quickswap burst nuker. Casts Jade Screen for damage and a 12% Geo DMG bonus gate, followed by Starshatter which fires homing Geo gems that double when passing through the screen.',
      energyRequirements: '120% - 130% ER; 40 energy cost makes burst ready every rotation.',
      combatTips: [
        'Optimal normal attack combo: 1 Normal Attack -> Charged Attack. Normal attacks grant Star Jades that make Charged Attacks consume ZERO stamina.',
        'Always pass characters through Jade Screen (E) to gain +12% Geo DMG bonus for 10 seconds.',
        'C2 resets Jade Screen cooldown when shattered, enabling E -> Q -> E combos for quick particle and burst generation.',
      ],
      weapons: [
        {
          name: 'Memory of Dust',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Massive ATK stacking with 100% effectiveness behind shields',
        },
        {
          name: 'Lost Prayer to the Sacred Winds',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Crit Rate, movement speed, and ramping elemental damage bonus',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Huge Crit DMG with 2 out of 3 songs granting monstrous ATK or DMG buffs',
        },
        {
          name: 'Solar Pearl',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'BP catalyst synchronizing Normal Attack and Skill/Burst damage bonuses',
        },
        {
          name: 'Flowing Purity',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Fontaine craftable catalyst granting elemental damage bonus upon clearing Bond of Life',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 2,
          category: 'Utility',
          notes: 'Allows Ningguang to serve as a fast burst + 48% ATK buffer for teammates',
        },
      ],
    },
  },
  {
    avatarId: 10000043,
    skillDepotId: 4301,
    referenceKey: 'Sucrose',
    displayName: 'Sucrose',
    defaultRoleId: 'reaction_trigger',
    evidenceIds: ['kqm-sucrose'],
    roles: [
      {
        id: 'reaction_trigger',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (40% Resistance Shred & Swirl DMG)',
          },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative (Team EM Buff)' },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge'],
        sets: [{ referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot' }],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/sucrose-quickguide/',
      playstyleSummary:
        'Premier 4-star Anemo support and driver. Shreds 40% elemental RES via 4pc VV while sharing massive Elemental Mastery with the team (50 flat EM + 20% of Sucrose EM) and gathering mobs.',
      energyRequirements:
        '140% - 170% ER with Sacrificial Fragments (R1+); 180%+ without Sacrificial reset.',
      combatTips: [
        'Passives Catalyst Conversion (50 flat EM matching Swirled element) and Mollis Favonius (shares 20% of Sucrose total EM for 8s) turn her into a top-tier reaction amplifier.',
        'Sacrificial Fragments provides high EM and resets Skill cooldown, providing up to 3 skill casts with C1 for extensive crowd control and energy.',
        'Normal attacks are naturally Anemo, enabling her to serve as an on-field driver in Sukokomon, National, and Taser teams.',
      ],
      weapons: [
        {
          name: 'Sacrificial Fragments',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Uncontested best weapon; high EM substat with Skill cooldown reset',
        },
        {
          name: 'A Thousand Floating Dreams',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'Highest EM stat stick with party EM buffs',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 1,
          category: 'Utility',
          notes: 'Offers 48% ATK buff to your hypercarry at the cost of personal EM',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Particle generator when high team energy requirements need addressing',
        },
        {
          name: 'Hakushin Ring',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Craftable catalyst granting elemental damage bonuses when triggering Electro reactions',
        },
      ],
    },
  },
  {
    avatarId: 10000022,
    skillDepotId: 2201,
    referenceKey: 'Venti',
    displayName: 'Venti',
    defaultRoleId: 'resistance_shred',
    evidenceIds: ['kqm-venti'],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge', 'atkPercent'],
          Goblet: ['elementalMastery', 'anemoDmg'],
          Circlet: ['elementalMastery', 'critRate', 'critDmg'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (40% Resistance Shred & Swirl DMG)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team ATK Buff)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/venti-quickguide/',
      playstyleSummary:
        'Undisputed god of AoE crowd control. Wind Grand Ode creates an immense black hole that sucks in all light and medium enemies, infuses with an absorbed element, and refunds 15 flat energy to Venti and all party members of that element.',
      energyRequirements:
        '140% - 160% ER; his A4 Passive refunds 15 energy, lowering net Burst cost to 45.',
      combatTips: [
        'Wind Grand Ode pulls enemies into the vortex for 8 seconds. Melee characters may miss enemies suspended too high; pair with ranged carries (Ganyu, Ayato, Catalyst users).',
        'Stormeye passive restores 15 Energy to all party members of the elemental type absorbed by the vortex, serving as a team-wide battery.',
        'Full Elemental Mastery build (EM/EM/EM) deals enormous transformative Swirl damage in multi-target mobbing encounters with zero talent investment.',
      ],
      weapons: [
        {
          name: 'Elegy for the End',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Uncontested best support bow; procs Millennial Movement buff in seconds, giving 100 EM and 20% ATK',
        },
        {
          name: 'The Stringless',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Massive EM substat and up to +48% Skill and Burst DMG bonus',
        },
        {
          name: 'Aqua Simulacra',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'Highest personal damage ceiling for CRIT/ATK builds',
        },
        {
          name: 'Favonius Warbow',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: 'Free weapon from Archon Quest; ensures seamless burst uptime and batteries team',
        },
        {
          name: 'Windblume Ode',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Event bow providing EM and ATK% on skill cast',
        },
      ],
    },
  },
  {
    avatarId: 10000029,
    skillDepotId: 2901,
    referenceKey: 'Klee',
    displayName: 'Klee',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-klee'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'CrimsonWitchOfFlames',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Vaporize/Mono Pyro)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (with Furina)',
          },
          { referenceKey: 'Lavawalker', pieces: 4, tier: 1, label: 'Best in Slot (Mono Pyro)' },
          { referenceKey: 'ShimenawasReminiscence', pieces: 4, tier: 2, label: 'Alternative' },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'energyRecharge', 'atkPercent'],
        sets: [{ referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot' }],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/klee-quickguide/',
      playstyleSummary:
        'Explosive on-field Pyro hypercarry with staggering poise damage (stumbles even Lawachurls) and intense Pyro application, thriving especially in Mono Pyro or Furina forward-Vape teams.',
      energyRequirements:
        '120% - 140% ER; Sparking Burst passive grants 2 flat energy to entire team when Charged Attacks critically hit.',
      combatTips: [
        'Jump-canceling or dash-canceling Normal Attacks and Charged Attacks significantly speeds up her attack cadence and dodges incoming hits.',
        'Charged Attacks generate an explosive spark that tosses heavy enemies and breaks Geo shields effortlessly.',
        'C2 Explosive Frags decreases enemy DEF by 23% for 10s upon being hit by Jumpy Dumpty mines.',
        'Extremely high Pyro application overwhelms standard single Hydro enablers, making Mono Pyro (with Bennett, Xiangling, and Kazuha) her most consistent team.',
      ],
      weapons: [
        {
          name: 'Lost Prayer to the Sacred Winds',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Crit Rate and movement speed greatly improve Klee positioning and sustained damage',
        },
        {
          name: "Kagura's Verity",
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Crit DMG and skill damage stacks with Jumpy Dumpty charges',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Immense Crit DMG and potent burst windows',
        },
        {
          name: 'Solar Pearl',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'BP catalyst balancing Normal Attacks, Skills, and Bursts seamlessly',
        },
        {
          name: 'Dodoco Tales',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Signature thematic event weapon boosting Normal and Charged Attack synergy',
        },
      ],
    },
  },
  {
    avatarId: 10000003,
    skillDepotId: 301,
    referenceKey: 'Jean',
    displayName: 'Jean',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-jean'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['anemoDmg', 'atkPercent'],
          Circlet: ['healingBonus', 'critRate', 'atkPercent'],
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'critRate'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (40% Resistance Shred & Swirl)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team ATK Buff)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Healing & Foam DMG)',
          },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge'],
        sets: [{ referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot' }],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/jean-quickguide/',
      playstyleSummary:
        'Premier party-wide instant burst healer and 4pc VV shredder, enabling full Furina Fanfare stacking on day one and the famous Sunfire engine with Bennett.',
      energyRequirements:
        '160% - 190% with Favonius or Amenoma; 200%+ without ER weapon; A4 passive refunds 20% of energy on burst cast.',
      combatTips: [
        'Dandelion Breeze instantly restores high HP to all party members based on Jean ATK, instantly capping Furina Fanfare stacks.',
        'Sunfire interaction: Overlapping Jean Burst (self-applies Anemo) and Bennett Burst (self-applies Pyro) causes continuous self-swirling Pyro pulses that shred shields and apply rapid Pyro.',
        'Gale Blade (Hold E) can lift and fling small humanoid enemies into the air, dealing massive fall damage scaling with enemy max HP.',
      ],
      weapons: [
        {
          name: 'Freedom-Sworn',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Provides team ATK% and normal/charged attack DMG buffs upon triggering Swirl',
        },
        {
          name: 'Amenoma Kageuchi',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: 'Craftable sword that refunds massive flat energy after Burst cast',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Best utility weapon for battery duties and team energy generation',
        },
        {
          name: 'Skyward Blade',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High Base ATK for healing scaling and ER substat',
        },
        {
          name: 'Festering Desire',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'High Skill DMG bonus and ER substat',
        },
      ],
    },
  },
  {
    avatarId: 10000016,
    skillDepotId: 1601,
    referenceKey: 'Diluc',
    displayName: 'Diluc',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-diluc'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'CrimsonWitchOfFlames',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Full 3-stack Skill synergy)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (with Furina)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+35% Normal Attack)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Vaporize/Melt)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/diluc-quickguide/',
      playstyleSummary:
        'Consistent, steady Pyro on-field carry weaving Searing Onslaught skills between normal attacks to constantly Vaporize or Melt, or an explosive Plunging carry with Xianyun.',
      energyRequirements: '110% - 130% ER; 40-cost burst has near 100% Pyro infusion uptime.',
      combatTips: [
        'Crimson Witch of Flames 4pc was custom-tailored for Diluc: his 3-cast Skill (E-E-E) effortlessly reaches the maximum 3 stacks (+22.5% Pyro DMG and +15% Vape/Melt DMG).',
        'Weave normal attacks between skill casts (N1 -> E -> N1 -> E -> N1 -> E) to maintain continuous Hydro aura consumption from Xingqiu/Yelan.',
        'Dawn (Q) carries small enemies away; position to push them against walls or into existing AoE fields.',
        'With Xianyun and Furina, Plunge Diluc boasts one of the highest single-hit Melt/Vaporize multipliers in the entire game.',
      ],
      weapons: [
        {
          name: 'Redhorn Stonethresher',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: '88.2% Crit DMG with high Normal/Plunge attack scaling',
        },
        {
          name: 'Beacon of the Reed Sea',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Crit Rate, massive ATK bonus upon skill cast and taking damage',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Top 4-star claymore providing Crit Rate and up to 50% all-DMG bonus',
        },
        {
          name: "Wolf's Gravestone",
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'Thematic signature claymore providing massive raw ATK% to Diluc and team',
        },
        {
          name: 'Rainslasher',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            'High EM substat and +36% DMG bonus against enemies affected by Hydro or Pyro in Vaporize comps',
        },
        {
          name: 'Mailed Flower',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Event claymore offering EM and ATK% on elemental trigger',
        },
      ],
    },
  },
  {
    avatarId: 10000042,
    skillDepotId: 4201,
    referenceKey: 'Keqing',
    displayName: 'Keqing',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-keqing'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'ThunderingFury',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Skill Cooldown Reset & Aggravate)',
          },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 2, label: 'Alternative (Aggravate EM)' },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Electro)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/keqing/',
      playstyleSummary:
        'High-mobility, rapid-slashing Electro carry transformed by Dendro Aggravate into a high-tier quickswap driver. 4pc Thundering Fury resets her Skill cooldown on every Aggravate, enabling endless teleportation and slashing.',
      energyRequirements:
        '110% - 120% ER; 40-cost burst has +15% Crit Rate buff and refunds energy with A4 passive.',
      combatTips: [
        'Stellar Restoration (E) gives a 5s Electro infusion when double-tapped; do NOT use Charged Attack to detonate the stiletto if you want Electro infusion.',
        'Starward Sword (Q) grants Keqing +15% Crit Rate and +15% Energy Recharge for 8s via Aristocratic Dignity passive.',
        '4pc Thundering Fury is exceptionally strong in Quicken/Aggravate teams: reducing Skill cooldown by 1s every 0.8s allows virtually continuous Skill uptime and endless Fischl A4 triggers.',
      ],
      weapons: [
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Unmatched signature performance; Crit DMG and 3 stacks of Elemental DMG% maintained effortlessly',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: '44.1% Crit Rate with bonus ATK from HP',
        },
        {
          name: 'The Black Sword',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'BP sword with Crit Rate and Normal/Charged Attack damage bonus',
        },
        {
          name: "Lion's Roar",
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Up to 36% DMG bonus against enemies affected by Electro',
        },
        {
          name: 'Iron Sting',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Craftable sword with EM for Aggravate reaction scaling',
        },
      ],
    },
  },
  {
    avatarId: 10000041,
    skillDepotId: 4101,
    referenceKey: 'Mona',
    displayName: 'Mona',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-mona'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['hydroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Support Buffer)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Burst Nuke / ER Conversion)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Skill Taunt Buffer)',
          },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative (Team EM Buff)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent', 'elementalMastery'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'elementalMastery'],
        sets: [{ referenceKey: 'EmblemOfSeveredFate', pieces: 4, tier: 1, label: 'Best in Slot' }],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/mona-quickguide/',
      playstyleSummary:
        'Premier damage amplifier and Burst nuker. Stellaris Phantasm applies the Omen debuff, granting party members up to +60% all-DMG bonus against affected enemies, extendable significantly in Freeze teams (Morgana).',
      energyRequirements:
        '200% - 240% ER in Freeze and support teams; 160% - 180% with Raiden or Favonius battery.',
      combatTips: [
        'Omen buff extends as long as the Illusory Bubble does not pop. In Freeze teams, frozen enemies cannot trigger bubble rupture, extending the 60% DMG bonus duration up to 13 seconds.',
        'Vaporize Nuke rotation: Apply Pyro -> Mona Burst (clears Pyro and applies bubble) -> wait 2 seconds for ICD -> apply Pyro (pops bubble with massive 2x Vaporize multiplier).',
        'Can equip Thrilling Tales of Dragon Slayers or Prototype Amber to serve as an ATK buffer or teamwide healer.',
      ],
      weapons: [
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 1,
          category: 'Utility',
          notes:
            'Stacks 48% ATK buff on top of Mona 60% Omen DMG bonus for staggering team burst windows',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Critical for hitting high ER requirements and batterying Cryo/Hydro teammates',
        },
        {
          name: 'Prototype Amber',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Enables Mona to fulfill the healer role in Furina or Freeze teams while providing flat energy',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Massive Crit DMG and huge song buffs for personal Vaporize nukes',
        },
      ],
    },
  },
  {
    avatarId: 10000035,
    skillDepotId: 3501,
    referenceKey: 'Qiqi',
    displayName: 'Qiqi',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-qiqi'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['atkPercent'],
          Circlet: ['healingBonus', 'atkPercent', 'critRate'],
        },
        priorityStats: ['atkPercent', 'energyRecharge', 'critRate'],
        sets: [
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Transforms Overhealing into 30k Physical Sea-Dyed Foam Pops)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Skill Orb Buffer)',
          },
          {
            referenceKey: 'MaidenBeloved',
            pieces: 4,
            tier: 3,
            label: 'Transitional (Pure Healing)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['physicalDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent'],
        sets: [
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot' },
          { referenceKey: 'PaleFlame', pieces: 4, tier: 2, label: 'Alternative (Physical)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/qiqi-quickguide/',
      playstyleSummary:
        'Pure ATK-scaling continuous healer. Fortune-Preserving Talismans heal active characters whenever they strike marked targets. With 4pc Ocean-Hued Clam, her excessive overhealing converts into max-cap 30,000 Physical damage bubble explosions every 3.5 seconds.',
      energyRequirements:
        '180% - 220% ER if relying on Burst; Qiqi produces ZERO particles on Skill cast, making Sacrificial Sword or Favonius Sword mandatory.',
      combatTips: [
        'Skill Herald of Frost does NOT generate any elemental particles. Sacrificial Sword (R3+) resets its 30s cooldown and provides 100% healing uptime.',
        'A4 Passive (A Stroll Through Fortune) marks enemies with a Fortune-Preserving Talisman on Normal Attacks, granting instant healing without spending energy.',
        'In Superconduct teams (with Electro), 4pc Ocean-Hued Clam reaches its 30,000 bubble cap effortlessly, turning Qiqi into a consistent off-field physical damage contributor.',
      ],
      weapons: [
        {
          name: 'Sacrificial Sword',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            'Uncontested best weapon for Qiqi; resets the massive 30s Skill cooldown for 100% healing uptime',
        },
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Essential particle battery for the entire party',
        },
        {
          name: 'Aquila Favonia',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'Massive 674 Base ATK boosts healing and physical damage output',
        },
        {
          name: 'Skyward Blade',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High Base ATK and ER substat',
        },
        {
          name: 'Amenoma Kageuchi',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Craftable sword that refunds flat energy on Burst',
        },
      ],
    },
  },
];
