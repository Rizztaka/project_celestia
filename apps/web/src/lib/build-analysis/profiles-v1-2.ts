import type { ReviewedCharacterProfile } from './identity';

export const v12Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000038,
    skillDepotId: 3801,
    referenceKey: 'Albedo',
    displayName: 'Albedo',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-albedo'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['defPercent'],
          Goblet: ['geoDmg', 'defPercent'],
          Circlet: ['critRate', 'critDmg', 'defPercent'],
        },
        priorityStats: ['def', 'critRate', 'critDmg', 'energyRecharge'],
        sets: [
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Best in Slot (+70% Skill DMG off-field)' },
          { referenceKey: 'HuskOfOpulentDreams', pieces: 4, tier: 1, label: 'Best in Slot Alternative (+54% DEF, +24% Geo DMG)' },
          { referenceKey: 'ArchaicPetra', pieces: 4, tier: 2, label: 'Alternative (35% Team Elemental DMG on Crystallize)' },
          { referenceKey: 'GoldenTroupe', pieces: 2, tier: 2, label: 'Alternative 2pc (+20% Skill DMG)' },
          { referenceKey: 'HuskOfOpulentDreams', pieces: 2, tier: 2, label: 'Alternative 2pc (+30% DEF)' },
          { referenceKey: 'ArchaicPetra', pieces: 2, tier: 2, label: 'Alternative 2pc (+15% Geo DMG)' },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['defPercent', 'energyRecharge'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'def', 'critRate', 'critDmg'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (Team ATK on Burst)' },
          { referenceKey: 'ArchaicPetra', pieces: 4, tier: 1, label: 'Best in Slot (35% Team Elemental DMG)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/albedo-quickguide/',
      playstyleSummary:
        'Low-field-time off-field Geo sub-DPS and universal flex battery. Places Solar Isotoma (lasting 30s with an 8s cooldown) which procs Transient Blossoms every 2 seconds whenever enemies take damage within the field. His 40-cost Burst shares +125 Elemental Mastery with all party members for 10s via A4 Passive.',
      energyRequirements:
        '100% - 120% ER; 40 energy cost is extremely low, but casting burst can be skipped if playing pure DEF skill build.',
      combatTips: [
        'Solar Isotoma Transient Blossoms scale purely off DEF; leveling Normal Attack is useless, and Burst only scales off ATK (unless C2).',
        'A4 Passive (Homuncular Nature) grants party members 125 Elemental Mastery for 10 seconds after casting Rite of Progeniture (Q), making Albedo a potent flex pick in reaction teams (Hu Tao double Geo).',
        'Solar Isotoma is a Geo construct and can be destroyed instantly if placed directly underneath large bosses; place it slightly to the side.',
        'Transient Blossoms deal 25% more damage against enemies below 50% HP (A1 Passive).',
      ],
      weapons: [
        {
          name: 'Cinnabar Spindle',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Event-exclusive custom signature sword; provides 69% DEF and increases Skill DMG by 80% of DEF',
        },
        {
          name: 'Uraku Misugiri',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Chiori signature sword; massive Crit DMG, +DEF, and +48% Skill DMG on Geo trigger',
        },
        {
          name: 'Harbinger of Dawn',
          rarity: 3,
          tier: 1,
          category: 'Alternative',
          notes: 'Incredible 3-star F2P weapon; grants 28% Crit Rate and 46.9% Crit DMG as long as HP stays above 90% (trivial from off-field)',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'Massive 44.1% Crit Rate eases artifact balancing',
        },
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High Crit DMG and elemental DMG bonus',
        },
        {
          name: 'Peak Patrol Song',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'DEF% substat with team all-elemental damage buffs',
        },
      ],
    },
  },
  {
    avatarId: 10000037,
    skillDepotId: 3701,
    referenceKey: 'Ganyu',
    displayName: 'Ganyu',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-ganyu'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['cryoDmg'],
          Circlet: ['critDmg', 'critRate'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['critDmg', 'critRate', 'atk', 'elementalMastery', 'energyRecharge'],
        sets: [
          { referenceKey: 'WanderersTroupe', pieces: 4, tier: 1, label: 'Best in Slot (Melt: +80 EM, +35% Charged Attack)' },
          { referenceKey: 'ShimenawasReminiscence', pieces: 4, tier: 1, label: 'Best in Slot (Melt: +50% Charged Attack)' },
          { referenceKey: 'BlizzardStrayer', pieces: 4, tier: 1, label: 'Best in Slot (Freeze: +40% Crit Rate)' },
          { referenceKey: 'UnfinishedReverie', pieces: 4, tier: 2, label: 'Alternative (Burn-Melt: +50% All-DMG)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 2, label: 'Alternative (with Furina)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk'],
        sets: [
          { referenceKey: 'EmblemOfSeveredFate', pieces: 4, tier: 1, label: 'Best in Slot (Burst Uptime & DMG)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (Team ATK Buff)' },
          { referenceKey: 'BlizzardStrayer', pieces: 2, tier: 2, label: 'Alternative 2pc (+15% Cryo)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/ganyu-quickguide/',
      playstyleSummary:
        'Legendary Charged Attack sniper and quadratic AoE Burst DPS. Fires Frostflake Arrows that detonate into expansive Frostflake Blooms (dealing massive Cryo damage twice per shot with no cooldown), or rains perpetual Cryo icicles inside Celestial Shower that grants +20% Cryo DMG bonus to active allies.',
      energyRequirements:
        '100% in Melt (Burst is often omitted to avoid stealing Pyro aura); 140% - 160% in Freeze or Sub-DPS rotations to sustain Celestial Shower.',
      combatTips: [
        'In Melt teams (with Xiangling/Bennett or Sunfire/Nahida burn), do NOT cast Celestial Shower (Q) unless your Pyro application is overwhelming, as its rapid icicles will steal the Pyro aura and prevent Frostflake Blooms from melting.',
        'In Freeze teams (Morgana with Venti and Mona), Celestial Shower icicles scale quadratically with tightly grouped enemies: each enemy spawns its own icicle drop that deals AoE damage to all surrounding foes.',
        'A1 Passive (Undivided Heart) grants subsequent Frostflake Arrows and Blooms +20% Crit Rate for 5s after firing a Frostflake Arrow.',
        'Charged shot timing: Frostflake Arrow takes ~1.5 to 2 seconds to charge; cancel the end of the shot animation with aim toggle or dash to fire more shots per minute.',
      ],
      weapons: [
        {
          name: 'Hunter\'s Path',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Exceptional in Melt; massive Crit Rate and converts EM into enormous Charged Attack flat damage',
        },
        {
          name: 'The First Great Magic',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Crit DMG, movement speed, and massive Charged Attack damage bonus',
        },
        {
          name: 'Aqua Simulacra',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Huge 88.2% Crit DMG with unconditional 20% all-DMG bonus',
        },
        {
          name: 'Amos\' Bow',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Thematic signature bow; ramps up Frostflake Bloom damage significantly with flight time',
        },
        {
          name: 'Polar Star',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'High Crit stats and unconditional attack buffs',
        },
        {
          name: 'Hamayumi',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: 'Inazuma craftable bow boosting Normal/Charged Attack; perfect for Melt where Burst is held',
        },
        {
          name: 'Prototype Crescent',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Craftable bow granting immense ATK% and movement speed buffs upon hitting enemy weak spots',
        },
        {
          name: 'Song of Stillness',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Fontaine craftable bow granting all-DMG bonus after receiving healing',
        },
      ],
    },
  },
];
