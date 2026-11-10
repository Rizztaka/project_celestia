import type { ReviewedCharacterProfile } from './identity';

export const v31Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000071,
    skillDepotId: 7101,
    referenceKey: 'Cyno',
    displayName: 'Cyno',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-cyno-info', 'kqm-cyno-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['elementalMastery', 'atkPercent', 'energyRecharge'],
          Goblet: ['electroDmg', 'elementalMastery'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        conditionalMainStats: {
          Sands: {
            elementalMastery: 'reaction_context',
            energyRecharge: 'team_buffs',
          },
          Goblet: {
            elementalMastery: 'reaction_context',
          },
          Circlet: {
            elementalMastery: 'reaction_context',
          },
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'energyRecharge', 'atkPercent'],
        sets: [
          { referenceKey: 'ThunderingFury', pieces: 4, tier: 1, label: 'Best in Slot (+15% Electro DMG, -1s Skill CD on reactions, drops ER by 30-40%)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 1, label: 'Competitive Alternative (+80 EM, high EM/ATK stacking in Quickbloom/Aggravate)' },
          { referenceKey: 'GladiatorsFinale', pieces: 4, tier: 2, label: 'Alternative (+18% ATK, +35% Normal Attack DMG in Aggravate)' },
          { referenceKey: 'FlowerOfParadiseLost', pieces: 4, tier: 2, label: 'Alternative (+80 EM, +80% Hyperbloom DMG in Quickbloom)' },
          { referenceKey: 'ThunderingFury', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Electro DMG)' },
          { referenceKey: 'GildedDreams', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/cyno-quickguide/',
      playstyleSummary:
        'Premier 5-star on-field Electro carry specializing in sustained Quickbloom and Aggravate damage. Sacred Rite: Wolf’s Swiftness (Burst, 80 Energy cost) transforms him into the Pactsworn Pathclearer for up to 18 seconds, granting an unoverrideable Electro infusion, +100 Elemental Mastery, increased interruption resistance, and Electro-Charged immunity. Secret Rite: Chasmic Soulfarer (Skill) deals swift Electro thrusts outside of Burst, but transforms inside Burst into Mortuary Rite—dealing heavy AoE Electro damage, extending Burst duration by 4s (up to 18s max), and interacting with his Ascension 1 Endseer stance.',
      energyRequirements:
        'High 80 Energy Burst cost. With 4pc Thundering Fury: Solo Electro requires 140%–160% ER; with Fischl 100%–110% ER; with Kuki Shinobu 110%–120% ER; with other Electro 120%–140% ER. Without 4pc Thundering Fury: Solo Electro requires 180%–200% ER; with Fischl 115%–130% ER; with Kuki 125%–140% ER. Each teammate Favonius proc reduces requirements by 10%–15%. R5 Kitain Cross Spear reduces requirements by 50%–65%.',
      combatTips: [
        'Endseer Stance & Judication (A1 Featherfall Judgment): During Burst, a stylized purple eye flashes on screen at regular intervals (Endseer stance). Casting Skill while this eye is active triggers the Judication effect: +35% Skill DMG and fires 3 Duststalker Bolts dealing 100% ATK as Electro damage (counted as Skill DMG).',
        'A4 EM Conversion (Authority Over the Nine Bows): Cyno’s Normal Attack DMG during Burst is increased by 150% of his Elemental Mastery, and Duststalker Bolt DMG is increased by 250% of his Elemental Mastery, making EM equally or more valuable than ATK%.',
        'Normal Attack Talent Leveling: Do NOT level Normal Attack talent Invoker’s Spear. During Burst, all normal attacks scale strictly with his Elemental Burst talent multipliers!',
        'Level 90 Criticality: Level 90 is mandatory for Cyno due to the heavy scaling of Additive (Aggravate) and Transformative (Hyperbloom) reaction bases with character level.',
        'Thundering Fury Combo Flow: E -> Q -> E -> 6x [N4E]. Casting Skill on cooldown triggers TF’s 1s cooldown reduction on reactions, enabling Skill casts both during and between Endseer stance windows.',
      ],
      weapons: [
        {
          name: 'Staff of the Scarlet Sands',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature weapon. Provides 44.1% Crit Rate and converts 52% of EM into flat ATK, plus another 28% EM per Skill hit up to 3 stacks (total 136% EM-to-ATK conversion), heavily rewarding high-EM builds.',
        },
        {
          name: 'Ballad of the Fjords',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Battle Pass polearm providing 27.6% Crit Rate and an unconditional +120 to +240 EM when party contains at least 3 distinct elemental types (standard in Quickbloom and Aggravate). Nearly rivals signature at R5.',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High base ATK, 22.1% Crit Rate, and easily reaches full +22.4% ATK and +12% DMG bonus stacks due to Cyno’s extensive on-field combat duration.',
        },
        {
          name: 'Kitain Cross Spear',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Inazuma polearm with 110 EM; passive refunds up to 15 energy over 6s after Skill, drastically lowering ER needs by up to 50%–65% in Solo Electro setups.',
        },
        {
          name: 'White Tassel',
          tier: 1,
          rarity: 3,
          category: 'F2P',
          notes:
            '3-star Liyue chest weapon offering 23.4% Crit Rate and an incredible +48% Normal Attack DMG bonus at R5; performs on par with 4-star gacha options.',
        },
        {
          name: 'Staff of Homa',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% Crit DMG stat stick with +20% HP and HP-to-ATK conversion; formidable universal polearm.',
        },
        {
          name: 'Deathmatch',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '36.8% Crit Rate and solid ATK% buff; great consistency stat stick.',
        },
        {
          name: 'Missive Windspear',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Event weapon offering ATK% and +96 EM on triggering reactions; performs comparably to White Tassel.',
        },
      ],
    },
  },
  {
    avatarId: 10000070,
    skillDepotId: 7001,
    referenceKey: 'Nilou',
    displayName: 'Nilou',
    defaultRoleId: 'reaction_trigger',
    evidenceIds: ['kqm-nilou-info', 'kqm-nilou-guide'],
    roles: [
      {
        id: 'reaction_trigger',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent'],
        },
        priorityStats: ['maxHp', 'elementalMastery', 'energyRecharge'],
        sets: [
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 1, label: 'Best in Slot 2pc Mix (+20% HP)' },
          { referenceKey: 'VourukashasGlow', pieces: 2, tier: 1, label: 'Best in Slot 2pc Mix (+20% HP — combining 2pc+2pc HP gives +40% HP to cap A4)' },
          { referenceKey: 'GildedDreams', pieces: 2, tier: 1, label: 'Alternative 2pc Mix (+80 EM paired with 2pc HP%)' },
          { referenceKey: 'FlowerOfParadiseLost', pieces: 2, tier: 1, label: 'Alternative 2pc Mix (+80 EM paired with 2pc HP%)' },
          { referenceKey: 'FlowerOfParadiseLost', pieces: 4, tier: 2, label: 'Alternative Trigger (+80 EM, +80% Bloom DMG if triggering high Bloom share)' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Team Buffer (+120 team EM upon reaction)' },
          { referenceKey: 'DeepwoodMemories', pieces: 4, tier: 2, label: 'Team Support (-30% Dendro RES shred on Skill cast if no teammate holds it)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/nilou-quickguide/',
      playstyleSummary:
        'Unique 5-star Hydro support and archetype enabler who fundamentally transforms the Bloom reaction into instant-detonation Bountiful Blooms. Under her A1 passive Court of Dancing Petals, if the team consists strictly of Dendro and Hydro characters (at least one of each), completing her 3-step Dance of Haftkarsvar (Skill) grants all party members the Golden Chalice’s Bounty for 30s. Dendro Cores are replaced by Bountiful Cores that detonate instantly in a massive AoE and gain up to +400% DMG from her A4 passive Dreamy Dance of Aeons based on her Max HP above 30,000.',
      energyRequirements:
        'Burst is entirely optional; Nilou does not need to build ER. Her Burst (Dance of Abzendegi, 70 cost) deals modest AoE Hydro damage in two waves, but is frequently skipped or cast every other rotation for extra Hydro application. If bursting every other rotation with 1 Hydro teammate (e.g. Xingqiu/Yelan): 100%–120% ER; with Barbara/Solo Hydro: 150%–160% ER.',
      combatTips: [
        'Golden Chalice Team Composition Invariant: Her core passives work ONLY if all characters in the party are Hydro or Dendro (no Anemo, Geo, Pyro, Electro, or Cryo allowed). Introducing any other element disables Bountiful Cores completely!',
        'Whirling Steps (Tranquility Aura): Always finish her Skill combo with an Elemental Skill press (E -> E E E or E -> N N E) to trigger Whirling Steps. This surrounds the active character with a 12-second water aura that continuously applies Hydro to surrounding opponents without dealing damage, enabling rapid Bloom generation while off-field.',
        'Sword Dance Alternative: Finishing the combo with a Normal Attack (E -> N N N) triggers Lunar Prayer, converting her attacks into on-field water slashes; rarely used in Bountiful Bloom support.',
        '74,444 Max HP Hard Cap (A4 Dreamy Dance of Aeons): Every 1,000 Max HP Nilou has above 30,000 increases Bountiful Core DMG by 9% (capped at +400% at 74,444 HP). Max HP is by far her most impactful stat until reaching this threshold.',
        'Self-Damage & Healer Mandate: Bountiful Cores detonate immediately and inflict 5% of their damage to active characters within the blast radius. A dedicated team healer (Kokomi, Baizhu, Yaoyao, Barbara) is strictly mandatory to survive self-inflicted Bloom damage.',
      ],
      weapons: [
        {
          name: 'Key of Khaj-Nisut',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Uncontested Best-in-Slot signature weapon. Massive 66.2% HP substat, +20% HP passive, and Grand Hymn converts 0.2% of Nilou’s HP into teamwide EM (granting +140 to +170 EM to all party members), supercharging Bloom damage.',
        },
        {
          name: "The Dockhand's Assistant",
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Only 4-star sword with an HP% secondary stat (41.3% HP); passive restores energy and grants EM upon receiving heals.',
        },
        {
          name: "Serenity's Call",
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable weapon providing HP% buffs; excellent accessible option for reaching high HP thresholds.',
        },
        {
          name: "Xiphos' Moonlight",
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            '165 EM secondary stat; converts built EM into personal and party Energy Recharge.',
        },
        {
          name: 'Freedom-Sworn',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '198 EM substat and party-wide ATK% and Normal/Charged Attack DMG buffs.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Provides an unconditional +20% Max HP passive and high 44.1% Crit Rate stat stick.',
        },
        {
          name: 'Favonius Sword',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            '61.3% ER and white particle generation; procs comfortably during the 4-hit Pirouette dance to alleviate high team energy requirements.',
        },
        {
          name: 'Iron Sting',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable 165 EM stat stick; increases Bloom damage if Nilou triggers cores with her Tranquility Aura.',
        },
        {
          name: 'Toukabou Shigure',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Free event sword with 165 EM stat stick; identical performance to Iron Sting.',
        },
        {
          name: 'Sapwood Blade',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable 30.6% ER sword that spawns a Leaf of Consciousness granting +60 to +120 EM to whichever teammate collects it.',
        },
      ],
    },
  },
  {
    avatarId: 10000072,
    skillDepotId: 7201,
    referenceKey: 'Candace',
    displayName: 'Candace',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-candace-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent', 'hydroDmg'],
          Circlet: ['hpPercent', 'critRate'],
        },
        conditionalMainStats: {
          Sands: {
            energyRecharge: 'reaction_context',
            hpPercent: 'team_buffs',
          },
          Circlet: {
            critRate: 'favonius_proc',
          },
        },
        priorityStats: ['energyRecharge', 'maxHp', 'critRate'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (+20% team ATK on Burst cast, boosting party Normal Attack carries)' },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4, tier: 1, label: 'Best in Slot (High elemental DMG bonus buffer in Natlan teams)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 4, tier: 1, label: 'Personal Damage BiS (+20% ER and increases Burst waves damage)' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Team Buffer (+120 team EM on reaction)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% ER)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% HP)' },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        conditionalMainStats: {
          Sands: {
            energyRecharge: 'team_buffs',
            elementalMastery: 'reaction_context',
          },
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'maxHp', 'critRate'],
        sets: [
          { referenceKey: 'FlowerOfParadiseLost', pieces: 4, tier: 1, label: 'Best in Slot (+80 EM, +80% Bloom DMG bonus in Nilou Bloom)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 1, label: 'Alternative (+80 EM, up to +150 EM on reaction)' },
          { referenceKey: 'DeepwoodMemories', pieces: 4, tier: 2, label: 'Team Support (-30% Dendro RES shred if no teammate holds it)' },
          { referenceKey: 'GildedDreams', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
          { referenceKey: 'FlowerOfParadiseLost', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/candace-quickguide/',
      playstyleSummary:
        '4-star Hydro support, normal attack buffer, and infusion enabler. Sacred Rite: Wagtail’s Tide (Burst, 60 Energy cost) grants the Prayer of the Crimson Crown state to the active character, conferring three major benefits: +20% Normal Attack Elemental DMG bonus, an unoverrideable Hydro Infusion to Sword, Claymore, and Polearm wielders, and Ripple waves dealing AoE Hydro damage upon character swaps (up to 3 times per Burst, with C6 triggering continuous Ripples on Normal Attack DMG). Sacred Rite: Heron’s Sanctum (Skill) raises a shield absorbing damage based on Max HP, releasing an explosive Hydro strike upon release or full charge.',
      energyRequirements:
        'High ER requirements due to 60 Energy cost and low particle generation. Highly recommended to use 2 Skills per Burst. In Solo Hydro: 230%–260% ER (2 Skills) or 260%–280% ER (1 Skill). In Double Hydro: 180%–200% ER (2 Skills) or 220%–250% ER (1 Skill). In Triple Hydro: 150%–165% ER (2 Skills). Each Favonius proc reduces requirements by 15%–25%; R5 Kitain Cross Spear reduces requirements by ~30%.',
      combatTips: [
        'A4 HP-to-DMG Conversion (Celestial Dome of Sand): Every 1,000 points of Candace’s Max HP grants a 0.5% DMG bonus to the active character’s Normal Attacks during Burst, incentivizing high HP stacking for support.',
        'Hydro Infusion Hierarchy: Hydro Infusion refreshes every 0.5s for 1s duration. It overrides Bennett C6 Pyro Infusion, Diluc’s Pyro Infusion, and Keqing’s Electro Infusion. With Chongyun’s Cryo Infusion, it triggers Frozen directly on the weapon aura (applying Cryo). It cannot override unoverrideable Elemental Conversions (Arlecchino, Xiao, Itto, Raiden, Noelle).',
        'Instant Shield Block (A1 Aegis of Crossed Arrows): If Candace is hit while holding Elemental Skill, the charge is instantly completed, releasing a max-damage strike immediately (parry mechanic).',
        'Constellation 6 (The Overflow): When active characters deal Normal Attack Elemental DMG during Burst, Candace unleashes an AoE Hydro wave dealing 15% of her Max HP every 2.3s, drastically boosting off-field Hydro application for Vaporize, Bloom, and Freeze.',
        '2 Skills Per Rotation Flow: Cast Skill early in the team setup, rotate through teammate buffs, then cast Burst and a second Skill to catch particles and meet ER thresholds comfortably.',
      ],
      weapons: [
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed best support weapon. High 30.6% ER substat and white energy particle generation on Crit reduces both Candace’s steep ER needs and the entire party’s requirements.',
        },
        {
          name: "Dragon's Bane",
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '221 EM secondary stat; uncontested top weapon in Nilou Bloom teams where Candace triggers Bountiful Blooms with her Hydro infusion.',
        },
        {
          name: 'Staff of Homa',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% Crit DMG and +20% HP passive; best weapon for hybrid personal damage and HP buffing at C6.',
        },
        {
          name: 'Kitain Cross Spear',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable polearm with 110 EM; passive generates flat energy after Skill hits, lowering ER requirements by up to ~30%.',
        },
        {
          name: 'Engulfing Lightning',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Massive 55.1% ER secondary stat and converts ER into ATK; effortlessly resolves ER requirements.',
        },
        {
          name: 'The Catch',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '45.9% ER with +32% Burst DMG and +12% Burst Crit Rate; strong offensive option.',
        },
        {
          name: 'Rightful Reward',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Fontaine polearm providing 27.6% HP; restores 16 energy when receiving healing (even off-field).',
        },
        {
          name: 'Black Tassel',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            '46.9% HP secondary stat; maximizes her A4 Normal Attack DMG buff at low investment.',
        },
      ],
    },
  },
];
