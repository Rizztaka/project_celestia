import type { ReviewedCharacterProfile } from './identity';

export const v14Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000045,
    skillDepotId: 4501,
    referenceKey: 'Rosaria',
    displayName: 'Rosaria',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-rosaria'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge', 'elementalMastery'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Support (Team +20% ATK on Burst)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Sub-DPS (Solves ER & Boosts Burst DMG)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Freeze: +40% Crit Rate)',
          },
          {
            referenceKey: 'Lavawalker',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Reverse Melt: +35% DMG vs Pyro)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Reverse Melt: +80 EM & ATK/EM Buffs)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Cryo DMG)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+20% Burst DMG)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate'],
        },
        priorityStats: ['critRate', 'energyRecharge', 'atk', 'critDmg'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% Team ATK on Burst)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+120 Team EM on Reaction)',
          },
          {
            referenceKey: 'TheExile',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team Energy Generation)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/rosaria-quickguide/',
      playstyleSummary:
        'Premier 4-star Cryo sub-DPS, battery, and team Crit Rate buffer. Drops Rites of Termination Ice Lance (which deals continuous tick damage with NO standard ICD, enabling consistent Reverse Melt triggers) and shares up to 15% Crit Rate to all party members via A4 Passive.',
      energyRequirements:
        '120% - 155% ER in Double Cryo; 180% - 210% ER in Solo Cryo (drops to 120% - 130% with C4 flat energy refund and multiple skill casts). Favonius Lance reduces ER requirements by ~15% - 20%.',
      combatTips: [
        'A1 Passive (Regina Probationum): Striking an opponent from behind with Ravaging Confession (E) grants Rosaria +12% Crit Rate for 5s.',
        "A4 Passive (Shadow Samaritan): Casting Rites of Termination (Q) increases all nearby party members' Crit Rate by 15% of Rosaria's Crit Rate for 10s (capped at 15% bonus at 100% Rosaria Crit Rate).",
        'Snapshotting Crit Buff: The +12% Crit Rate gained from A1 DOES snapshot into the A4 party Crit Rate buff! Always cast Skill from behind an enemy immediately before Burst (E -> Q) to share maximum Crit Rate.',
        "No ICD on Burst: Rosaria's Ice Lance pulses have no standard Internal Cooldown (ICD), allowing every tick to trigger Reverse Melt against a strong Pyro aura (Xiangling Pyronado / Sunfire).",
        'C2 extends Ice Lance duration by 4s (from 8s to 12s, boosting total ticks from 4 to 6).',
        "C6 reduces enemies' Physical RES by 20% for 10s on Burst hit, making Rosaria a top-tier support for Physical carries (Eula, Razor).",
      ],
      weapons: [
        {
          name: 'Staff of the Scarlet Sands',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Top 5-star option in Reverse Melt; massive 44.1% Crit Rate and converts EM to flat ATK',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Crit DMG and universal ATK boost scaling with HP',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Crit Rate substat helps cap A4 Crit share; high base ATK and ramping damage',
        },
        {
          name: 'The Catch',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'F2P fishing polearm; 45.9% ER with +32% Burst DMG and +12% Burst Crit Rate',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            'Top-tier utility weapon; huge ER and white particle generation to battery both Rosaria and the team',
        },
        {
          name: 'Deathmatch',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Massive 36.8% Crit Rate makes reaching 100% Crit Rate for A4 max buff effortless',
        },
        {
          name: "Dragon's Bane",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'High EM and damage bonus in Reverse Melt teams',
        },
        {
          name: 'Ballad of the Fjords',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Battle Pass polearm; Crit Rate and +120~240 EM in rainbow teams',
        },
        {
          name: 'White Tassel',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: 'Accessible 3-star weapon providing 23.4% Crit Rate',
        },
      ],
    },
  },
];
