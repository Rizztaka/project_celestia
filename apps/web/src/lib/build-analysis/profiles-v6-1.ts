import type { ReviewedCharacterProfile } from './identity';

export const v61Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000122,
    skillDepotId: 12201,
    referenceKey: 'Nefer',
    displayName: 'Nefer',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-nefer-info', 'kqm-nefer-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        conditionalMainStats: {
          Circlet: { elementalMastery: 'team_buffs' },
        },
        priorityStats: ['elementalMastery', 'critRate', 'critDmg'],
        sets: [
          {
            referenceKey: 'NightOfTheSkysUnveiling',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+30% CRIT Rate, +10% Lunar-Bloom DMG Bonus & +80 EM at Ascendant Gleam; best set by a wide margin)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label:
              "Alternative (+80 EM & up to +150 EM; solid placeholder while farming 4pc Sky's Unveiling)",
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc mix (+80 EM / +80 EM combinations)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/nefer-quickguide/',
      playstyleSummary:
        'Nefer is a 5-star Dendro Catalyst on-field DPS centered around the Lunar-Bloom reaction. Entering her special Shadow Dance state via Elemental Skill, she unleashes devastating special Charged Attacks that consume Verdant Dew to deal massive Dendro and Lunar-Bloom damage.',
      energyRequirements:
        'Nefer should NOT build Energy Recharge (0% additional ER / 100% baseline). Her Burst is only cast as a tactical downtime filler during dash cancel combos when waiting for Verdant Dew generation.',
      combatTips: [
        "Skill Priority Invariant (Skill >> Burst >> NA): Nefer's personal damage is overwhelmingly concentrated in her Shadow Dance enhanced Charged Attacks, which scale from Elemental Skill talent levels and EM. Character Level 80/90 is sufficient for talent levels and A6 CRIT DMG (Lunar-Bloom does not scale with character level). Her Normal Attack should remain at Level 1.",
        'Zero ER Invariant (100% Base ER): Never build ER substats or ER sands on Nefer. All offensive stat budget must be invested strictly into CRIT and EM.',
        'Dash-Cancel Tech (E 3[CD] E CD CQ CD): Dash-canceling her special Charged Attacks accelerates rotation tempo and provides continuous invulnerability frames (i-frames), eliminating the need for a dedicated shielder or healer.',
        'Lauma Synergy (Ascendant Gleam & RES Shred): Nefer requires at least one Nod-Krai teammate to achieve Moonsign: Ascendant Gleam. Lauma is her premier support by far, providing simultaneous Hydro/Dendro RES shred, off-field Dendro application, and Moonsign elevation.',
        'Reliquary of Truth & EM Circlet: When equipped with her signature 5★ weapon Reliquary of Truth (124.2% CRIT DMG, 8% CRIT Rate, 120 EM), an EM Circlet becomes fully competitive with a CRIT Circlet due to weapon CRIT oversaturation.',
      ],
      weapons: [
        {
          name: 'Reliquary of Truth',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature Catalyst and undisputed Best-in-Slot. Grants massive 124.2% CRIT DMG, 8% CRIT Rate, and 120 EM; comparable to a full constellation upgrade over F2P craftables.',
        },
        {
          name: "Nightweaver's Looking Glass",
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ Premier Alternative. High EM secondary stat and Lunar-Bloom DMG% bonus make this her second-best weapon option.',
        },
        {
          name: 'Dawning Frost',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Banner-Exclusive Alternative. Scales exceptionally well with refinement to become her third-best weapon at R5.',
        },
        {
          name: 'Blackmarrow Lantern',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS. Provides consistent EM and Lunar-Bloom DMG bonuses with zero gacha investment.',
        },
        {
          name: "Surf's Up",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick offering 88.2% CRIT DMG.',
        },
        {
          name: 'Tome of the Eternal Flow',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick offering 88.2% CRIT DMG and Base ATK.',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Gacha Alternative. 55.1% CRIT DMG stat stick; when its EM song triggers, it can match or exceed 5★ weapons in speedrunning scenarios.',
        },
        {
          name: 'A Thousand Floating Dreams',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ EM Stat Stick (265 EM) with team EM buffs.',
        },
        {
          name: "Starcaller's Watch",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ High EM Stat Stick (265 EM).',
        },
        {
          name: 'Sunny Morning Sleep-In',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Massive EM Stat Stick (up to 417 EM via passives).',
        },
        {
          name: 'Sacrificial Jade',
          rarity: 4,
          tier: 3,
          category: 'Alternative',
          notes: '4★ Battle Pass Alternative offering 36.8% CRIT Rate and EM buffs upon swapping.',
        },
      ],
    },
  },
];
