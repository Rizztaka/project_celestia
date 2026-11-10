import type { ReviewedCharacterProfile } from './identity';

export const v36Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000082,
    skillDepotId: 8201,
    referenceKey: 'Baizhu',
    displayName: 'Baizhu',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-baizhu-info', 'kqm-baizhu-guide'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent', 'healingBonus', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'maxHp', 'hpPercent', 'healingBonus', 'critRate'],
        sets: [
          { referenceKey: 'DeepwoodMemories', pieces: 4, tier: 1, label: 'Best in Slot (-30% Dendro RES shred for Bloom, Hyperbloom, Burgeon, and Spread teams)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot Healing & Sub-DPS (continuous Clam foam damage from team Skill and Burst heals)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot Aggravate (+20% Team ATK for 12s on Burst)' },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4, tier: 2, label: 'Alternative (+12% Elemental DMG bonus to reacted elements)' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Reaction Buffer (+120 EM teamwide upon triggering reaction on-field)' },
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 2, label: 'Alternative (+15% Healing Bonus & Additive Base DMG Bonus for active character)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% HP)' },
          { referenceKey: 'OceanHuedClam', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Healing Bonus)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Energy Recharge)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/baizhu-quickguide/',
      playstyleSummary:
        '5-star Dendro healer and shield-like defensive buffer. Universal Diagnosis (Elemental Skill) dispatches a Gossamer Sprite that darts around up to 3 nearby enemies dealing Dendro damage, before returning to heal all active party members based on Baizhu\'s Max HP. Holistic Revivification (Burst, 80 Energy cost) enters the Pulsing Clarity state for 14 seconds: generates a Seamless Shield every 2.5s that absorbs Dendro damage with 250% effectiveness, heals the active character, and fires Spiritvein Dendro projectiles. His A4 Passive (All Things Are of the Earth) buffs the reaction damage of active characters healed by Seamless Shields by up to +100% Bloom/Hyperbloom/Burgeon and +40% Aggravate/Spread (capping at 50,000 Max HP).',
      energyRequirements:
        'Burst costs 80 Energy, demanding substantial ER: In Solo Dendro: 210%–250% ER with R1 Jadefall / R5 Prototype Amber (or 250%–290% with Favonius Codex; 320%–370% on other weapons without ER passives). In Double Dendro (Nahida/Alhaitham): 125%–160% ER. In Double Electro (Fischl/Raiden): 140%–170% ER. Each team Favonius proc shaves ~10% ER. At C1 (granting a second Skill charge), ER requirements drop by 30%–50%.',
      combatTips: [
        'A4 50,000 Max HP Cap: Baizhu\'s A4 passive reaction bonus increases with every 1,000 HP up to 50,000 Max HP (+2% Bloom/Hyperbloom/Burgeon per 1,000 HP, +0.8% Aggravate/Spread per 1,000 HP). HP% is preferred over Healing Bonus on Circlet until hitting 50,000 HP.',
        'Seamless Shield Mechanics: Seamless Shields are fragile pseudo-shields designed to break upon impact; each time a shield breaks or expires, it regenerates 2.5s later, providing continuous interruption resistance refreshes and single-target healing rather than unbreakable tanking.',
        'Teamwide Burst Healing on Skill: Universal Diagnosis (Skill) heals the ENTIRE team simultaneously regardless of who is on-field, making Baizhu one of the best healers in the game for immediately stacking Furina\'s Fanfare.',
        '4pc Deepwood Multi-Target Limitations: Baizhu\'s Skill hits only 3 enemies, and Burst Spiritveins hit only single targets with tiny AoE. In heavy mob AoE chambers, Nahida or an Anemo Swirler may be a more consistent Deepwood holder.',
        'Favonius Codex Optimization: Baizhu needs roughly 30%–40% Crit Rate (or a Crit Rate Circlet) to reliably trigger Favonius Codex on Skill cast without needing to weave in slow melee Normal Attacks.',
      ],
      weapons: [
        {
          name: 'Prototype Amber',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Craftable F2P BiS. 41.3% HP substat and regenerates 12–18 flat energy over 6s upon Burst, performing essentially on par with his 5-star signature.',
        },
        {
          name: "Jadefall's Splendor",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature catalyst. 49.6% HP substat; restores 13.5–27 flat energy and provides an Elemental DMG bonus after casting Burst or creating shields.',
        },
        {
          name: 'Favonius Codex',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '45.9% ER; generates 6 clear elemental particles on CRIT hits, lowering team and personal ER requirements.',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          tier: 2,
          rarity: 3,
          category: 'Utility',
          notes:
            '35.2% HP substat; grants massive +48% ATK buff to the next character swapped in, optimal for ATK-scaling carries like Cyno or Keqing.',
        },
        {
          name: 'Hakushin Ring',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '30.6% ER; provides +10%–20% Electro and Dendro DMG bonus to teammates when Baizhu triggers Quicken reactions while driving on-field.',
        },
        {
          name: 'Sacrificial Fragments',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '221 EM substat; Skill reset provides an extra Skill cast for immediate particle generation and double team healing in Nilou Bloom.',
        },
        {
          name: 'A Thousand Floating Dreams',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '265 EM substat; grants partywide +40 EM buff and self EM / Dendro DMG bonus.',
        },
      ],
    },
  },
  {
    avatarId: 10000081,
    skillDepotId: 8101,
    referenceKey: 'Kaveh',
    displayName: 'Kaveh',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-kaveh-info', 'kqm-kaveh-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'normal', 'skill'],
        talentPriorityGroups: [['burst'], ['normal', 'skill']],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery'],
          Goblet: ['elementalMastery', 'dendroDmg'],
          Circlet: ['elementalMastery', 'healingBonus', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate', 'atkPercent'],
        sets: [
          { referenceKey: 'DeepwoodMemories', pieces: 4, tier: 1, label: 'Best in Slot (-30% Dendro RES shred with 100% uptime from on-field Dendro attacks)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot Bloom/Burgeon (converts core rupture self-healing into massive Clam foam physical damage)' },
          { referenceKey: 'FlowerOfParadiseLost', pieces: 4, tier: 2, label: 'Alternative (+80 EM, up to +140% Bloom DMG bonus when Kaveh has high core ownership)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 2, label: 'Alternative (+80 EM, up to +150 EM via reactions)' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Reaction Buffer (+120 EM teamwide buffer)' },
          { referenceKey: 'FlowerOfParadiseLost', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
          { referenceKey: 'GildedDreams', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['burst', 'normal', 'skill'],
        talentPriorityGroups: [['burst'], ['normal', 'skill']],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate'],
        sets: [
          { referenceKey: 'DeepwoodMemories', pieces: 4, tier: 1, label: 'Best in Slot (-30% Dendro RES shred)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot Bloom Sustain & Damage' },
          { referenceKey: 'FlowerOfParadiseLost', pieces: 4, tier: 2, label: 'Alternative (+80 EM, Bloom reaction bonus)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 2, label: 'Alternative (+80 EM, reaction EM stacking)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/kaveh-quickguide/',
      playstyleSummary:
        '4-star Dendro claymore on-field driver and Bloom reaction specialist. Artistic Ingenuity (Elemental Skill) initiates a radial scan with Mehrak that deals AoE Dendro DMG and causes all Dendro Cores within range to immediately explode. Painted Dome (Elemental Burst, 80 Energy cost) creates a cubic scanned space, immediately exploding all Dendro Cores, granting Kaveh complete non-overrideable Dendro conversion on his Normal, Charged, and Plunging Attacks with expanded AoE, increasing party Bloom damage, and enhancing his interruption resistance.',
      energyRequirements:
        'Burst costs 80 Energy, requiring substantial ER to burst every rotation: With Favonius Greatsword: 160%–190% ER in Double Dendro, or 200%–220% ER in Solo Dendro. Without Favonius: 180%–210% ER in Double Dendro, reaching 220%–250% ER in Solo Dendro. Sacrificial Greatsword extra Skill cast reduces ER needs by ~20%.',
      combatTips: [
        'A1 An Architect’s Undertaking Self-Healing: When Dendro Cores (including Burgeon damage) damage Kaveh, he regenerates HP equal to 300% of his Elemental Mastery every 0.5s. High EM turns enemy-damaging explosions into massive personal healing!',
        'Core Ownership Nuance: Detonating cores with Kaveh\'s Skill or Burst does NOT grant Kaveh ownership of the Dendro Cores! Core damage is calculated using the Elemental Mastery and character level of whoever triggered the Bloom reaction (typically the off-field Hydro applier like Xingqiu, Yelan, or Nilou).',
        'Burst Dendro Conversion Persistence: Kaveh\'s Dendro Infusion and Bloom damage buffs are immediately canceled if he leaves the field! Complete your full on-field attack string before swapping.',
        'C1 A Golden Age Safeguard: Casting Skill grants Kaveh +50% Dendro RES and +25% incoming healing bonus for 3 seconds, significantly increasing his survivability in heavy Bloom detonation spikes.',
        'Claymore Shatter Synergy: In Freeze-Bloom (Shatterbloom) teams with a Cryo teammate, Kaveh\'s blunt claymore attacks trigger Shatter on frozen enemies while simultaneously generating and detonating Dendro Cores.',
      ],
      weapons: [
        {
          name: 'Favonius Greatsword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '61.3% ER; high clear particle generation triggered multiple times per rotation eases his and teammates\' steep 80 energy Burst costs.',
        },
        {
          name: 'Makhaira Aquamarine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '165 EM; converts high EM into personal and party flat ATK buffs.',
        },
        {
          name: 'Mailed Flower',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Event claymore. 110 EM substat, grants +24% ATK and +96 EM on Skill hit or reaction (+206 EM total).',
        },
        {
          name: 'Rainslasher',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '165 EM substat, +20%–36% DMG against opponents affected by Hydro or Pyro in Bloom/Burgeon.',
        },
        {
          name: 'Bloodtainted Greatsword',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            '187 EM substat; highest raw EM of any claymore for maximum A1 core-damage self-healing.',
        },
        {
          name: 'Sacrificial Greatsword',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '30.6% ER; Skill reset allows an immediate second Dendro core detonation and particle generation.',
        },
        {
          name: 'Forest Regalia',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Sumeru claymore. 30.6% ER; triggering Bloom drops a Leaf of Consciousness granting +60 to +120 EM.',
        },
        {
          name: 'Katsuragikiri Nagamasa',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Inazuma claymore. 45.9% ER; restores up to 15 flat energy upon Skill cast.',
        },
        {
          name: '"Ultimate Overlord\'s Mega Magic Sword"',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '30.6% ER and up to +48% ATK; solid ER stat stick for burst uptime.',
        },
        {
          name: 'Skyward Pride',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '36.8% ER, +8% all DMG, and fires vacuum blades on Normal/Charged Attacks during Burst.',
        },
      ],
    },
  },
];
