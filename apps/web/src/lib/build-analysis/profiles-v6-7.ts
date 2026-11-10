import type { ReviewedCharacterProfile } from './identity';

export const v67Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000133,
    skillDepotId: 13301,
    referenceKey: 'Sandrone',
    displayName: 'Sandrone',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-sandrone-info', 'kqm-sandrone-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        talentPriorityGroups: [['normal'], ['burst'], ['skill']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['atkPercent', 'cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'DisenchantmentInDeepShadow',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot by far for on-field Stellar-Conduct DPS',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative (+80 EM & up to +42% ATK / +150 EM from reactions)',
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
      sourceUrl: 'https://keqingmains.com/q/sandrone-quickguide/',
      playstyleSummary:
        'Sandrone is a 5-star Cryo Claymore on-field Stellar-Conduct DPS and Seventh of the Fatui Harbingers ("Marionette"). She commands her automaton "Fagio" to unleash sweeping fire attacks and periodic condensed Cryo beam strikes through her Charged Attack, converting Superconduct into destructive direct Stellar-Conduct reactions amplified by her ATK, CRIT, and EM.',
      energyRequirements:
        '100% baseline when bursting every other rotation or when ER requirements exceed 140% (where building ER is a DPS loss compared to offensive stats). If aiming to burst every rotation with Favonius teammates: 130–165% with +1 Cryo, or 120–140% with +2 Cryo / +2 Electro. Sandrone should not sacrifice ATK% or CRIT for ER and should use Burst when naturally available.',
      combatTips: [
        "ATK% Goblet Over Cryo DMG%: Sandrone's primary damage is direct Stellar-Conduct, which scales with ATK, CRIT, and EM. Cryo DMG Bonus does not affect Stellar-Conduct reaction damage, making ATK% Goblet the optimal choice.",
        "Talent Priority (Normal Attack > Burst > Skill): Her personal damage overwhelmingly originates from Fagio's Charged Attack beam strikes governed by the Normal Attack talent. Level 80/90 is sufficient before pushing 90.",
        "Burst Every Other Rotation Invariant: Sandrone's Burst deals high damage and consumes A1 Refined Tactics stacks, but investing in >140% ER hurts her team DPS. In practice, 100% baseline ER with Burst every other rotation is recommended.",
        'Skill Cancels & Fagio Repair: Sandrone can cancel her Skill (hovercraft) animation via Normal Attack (N0 cancel: tap N1 then immediately start Charged Attack) or Dash (ED cancel) to shorten field time while ensuring Fagio cools down its Decoding Power below 50.',
      ],
      weapons: [
        {
          name: 'A Teaspoon of Transcendence',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: '5★ Signature BiS (Tailor-made Base ATK and passive buffs for Sandrone)',
        },
        {
          name: 'A Thousand Blazing Suns',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (Plethora of offensive stats and high Base ATK; start field time with Skill cancel)',
        },
        {
          name: 'Forged by the Golden Melody',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            '4★ Battle Pass BiS (Performs on par with R5 Tidal Shadow at R1; definitive 4★ BiS at higher refinements with Electro aura uptime)',
        },
        {
          name: 'Blade of Atonement',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (Second-best 4★ option when triggering Stellar-Conduct with 2 Electro teammates)',
        },
        {
          name: 'Tidal Shadow',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            "4★ Craftable F2P BiS (Sandrone's best accessible 4★ option in teams with a healer like Qiqi, Diona, or Escoffier)",
        },
        {
          name: 'Mailed Flower',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Event F2P BiS (High ATK% & EM buffs upon reaction; premier option in teams without a dedicated healer)',
        },
        {
          name: 'Beacon of the Reed Sea',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes:
            '5★ BiS Alternative (33.1% CRIT Rate; competitive with A Thousand Blazing Suns if taking damage)',
        },
        {
          name: 'Redhorn Stonethresher',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (88.2% CRIT DMG secondary stat)',
        },
        {
          name: 'Verdict',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (22.1% CRIT Rate and ATK% passive)',
        },
        {
          name: 'The Unforged',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes:
            '5★ Shielded Alternative (Generous ATK% scaling with a shielder like C6 Diona, C6 Beidou, or Nicole)',
        },
        {
          name: "Wolf's Gravestone",
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Alternative (Massive teamwide and personal ATK% bonuses)',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            '4★ Battle Pass Alternative (27.6% CRIT Rate; benefits from a shielder to preserve damage stacks)',
        },
        {
          name: 'Blackcliff Slasher',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Shop F2P Alternative (55.1% CRIT DMG secondary stat)',
        },
      ],
    },
  },
];
