import type { ReviewedCharacterProfile } from './identity';

export const v21Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000052,
    skillDepotId: 5201,
    referenceKey: 'RaidenShogun',
    displayName: 'Raiden Shogun',
    defaultRoleId: 'on_field_damage',
    evidenceIds: [
      'kqm-raiden-onfield',
      'kqm-raiden-hyperbloom',
      'kqm-raiden-aggravate',
      'kqm-raiden-guide',
    ],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['electroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% ER and converts ER to Burst DMG up to +75%)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label: 'Alternative with Furina (+36% Crit Rate from HP fluctuations)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative in Aggravate / Quickbloom teams',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill'],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+80 EM and up to +140% Hyperbloom reaction DMG)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+80 EM and up to +150 EM party reaction buff)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc EM (+80 EM)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc EM (+80 EM)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['electroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% ER and maximises Burst personal damage and battery)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative Support (Skill procs provide continuous +20% team ATK)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/raiden-quickguide/',
      playstyleSummary:
        'Supreme on-field Burst carry, universal energy battery, and coordinated Electro sub-DPS or premier off-field Hyperbloom trigger. In her signature Burst carry role, Raiden unleashes Musou Shinsetsu dealing colossal upfront Electro damage amplified by party Resolve stacks, followed by 7 seconds of Electro-infused Musou Isshin strikes that refund substantial flat Energy to the entire party. In Hyperbloom teams, she triggers Dendro cores with 100% uptime from off-field via Eye of Stormy Judgment.',
      energyRequirements:
        '200%–250% ER for standard Burst rotations; up to 270% when equipping Engulfing Lightning to optimize ER-to-ATK conversion and A4 passive scaling. In Hyperbloom teams, ER is irrelevant as she relies solely on her Skill.',
      combatTips: [
        'Musou Isshin converted attacks scale strictly from Elemental Burst talent multipliers, NOT Normal Attack talent levels. Leave her Normal Attack talent at Level 1.',
        "Chakra Desiderata accumulates Resolve stacks whenever party members cast their Bursts (0.15–0.3 stacks per Energy consumed). Always execute all teammate Bursts prior to unleashing Raiden's Burst for maximum damage.",
        'A4 Passive (Enlightened One): For each 1% ER above 100%, Raiden gains +0.4% Electro DMG Bonus and +0.6% greater Energy restoration from Musou Isshin hits.',
        'During Musou Isshin, Raiden possesses complete interruption immunity and is unaffected by Electro-Charged reaction self-damage.',
        'For Hyperbloom trigger setups, level Raiden to 90 as transformative reaction damage scales directly with character level and Elemental Mastery (aim for 900–1000+ EM).',
      ],
      weapons: [
        {
          name: 'Engulfing Lightning',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature weapon and undisputed BiS for on-field Burst DPS. Converts ER above 100% into ATK% and grants +30%–50% ER upon Burst cast, perfectly harmonizing with Emblem of Severed Fate and A4 passive.',
        },
        {
          name: 'The Catch',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Outstanding free-to-play weapon obtainable through fishing. At R5, provides 45.9% ER, +32% Burst DMG Bonus, and +12% Burst Crit Rate, rivalling many 5-star polearms.',
        },
        {
          name: 'Staff of the Scarlet Sands',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Top-tier offensive 5-star option with 44.1% Crit Rate. Exceptionally powerful in Aggravate, Quickbloom, or Bennett teams where EM buffs are converted into bonus ATK.',
        },
        {
          name: 'Staff of Homa',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Substantial 66.2% Crit DMG substat with unconditional HP-to-ATK conversion. Highly competitive when ER requirements are met through artifacts.',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High 674 Base ATK and Crit Rate substat. Raiden quickly stacks its on-hit ATK% and DMG% passive during her initial Musou Isshin combo.',
        },
        {
          name: "Dragon's Bane",
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed Best in Slot for Hyperbloom trigger role. Provides a massive 221 Elemental Mastery substat with zero refinement requirement.',
        },
        {
          name: 'Skyward Spine',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High Base ATK, 36.8% ER substat, +8% Crit Rate, and +12% Normal Attack Speed which enables smoother N3D/N4D Burst attack strings.',
        },
        {
          name: 'Ballad of the Fjords',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass polearm with high Crit Rate and up to +240 EM passive in multi-element teams, excelling in Aggravate and Quickbloom.',
        },
        {
          name: "Wavebreaker's Fin",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'High Base ATK polearm that scales Burst DMG% based on total party Burst energy costs, particularly devastating at R3–R5 in high-energy teams.',
        },
        {
          name: 'Deathmatch',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Solid stat stick providing 36.8% Crit Rate and bonus ATK% depending on opponent count.',
        },
        {
          name: 'Moonpiercer',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable EM polearm for Hyperbloom/Aggravate that spawns a Leaf of Revival granting +16%–32% ATK to a party member.',
        },
        {
          name: 'Kitain Cross Spear',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable EM polearm with flat Energy refund on Skill hit, helpful for hybrid builds or comfortable Burst rotations.',
        },
        {
          name: 'Favonius Lance',
          tier: 3,
          rarity: 4,
          category: 'Utility',
          notes:
            "Provides high ER and generates neutral energy particles for the whole team, but substantially lowers Raiden's personal damage.",
        },
      ],
    },
  },
  {
    avatarId: 10000054,
    skillDepotId: 5401,
    referenceKey: 'SangonomiyaKokomi',
    displayName: 'Sangonomiya Kokomi',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-kokomi'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hydroDmg', 'hpPercent'],
          Circlet: ['healingBonus'],
        },
        priorityStats: ['energyRecharge', 'hpPercent', 'maxHp', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot for Healing & Sub-DPS (Sea-Dyed Foam deals up to ~30k physical AOE damage)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Off-Field Team Support (Bake-Kurage ticks guarantee 100% uptime on +20% ATK)',
          },
          {
            referenceKey: 'SongOfDaysPast',
            pieces: 4,
            tier: 2,
            label: 'Alternative Support (Converts healing into flat damage addition)',
          },
          {
            referenceKey: 'MaidenBeloved',
            pieces: 4,
            tier: 2,
            label: 'Alternative Maximum Healing (+15% Healing Bonus and +20% incoming heals)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative Support (+120 Team EM on Elemental Reaction)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hydroDmg', 'hpPercent'],
          Circlet: ['healingBonus'],
        },
        priorityStats: ['energyRecharge', 'hpPercent', 'maxHp', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot for On-Field Driver & Teamwide Healing',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+15% Hydro DMG and +30% Normal/Charged Attack DMG)',
          },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['elementalMastery', 'hpPercent'],
          Goblet: ['elementalMastery', 'hpPercent'],
          Circlet: ['elementalMastery', 'healingBonus'],
        },
        priorityStats: ['elementalMastery', 'hpPercent', 'energyRecharge', 'maxHp'],
        sets: [
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Bloom Reaction DMG (+80 EM and up to +140% Bloom DMG)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot EM Stacking (+80 EM and +150 EM party reaction buff)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 2,
            label: 'Alternative Bloom & Healing Hybrid',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent', 'hydroDmg'],
          Circlet: ['healingBonus'],
        },
        priorityStats: ['energyRecharge', 'hpPercent', 'maxHp'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Buffer (100% uptime on team +20% ATK from Bake-Kurage)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative Team EM Buffer (+120 Team EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/kokomi-quickguide/',
      playstyleSummary:
        "Premier Hydro healer, off-field AoE applicator, and on-field reaction enabler/driver. Kokomi summons Bake-Kurage providing continuous Hydro application and high-potency periodic healing. Through Nereid's Ascension (Burst), she refreshes Bake-Kurage's uptime and gains Ceremonial Garment, boosting all Normal Attacks, Charged Attacks, and jellyfish DMG based on her Max HP while healing the entire party on hit.",
      energyRequirements:
        'On-field: 145%–180% with Prototype Amber (185%–220% in solo Hydro without ER weapons). Off-field: 200%+ ER if bursting every rotation to maintain 100% jellyfish uptime; 100% (zero ER required) in Skill-only Freeze rotations where jellyfish repositioning is not required.',
      combatTips: [
        'Passive "Flawless Strategy" decreases Kokomi\'s Crit Rate by 100% while granting +25% Healing Bonus. Never build Crit Rate or Crit DMG on Kokomi; prioritize HP%, ER, Healing Bonus, and EM.',
        "A4 Passive (Song of Pearls): When Nereid's Ascension is active, Normal and Charged Attack DMG receives a bonus equal to 15% of her total Healing Bonus value.",
        'A1 Passive (Tamakushi Casket): Unleashing Burst immediately resets the 12s duration of Bake-Kurage on field. Timing her Burst just before the jellyfish expires achieves infinite 100% Hydro application uptime.',
        'Thrilling Tales of Dragon Slayers (TTDS) provides a massive +48% ATK buff for 10s to whichever character swaps in next, serving as a core staple in Freeze (Ayaka/Ganyu) and Vaporize setups.',
      ],
      weapons: [
        {
          name: 'Everlasting Moonglow',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature weapon providing 49.6% HP, +10% Healing Bonus, Normal Attack DMG increase based on Max HP, and flat Energy regeneration during Burst.',
        },
        {
          name: 'Prototype Amber',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Best in Slot generalist and accessible craftable weapon. Provides 41.3% HP, regenerates up to 18 flat Energy post-Burst (substantially reducing ER requirements), and heals all party members for 18% of their Max HP.',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          tier: 1,
          rarity: 3,
          category: 'BiS',
          notes:
            'Top tier support weapon. Provides 35.2% HP substat and an indispensable +48% ATK buff to the next active character, making it the premier option in Freeze (Ayaka/Ganyu) teams.',
        },
        {
          name: 'Hakushin Ring',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable Inazuma Catalyst tailored for Electro-Charged (Taser) teams. Grants ER substat and +10%–20% Elemental DMG Bonus for both Hydro and Electro upon triggering an Electro reaction.',
        },
        {
          name: 'Sacrificial Fragments',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Offers massive 221 EM substat for Nilou Bloom teams and allows on-demand Bake-Kurage repositioning by resetting Skill cooldown upon damage.',
        },
        {
          name: "Jadefall's Splendor",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Provides 49.6% HP substat and flat Energy restoration upon Burst cast and shield generation, offering marginal personal damage gains over Prototype Amber.',
        },
        {
          name: 'Favonius Codex',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'High ER substat. While Kokomi cannot normally crit due to -100% Crit Rate, Lunar-Charged teams can trigger its white particle generation through reaction crits.',
        },
        {
          name: 'A Thousand Floating Dreams',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'High EM substat with teamwide +40 EM buff, well-suited for Bloom driver teams.',
        },
      ],
    },
  },
  {
    avatarId: 10000056,
    skillDepotId: 5601,
    referenceKey: 'KujouSara',
    displayName: 'Kujou Sara',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-sara'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot for Personal Damage & ER Conversion (+20% ER)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Team Support (+20% Team ATK on Burst if unheld by teammates)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative Support for snapshotting characters',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc ER (+20% ER)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc Burst DMG (+20% Burst DMG)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'energyRecharge', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% ER and up to +75% Titanbreaker Burst DMG)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative Burst & Support Hybrid',
          },
        ],
      },
    ],
    guide: {
      sourceUrl:
        'https://kqm-uploads.keqingmains.com/wp-content/uploads/2024/09/Kujou_Sara_5.0_-_cote__euphorysm.png',
      playstyleSummary:
        "Specialized Electro hypercarry buffer and Burst nuke support. Tengu Juurai provides an ATK bonus that scales strictly on Sara's Base ATK (character base + weapon base ATK). At Constellation 6, she becomes the premier hypercarry amplifier in the game for Electro units like Raiden Shogun and Keqing by bestowing a massive +60% Electro Crit DMG bonus to characters receiving her buff.",
      energyRequirements:
        '140%–160% ER in teams with Raiden Shogun or triple Electro; 180%–200% in Electro-Charged or standard double Electro setups; 220%+ if playing as solo Electro.',
      combatTips: [
        "Tengu Juurai's ATK buff scales EXCLUSIVELY with Sara's Base ATK (Character base + Weapon base). Artifact ATK% mainstats and substats do NOT increase the buff provided to teammates.",
        'Constellation 6 (Sin of Pride) grants +60% Electro Crit DMG to characters buffed by Tengu Juurai. This buff lasts 6s and transforms Raiden Shogun and Keqing into devastating hypercarries.',
        'At Constellation 2 (Dark Wings), casting her Skill leaves a weaker Crowfeather at her original position that detonates automatically, removing the necessity of performing a Charged Aimed Shot during high-speed rotations.',
        'Subjugation: Koukou Sendou (Burst) unleashes Titanbreaker dealing colossal single-instance Electro damage, then expands into 4 Stormclusters that also grant the full Tengu Juurai ATK buff.',
      ],
      weapons: [
        {
          name: 'Skyward Harp',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Best in Slot generalist weapon. Possesses an extraordinary 674 Base ATK maximizing her Tengu Juurai ATK buff, paired with unconditional 22.1% Crit Rate and +20% Crit DMG for her Burst.',
        },
        {
          name: 'Elegy for the End',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Premier team support bow. Combines a high 608 Base ATK with 55.1% ER and an unyielding team buff of +100 EM and +20% ATK upon triggering Millennial Movement.',
        },
        {
          name: 'Polar Star',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '608 Base ATK with 33.1% Crit Rate and Skill/Burst DMG buffs, greatly boosting personal Burst nuke potential.',
        },
        {
          name: 'Aqua Simulacra',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Massive 88.2% Crit DMG substat and unconditional +20% DMG bonus, though lower 542 Base ATK yields slightly smaller teammate buffs.',
        },
        {
          name: 'Fading Twilight',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Top F2P recommendation. Features high 565 Base ATK for a 4-star, 30.6% ER substat, and ramping DMG% bonus for her Burst.',
        },
        {
          name: 'Favonius Warbow',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Exceptional team utility bow. Grants 61.3% ER to comfortably satisfy high burst costs and reliably feeds neutral particles to energy-demanding teammates.',
        },
        {
          name: 'Sacrificial Bow',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes: 'High 565 Base ATK 4-star with ER substat and Skill cooldown reset capability.',
        },
        {
          name: 'Alley Hunter',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes: "565 Base ATK with up to +40% off-field damage bonus for Sara's Burst.",
        },
        {
          name: "Mouun's Moon",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'High 565 Base ATK with passive that boosts Burst DMG based on total party Burst energy costs.',
        },
        {
          name: 'The Stringless',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Boosts Skill and Burst DMG by up to +48%, but lower 510 Base ATK reduces her team ATK buff.',
        },
      ],
    },
  },
  {
    avatarId: 10000062,
    skillDepotId: 6201,
    referenceKey: 'Aloy',
    displayName: 'Aloy',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-aloy-freeze', 'kqm-aloy-melt', 'kqm-aloy-support', 'kqm-aloy-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot for Burst Nuke (+20% ER and converts ER to Burst DMG)',
          },
          {
            referenceKey: 'Lavawalker',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Reverse Melt (+35% DMG against Pyro-affected opponents)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot EM Stacking (+80 EM and up to +150 EM in Melt teams)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc Cryo DMG (+15% Cryo DMG)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc Burst DMG (+20% Burst DMG)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Support (40-cost Burst guarantees near 100% uptime on +20% Team ATK)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Personal Damage in Freeze (+40% Crit Rate vs Frozen enemies)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label: 'Alternative with Furina (+36% Crit Rate on HP changes)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Off-Field Burst Nuke (+20% ER)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative Support Hybrid',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/aloy-quickguide/',
      playstyleSummary:
        'Low-cost Cryo Burst nuker in Reverse Melt, or versatile Cryo battery and team ATK buffer in Freeze and Mono-Cryo comps. Aloy excels at delivering instantaneous single-hit Cryo damage via Prophecies of Dawn (Burst) for 2.0x Forward Melt multiplier on Pyro auras, while providing steady party utility via A4 Combat Overdrive and Chillwater Bomblet particle generation.',
      energyRequirements:
        '100%–125% ER in Double Cryo teams, with Favonius/Sacrificial Bow, or Venti; ~140%–165% as solo Cryo. With a low 40 energy cost on a 12s cooldown, her energy requirements are very easy to meet.',
      combatTips: [
        'Prophecies of Dawn (Burst) costs only 40 Energy on a 12s cooldown and applies 2 units of Cryo with no delay, making it one of the easiest skills in the game to trigger high-damage Reverse Melt.',
        'Combat Overdrive (A4) grants all nearby party members +8% ATK and Aloy +16% ATK for 10s upon gaining Coil stacks.',
        'Frozen Wilds bomblets have a 0.1s internal cooldown on granting Coil stacks. Grouping abilities (Kazuha, Sucrose) or Sacrificial Bow help trigger all 4 stacks reliably to enter Rushing Ice infusion.',
        'Equipping Sacrificial Bow allows a second cast of Frozen Wilds, doubling particle generation (yielding 8–10 Cryo particles) to act as a premier battery for Ayaka or Eula.',
      ],
      weapons: [
        {
          name: 'Polar Star',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Best in Slot overall weapon. Increases Skill and Burst DMG by +12%–24% and accumulates up to +48% ATK by interweaving Normal Attacks and Aimed Shots into rotations.',
        },
        {
          name: 'Aqua Simulacra',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Tremendous 88.2% Crit DMG substat with universal +20% DMG bonus when near opponents.',
        },
        {
          name: 'Skyward Harp',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High Base ATK, 22.1% Crit Rate, and +20% Crit DMG, providing reliable baseline scaling across all playstyles.',
        },
        {
          name: 'The Stringless',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Best in Slot 4-star weapon for Reverse Melt. Provides 165 EM and up to +48% Skill and Burst DMG Bonus.',
        },
        {
          name: 'Sacrificial Bow',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Best in Slot utility and battery weapon. Resets Skill cooldown to grant another massive hit of Cryo damage, guarantees Rushing Ice Coil stacks, and doubles Cryo particle generation.',
        },
        {
          name: 'Favonius Warbow',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Premier team battery weapon providing 61.3% ER and consistent neutral energy particles.',
        },
        {
          name: 'Elegy for the End',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Top tier buffer weapon providing 55.1% ER and partywide +100 EM and +20% ATK upon trigger.',
        },
        {
          name: 'Thundering Pulse',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'High Base ATK and 66.2% Crit DMG stat stick.',
        },
        {
          name: 'The First Great Magic',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'High Crit DMG substat with ATK% buffs that scale with matching Cryo teammates.',
        },
        {
          name: 'Prototype Crescent',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable bow providing substantial ATK% buff upon hitting a weak point with an Aimed Shot.',
        },
        {
          name: 'Song of Stillness',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Craftable Fontaine bow providing up to +32% DMG bonus upon receiving healing.',
        },
      ],
    },
  },
];
