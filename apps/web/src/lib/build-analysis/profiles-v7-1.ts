import type { ReviewedCharacterProfile } from './identity';

export const v71Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000140,
    skillDepotId: 14001,
    referenceKey: 'Vodyanitsa',
    displayName: 'Vodyanitsa',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-vodyanitsa-info', 'kqm-vodyanitsa-guide'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent'],
        },
        priorityStats: ['hpPercent', 'maxHp', 'energyRecharge', 'critRate'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot in ATK-Scaling Teams (+20% HP & continuous +20% Teamwide ATK refreshed by off-field Skill)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 1,
            label:
              'Best in Slot 2pc HP + 2pc HP in Non-ATK Teams (+20% HP / +20% HP with TotM for Neuvillette or Mizuki)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+40% Teamwide Elemental DMG bonus upon triggering reaction)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 4,
            tier: 2,
            label:
              'Alternative in Geo Compositions (+35% Elemental DMG on picking Crystallize shard)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 3,
            label: 'Transitional Healer Set (Converts continuous healing into Physical damage bubbles)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent'],
        },
        priorityStats: ['hpPercent', 'maxHp', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Support (+20% HP & continuous +20% Teamwide ATK to active carry)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+40% Teamwide Elemental DMG bonus upon triggering reaction)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 4,
            tier: 2,
            label:
              'Alternative with Geo Carries (+35% Elemental DMG on Crystallize shard)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/vodyanitsa-quickguide/',
      playstyleSummary:
        'Vodyanitsa is a 5-star Hydro Catalyst off-field support and healer. Her Elemental Skill summons the Horn of Spring\'s Call, which attacks in AoE every 3s, shreds Hydro and Cryo RES, heals the active character based on Max HP, and provides interruption resistance. Her A4 Dirge of the Fandyr grants Lead Vocal and Chorus stacks delivering massive Additive Base DMG to Hydro/Cryo and Stellar Swirl attacks scaling with her HP over 40,000 (up to 65,000 HP).',
      energyRequirements:
        'Zero ER requirement (100% baseline) in most teams, where Vodyanitsa skips Burst or casts it whenever naturally available as downtime filler. In teams with primarily Hydro damage dealers where Burst is used every rotation: 145–155% with Prototype Amber in Double Hydro, or 100–130% in Triple Hydro.',
      combatTips: [
        'Zero ER Invariant in Standard Teams: Vodyanitsa\'s Burst deals simple Hydro damage and provides no team utility. In most teams, skip Bursting entirely or cast when naturally available; building ER sacrifices valuable HP% rolls.',
        'Triple HP% Main Stat Priority: Healing, A4 Additive Base DMG buffs (Lead Vocal / Chorus), and C1 all scale exclusively from Max HP. Maximize HP% across Sands, Goblet, and Circlet to approach her 65,000 HP cap.',
        'Talent Priority (Skill > Character Level 90 > Burst): Elemental Skill governs her Hydro/Cryo RES shred and healing; Level 90 is critical for base HP and A4 scaling. Normal Attack remains at Level 1.',
        'Stellar Swirl Support & Anemo Shred (A1): In Stellar Swirl teams, generating or detonating a Wandering Vortex shreds Anemo RES by 35% and extends Radiance: Stellar Swirl by 4s, making her an elite partner for Vesna and Mizuki.',
      ],
      weapons: [
        {
          name: 'Hymn of the Maelstrom',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (Buffs HP and provides up to +42% ATK to the on-fielder at 60k HP)',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          rarity: 3,
          tier: 1,
          category: 'Utility',
          notes:
            '3★ Premier Team Buff BiS (+48% ATK buff to the incoming carry; rivals signature in 20s+ rotations with ATK-scaling carries)',
        },
        {
          name: 'Prototype Amber',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (41.3% HP, teamwide flat energy, and team healing; premier option for HP-scaling carries or Burst rotations)',
        },
        {
          name: 'Ash-Graven Drinking Horn',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Event F2P BiS (41.3% HP secondary stat and HP-scaling physical procs; great free option in non-burst setups)',
        },
        {
          name: 'Sacrificial Jade',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Battle Pass Alternative (HP% and CRIT Rate; valuable at high refinements)',
        },
        {
          name: 'Everlasting Moonglow',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (49.6% HP secondary stat)',
        },
        {
          name: "Jadefall's Splendor",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (49.6% HP secondary stat)',
        },
      ],
    },
  },
  {
    avatarId: 10000143,
    skillDepotId: 14301,
    referenceKey: 'Vesna',
    displayName: 'Vesna',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-vesna-info'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['atkPercent', 'elementalMastery'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
          Goblet: { elementalMastery: 'reaction_context' },
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'ScarletProof',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot by far (Tailor-made set significantly ahead of other options for on-field Stellar Swirl DPS)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+80 EM & up to +42% ATK / +150 EM from reactions)',
          },
          {
            referenceKey: 'ADayCarvedFromRisingWinds',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Provides high ATK% bonus)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+18% ATK / +80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://kqm-uploads.keqingmains.com/wp-content/uploads/2026/09/Vesna-Infographic-7.1.png',
      playstyleSummary:
        'Vesna is a 5-star Anemo Sword on-field DPS specializing in Stellar Swirl reactions with Cryo. Her Elemental Skill enters Armed for Action mode, infusing her strikes with Anemo, summoning wind pinions that generate Sword Essence, and unleashing Windborne Sword Lv. 1–3 and Spirit Blades that deal devastating Stellar Swirl reaction damage.',
      energyRequirements:
        '125–135% ER when paired with C6 Faruzan, a Favonius teammate, and her signature weapon Beyond the Chrysalis. Without all of the above, Vesna should forgo building ER (100% baseline) and cast Burst only when naturally available.',
      combatTips: [
        'Zero ER Invariant Without Battery Core: Building high ER without C6 Faruzan and Chrysalis is a net DPS loss. Vesna should forgo building ER and cast Burst whenever available, maximizing offensive CRIT, ATK%, and EM stats.',
        'At Most 1 EM Main Stat: Use at most 1 EM main stat (Sands or Goblet), and only when the team lacks external EM buffers; ATK% and CRIT provide superior scaling across her kit.',
        'Talent Priority (Skill > Burst >> NA): Skill talent levels directly govern Armed for Action and Windborne Sword damage. Normal Attack talent remains at Level 1.',
        'Vodyanitsa Synergy: Vodyanitsa\'s 35% Anemo RES shred and Additive Base DMG buff for Stellar Swirl heavily outweigh her slower Hydro aura, making her Vesna\'s premier companion.',
      ],
      weapons: [
        {
          name: 'Beyond the Chrysalis',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (Tailor-made for Armed for Action and Spirit Blade damage multipliers)',
        },
        {
          name: 'Whitelake Frostfeather',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Wish Alternative (Buffs Stellar Glimmer reaction damage and provides energy utility)',
        },
        {
          name: 'New Bough',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Wish Alternative (High Base ATK and offensive passives)',
        },
        {
          name: "Heretic's Molten Blade",
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Battle Pass BiS (High damage bonuses to her Elemental Skill attacks)',
        },
        {
          name: 'Emberwell',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (Sandrone\'s and Vesna\'s premier accessible craftable sword)',
        },
        {
          name: 'Absolution',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (High Base ATK & 44.1% CRIT DMG)',
        },
        {
          name: 'Azurelight',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (CRIT stats and offensive buffs)',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (44.1% CRIT Rate & HP-to-ATK conversion)',
        },
        {
          name: 'Finale of the Deep',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable Alternative (High ATK% bonuses from Bond of Life)',
        },
        {
          name: 'Wolf-Fang',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Battle Pass Alternative (27.6% CRIT Rate & Skill DMG buffs)',
        },
      ],
    },
  },
];
