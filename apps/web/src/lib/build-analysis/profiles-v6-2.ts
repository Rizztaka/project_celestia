import type { ReviewedCharacterProfile } from './identity';

export const v62Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000123,
    skillDepotId: 12301,
    referenceKey: 'Durin',
    displayName: 'Durin',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-durin-support-info', 'kqm-durin-dps-info', 'kqm-durin-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['atkPercent', 'pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
          Goblet: { atkPercent: 'team_buffs' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'CelestialGift',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot for Hexerei Teams (+20% ER & teamwide Elemental DMG% buffs across 2 Hexerei characters)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative (+20% Teamwide ATK for 12s upon casting Burst)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot in Dendro Teams (-30% Dendro RES shred for on-field carry)',
          },
          {
            referenceKey: 'ADayCarvedFromRisingWinds',
            pieces: 4,
            tier: 2,
            label:
              'Alternative for Hybrid Support / Personal Damage (ATK% and CRIT Rate bonuses)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+40% Teamwide Elemental DMG bonus upon triggering reaction)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+18% ATK / +20% ER / +15% Pyro DMG)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'ADayCarvedFromRisingWinds',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (Unequivocal best personal DPS set; grants massive ATK% and CRIT Rate bonuses upon Witch\'s Homework completion)',
          },
          {
            referenceKey: 'CelestialGift',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot in Hexerei Compositions (+20% ER & personal/team DMG%)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% Teamwide ATK on Burst)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+18% ATK / +15% Pyro DMG / +80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/durin-quickguide/',
      playstyleSummary:
        'Durin is a 5-star Pyro Sword character capable of shifting between off-field support (Light state) and potent Burst DPS (Darkness state). He provides reliable off-field Pyro application, elemental resistance shred (elevated with another Hexerei teammate), and massive Burst Melt/Vape detonations.',
      energyRequirements:
        '120-150% as Solo Pyro; 100-150% with +1 Pyro; 100-110% with +2 Pyros; +15% per missed Favonius proc.',
      combatTips: [
        'Dual Stance Mechanics (Light vs Darkness): Durin operates in two distinct states—Light (off-field support, applying Pyro and granting team buffs and RES shred) and Darkness (on-field/burst DPS, converting his strikes into massive Melt/Vape damage).',
        'Hexerei Synergy & A1 RES Shred: Having at least one other Hexerei character (e.g. Nicole, Alice, Prune) on the team maxes out Durin\'s A1 passive resistance shred and Melt/Vape damage amplification.',
        'Durcole Duo (Durin + Nicole): Nicole provides a sturdy shield, teamwide ATK buffs, and holds 4pc Celestial Gift, forming a premier support backbone that elevates on-field hypercarries like Varka, Arlecchino, and Lohen.',
        'Talent Priority (Burst > Skill >> NA): Both his support utility and burst nukes scale primarily from his Elemental Burst, followed by Skill. His Normal Attack contributes negligible damage and should remain at Level 1.',
      ],
      weapons: [
        {
          name: 'Athame Artis',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature Sword and undisputed Best-in-Slot. CRIT Rate secondary stat, Burst DMG%, and ATK% buffs maximized when paired with at least one other Hexerei teammate.',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Top Alternative. Massive 44.1% CRIT Rate and unconditional HP-to-ATK conversion.',
        },
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Top Alternative. 674 Base ATK, 44.1% CRIT DMG, and elemental DMG% buffs on Burst and normal rotations.',
        },
        {
          name: 'Haran Geppaku Futsu',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick offering 33.1% CRIT Rate and unconditional +12% Elemental DMG bonus.',
        },
        {
          name: 'Azurelight',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick offering 33.1% CRIT Rate and generous offensive buffs.',
        },
        {
          name: 'Absolution',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick offering 44.1% CRIT DMG.',
        },
        {
          name: 'Wolf-Fang',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Battle Pass BiS. Premier 4★ option offering CRIT Rate and ramping Skill/Burst DMG bonus; competes directly with 5★ options at R5.',
        },
        {
          name: 'New Bough',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Banner-Exclusive Alternative. Easily maintains full stacks for generous ATK% and EM buffs in Melt/Vape teams.',
        },
        {
          name: "Moonweaver's Dawn",
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Quest Free F2P. Best freely accessible sword from Echoes of an Unfinished Past offering high ATK and Burst buffs.',
        },
        {
          name: "Lion's Roar",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Alternative offering up to +36% DMG bonus against enemies affected by Pyro or Electro (ideal for Overloaded and Burning teams).',
        },
        {
          name: 'Finale of the Deep',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P Alternative. High ATK% secondary stat and flat ATK buffs on clearing Bond of Life.',
        },
      ],
    },
  },
  {
    avatarId: 10000124,
    skillDepotId: 12401,
    referenceKey: 'Jahoda',
    displayName: 'Jahoda',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-jahoda-info', 'kqm-jahoda-guide'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['atkPercent'],
          Circlet: ['critRate', 'healingBonus', 'atkPercent'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
          Sands: { energyRecharge: 'team_buffs' },
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'critRate'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (-40% Elemental RES Shred upon Swirling absorbed elements; premier team offensive amplifier)',
          },
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot for Moonsign Teams (+20% ER & +60-120 Teamwide EM depending on Moonsign level)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+20% HP & continuous +20% Teamwide ATK via periodic Skill hits in Ascendant Gleam)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+120 Teamwide EM upon triggering reaction; optimal in Nefer teams)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 2,
            label: 'Alternative in Nefer Teams (-30% Dendro RES shred)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+20% ER / +18% ATK combinations)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['atkPercent'],
          Circlet: ['critRate', 'healingBonus'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'atkPercent'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (-40% RES Shred on Swirl)',
          },
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% ER & +60-120 Team EM)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% Teamwide ATK)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+120 Teamwide EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/jahoda-quickguide/',
      playstyleSummary:
        'Jahoda is a 4-star Anemo Bow healer, buffer, and enabler. In Ascendant Gleam teams, she charges her Purr-loined Treasure Flask with absorbed elements (PHEC) to provide off-field elemental application, partywide healing scaling from ATK, and Moonsign elevation.',
      energyRequirements:
        '240-300%+ as Solo Anemo; 225-250% with +2 Electro; 165-215% with +1 Anemo; C4 or Favonius Warbow reduces requirements by ~35-50%.',
      combatTips: [
        'ATK-Scaling Party Sustainer: Jahoda\'s healing scales directly with her ATK stat. Prioritize reaching her steep ER requirements first (via ER Sands and substats), then invest into ATK% and CRIT Rate (for Favonius Warbow procs).',
        'Purr-loined Treasure Flask Absorption: In Ascendant Gleam teams, Jahoda\'s Skill absorbs Pyro, Hydro, Electro, or Cryo from opponents, charging her flask to unleash coordinated off-field elemental strikes alongside team attacks.',
        'Favonius Warbow Priority: Given her extreme 240-300%+ ER requirements as solo Anemo, Favonius Warbow is her premier weapon by a landslide, generating neutral particles that ease both her own and her teammates\' burst rotations.',
        'C6 Moonsign Buff Ceiling: At C6, Jahoda\'s Burst bestows massive CRIT stats upon Moonsign teammates, establishing her as a premier offensive support in Nod-Krai compositions.',
        'Talent Priority (Burst > Skill >> NA): Level her Burst to maximize party healing output. Her personal Skill damage is negligible and Normal Attacks should stay at Level 1.',
      ],
      weapons: [
        {
          name: 'Elegy for the End',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature Support Bow. 55.1% ER secondary stat and teamwide +100 EM and +20% ATK buffs activated rapidly via her multi-hit Skill and Burst.',
        },
        {
          name: 'Favonius Warbow',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Undisputed F2P/Support BiS. 61.3% ER and 6 neutral particles on CRIT slash her extreme 240-300% ER requirements while battery-charging the team.',
        },
        {
          name: 'Snare Hook',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable ER Bow with supportive energy refund mechanics.',
        },
        {
          name: "Rainbow Serpent's Rain Bow",
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Event-Limited ER Bow. Provides ER and ATK% buffs that directly elevate her healing ceiling.',
        },
        {
          name: 'End of the Line',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: '4★ Fishing F2P Bow offering 45.9% ER.',
        },
      ],
    },
  },
];
