import type { ReviewedCharacterProfile } from './identity';

export const v66Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000129,
    skillDepotId: 12901,
    referenceKey: 'Lohen',
    displayName: 'Lohen',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-lohen-driver-info', 'kqm-lohen-melt-info', 'kqm-lohen-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'ADayCarvedFromRisingWinds',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+40% ATK & +20% CRIT Rate upon completing Witch\'s Homework as a Hexerei character)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot with Furina (+15% Normal/Charged DMG & +36% CRIT Rate)',
          },
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot in Burnmelt Teams (+50% DMG while Burning is active)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 2,
            label:
              'Alternative in Freeze Compositions (+15% Cryo DMG & up to +40% CRIT Rate)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+18% ATK / +15% Cryo DMG / +80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/lohen-quickguide/',
      playstyleSummary:
        'Lohen is a 5-star Cryo Polearm on-field hypercarry and driver, a member of the Hexerei. With rapid Cryo slashes from his Elemental Skill, he excels as a forward-melt enabler for Durin or a personal reverse-melt carry with Burning/Nicole, while functioning as a potent Cryo carry in Freeze teams.',
      energyRequirements:
        '0% ER requirement (100% baseline). Lohen does not build Energy Recharge and uses his Burst when naturally available instead of sacrificing offensive stats.',
      combatTips: [
        'Zero ER Invariant: Lohen does not build Energy Recharge; his damage is overwhelmingly loaded into his Elemental Skill stance. Cast Burst whenever available as filler.',
        'Talent Priority (Skill > Burst >> NA): Skill levels govern his enhanced Cryo strikes and damage multipliers. Normal Attack talent is not utilized and remains at Level 1.',
        'Hexerei Synergy: As a Hexerei character, Lohen activates Witch\'s Homework and 4pc A Day Carved From Rising Winds (+20% CRIT Rate) when paired with Hexerei teammates like Nicole, Durin, or Prune.',
        'Melt Driver Dynamics: Lohen\'s rapid Cryo application allows off-field Pyro sub-DPS units (Durin / Xiangling) to trigger massive Forward Melt hits, while in Burning teams Lohen triggers continuous Reverse Melt.',
      ],
      weapons: [
        {
          name: 'Disaster & Remorse',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (Tailored Base ATK, CRIT stats and stacking Cryo DMG multipliers)',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (22.1% CRIT Rate, high Base ATK and stacking ATK% buffs on on-field hits)',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Premier Stat Stick (66.2% CRIT DMG & HP-to-ATK conversion)',
        },
        {
          name: 'Calamity Queller',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ High Base ATK Alternative (741 Base ATK and generous Elemental DMG buffs)',
        },
        {
          name: 'Staff of the Scarlet Sands',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Melt BiS Alternative (44.1% CRIT Rate & converts EM to Flat ATK)',
        },
        {
          name: 'Lumidouce Elegy',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick (33.1% CRIT Rate and ATK buffs in Burnmelt setups)',
        },
        {
          name: 'Deathmatch',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Battle Pass BiS (36.8% CRIT Rate and strong single-target ATK buffs)',
        },
        {
          name: 'Blackcliff Pole',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: '4★ Shop F2P BiS (55.1% CRIT DMG secondary stat)',
        },
        {
          name: 'Ballad of the Fjords',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Battle Pass Alternative (27.6% CRIT Rate & +120–240 EM in multi-element teams)',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: '4★ Utility Battery Alternative (Generates neutral particles on CRIT to battery team)',
        },
        {
          name: 'White Tassel',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: '3★ F2P Stat Stick (23.4% CRIT Rate and Normal Attack DMG bonus)',
        },
      ],
    },
  },
  {
    avatarId: 10000131,
    skillDepotId: 13101,
    referenceKey: 'Nicole',
    displayName: 'Nicole',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-nicole-info', 'kqm-nicole-guide'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['atkPercent'],
          Circlet: ['atkPercent'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
        },
        priorityStats: ['energyRecharge', 'atkPercent'],
        sets: [
          {
            referenceKey: 'CelestialGift',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% ER & +40% Elemental DMG bonus to Anemo and Pyro across 2 Hexerei characters)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+20% Teamwide ATK for 12s on Burst)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+40% Teamwide Elemental DMG bonus upon triggering reaction)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+18% ATK / +18% ATK / +20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/nicole-quickguide/',
      playstyleSummary:
        'Nicole is a 5-star Pyro Catalyst user, a prominent Hexerei witch and premier off-field shielder/buffer. She provides teamwide Flat ATK buffs scaled from her total ATK, a sturdy Pyro shield, coordinated off-field Pyro attacks via her Burst, and full synergy with 4pc Celestial Gift to empower hypercarries like Varka, Durin, and Lohen.',
      energyRequirements:
        '200–230% ER as Solo Pyro; drops by ~30–50% with signature weapon Angelos Heptades, by ~20–50% with +1 Pyro (Durin/Bennett) or Venti, and by ~10–20% per Favonius proc. In pure Skill buffer/shielder rotations where Burst is omitted, ER can be completely ignored.',
      combatTips: [
        'Triple ATK% Main Stat Priority: Nicole\'s shield absorption and teamwide Flat ATK buff scale exclusively from her total ATK. Triple ATK% (Sands, Goblet, Circlet) with ER substats maximizes her utility.',
        'Talent Priority (Skill > Burst >> NA): Skill provides her shield and Flat ATK sharing; Burst adds coordinated Pyro strikes. Her Normal Attack contributes negligible utility and should remain at Level 1.',
        'Hexerei Backbone (Durcole & Varka Cores): Pair Nicole with Hexerei teammates (Durin, Prune, Varka, Lohen) to activate the full 2-character requirement of 4pc Celestial Gift (+40% teamwide Elemental DMG%).',
        'Flexible Burst Invariant: In short buff window rotations or high-ER requirements without Pyro batteries, Nicole can skip casting Burst entirely to preserve field time and zero out ER constraints.',
      ],
      weapons: [
        {
          name: 'Angelos Heptades',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (Massive ATK% secondary stat, teamwide ATK buffs, and personal Energy refund)',
        },
        {
          name: 'Skyward Atlas',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ High Base ATK Alternative (674 Base ATK and generous unconditional ATK% buffs)',
        },
        {
          name: 'Cashflow Supervision',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick (674 High Base ATK to maximize Flat ATK sharing)',
        },
        {
          name: 'Memory of Dust',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Shield ATK Alternative (Massive ATK% bonuses while protected by her own shield)',
        },
        {
          name: "Kagura's Verity",
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick (608 Base ATK and Skill DMG buffs)',
        },
        {
          name: 'Oathsworn Eye',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Event BiS (565 Base ATK, +27.6% ATK & +48% ER after Skill cast; optimal ER/ATK hybrid)',
        },
        {
          name: 'Flowing Purity',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (565 High Base ATK & ATK% bonuses accessible to all players)',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            '4★ Utility Battery BiS (45.9% ER & neutral energy particle generation on CRIT)',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 1,
          category: 'Utility',
          notes:
            '3★ Premier Team Buff BiS (+48% ATK buff to the incoming carry; excels in hypercarry teams)',
        },
        {
          name: 'Wine and Song',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Gacha Alternative (565 Base ATK and ER secondary stat)',
        },
        {
          name: 'Hakushin Ring',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable Alternative (565 Base ATK and ER in Electro teams)',
        },
        {
          name: 'Wandering Evenstar',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Support Alternative (Shares ATK to teammates based on EM)',
        },
      ],
    },
  },
  {
    avatarId: 10000132,
    skillDepotId: 13201,
    referenceKey: 'Prune',
    displayName: 'Prune',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-prune-info', 'kqm-prune-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: [],
        talentPriorityGroups: [],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['atkPercent'],
          Circlet: ['atkPercent', 'critRate'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'critRate'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (-40% Elemental RES shred to swirled elements; unrivaled team damage amplification)',
          },
          {
            referenceKey: 'CelestialGift',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot in Hexerei Compositions (+20% ER & +40% Elemental DMG bonus across 2 Hexerei characters)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+40% Teamwide Elemental DMG bonus upon triggering reaction)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+20% Teamwide ATK for 12s on Burst)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+18% ATK / +20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/prune-quickguide/',
      playstyleSummary:
        'Prune is a 4-star Anemo Catalyst buffer and Hexerei member. She provides teamwide DMG Bonus based on her ATK (A4), an active character 30% ATK buff (Hexerei passive), and at C6 grants 350 Flat ATK to the active carry. She serves as the premier Anemo/Hexerei buffer for Varka, Lohen, and Durin.',
      energyRequirements:
        '245–285% ER as Solo Anemo; 185–205% with +1 Anemo. Favonius Codex reduces ER requirements by 30–60%. C1 reduces ER requirements by 30–50%.',
      combatTips: [
        'Zero Talent Investment Invariant: Prune\'s buffing capabilities scale from her ATK stat and passive talents, not talent multipliers. All three talents (Normal Attack, Skill, Burst) can comfortably remain at Level 1.',
        'Level 80/90 Sufficiency: Leveling Prune from 80/90 to 90 provides only a minuscule increase to base ATK; resources are better spent optimizing artifact main stats and ER substats.',
        'High ER Invariant & Favonius Codex: With severe ER requirements (245–285% solo Anemo), Favonius Codex paired with a CRIT Rate circlet or high ER Sands is practically mandatory for reliable Burst rotations.',
        'Varka Premier Buffer: Prune simultaneously fulfills both the Anemo resonance and Hexerei teammate requirements for Varka, granting teamwide DMG% and massive ATK buffs.',
      ],
      weapons: [
        {
          name: 'Skyward Atlas',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ High Base ATK BiS (674 Base ATK maximizes her ATK-scaling teamwide DMG% buff)',
        },
        {
          name: 'Memory of Dust',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ High ATK Alternative (Generous ATK% bonuses to amplify her A4 buff ceiling)',
        },
        {
          name: 'Cashflow Supervision',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Stat Stick (674 High Base ATK)',
        },
        {
          name: 'Oathsworn Eye',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Event BiS (565 Base ATK & +48% ER after Skill cast; excellent balance of ATK and ER)',
        },
        {
          name: 'Flowing Purity',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (565 High Base ATK & craftable ATK% bonus accessible to all)',
        },
        {
          name: 'Favonius Codex',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            '4★ Utility Battery BiS (45.9% ER & neutral energy particles on CRIT to manage high ER demands)',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 1,
          category: 'Utility',
          notes:
            '3★ Hypercarry Buffer BiS (+48% ATK buff to the incoming carry; massive damage spike for Varka or Lohen)',
        },
        {
          name: 'Wine and Song',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Gacha Alternative (565 Base ATK and ER secondary stat)',
        },
        {
          name: 'Hakushin Ring',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable Alternative (565 Base ATK and ER secondary stat)',
        },
        {
          name: 'Wandering Evenstar',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Support Alternative (Shares ATK to party based on EM)',
        },
      ],
    },
  },
];
