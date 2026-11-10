import type { ReviewedCharacterProfile } from './identity';

export const v22Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000050,
    skillDepotId: 5001,
    referenceKey: 'Thoma',
    displayName: 'Thoma',
    defaultRoleId: 'reaction_trigger',
    evidenceIds: ['kqm-thoma-burgeon', 'kqm-thoma-support'],
    roles: [
      {
        id: 'reaction_trigger',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery', 'hpPercent'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'hpPercent', 'maxHp'],
        sets: [
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+80 EM and up to +140% Burgeon reaction DMG)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+80 EM and up to +150 EM party reaction buff)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc EM (+80 EM)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc EM (+80 EM)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc ER (+20% ER)',
          },
        ],
      },
      {
        id: 'shield_support',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent', 'critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['energyRecharge', 'hpPercent', 'maxHp', 'critRate'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Support (+20% Team ATK on Burst)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 1,
            label: 'Best in Slot Tank Hybrid (+20% HP)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 1,
            label: 'Best in Slot Tank Hybrid (+20% ER)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative Support (+120 Team EM on Elemental Reaction)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 2,
            label: 'Alternative in Burning / Kinich teams (-30% Dendro RES)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent'],
        },
        priorityStats: ['energyRecharge', 'hpPercent', 'maxHp'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Team Buffer (+20% Team ATK on Burst)',
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
      sourceUrl: 'https://keqingmains.com/q/thoma-quickguide/',
      playstyleSummary:
        "Premier off-field Burgeon trigger and defensive stacking shielder. In Burgeon compositions, Crimson Ooyoroi (Burst) triggers Fiery Collapses every second coordinated with the active character's Normal Attacks, detonating Dendro cores into rapid AoE Pyro Burgeon explosions. In shield support compositions, Blazing Barriers created by Skill and Burst repeatedly refresh duration and stack their damage absorption up to a high HP-based threshold, granting sustained interruption resistance and party buffs.",
      energyRequirements:
        'Very high 80-cost Burst with low personal energy generation. Solo Pyro Burgeon rotations require 190%–240% ER (lowered to ~165%–190% with C4 and R3+ Kitain Cross Spear). Shield support rotations with Favonius Lance require ~180%–220% ER.',
      combatTips: [
        'Level 90 is paramount for Burgeon: As a Transformative reaction, Burgeon damage scales solely from character level and Elemental Mastery (~30% damage increase from Lv 80 to 90).',
        'Fiery Collapse follows standard ICD (1U Pyro once every 3 hits or 2.5s). This is ideal for Burgeon, as it consistently ignites Bloom seeds every second without overtaking the Hydro/Dendro aura on enemies.',
        "When equipping Kitain Cross Spear, always cast Thoma's Burst BEFORE his Skill (Q -> E). This avoids Kitain's energy drain from consuming the energy needed for his Burst.",
        'Constellation 4 (Long-Term Planning) restores 15 flat Energy after casting Crimson Ooyoroi, dramatically easing his steep ER requirements across all teams.',
        "Constellation 6 (Burning Heart) increases all party members' Normal, Charged, and Plunging Attack DMG by 15% for 6s whenever a Blazing Barrier is gained or refreshed.",
      ],
      weapons: [
        {
          name: 'Kitain Cross Spear',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed Best in Slot craftable weapon for Burgeon. Provides 110 EM and its passive refunds up to 15 flat energy per Skill cast, significantly easing ER requirements (cast Q then E).',
        },
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Best in Slot weapon for Shield Support. Combines 30.6% ER with neutral energy particle generation for the entire party (requires ~30%–40% Crit Rate).',
        },
        {
          name: "Dragon's Bane",
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'High 221 EM substat maximizing raw Burgeon explosion damage, provided ER requirements are satisfied via artifact substats.',
        },
        {
          name: 'Rightful Reward',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable Fontaine polearm providing 27.6% HP substat to strengthen his shield and refunding up to 16 flat Energy when Thoma receives healing.',
        },
        {
          name: 'Black Tassel',
          tier: 1,
          rarity: 3,
          category: 'F2P',
          notes:
            'High-value budget option providing an immense 46.9% HP substat to maximize Blazing Barrier shield durability.',
        },
        {
          name: 'Ballad of the Fjords',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass polearm that grants up to 240 EM in multi-element Burgeon teams (Hydro + Dendro + Pyro).',
        },
        {
          name: 'Engulfing Lightning',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Stat stick offering massive ER (55.1%) and bonus ER after Burst cast to guarantee seamless Burst uptime.',
        },
        {
          name: 'Skyward Spine',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Offers 36.8% ER substat, high Base ATK, and a minor Crit Rate bonus for Favonius-like reliability.',
        },
      ],
    },
  },
];
