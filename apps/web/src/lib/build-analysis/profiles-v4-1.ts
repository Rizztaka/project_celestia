import type { ReviewedCharacterProfile } from './identity';

export const v41Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000087,
    skillDepotId: 8701,
    referenceKey: 'Neuvillette',
    displayName: 'Neuvillette',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-neuvillette-info', 'kqm-neuvillette-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        talentPriorityGroups: [['normal'], ['burst', 'skill']],
        mainStats: {
          Sands: ['hpPercent'],
          Goblet: ['hydroDmg', 'hpPercent'],
          Circlet: ['critDmg', 'critRate', 'hpPercent'],
        },
        priorityStats: ['critDmg', 'critRate', 'hpPercent', 'maxHp', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+36% CRIT Rate and +15% Charged Attack DMG stacked instantly via Equitable Judgment HP drain and Droplet healing)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+15% Hydro DMG and +30% Charged Attack DMG for 15s after Skill)',
          },
          {
            referenceKey: 'NymphsDream',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Stacking Hydro DMG% and ATK% buffs)',
          },
          {
            referenceKey: 'WanderersTroupe',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+35% Charged Attack DMG unconditionally for Catalyst users)',
          },
          {
            referenceKey: 'RetracingBolide',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+40% Charged Attack DMG when protected by a shield)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Normal and Charged Attack DMG)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Hydro DMG Bonus)',
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
      sourceUrl: 'https://keqingmains.com/q/neuvillette-quickguide/',
      playstyleSummary:
        "5-star Hydro Catalyst sovereign hypercarry channeling catastrophic continuous torrents of water through his enhanced Charged Attack: Equitable Judgment. Charging up creates a Seal of Arbitration, absorbing up to 3 nearby Sourcewater Droplets to reduce windup from 4 seconds down to 1 second while healing Neuvillette for 48% Max HP. While firing Equitable Judgment, Neuvillette unleashes continuous straight-line AoE Hydro damage for 3 seconds without consuming Stamina, draining 8% Max HP every 0.5s while above 50% HP. O Tears, I Shall Repay (Elemental Skill) deals AoE Hydro damage and creates 3 Sourcewater Droplets, while O Tides, I Have Returned (Elemental Burst, 70 Energy cost) crashes down in massive waterfalls creating 6 Sourcewater Droplets (9 Droplets total per rotation, perfectly fueling 3 full Charged Attacks). His A1 Passive Heir to the Ancient Sea's Authority grants independent stacks of Past Draconic Glories upon triggering unique Hydro elemental reactions, boosting Equitable Judgment damage by 110% / 125% / 160% as a colossal multiplicative damage multiplier.",
      energyRequirements:
        'Burst costs 70 Energy and is vital to cast every rotation to generate 6 Sourcewater Droplets: 100% (zero extra ER) when wielding Prototype Amber or Tome of the Eternal Flow in Double Hydro teams with Furina; 115%–135% ER when using other weapons in Solo Hydro teams. Each team Favonius proc reduces requirements by 10%–20%.',
      combatTips: [
        'Sourcewater Droplet Management: Skill creates 3 Droplets; Burst creates 6 Droplets. Because each Equitable Judgment consumes exactly 3 Droplets, Neuvillette cleanly executes 3 continuous Charged Attacks per standard rotation (`E -> Team -> Q -> 2x CA -> Team -> CA`).',
        'A1 Reaction Stacking Rule: Triggering Vaporize, Frozen, Electro-Charged, Bloom, Hydro Swirl, or Hydro Crystallize grants 1 stack of Past Draconic Glories for 30s (max 3 stacks). Each unique reaction stack boosts Equitable Judgment damage multiplicatively to 110% / 125% / 160% (a massive 1.6x final damage multiplier at 3 stacks).',
        'Interruption Resistance & C1 Watershed: Pre-C1 Neuvillette has low interruption resistance and can be knocked out of his Charged Attack beam, causing massive DPS loss. Pairing with a shielder (Zhongli, Layla, Kirara) or unlocking C1 (which grants complete interruption immunity and 1 free A1 stack upon taking the field) is transformative.',
        "HP% Goblet Competitiveness: Due to Neuvillette's massive innate Hydro DMG bonuses from his A4 Passive and Furina's Fanfare, an HP% Goblet performs equally to or slightly better than a Hydro DMG% Goblet with Tome of the Eternal Flow or in Furina teams.",
        'Pneuma Arkhe Alignment: Skill unleashes a Spiritbreath Thorn dealing Pneuma-aligned Hydro damage every 10s to stun Ousia Clockwork Meka.',
      ],
      weapons: [
        {
          name: 'Tome of the Eternal Flow',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. Colossal 88.2% CRIT DMG, +16% Max HP, +42% Charged Attack DMG bonus upon HP fluctuation, and restores up to 12 flat Energy per rotation.',
        },
        {
          name: 'Sacrificial Jade',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Battle Pass catalyst and phenomenal runner-up. 36.8% CRIT Rate, up to +64% Max HP and +80 EM at R5 after being off-field for 5s (max 10s field time); rivals 5★ weapons in Furina teams.',
        },
        {
          name: "Surf's Up",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes: '88.2% CRIT DMG stat stick granting +20% Max HP and massive offensive bonuses.',
        },
        {
          name: 'Lost Prayer to the Sacred Winds',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '33.1% CRIT Rate with +10% Movement SPD and stacking 8% Elemental DMG bonus every 4s on-field.',
        },
        {
          name: 'Cashflow Supervision',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '22.1% CRIT Rate stat stick providing Normal/Charged Attack DMG buffs upon HP changes.',
        },
        {
          name: 'Prototype Amber',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Liyue catalyst and undisputed 4★ F2P BiS. 41.3% HP substat, refunds up to 18 flat Energy to Neuvillette, and heals the entire party by 18% Max HP to stack Furina Fanfare.',
        },
        {
          name: 'Ash-Graven Drinking Horn',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '41.3% HP substat event catalyst unleashing an AoE HP-scaling damage shockwave every 15s; top free damage option at low ER needs.',
        },
        {
          name: "Jadefall's Splendor",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '49.6% HP substat with Energy recovery and elemental DMG bonus upon casting Burst.',
        },
        {
          name: 'Everlasting Moonglow',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '49.6% HP stat stick providing solid baseline HP scaling.',
        },
        {
          name: "Kagura's Verity",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '66.2% CRIT DMG stat stick providing high CRIT value.',
        },
      ],
    },
  },
  {
    avatarId: 10000086,
    skillDepotId: 8601,
    referenceKey: 'Wriothesley',
    displayName: 'Wriothesley',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-wriothesley-info', 'kqm-wriothesley-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        talentPriorityGroups: [['normal', 'skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['cryoDmg', 'atkPercent'],
          Circlet: ['critDmg', 'critRate'],
        },
        priorityStats: [
          'critDmg',
          'critRate',
          'atkPercent',
          'elementalMastery',
          'atk',
          'energyRecharge',
        ],
        sets: [
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+36% CRIT Rate and +15% Normal/Charged Attack DMG stacked continuously via Chilling Penalty HP drain and Rebuke self-healing)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Up to +40% CRIT Rate in Freeze teams against Frozen foes)',
          },
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+18% ATK and +50% DMG bonus in Burnmelt teams with Emilie/Nahida)',
          },
          {
            referenceKey: 'ShimenawasReminiscence',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+50% Normal/Charged Attack DMG at the cost of 15 Energy)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Normal and Charged Attack DMG)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Cryo DMG Bonus)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/wriothesley-quickguide/',
      playstyleSummary:
        "5-star Cryo Catalyst on-field carry and high-tempo martial brawler delivering rapid, visceral boxing combinations. Icefang Rush (Elemental Skill) initiates a forward sprint into the Chilling Penalty state: while above 50% HP, Wriothesley's Normal Attacks deal significantly enhanced Cryo DMG, consume 4.5% of his HP with each hit, and gain increased interruption resistance. When his HP drops below 60%, his A1 Passive grants Gracious Rebuke, transforming his next Charged Attack into Rebuke: Vaulting Fist—which consumes 0 Stamina, deals +50% DMG, and heals Wriothesley for 30% of his Max HP. Darkgold Wolfbite (Elemental Burst, 60 Energy cost) unleashes an icy straight followed by 5 rapid frontal icicle strikes and an Ousia-aligned Surging Blade. His A4 Passive Prosecution Edict grants up to +30% ATK as his HP fluctuates during combat. Excels in Reverse Melt, Burnmelt, and Freeze/Mono Cryo teams.",
      energyRequirements:
        'Burst costs 60 Energy. Pre-C2: 100%–120% ER (casting Burst every other rotation at the end of his field time is recommended to save time for his punch combos). C2+: 130%–150% ER (C2 provides up to +200% Burst DMG bonus based on A4 Prosecution Edict stacks, heavily rewarding Bursting every rotation).',
      combatTips: [
        'C0 Rotation Combo Loop: Under Skill, execute `5-6x [N3C(J)]` (3 Normal Attacks into a jump-canceled Charged Attack). This preserves stamina, maintains HP above 50% without requiring an external healer, and weaves in Rebuke heals cleanly.',
        'C1 Watershed (Terror for the Evildoers): C1 allows the 5th Normal Attack (N5) in his Skill state to automatically generate a Gracious Rebuke regardless of HP, boosts Rebuke damage by +200%, and extends Skill duration by 4s. Unlocks the optimal `3x [N5CD] -> N3CD` combo string!',
        'HP Threshold Mechanics: Enhanced Normal Attacks strictly require Wriothesley to remain above 50% HP. If playing without a dedicated healer at C0, avoid taking enemy damage so that Rebuke: Vaulting Fist can keep his HP above 50%.',
        'A4 Prosecution Edict Snapshot: Each HP increase or decrease during Skill grants 1 stack of Prosecution Edict (+6% ATK, max 5 stacks / +30% ATK). Always cast Burst at the very end of his field time to benefit from the maximum +30% ATK buff.',
        "Reverse Melt Timing: In Reverse Melt with Xiangling, Durin, or Bennett, Wriothesley's Normal Attack strings melt reliably on hits 1, 4, and his Charged Attacks. Avoid skipping straight into dash cancels to ensure Pyro aura persists on the target.",
        'Ousia Arkhe Alignment: Burst concludes with a Surging Blade dealing Ousia-aligned Cryo damage to stun Pneuma clockwork meka.',
      ],
      weapons: [
        {
          name: 'Cashflow Supervision',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 22.1% CRIT Rate, +14% ATK, and stacking Normal Attack (+48%), Charged Attack (+42%), and Attack SPD (+8%) buffs triggered continuously by HP changes.',
        },
        {
          name: "Tulaytullah's Remembrance",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High 674 Base ATK, 44.1% CRIT DMG, +10% Attack SPD, and up to +48% Normal Attack DMG bonus; exceptional runner-up to signature.',
        },
        {
          name: 'Reliquary of Truth',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Exceptional CRIT stats and unconditional EM/ATK bonuses; top-tier choice in Reverse Melt teams.',
        },
        {
          name: 'Vivid Notions',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Outstanding 5★ CRIT stat stick with massive damage bonuses, competing with signature in Freeze and Plunge teams.',
        },
        {
          name: 'Clash of Kings',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Battle Pass catalyst providing plentiful CRIT Rate, ATK%, and EM; at R5 competes with top 5★ options in Reverse Melt.',
        },
        {
          name: 'Tome of the Eternal Flow',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG stat stick granting bonus HP% and Charged Attack DMG upon HP fluctuation.',
        },
        {
          name: 'The Widsith',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Accessible 4★ catalyst with 55.1% CRIT DMG; all three Aria songs (ATK%, Elemental DMG%, EM) provide massive value in Reverse Melt.',
        },
        {
          name: 'Flowing Purity',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine craftable catalyst and best free weapon. Grants +16% to +32% Elemental DMG bonus upon clearing Bond of Life (pair with a healer or C4).',
        },
        {
          name: "Surf's Up",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '88.2% CRIT DMG stat stick with bonus HP and Normal Attack DMG bonus.',
        },
        {
          name: 'Lost Prayer to the Sacred Winds',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '33.1% CRIT Rate, +10% Movement SPD, and stacking elemental DMG bonus.',
        },
        {
          name: 'Memory of Dust',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'Massive ATK% stat stick doubling its ATK buffs when protected by a shield.',
        },
        {
          name: 'Mappa Mare',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable EM catalyst granting elemental DMG buffs upon triggering reactions in Reverse Melt.',
        },
        {
          name: 'Echoes of the Heart',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Natlan craftable catalyst providing ATK% and DMG buffs.',
        },
      ],
    },
  },
];
