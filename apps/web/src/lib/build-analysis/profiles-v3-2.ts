import type { ReviewedCharacterProfile } from './identity';

export const v32Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000073,
    skillDepotId: 7301,
    referenceKey: 'Nahida',
    displayName: 'Nahida',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-nahida', 'kqm-nahida-info', 'kqm-nahida-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery', 'dendroDmg'],
          Circlet: ['elementalMastery', 'critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (-30% Dendro RES shred with 100% uptime teamwide)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 1,
            label: 'BiS Personal Damage (+70% Skill DMG if teammate holds Deepwood)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Competitive Alternative (+80 EM, high EM/ATK stacking on reaction)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label: 'Team Buffer (+12% Elemental DMG bonus on Dendro reactions)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Dendro DMG)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 EM)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        talentPriorityGroups: [['skill'], ['burst'], ['normal']],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['dendroDmg', 'elementalMastery'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        conditionalMainStats: {
          Goblet: {
            dendroDmg: 'reaction_context',
          },
          Circlet: {
            critRate: 'reaction_context',
          },
        },
        priorityStats: ['elementalMastery', 'critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (-30% Dendro RES shred)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'On-Field Carry BiS (+80 EM, high ATK & EM buffs)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'On-Field BiS with Furina (+36% Crit Rate)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Dendro DMG)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/nahida-quickguide/',
      playstyleSummary:
        'The premier 5-star Dendro Archon and universal Dendro cornerstone. All Schemes to Know (Skill) marks up to 8 enemies with the Seed of Skandha for 25 seconds, unleashing Tri-Karma Purification whenever an elemental reaction is triggered or enemies take Bloom damage (1.5U Dendro application, 2.5s base interval). Illusory Heart (Burst) erects the massive Shrine of Maya (50 Energy cost, 15s duration, 13.5s cooldown—100% natural uptime), conferring major party buffs based on elemental types: Pyro increases Tri-Karma DMG, Electro reduces Tri-Karma interval (down to ~1.8s), and Hydro extends Shrine duration.',
      energyRequirements:
        'Low 50 Energy Burst cost with 13.5s CD and 15s duration (100% natural uptime). In Double Electro: 100%–120% ER; Double Dendro: 120%–140% ER (off-field) or 110%–130% ER (on-field); Nilou Bloom (solo Dendro): 120%–140% ER; Hyperbloom: 130%–140% (off-field) or 100%–120% (on-field); Burgeon: 140%–160% ER. Teammate Favonius procs reduce requirements by 10%–15%.',
      combatTips: [
        'Tri-Karma Purification Mechanics: Triggers 1.5U of Dendro application every time an elemental reaction occurs on marked targets (or Bloom DMG is taken), with a 2.5s base interval (reduced by Electro in Burst). This 1.5U gauge is exceptionally robust, easily sustaining Burning, Quicken, or Bloom auras across multiple enemies.',
        'A1 Party EM Share (Compassion Illuminated): While inside the Shrine of Maya, the active character gains Elemental Mastery equal to 25% of the party member with the highest EM (up to +250 EM at 1,000 EM).',
        'A4 Dual Scaling Cap (Awakening Elucidated): Each point of Nahida’s EM beyond 200 grants +0.1% DMG Bonus and +0.03% Crit Rate to Tri-Karma Purification (capped at +80% DMG Bonus and +24% Crit Rate at 1,000 EM). Thus, building up to 1,000 EM maximizes both A1 and A4.',
        '1,000 EM Rule of Thumb: If Nahida is off-field and the sole high-EM unit, aim for 900–1,000 EM to maximize A1. If she is on-field or an ally already has 1,000 EM (e.g. Kuki, Raiden, or Nilou), Nahida gains up to +250 EM from A1, allowing her to build ~750–800 EM and prioritize Dendro DMG / Crit stats.',
        'Hold-Skill Remote Sniping: Holding Skill enters viewfinder targeting mode that sweeps across multiple spread-out enemies instantly, marking them up to 8 targets from great range.',
      ],
      weapons: [
        {
          name: 'A Thousand Floating Dreams',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature weapon. 265 EM substat; grants party +40 EM and gives Nahida +32 EM or +30% Dendro DMG depending on teammate elements.',
        },
        {
          name: "Kagura's Verity",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '66.2% Crit DMG; provides up to +36% Skill DMG and +12% all-Elemental DMG; exceptional for on-field and off-field spread DPS.',
        },
        {
          name: 'Wandering Evenstar',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '165 EM secondary stat; converts 24%–48% of Nahida’s EM into personal flat ATK and shares 30% of that bonus to all party members.',
        },
        {
          name: 'Sacrificial Fragments',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes: 'Massive 221 EM secondary stat; outstanding high-EM stat stick.',
        },
        {
          name: 'Magic Guide',
          tier: 1,
          rarity: 3,
          category: 'F2P',
          notes:
            '187 EM secondary stat; passive increases DMG against opponents affected by Hydro or Electro by 24% at R5; performs surprisingly close to 5-star options in Quicken and Bloom.',
        },
        {
          name: 'The Widsith',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '55.1% Crit DMG; 2 of the 3 song buffs (ATK% and EM) grant gargantuan burst damage.',
        },
        {
          name: 'Favonius Codex',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Solves teamwide energy constraints with white particle generation (best on on-field Nahida who can easily Crit).',
        },
        {
          name: 'Hakushin Ring',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable weapon with 30.6% ER; grants up to +20% Electro & Dendro DMG bonus on Quicken/Aggravate reactions.',
        },
        {
          name: 'Solar Pearl',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '27.6% Crit Rate; buffs Normal Attack and Skill damage alternatively in on-field setups.',
        },
        {
          name: 'Prototype Amber',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'HP% substat; grants teamwide healing and flat energy refund, allowing Nahida to consolidate defensive healing in Furina teams.',
        },
      ],
    },
  },
  {
    avatarId: 10000074,
    skillDepotId: 7401,
    referenceKey: 'Layla',
    displayName: 'Layla',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-layla-dps-info', 'kqm-layla-shielder-info', 'kqm-layla-guide'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: {
            critRate: 'favonius_proc',
          },
        },
        priorityStats: ['maxHp', 'energyRecharge', 'critRate'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% HP, +30% Shield Strength, and 100% uptime on +20% party ATK)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% party ATK on Burst cast)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Team Buffer (+120 team EM upon on-field reaction)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['cryoDmg', 'hpPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: {
            energyRecharge: 'team_buffs',
          },
        },
        priorityStats: ['maxHp', 'critRate', 'critDmg', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% HP, +20% Team ATK)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 1,
            label: 'Freeze/Mono Cryo BiS (+15% Cryo DMG, up to +40% Crit Rate)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% ER, high Burst DMG bonus)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 2,
            label: 'Off-Field Skill BiS (+70% Shooting Star DMG)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Cryo DMG)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/layla-quickguide/',
      playstyleSummary:
        '4-star Cryo shielder and off-field sub-DPS with near 100% shield uptime. Nights of Formal Focus (Skill) creates a Curtain of Slumber shield scaling with Max HP (12s duration, 12s cooldown). While active, the shield generates Night Stars every 1.5s, or when active characters cast an Elemental Skill (2 stars). At 4 stars, they transform into homing Shooting Stars that strike opponents, dealing Cryo damage based on Max HP and generating 1–2 Cryo particles. Dream of the Star-Stream Shaker (Burst, 40 Energy cost, 12s duration, 12s cooldown) suspends a Celestial Dreamsphere firing Starlight Slugs continuously.',
      energyRequirements:
        'Low 40 Energy Burst cost with 12s cooldown matching duration. In Mono Cryo or with Favonius: 100%–120% ER; with Cryo Battery (e.g. Diona/Rosaria): 110%–130% ER; Solo Cryo without Favonius: 130%–150% ER. Highly manageable, often satisfied passively through substats.',
      combatTips: [
        '100% Tenacity of the Millelith Uptime: Because Shooting Stars fire in waves while Layla is off-field, each hit refreshes 4pc Tenacity’s 3-second duration, maintaining continuous +20% team ATK and +30% shield strength throughout combat.',
        'A1 Shield Ramp (Like Nascent Light): While the Curtain of Slumber is active, each time a Night Star is gained, it activates the Deep Sleep effect: +6% Shield Strength, stacking up to 4 times (+24% Shield Strength total).',
        'A4 HP Scaling (Sweet Slumber Undisturbed): Increases the damage dealt by Shooting Stars by 1.5% of Layla’s Max HP, allowing full-HP shielder builds to simultaneously deal respectable off-field damage.',
        'Constellation 4 (Starry Illumination): When Shooting Stars begin firing, active party members gain a buff increasing Normal and Charged Attack DMG by 5% of Layla’s Max HP for 3 seconds.',
        'Favonius Proc Optimization: Execute N1 -> Q -> E when deploying Layla. The initial Normal Attack buffers her on-field Crit window so the first Starlight Slug from Burst and the Skill shield impact can both trigger Favonius particles before swapping off.',
      ],
      weapons: [
        {
          name: 'Key of Khaj-Nisut',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Massive 66.2% HP substat and +20% HP passive; provides by far the thickest shield absorption in the game for Layla.',
        },
        {
          name: "The Dockhand's Assistant",
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '41.3% HP secondary stat; the only 4-star sword with an HP% stat, making it her premier 4-star shielder weapon.',
        },
        {
          name: 'Favonius Sword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '61.3% ER and neutral energy particle generation; alleviates entire party energy constraints and guarantees 100% Burst uptime.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High 44.1% Crit Rate and +20% Max HP passive; top weapon for hybrid damage and shielding.',
        },
        {
          name: 'Freedom-Sworn',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Provides party-wide ATK% and Normal/Charged Attack buffs in reaction teams like Vapemelt.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '45.9% ER and +16% Skill Crit Rate; helps meet ER needs and proc Favonius-like consistency.',
        },
        {
          name: 'Sacrificial Sword',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '61.3% ER; resets Skill cooldown if her shield is prematurely broken by heavy enemy attacks.',
        },
        {
          name: 'Harbinger of Dawn',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            '3-star weapon offering +28% Crit Rate and 46.9% Crit DMG when HP > 90%; Layla easily maintains the passive behind her strong shield.',
        },
      ],
    },
  },
];
