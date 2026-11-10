import type { ReviewedCharacterProfile } from './identity';

export const v30Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000069,
    skillDepotId: 6901,
    referenceKey: 'Tighnari',
    displayName: 'Tighnari',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-tighnari-info', 'kqm-tighnari-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['elementalMastery', 'atkPercent'],
          Goblet: ['dendroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'WanderersTroupe',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+80 EM, +35% Charged Attack DMG unconditionally)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: "Best in Slot (+80 EM, high EM/ATK stacking with Hunter's Path)",
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot if no other party holder (-30% Dendro RES Shred)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Dendro DMG)',
          },
          {
            referenceKey: 'WanderersTroupe',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/tighnari-quickguide/',
      playstyleSummary:
        "Premier 5-star single-target Dendro quickswap carry and Spread specialist. Vijnana-Khanda (Skill) creates a Vijnana-Khanda field that taunts and confuses enemies while granting Vijnana Suffusion, reducing the charge time of his next three Wreath Arrows by 2.4 seconds (rendering them virtually instantaneous). Each Wreath Arrow splits into 4 homing Clusterbloom Arrows upon hit. Fashioner's Tanglevine Shaft (Burst) fires 6 homing Tanglevine Shafts that split into secondary waves, delivering massive burst damage with a low 40 energy cost.",
      energyRequirements:
        'Low 40 Energy Burst cost. 2 Skills per Burst: 100%–110% ER. 1 Skill per Burst in Double Dendro: 130%–140% ER. 1 Skill per Burst in Solo Dendro: 150%–160% ER. A teammate Favonius proc reduces requirements by ~10%.',
      combatTips: [
        'Vijnana Suffusion Fast Charge: Skill provides 3 instant Wreath Arrow charges. Never charge arrows without Suffusion active unless finishing an enemy.',
        'Clusterbloom & Spread ICD: Wreath Arrows and Clusterblooms share ICD rules, allowing up to 2 Spread reactions per Charged Shot (one from the main arrow, one from the 4 sub-arrows).',
        'A1 EM Buff (Keen Sight): Firing a Wreath Arrow grants Tighnari 50 Elemental Mastery for 4 seconds, continuously refreshing throughout his 3-shot combo.',
        'A4 EM-to-DMG Conversion (Scholarly Blade): Every point of EM increases his Charged Attack and Burst damage by 0.06% (capped at +48% at 800 EM), making EM sands and substats equally valuable to ATK% and Crit.',
        'Quickswap Rotation Flow: E -> Q -> 3x Charged Shots (CA CA CA). Casting Burst immediately after Skill ensures buffs like A1 are active while leaving 3 instant charges ready.',
      ],
      weapons: [
        {
          name: "Hunter's Path",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature bow and uncontested BiS. 44.1% Crit Rate, +12% All Elemental DMG, and converts 160% of EM into flat Charged Attack damage.',
        },
        {
          name: 'The First Great Magic',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% Crit DMG stat stick that unconditionally boosts Charged Attack damage by 16% and provides team ATK% stacks.',
        },
        {
          name: 'Aqua Simulacra',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% Crit DMG with +20% unconditional All DMG Bonus when near enemies; top-tier generalist option.',
        },
        {
          name: 'Polar Star',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '33.1% Crit Rate; fire a quick Normal Attack upon entering the field to easily build 4 Ashen Nightstar stacks.',
        },
        {
          name: 'Slingshot',
          tier: 1,
          rarity: 3,
          category: 'BiS',
          notes:
            'Incredible 3★ F2P option. 31.2% Crit Rate and +60% Normal/Charged Attack DMG Bonus within 0.3s; rivals non-signature 5★ bows when paired with external ATK/EM buffs!',
        },
        {
          name: 'Scion of the Blazing Sun',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle pass bow offering 18.4% Crit Rate and Sunfire Arrow procs that increase Charged Attack damage taken by 28%.',
        },
        {
          name: 'Ibis Piercer',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Event 4★ bow providing 27.6% ATK and stacking up to 160 EM upon landing Charged Attacks.',
        },
        {
          name: 'Song of Stillness',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine craftable bow with 41.3% ATK that grants up to +32% All DMG Bonus upon receiving healing.',
        },
        {
          name: 'Prototype Crescent',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable bow granting +36% to +72% ATK and movement speed when hitting weak points.',
        },
      ],
    },
  },
  {
    avatarId: 10000067,
    skillDepotId: 6701,
    referenceKey: 'Collei',
    displayName: 'Collei',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-collei-info', 'kqm-collei-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['dendroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'reaction_context' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Uncontested Best in Slot for Team Damage (-30% Dendro RES Shred)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Alternative Buffer (+20% Team ATK on Burst if another Deepwood exists)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative Team Buffer (+120 EM to party on reaction)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 2,
            label: 'Alternative Sub-DPS (+70% Skill Boomerang DMG off-field)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Dendro DMG)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/collei-quickguide/',
      playstyleSummary:
        'Premier 4-star off-field Dendro applicator, support buffer, and Nilou Bloom enabler. Floral Brush throws a flying leaf boomerang that slices through enemies twice, while her A1 passive generates the Sprout aura around the active character upon triggering Dendro reactions. Trump-Card Kitty deploys Cuilein-Anbar in an expanding zone that continuously bounces to deal AoE Dendro damage and trigger rapid Bloom or Quicken reactions.',
      energyRequirements:
        '60 Energy Burst cost. Solo Dendro: 200%–220% ER with Favonius Warbow (~220%–240% without). Double Dendro: 160%–180% ER with Favonius (~180%–200% without). In Nilou Bloom with Sacrificial Bow: 150%–170% ER.',
      combatTips: [
        'Sprout Aura (A1 Floral Sidewinder): If party members trigger Dendro reactions before the Floral Ring boomerang returns, Collei gains the Sprout effect, dealing continuous Dendro damage equal to 40% ATK around the active character for 3 seconds.',
        'Burst Zone Extension (A4): When an active character triggers Dendro reactions inside the Cuilein-Anbar zone, the field duration is extended by 1s (up to 3 times, extending duration from 6s to 9s).',
        'Constellation 2 (Sprout Improvement): Sets Sprout duration to 3s upon return unconditionally, and extends it by an additional 3s if reactions occur, ensuring persistent close-range Dendro aura.',
        'Fast Frontloaded Casts: Cast E -> Q rapidly. The boomerang animation allows immediate character switching while leaving off-field Dendro application intact.',
      ],
      weapons: [
        {
          name: 'Elegy for the End',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Undisputed best-in-slot weapon. 55.1% ER secondary stat satisfies energy needs, while its passive effortlessly procs via Cuilein-Anbar to buff the party with +100 EM and +20% ATK.',
        },
        {
          name: 'Favonius Warbow',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Top F2P weapon. 61.3% ER and partywide clear particle generation dramatically reduces energy requirements for Collei and the whole team.',
        },
        {
          name: 'The Stringless',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            '165 EM sub-stat with +24% to +48% Skill and Burst DMG Bonus; top offensive choice in Double Dendro teams where ER is handled.',
        },
        {
          name: 'Sacrificial Bow',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            '30.6% ER with Skill cooldown reset; provides double boomerang particle generation and extra frontloaded Dendro application in Nilou Bloom.',
        },
        {
          name: 'Fading Twilight',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes: 'Event 4★ bow providing 30.6% ER and cycling DMG bonuses from 12% to 28%.',
        },
      ],
    },
  },
  {
    avatarId: 10000068,
    skillDepotId: 6801,
    referenceKey: 'Dori',
    displayName: 'Dori',
    defaultRoleId: 'healing_support',
    evidenceIds: [
      'kqm-dori-dps-info',
      'kqm-dori-hyperbloom-info',
      'kqm-dori-support-info',
      'kqm-dori-guide',
    ],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['healingBonus', 'hpPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'maxHp', 'critRate'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Support (+20% Team ATK on Burst)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Healing & Clam Foam Damage (+15% Healing Bonus)',
          },
          {
            referenceKey: 'SongOfDaysPast',
            pieces: 4,
            tier: 1,
            label: 'Supportive Alternative (converts continuous healing into flat base DMG)',
          },
          {
            referenceKey: 'TheExile',
            pieces: 4,
            tier: 2,
            label: 'Supportive Battery (+6 flat Energy to party members upon Burst)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Healing Bonus)',
          },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['burst'],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'maxHp'],
        sets: [
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot for Hyperbloom Damage (+80 EM, up to +140% Hyperbloom DMG)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative (+80 EM, high EM stacking)',
          },
          {
            referenceKey: 'WanderersTroupe',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 EM)',
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
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'ThunderingFury',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Aggravate (+15% Electro DMG, +20% Aggravate DMG, -1s Skill CD on reactions)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Alternative Aggravate DPS (+80 EM, ATK/EM scaling)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/dori-quickguide/',
      playstyleSummary:
        "Versatile 4-star Electro healer, flat energy battery, and multi-archetype driver. Alcazarzaray's Exactitude (Burst) summons a Jinni that tethers directly to the active character, continuously restoring HP based on Dori's Max HP and regenerating up to 2.5 flat energy per pulse. The connector line between character and Jinni deals continuous Electro damage, serving as a lethal Hyperbloom trigger or self-infusing Electro for Jean Sunfire-style reactions. At C6, using Skill infuses her attacks with Electro, transforming her into an active driver.",
      energyRequirements:
        "High 80 Energy Burst cost. Support (with Favonius): 180%–220% ER in Solo Electro; 140%–160% in Double Electro. Without Favonius: 210%–260% in Solo Electro; 160%–180% in Double Electro. Having Raiden or Fischl reduces requirements by 30%–60%. A4 passive restores flat energy when Skill hits opponents based on Dori's ER.",
      combatTips: [
        'Jinni Connector Line Positioning: The visual tether connecting the Jinni to the active character deals Electro DMG to any enemy crossing it. Position yourself so enemies stand between you and the Jinni to trigger continuous Hyperblooms or Aggravates!',
        'Flat Energy Battery: The Jinni generates up to 2.5 flat energy per tick for whichever active character is tethered, making Dori an exceptional battery for energy-hungry carries (e.g. Xiao, Eula, Itto).',
        'Self-Electro Infusion: The Jinni continuously applies Electro to the active character, allowing you to cleanse elements (e.g. Hydro slowing water, Cryo stamina drain) and trigger Swirls via Anemo abilities (Jean, Kazuha).',
        'A4 Energy Refund (Compound Interest): Landing Troubleshooter Shots restores 5 flat energy per 100% ER Dori possesses (up to 15 energy at 300% ER), drastically easing her own burst upkeep.',
        'C6 Electro Infusion Driver: C6 grants 3 seconds of Electro weapon infusion after casting Skill and heals the entire party by 4% of Max HP on Normal Attack hits, unlocking an active on-field Aggravate driver playstyle.',
      ],
      weapons: [
        {
          name: 'Favonius Greatsword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            "Undisputed best support claymore. 61.3% ER and neutral energy particle generation solves both Dori's 80-cost Burst and the entire party's energy needs.",
        },
        {
          name: 'Sacrificial Greatsword',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            '30.6% ER and Skill reset provides double particle generation and triggers A4 energy restoration twice.',
        },
        {
          name: 'Forest Regalia',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Craftable Sumeru claymore providing 30.6% ER and spawning a Leaf of Consciousness on Dendro reactions that grants party members +60 to +120 EM.',
        },
        {
          name: 'Katsuragikiri Nagamasa',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable Inazuma claymore providing 45.9% ER and flat energy refund on Skill hits; excellent for pure Burst reliability.',
        },
        {
          name: 'Bloodtainted Greatsword',
          tier: 1,
          rarity: 3,
          category: 'BiS',
          notes:
            'Uncontested 3★ BiS for Hyperbloom. 187 EM secondary stat is the highest EM among claymores, maximizing transformative reaction damage.',
        },
        {
          name: 'Rainslasher',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '165 EM secondary stat with passive increasing damage against enemies affected by Hydro or Electro; premier 4★ Hyperbloom claymore.',
        },
        {
          name: 'Makhaira Aquamarine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            "165 EM sub-stat that converts Dori's stacked EM into flat ATK buffs for herself and the entire party.",
        },
        {
          name: 'Redhorn Stonethresher',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% Crit DMG with Normal Attack flat damage buffs; top offensive weapon for C6 on-field Aggravate Dori.',
        },
        {
          name: 'Serpent Spine',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle pass claymore offering 27.6% Crit Rate and up to +50% All DMG Bonus; top 4★ pick for on-field Aggravate builds.',
        },
      ],
    },
  },
  {
    avatarId: 10000005,
    skillDepotId: 508,
    referenceKey: 'TravelerDendro',
    displayName: 'Dendro Traveler',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-dendro-traveler'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery'],
          Goblet: ['dendroDmg'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'favonius_proc' },
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'elementalMastery', 'atkPercent'],
        sets: [
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Uncontested Best in Slot (-30% Dendro RES Shred for Bloom/Hyperbloom/Spread)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Supportive Alternative (+20% Team ATK on Burst)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Alternative Personal Damage (+20% ER, up to +75% Burst DMG)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative Team Buffer (+120 EM to party upon triggering reaction)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Dendro DMG)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/dendro-traveler-quickguide/',
      playstyleSummary:
        'Premier F2P off-field Dendro enabler and reaction centerpiece throughout the Sumeru era. Razorgrass Blade (Skill) unleashes a forward spray of sharp leaves dealing instant Dendro damage and generating 2.5–3.5 Dendro particles. Surgent Manifestation (Burst) creates a long-lasting Lea Lotus Lamp that continuously attacks enemies in a wide AoE, infusing with Hydro (larger AoE) or Electro (faster attack speed) to power Nilou Bloom, Hyperbloom, Burgeon, and Quicken team compositions.',
      energyRequirements:
        'High 80 Energy Burst cost. 2 Skills per rotation (Solo Dendro): 200%–250% ER (250%–300% with 1 Skill). 2 Skills in Double Dendro: 160%–200% ER (200%–250% in Nilou Bloom). 2 Skills in Double Electro: 190%–230% ER. Each teammate Favonius proc reduces requirements by 10%–30%.',
      combatTips: [
        'Lotuslight Transfiguration Rules: The Lea Lotus Lamp can undergo only ONE transfiguration: Hydro expands its attack AoE and radius; Electro increases attack speed; Pyro detonates the Lamp immediately, causing it to explode and vanish! Always touch the Lamp with Hydro or Electro BEFORE introducing Pyro in Burgeon teams!',
        "A1 EM Ramp (Verdant Overgrowth): The Lamp gains 1 stack of Overflowing Lotuslight every second, buffing the active character's Elemental Mastery by 6 per stack (up to +60 EM at 10 stacks).",
        'A4 EM Conversion (Verdant Luxury): Every point of EM increases Razorgrass Blade DMG by 0.15% and Surgent Manifestation DMG by 0.1%.',
        'Particle Catching Technique: Cast Skill and perform 1–2 Normal Attacks while waiting to catch the Dendro particles on Traveler before swapping off to minimize team energy requirements.',
        'Constellation 1 Energy Refund: When Razorgrass Blade hits an opponent, Traveler regenerates 3.5 flat energy, easing rotation energy pressure.',
      ],
      weapons: [
        {
          name: 'Favonius Sword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            "Undisputed best weapon. 61.3% ER secondary stat and neutral white particle generation resolves both Traveler's steep 80-cost Burst and the entire party's energy needs.",
        },
        {
          name: 'Freedom-Sworn',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '198 EM sub-stat amplifies transformative reactions and A4 passive, while triggering Millennial Movement to buff party ATK by 20% and Normal/Charged Attack DMG by 16%.',
        },
        {
          name: 'Sacrificial Sword',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            '61.3% ER and Skill reset allows back-to-back Razorgrass Blade casts, generating up to 6–7 Dendro particles and 7 flat energy via C1.',
        },
        {
          name: 'Sapwood Blade',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Sumeru sword providing 30.6% ER and spawning a Leaf of Consciousness on Dendro reactions that grants the active character +60 to +120 EM.',
        },
        {
          name: "Xiphos' Moonlight",
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            '165 EM sub-stat converts stacked EM into Energy Recharge for Traveler and the entire team.',
        },
        {
          name: 'Skyward Blade',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '55.1% ER secondary stat with high base ATK; excellent high-ER stat stick.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine fishing sword offering 45.9% ER, +16% Skill Crit Rate, and +32% ER for 5s after casting Skill.',
        },
      ],
    },
  },
];
