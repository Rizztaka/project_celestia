import type { ReviewedCharacterProfile } from './identity';

export const v11Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000033,
    skillDepotId: 3301,
    referenceKey: 'Tartaglia',
    displayName: 'Tartaglia',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-tartaglia'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['critRate', 'critDmg', 'atk', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'NymphsDream',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+25% Hydro, +25% ATK)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative (+15% Hydro, +30% Normal/Charged)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label: 'Alternative (with Furina)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Hydro)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+18% ATK)',
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
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'atk', 'energyRecharge'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 2, tier: 1, label: '2pc Burst + 2pc Hydro' },
          { referenceKey: 'HeartOfDepth', pieces: 2, tier: 1, label: '2pc Hydro (+15% Hydro)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/tartaglia/',
      playstyleSummary:
        'Fast-paced melee Hydro enabler famous for the International team (Childe, Bennett, Xiangling, Kazuha/Sucrose). Applies unmatched quadratic Hydro via Riptide slashes, enabling Xiangling to reverse-vaporize every single Pyronado hit while frontloading massive Vaporize Burst nukes.',
      energyRequirements:
        '120% - 140% ER for Ranged Burst every rotation (refunds 20 energy); 140% - 160% if casting Melee Burst.',
      combatTips: [
        'Casting Ranged Burst (Flash of Havoc) refunds 20 energy, dropping net cost to 40 and speeding up your rotation considerably compared to Melee Burst.',
        'Keep melee stance active for only 9-10 seconds (roughly the duration of Xiangling Pyronado) to prevent extended skill cooldown penalties.',
        'Riptide Slash deals quadratic AoE Hydro damage when multiple enemies are grouped tightly by Kazuha or Sucrose.',
        'Optimal melee attack combo: N2C (2 Normal Attacks followed by Charged Attack) or N3C for maximum DPS and stamina conservation.',
      ],
      weapons: [
        {
          name: 'Polar Star',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Custom signature bow granting Crit Rate and up to 48% ATK and 24% Skill/Burst DMG',
        },
        {
          name: 'Aqua Simulacra',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Massive Crit DMG substat with unconditional 20% all-DMG bonus in melee proximity',
        },
        {
          name: 'Thundering Pulse',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'High Base ATK, Crit DMG, and up to 40% Normal Attack DMG bonus',
        },
        {
          name: 'The Viridescent Hunt',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes:
            'BP bow with Crit Rate and cyclone grouping effect that synergizes with quadratic Riptide',
        },
        {
          name: 'Skyward Harp',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'High Base ATK with generous Crit Rate and Crit DMG',
        },
        {
          name: 'Rust',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'High refinement Rust grants up to +80% Normal Attack DMG bonus',
        },
        {
          name: 'The Stringless',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Empowers frontloaded Vaporize burst nukes with EM and Burst DMG%',
        },
        {
          name: 'Prototype Crescent',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: 'Craftable bow granting large ATK% buff upon hitting weak spots',
        },
      ],
    },
  },
  {
    avatarId: 10000030,
    skillDepotId: 3001,
    referenceKey: 'Zhongli',
    displayName: 'Zhongli',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-zhongli'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['hpPercent'],
          Goblet: ['hpPercent', 'geoDmg'],
          Circlet: ['hpPercent', 'critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['maxHp', 'critRate', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% HP, +20% Team ATK, +30% Shield Strength)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative (+35% Elemental DMG on Crystal Pick)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team ATK on Burst)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+20% HP)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+20% HP)',
          },
          { referenceKey: 'Instructor', pieces: 4, tier: 3, label: 'Transitional (120 EM Buffer)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill', 'normal'],
        mainStats: {
          Sands: ['hpPercent', 'atkPercent'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'maxHp', 'atk', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Burst Nuke)',
          },
          { referenceKey: 'NoblesseOblige', pieces: 2, tier: 1, label: '2pc Burst + 2pc Geo/HP' },
          { referenceKey: 'ArchaicPetra', pieces: 2, tier: 1, label: '2pc Geo (+15% Geo)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/zhongli-quickguide/',
      playstyleSummary:
        'The definitive shielder in Genshin Impact. Jade Shield provides complete interruption immunity, absorbs 150% of all elemental and physical damage, and passively shreds nearby enemy resistance to ALL elements and physical by 20%.',
      energyRequirements:
        '130% - 150% ER if casting Planet Befall every rotation; ER can be ignored if only refreshing Hold Skill shield.',
      combatTips: [
        'Jade Shield reduces nearby enemy Elemental and Physical RES by 20% unconditionally in a small AoE around the active character.',
        'Hold Elemental Skill (Dominus Lapidis) generates the Jade Shield, summons a Stone Stele, and instantly drains Geo shields from enemies.',
        'In high-DPS endgame rotations, casting Planet Befall (Q) can be a DPS loss due to its long 2-second animation unless crowd control petrification or a burst nuke is specifically needed.',
        '4pc Archaic Petra grants the entire team +35% elemental damage bonus for 10s when Zhongli picks up an elemental Crystallize shard corresponding to that element.',
      ],
      weapons: [
        {
          name: 'Black Tassel',
          rarity: 3,
          tier: 1,
          category: 'BiS',
          notes:
            'Unmatched 46.9% HP substat; the ultimate low-investment weapon for maximum shield durability',
        },
        {
          name: 'Favonius Lance',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes:
            'Premier utility polearm; generates white particles for the entire party with a Crit Rate circlet',
        },
        {
          name: 'Staff of Homa',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes:
            'Provides +20% HP and converts Max HP to massive ATK for hybrid shield/burst nukes',
        },
        {
          name: 'The Catch',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Free weapon boosting Planet Befall damage and ER',
        },
        {
          name: 'Rightful Reward',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes:
            'Fontaine craftable polearm providing HP% and energy refund upon receiving healing',
        },
        {
          name: 'Vortex Vanquisher',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'Thematic weapon increasing shield strength and personal ATK',
        },
      ],
    },
  },
  {
    avatarId: 10000039,
    skillDepotId: 3901,
    referenceKey: 'Diona',
    displayName: 'Diona',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-diona'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent', 'healingBonus', 'critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['energyRecharge', 'maxHp', 'critRate'],
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
            label: 'Best in Slot Alternative (120 EM Reaction Buff)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+20% HP)',
          },
          {
            referenceKey: 'MaidenBeloved',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Healing)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc (+15% Healing)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/diona-quickguide/',
      playstyleSummary:
        'Versatile 4-star support combining Cryo shielding, continuous healing circles, movement speed buffs/stamina reduction, and battery utility for energy-hungry Cryo carries like Ayaka and Eula.',
      energyRequirements: '160% - 190% ER with Sacrificial Bow (R3+); 200%+ with Favonius Warbow.',
      combatTips: [
        'Always HOLD Skill (Icy Paws) instead of tapping: Hold fires 5 paws (creating an 80% stronger shield lasting 12s) and generates 3-4 Cryo particles.',
        'Sacrificial Bow is Diona best weapon: each of the 5 paws has an independent chance to proc the cooldown reset, making double Hold E virtually guaranteed at high refinements.',
        'C6 Signature Mix grants +200 Elemental Mastery to characters above 50% HP inside the circle, providing immense amplification in Melt and reaction teams.',
        'A1 Passive decreases stamina consumption by 10% and increases movement speed by 10% under her shield.',
      ],
      weapons: [
        {
          name: 'Sacrificial Bow',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes:
            'Uncontested best weapon; 5 paws give 5 proc chances to reset skill, allowing near 100% shield uptime and 8 Cryo particles',
        },
        {
          name: 'Favonius Warbow',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Reliable teamwide particle battery with high ER substat',
        },
        {
          name: 'Recurve Bow',
          rarity: 3,
          tier: 2,
          category: 'F2P',
          notes: '3-star bow offering 46.9% HP substat to maximize shield absorption and healing',
        },
        {
          name: 'Elegy for the End',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'Empowers team with 100 EM and 20% ATK on Burst cast',
        },
      ],
    },
  },
  {
    avatarId: 10000044,
    skillDepotId: 4401,
    referenceKey: 'Xinyan',
    displayName: 'Xinyan',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-xinyan'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['defPercent', 'energyRecharge'],
          Goblet: ['defPercent'],
          Circlet: ['defPercent', 'critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['def', 'energyRecharge', 'critRate'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% Team ATK via Lv. 3 Shield pulses)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 2,
            tier: 1,
            label: 'Best in Slot 2pc (+30% DEF)',
          },
          {
            referenceKey: 'DefendersWill',
            pieces: 2,
            tier: 1,
            label: 'Best in Slot 2pc (+30% DEF)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Team ATK on Burst)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'normal', 'skill'],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['physicalDmg'],
          Circlet: ['critDmg', 'critRate'],
        },
        priorityStats: ['critDmg', 'atk', 'critRate', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'PaleFlame',
            pieces: 2,
            tier: 1,
            label: '2pc Physical + 2pc Bloodstained',
          },
          {
            referenceKey: 'BloodstainedChivalry',
            pieces: 2,
            tier: 1,
            label: '2pc Physical (+50% Total Physical DMG)',
          },
          { referenceKey: 'PaleFlame', pieces: 4, tier: 1, label: 'Best in Slot (Full Stacks)' },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label: 'Alternative (with Furina)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/xinyan/',
      playstyleSummary:
        'Multi-faceted rocker who can be built as a Tenacity shield buffer with continuous Pyro pulses, a physical damage amplifier (A4 gives +15% Physical DMG; C4 gives -15% Physical RES), or a 100% CRIT Physical Burst nuker via C2.',
      energyRequirements:
        '160% - 190% ER in Support builds; 120% - 140% as on-field carry with a battery.',
      combatTips: [
        'Sweeping Fervor (E) Lv. 3 Rave shield periodically deals Pyro damage to surrounding enemies, reliably triggering 4pc Tenacity of the Millelith team ATK buffs.',
        'C2 Impromptu Opening grants 100% Crit Rate to the Physical damage portion of Riff Revolution (Q) and automatically forms a Lv. 3 Rave shield, allowing you to build pure Crit DMG on Burst nuke builds.',
        'A4 Passive (Now That Is Rock N Roll) increases Physical damage dealt by characters shielded by Sweeping Fervor by 15%.',
        'C4 Wildfire Rhythm reduces enemies Physical RES by 15% for 12s when hit by Sweeping Fervor.',
      ],
      weapons: [
        {
          name: 'Redhorn Stonethresher',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Massive Crit DMG and converts DEF into Normal/Charged Attack damage',
        },
        {
          name: 'Sacrificial Greatsword',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Resets skill cooldown to ensure consistent Lv. 3 shield uptime',
        },
        {
          name: 'Favonius Greatsword',
          rarity: 4,
          tier: 1,
          category: 'Utility',
          notes: 'Generates energy particles for team battery',
        },
        {
          name: 'Whiteblind',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: 'Craftable claymore providing huge DEF% for shield thickness',
        },
        {
          name: "Wolf's Gravestone",
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'High ATK and party ATK buff below 30% enemy HP',
        },
        {
          name: 'Serpent Spine',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: 'Crit Rate and all-damage bonus for Physical carry',
        },
        {
          name: 'Snow-Tombed Starsilver',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Dragonspine craftable claymore with Physical DMG% substat',
        },
      ],
    },
  },
];
