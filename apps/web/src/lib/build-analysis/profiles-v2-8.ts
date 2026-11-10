import type { ReviewedCharacterProfile } from './identity';

export const v28Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000059,
    skillDepotId: 5901,
    referenceKey: 'ShikanoinHeizou',
    displayName: 'Shikanoin Heizou',
    defaultRoleId: 'resistance_shred',
    evidenceIds: ['kqm-heizou-dps', 'kqm-heizou-driver', 'kqm-heizou-support', 'kqm-heizou-guide'],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['elementalMastery', 'atkPercent'],
          Goblet: ['elementalMastery', 'anemoDmg'],
          Circlet: ['elementalMastery', 'critRate', 'critDmg'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Uncontested Best in Slot (+15% Anemo DMG, +60% Swirl DMG, -40% Elemental RES shred)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 2, label: 'Pure Swirl / Hyperbloom Alternative (+80 EM, high EM stacking if another VV holder exists)' },
          { referenceKey: 'ViridescentVenerer', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Anemo DMG)' },
          { referenceKey: 'WanderersTroupe', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'normal', 'burst'],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['anemoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot for Mixed Team Damage (-40% RES shred benefits off-field sub-DPS)' },
          { referenceKey: 'DesertPavilionChronicle', pieces: 4, tier: 1, label: 'Best in Slot Hypercarry (+15% Anemo DMG, +10% Normal Attack SPD, +40% NA/CA DMG)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'Best in Slot with Furina (+36% Crit Rate from HP fluctuation)' },
          { referenceKey: 'GladiatorsFinale', pieces: 2, tier: 2, label: 'Alternative 2pc Mix (+18% ATK)' },
          { referenceKey: 'ViridescentVenerer', pieces: 2, tier: 2, label: 'Alternative 2pc Mix (+15% Anemo DMG)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/heizou-quickguide/',
      playstyleSummary:
        'Inazuma\'s prodigy detective and agile 4-star Anemo melee catalyst user. Excels across three flexible roles: an on-field Swirl driver applying rapid Anemo fisticuffs to trigger Electro-Charged or Bloom reactions, a 4pc Viridescent Venerer resistance shred support buffing team EM via A4, and an on-field Anemo nuker unleashing massive 4-stack Conviction Heartstopper Strikes. His 40-cost, 12s cooldown Burst (Windmuster Kick) groups enemies and detonates Iris explosions.',
      energyRequirements:
        'On-field Driver / DPS: 100%–110% ER with 2 Skill uses per rotation (170%–180% with 1 Skill at C0–C3; 130%–140% at C4+). Quickswap Support: 120%–130% with 2 Skill uses (200%+ with 1 Skill). C4 restores up to 13.5 energy upon Burst explosion, reducing ER requirements across all team archetypes down to 100% baseline.',
      combatTips: [
        'Conviction Strike (Heartstopper E): Gaining 4 Declension stacks triggers the Conviction effect, vastly increasing Heartstopper Strike\'s damage and AoE. Never hold E to manually charge stacks; instead, build stacks instantly through on-field Swirls via A1 Paradoxical Practice!',
        'Melee Attack Combos: Heizou\'s Normal and Charged Attacks do not share an ICD. Performing a hold-attack (N1C) triggers two distinct Swirls instantaneously, granting 2 Declension stacks in under half a second.',
        'A4 EM Party Buff (Penetrative Reasoning): Landing Heartstopper Strike buffs all party members\' (excluding Heizou) Elemental Mastery by 80 for 10s, boosting team reaction damage.',
        'Windmuster Kick (Burst) Mechanics: 40 energy cost, 12s cooldown. Kicks a Vacuum Slugger that pulls enemies and inflicts Windmuster Iris on up to 4 enemies affected by Hydro/Pyro/Cryo/Electro, detonating for corresponding elemental AoE damage after a short delay.',
        'Quickswap Nuke Combo: Open with N1C -> Q -> N1 -> E. This guarantees max 4 Declension stacks, triggers 4pc VV resistance shred, and launches a max-power Conviction punch in under 2 seconds.',
        'Driver Level 90 Imperative: When played as an on-field Swirl driver in Electro-Charged or Hyperbloom teams, leveling Heizou to 90 is critical for base Swirl transformative damage.',
      ],
      weapons: [
        {
          name: 'Skyward Atlas',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Top-tier 5★ weapon for ADC damage. 674 Base ATK, 33.1% ATK%, and unconditional +12% Elemental DMG Bonus yields the highest consistent personal damage output.',
        },
        {
          name: 'The Widsith',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed best 4★ catalyst for personal damage. 55.1% Crit DMG; all three Aria songs (ATK%, All Elemental DMG%, and EM) are fully utilized across his personal nukes and Swirls.',
        },
        {
          name: 'Sacrificial Fragments',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Best weapon for EM / Swirl Driver playstyle. 221 EM sub-stat maximizes Swirl damage, while its passive resets Skill cooldown to allow double 4-stack Heartstopper strikes per rotation.',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          tier: 1,
          rarity: 3,
          category: 'BiS',
          notes:
            'Premier support weapon. Provides a +48% ATK buff to the next swapped-in hypercarry (e.g. Xiangling, Beidou, Raiden) in quickswap rotations.',
        },
        {
          name: "Kagura's Verity",
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% Crit DMG stat stick; provides solid Skill DMG bonuses over prolonged combat rotations.',
        },
        {
          name: 'Lost Prayer to the Sacred Winds',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '33.1% Crit Rate stat stick with 608 Base ATK and movement speed utility; excellent for on-field driver or carry playstyles.',
        },
        {
          name: 'Solar Pearl',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '27.6% Crit Rate battle pass weapon. Normal Attacks buff Skill/Burst DMG by 20%–40%, and Skill/Burst hits buff Normal Attack DMG.',
        },
        {
          name: 'Mappa Mare',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Versatile craftable hybrid weapon providing 110 EM and stacking Elemental DMG bonuses upon triggering Swirl reactions.',
        },
        {
          name: 'Hakushin Ring',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Craftable Inazuma catalyst providing Energy Recharge and teamwide Hydro and Electro DMG% buffs upon triggering Electro Swirls.',
        },
        {
          name: 'Magic Guide',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            'High value 3★ weapon providing 187 EM and up to +24% DMG against enemies affected by Hydro or Electro in taser teams.',
        },
        {
          name: 'Prototype Amber',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Provides teamwide healing and flat energy regeneration on Burst cast, enabling Heizou to act as a pseudo-healer in offensive teams.',
        },
      ],
    },
  },
];
