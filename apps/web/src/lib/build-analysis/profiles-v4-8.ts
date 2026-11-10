import type { ReviewedCharacterProfile } from './identity';

export const v48Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000099,
    skillDepotId: 9901,
    referenceKey: 'Emilie',
    displayName: 'Emilie',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-emilie-info', 'kqm-emilie-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['dendroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge', 'atk'],
        sets: [
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+18% ATK and +50% All DMG Bonus with permanent 100% uptime in Burning teams; easily outperforms Deepwood)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (-30% Dendro RES shred support; top choice in double Dendro teams or if no teammate holds Deepwood)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+70% Skill DMG; decent option, though Cleardew Cologne and Burst do not benefit from Skill DMG%)',
          },
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Dendro DMG Bonus)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/emilie-quickguide/',
      playstyleSummary:
        "5-star Dendro Polearm Fontainian perfumer delivering outstanding, consistent off-field Dendro damage centered around the Burning reaction. Her Elemental Skill (Fragrance Extraction, 22s duration, 14s CD) creates a Lumidouce Case that periodically fires Puffs of Puredew dealing AoE Dendro DMG (attacking every 1.5s). When nearby enemies are affected by Burning, they emit Scents every 2s; collecting 2 Scents upgrades the Lumidouce Case to Level 2, firing an additional Puff of Puredew with increased damage and wider AoE. Her A1 Passive Lingering Fragrance consumes 2 collected Scents at Level 2 to unleash Cleardew Cologne, an explosive AoE Dendro burst dealing 600% of Emilie's ATK (~40% of her total damage output!). Her A4 Passive Rectification increases her damage dealt to Burning enemies by 15% for every 1,000 ATK (capping at a +36% DMG bonus at 2,400 ATK). Her Elemental Burst (Aromatic Explication, 50 Energy, 13.5s CD) manifests a Level 3 Lumidouce Case bombarding enemies with rapid Puredew drops every 0.3s for 2.8s before leaving behind a Level 1 Case (or refreshed Level 2 Case if Scents were collected). Her passive Head Fragrance grants the entire team +85% Burning DMG RES, neutralizing self-damage from burning grass and environments.",
      energyRequirements:
        'Burst costs 50 Energy with a 13.5s CD. Because Emilie usually operates as the sole Dendro unit off-field, bursting every rotation requires 180%–255% ER (or 135%–195% ER with Lumidouce Elegy). In most teams, it is significantly better for overall DPS to forgo heavy ER investment and burst every other rotation (100%–120% ER without energy weapons, or 100% ER with Lumidouce Elegy), channeling all substats into CRIT and ATK.',
      combatTips: [
        'No Elemental Mastery Trap: Emilie should NOT build Elemental Mastery. Her personal damage consists of direct Dendro damage scaling purely with ATK and CRIT. Burning damage itself is negligible, and her signature A1 Cleardew Cologne 600% ATK burst explicitly cannot trigger reactions. Focus entirely on ATK% and CRIT.',
        'A4 Rectification 2,400 ATK Benchmark: Emilie gains +15% DMG dealt to Burning enemies per 1,000 ATK, capping at +36% DMG at 2,400 ATK. Pair her with ATK buffers (Bennett, Pyro Resonance, Noblesse Oblige, Tenacity) to easily reach this ceiling.',
        "Dynamic Non-Snapshotting Case: Lumidouce Case damage does not snapshot Emilie's stats upon creation; it updates dynamically based on current buffs and Scent collections. Teammate buffs like Bennett's Burst buff her whenever she swaps on-field or when active.",
        'Permanent Skill Uptime: With a 22s duration and a 14s cooldown, Emilie easily achieves 100% Lumidouce Case uptime. In standard rotations, you can cast Burst to refresh Case duration and position without needing to recast Skill.',
        'Burnmelt and Burnvape Enabler: Beyond mono-Pyro/Burning teams, Emilie excels in Burnmelt (with Wriothesley, Ganyu) and Burnvape (with Kinich, Mualani) teams by maintaining a stable burning Pyro aura that Cryo and Hydro carries can repeatedly melt and vaporize.',
      ],
      weapons: [
        {
          name: 'Lumidouce Elegy',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 33.1% CRIT Rate, 608 Base ATK, +15% ATK, restores 12 Energy and grants up to +36% DMG when triggering Burning or dealing Dendro DMG to Burning foes. Slashes ER needs drastically.',
        },
        {
          name: 'Calamity Queller',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Exceptional 5★ BiS alternative. Massive 741 Base ATK, +12% All Elemental DMG Bonus, and doubles off-field ATK% stacks up to +38.4% ATK, effortlessly capping her A4 passive.',
        },
        {
          name: 'Staff of the Scarlet Sands',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Outstanding 5★ stat stick. 44.1% CRIT Rate and converts baseline EM into Flat ATK.',
        },
        {
          name: 'Staff of Homa',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '66.2% CRIT DMG, 608 Base ATK, +20% HP, and converts Max HP to ATK. Outstanding stat stick even when Emilie is above 50% HP.',
        },
        {
          name: 'Deathmatch',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Premier Battle Pass 4★ BiS. 36.8% CRIT Rate and grants up to +32% ATK in single-target combat (+24% ATK with multiple foes), rivaling 5★ polearms at high refinements.',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '22.1% CRIT Rate and 674 Base ATK stat stick. Passive stacks are underutilized off-field but solid baseline stats.',
        },
        {
          name: 'Missive Windspear',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Version 3.1 event 4★ weapon. 41.3% ATK substat and grants +24% ATK on reaction triggers. Premier free-to-play option.',
        },
        {
          name: 'Blackcliff Pole',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes: '55.1% CRIT DMG stat stick obtainable via Starglitter exchange.',
        },
        {
          name: 'Favonius Lance',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            '30.6% Energy Recharge and generates neutral particles on CRIT hits to lower teamwide ER thresholds.',
        },
      ],
    },
  },
];
