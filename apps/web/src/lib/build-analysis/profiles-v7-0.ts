import type { ReviewedCharacterProfile } from './identity';

export const v70Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000148,
    skillDepotId: 14801,
    referenceKey: 'Alyosha',
    displayName: 'Alyosha',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-alyosha-info', 'kqm-alyosha-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['atkPercent'],
          Circlet: ['healingBonus', 'atkPercent', 'critRate'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'team_buffs' },
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'HeartOfTheFurnace',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot in Stellar-Conduct Teams (Default team support set if no one else holds it)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+20% Teamwide ATK on Burst; used when another teammate holds 4pc HotF)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+120 Teamwide Elemental Mastery on reaction trigger in reaction-heavy setups)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+40% Teamwide Elemental DMG bonus upon triggering reaction)',
          },
          {
            referenceKey: 'SilkenMoonsSerenade',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% ER & teamwide EM/Reaction DMG buffs)',
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
      sourceUrl: 'https://keqingmains.com/q/alyosha-quickguide/',
      playstyleSummary:
        "Alyosha is a 4-star Electro Polearm support, buffer, and healer. He marks enemies with Hunter's Mark via his Skill and summons his companion Tugarin with his Burst, granting on-field carries massive ATK% buffs, periodic healing scaling from ATK, and a 20% Stellar-Conduct DMG buff (doubling at C6) inside Polestar Fields.",
      energyRequirements:
        'Practically 0% additional ER investment (100% baseline) when bursting every other rotation at C2+ due to 20s Burst uptime. At C0–C1 bursting every rotation: 195–225% with Favonius Lance (or 235–280% without Favonius) as Solo Electro; drops to 130–155% with +1 Electro.',
      combatTips: [
        "Burst Every Other Rotation Invariant at C2+: At C2+, Tugarin's Burst duration increases from 14s to 20s, enabling continuous buff and healing uptime while bursting every other rotation at 100% baseline ER.",
        "Talent Priority (Skill > Burst >> NA): Skill levels directly increase the on-fielder's ATK% buff from Hunter's Precision. Burst levels increase personal damage. Normal Attack remains at Level 1.",
        "Healing & Buffing Scale from ATK: Tugarin's periodic healing (A1 Awakened By the Baying Hounds) scales from 120% of Alyosha's ATK, favoring ATK% and ER main stats over personal offensive CRIT builds.",
        'Shield Penetration with Frostbreath: Favonius Lance requires CRIT Rate and hits against unshielded targets; against shielded endgame bosses (e.g. Stygian Onslaught), Frostbreath provides reliable Flat Energy regardless of shields.',
      ],
      weapons: [
        {
          name: 'Symphonist of Scents',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Premier Support BiS (Passive activated by his healing to grant teamwide ATK% buffs to the on-field carry)',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            '4★ Universal Battery BiS (High Base ATK relative to 4★ weapons & teamwide neutral energy particle generation on CRIT)',
        },
        {
          name: 'Frostbreath',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            '4★ Flat Energy BiS (Provides flat energy on Cryo/Electro reaction; functions against shielded bosses where Favonius cannot proc)',
        },
        {
          name: 'Engulfing Lightning',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes:
            '5★ ER Stat Stick (Massive 55.1% ER and ER-to-ATK conversion to easily meet ER requirements)',
        },
        {
          name: 'Rightful Reward',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable F2P Alternative (Restores energy upon receiving healing)',
        },
        {
          name: 'Skyward Spine',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (High Base ATK and ER secondary stat)',
        },
        {
          name: '"The Catch"',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ F2P Alternative (45.9% ER secondary stat and Burst DMG buff)',
        },
        {
          name: 'Mountain-Bracing Bolt',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Event Alternative (ER secondary stat and Skill DMG buffs)',
        },
        {
          name: 'Prototype Starglitter',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: '4★ Craftable F2P Alternative (45.9% ER secondary stat)',
        },
      ],
    },
  },
  {
    avatarId: 10000150,
    skillDepotId: 15001,
    referenceKey: 'Odette',
    displayName: 'Odette',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-odette-info', 'kqm-odette-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['atkPercent', 'cryoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'HeartOfTheFurnace',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Support (Default support set for Stellar-Conduct and Stellar Swirl teams if no other holder)',
          },
          {
            referenceKey: 'DisenchantmentInDeepShadow',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Damage (+60% Stellar Reaction DMG; optimal if another teammate holds 4pc HotF)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% Teamwide ATK continuously refreshed by Solo Dance Double)',
          },
          {
            referenceKey: 'ADayCarvedFromRisingWinds',
            pieces: 4,
            tier: 2,
            label: 'Alternative (High ATK% stacking set)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 2,
            label: 'Alternative in Freeze / Cryo-aurad teams (+15% Cryo DMG & CRIT Rate)',
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
      sourceUrl: 'https://keqingmains.com/q/odette-quickguide/',
      playstyleSummary:
        "Odette is a 5-star Cryo Sword off-field sub-DPS and support in Stellar Glimmer (Stellar-Conduct & Stellar Swirl) teams. She summons her Solo Dance Double for 20s of sustained off-field Cryo damage and reaction triggers, follows up with Adagio: Coda at Dawn's Tolling for a burst of Stellar reaction damage, and shares up to a 60% teamwide Stellar Glimmer DMG buff via Marvelous Splendor stacks.",
      energyRequirements:
        'Zero ER requirement (100% baseline). It is generally not recommended to build ER or cast Burst on Odette, as her Burst animation is excessively long and causes a net team DPS loss. If bursting every other rotation in Sandrone or Cryo Traveler teams at C4+ with signature weapon, ~100–120% ER is sufficient.',
      combatTips: [
        "Skip Burst Invariant: Odette's Burst deals underwhelming damage and has an extended animation that prolongs rotations. Odette should skip Bursting entirely in standard rotations, focusing all substat budget on CRIT, ATK%, and EM.",
        'ATK% Goblet Over Cryo DMG%: Direct Stellar Glimmer reactions (Stellar-Conduct and Stellar Swirl) scale with ATK, CRIT, and EM, and are completely unaffected by Cryo DMG Bonus. Additionally, A4 Pathetique of Pateticheskaya increases Stellar Glimmer DMG by 1.5% per 100 ATK above 1,000 (up to 30% at 3,000 ATK).',
        'Talent Priority (Skill >> Level 90 >= Burst): Elemental Skill provides the summon and virtually all off-field damage and reaction triggers. Normal Attack talent is not utilized and remains at Level 1.',
        'Marvelous Splendor Sharing (A1): Summoning the Solo Dance Double grants 4 stacks of Marvelous Splendor (+15% Stellar Glimmer DMG per stack). Upon swapping off-field, these stacks transfer to the active carry for up to +60% reaction damage bonus.',
      ],
      weapons: [
        {
          name: 'Whitelake Frostfeather',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            '5★ Signature BiS (Buffs Stellar Glimmer damage and provides Energy refund upon Skill/Burst)',
        },
        {
          name: 'Absolution',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ BiS Alternative (High Base ATK, 44.1% CRIT DMG, and Bond of Life DMG bonuses)',
        },
        {
          name: 'Azurelight',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ BiS Alternative (High CRIT stats and offensive buffs)',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ BiS Alternative (44.1% CRIT Rate and unconditional HP-to-ATK conversion)',
        },
        {
          name: 'Finale of the Deep',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes:
            '4★ Craftable F2P BiS (The best 4★ sword for Odette; generous ATK% bonus from Bond of Life)',
        },
        {
          name: 'Emberwell',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            '4★ Alternative (Competitive with Finale of the Deep when Bond of Life is left uncleared)',
        },
        {
          name: 'Uraku Misugiri',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (88.2% CRIT DMG secondary stat)',
        },
        {
          name: 'Light of Foliar Incision',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (88.2% CRIT DMG and EM-scaling damage boost)',
        },
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (44.1% CRIT DMG and high Base ATK)',
        },
        {
          name: 'Haran Geppaku Futsu',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (33.1% CRIT Rate)',
        },
        {
          name: 'Athame Artis',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (High CRIT and offensive passive)',
        },
        {
          name: 'Lightbearing Moonshard',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (CRIT secondary stat)',
        },
        {
          name: 'Splendor of Tranquil Waters',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (88.2% CRIT DMG)',
        },
        {
          name: 'Summit Shaper',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ ATK Stat Stick (High ATK% stacking with a shielder)',
        },
        {
          name: 'Aquila Favonia',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ Stat Stick (674 High Base ATK & unconditional ATK% passive)',
        },
        {
          name: 'Exaiphanes Blade',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Stat Stick (Solid secondary stat and passive buffs)',
        },
        {
          name: "Heretic's Molten Blade",
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes:
            "4★ Alternative (Skill teleport proc enhances initial on-field Coda at Dawn's Tolling strike)",
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
