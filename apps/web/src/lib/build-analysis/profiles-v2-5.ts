import type { ReviewedCharacterProfile } from './identity';

export const v25Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000058,
    skillDepotId: 5801,
    referenceKey: 'YaeMiko',
    displayName: 'Yae Miko',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-yae-guide', 'kqm-yae-infographic'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['electroDmg', 'elementalMastery', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
          Goblet: { elementalMastery: 'reaction_context' },
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Best in Slot for Raw & Off-Field Skill Damage (+70% Skill DMG off-field)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 1, label: 'Best in Slot for Aggravate & Reaction Damage (+80 EM, high EM/ATK stacking)' },
          { referenceKey: 'DisenchantmentInDeepShadow', pieces: 4, tier: 1, label: 'Best in Slot for Stellar-Conduct Teams (+Stellar-Conduct DMG & Crit Rate)' },
          { referenceKey: 'ThunderingFury', pieces: 2, tier: 2, label: 'Alternative 2pc Mix (+15% Electro DMG)' },
          { referenceKey: 'GoldenTroupe', pieces: 2, tier: 2, label: 'Alternative 2pc Mix (+20% Skill DMG)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 2, label: 'Supportive Alternative (+20% Team ATK with continuous turret strikes)' },
          { referenceKey: 'UnfinishedReverie', pieces: 4, tier: 2, label: 'Best in Slot for Quickburn Teams (+50% DMG near Burning enemies)' },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['electroDmg', 'elementalMastery'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          { referenceKey: 'GildedDreams', pieces: 4, tier: 1, label: 'Best in Slot for On-Field Aggravate / Driver (+80 EM, high reaction scaling)' },
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Competitive On-Field Option (retains +45% Skill DMG on-field)' },
          { referenceKey: 'ThunderingFury', pieces: 4, tier: 2, label: 'Aggravate Driver (+15% Electro DMG, +20% Aggravate DMG, -1s Skill CD on reactions)' },
          { referenceKey: 'NightOfTheSkysUnveiling', pieces: 4, tier: 2, label: 'Best in Slot for On-Field Lunar-Charged Compositions' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/yae-quickguide/',
      playstyleSummary:
        'Premier Electro off-field DPS and on-field reaction driver. Yae Miko establishes up to three Sesshou Sakura turrets that deliver rapid, autonomous Electro lightning strikes over long durations without requiring Burst uptime. Her Ascension 4 passive converts every point of Elemental Mastery into bonus Skill damage, making her exceptionally potent in Quicken/Aggravate and reaction-driven team archetypes. While her 90-cost Burst delivers immense 4-hit AoE nukes, skipping or casting it every other rotation is frequently a team DPS gain due to zero field-time interruption.',
      energyRequirements:
        'Bursting every rotation with Raiden Shogun: 140%–150% (C0) / 100% (C1+). Off-field with Fischl: 130%–140% (C0) / 100% (C1+). On-field with Fischl: 100%–110%. Solo Electro / without battery: 160%–180%+ ER. Bursting every other rotation or Skill-only playstyle: 100% (no ER investment needed). C1 refunds up to 24 flat energy per Burst.',
      combatTips: [
        'Totem Placement (EEE): Deploy all three Sesshou Sakura in a triangle or connected pattern so each links together to reach Level 3 (or Level 4 at C2). Never place totems too close to one another, or the previous totem will be immediately destroyed!',
        'Dynamic Scaling (No Snapshot): Sesshou Sakura do NOT snapshot stats on cast. They dynamically recalculate damage in real time, fully benefiting from active buffs such as Nahida\'s Shrine of Maya, Furina\'s Fanfare, or Kazuha\'s A4 Electro DMG Bonus while Yae is off-field.',
        'Burst & Cooldown Reset: Great Secret Art: Tenko Kenshin destroys nearby Sesshou Sakura and drops one Tenko Thunderbolt per destroyed totem. Her A1 passive resets 1 charge of Elemental Skill per destroyed totem, allowing you to redeploy all 3 turrets (EEE -> Team Rotations -> Q -> EEE).',
        'Aggravate & CA Tech: While her turrets adhere to standard 3-hit ICD, Yae Miko\'s Charged Attack possesses NO internal cooldown, allowing every CA to trigger Aggravate. Weave N2CJ or N2CD combos to cancel the long end-lag animation with jump or dash.',
        'Interruption Vulnerability: Yae lacks invulnerability frames (i-frames) during her Skill dash and possesses no base interruption resistance. Pair her with shielders (Zhongli, Nicole, Kirara) or coordinate E casts during boss attack downtimes.',
        'Elemental Mastery Value (A4): Enlightened Blessing grants +0.15% Sesshou Sakura DMG for every point of EM. In Aggravate teams, EM substats hold equivalent damage value to ATK% substats.',
      ],
      weapons: [
        {
          name: "Kagura's Verity",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            "Signature weapon and uncontested BiS. 66.2% Crit DMG with 608 Base ATK. Yae fully stacks its +36% Skill DMG and +12% All Elemental DMG passive effortlessly with three consecutive Skill casts.",
        },
        {
          name: 'Reliquary of Truth',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Top-tier 5★ stat stick with massive Crit secondary stats and powerful damage passives. Can even surpass Kagura\'s Verity in teams where Yae Bursts every rotation.',
        },
        {
          name: 'Vivid Notions',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Universal third-best 5★ weapon across all playstyles with generous unconditional stats. Top choice when running plunging teams with Xianyun.',
        },
        {
          name: 'The Widsith',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed best 4★ catalyst and F2P baseline. 55.1% Crit DMG. All three random Aria songs (ATK%, All Elemental DMG%, and EM) provide massive value for Yae, rivaling 5★ weapons during its 10s buff window.',
        },
        {
          name: 'A Thousand Floating Dreams',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Huge 265 EM sub-stat directly amplifies Yae\'s Aggravate reaction damage and A4 passive, while providing teamwide EM buffs for reaction synergy.',
        },
        {
          name: 'Lost Prayer to the Sacred Winds',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Consistent 33.1% Crit Rate stat stick with 608 Base ATK. Performs closely to an R5 Widsith outside buff windows; movement speed is a helpful defensive utility.',
        },
        {
          name: 'Skyward Atlas',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Enormous 674 Base ATK with 33.1% ATK% and unconditional Elemental DMG Bonus. Exceptional choice in raw damage teams or teams with limited external ATK buffs.',
        },
        {
          name: 'Echoes of the Heart',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Best 4★ craftable option in Stellar-Conduct and reaction archetypes, providing substantial ATK, EM, and DMG Bonus when reactions are consistently triggered.',
        },
        {
          name: 'Flowing Purity',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'High-performing Fontaine craftable catalyst with ATK% sub-stat and up to 16%–32% All Elemental DMG Bonus when Bond of Life is cleared by a party healer.',
        },
        {
          name: 'Mappa Mare',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Accessible F2P craftable catalyst offering 110 EM and stacking Elemental DMG Bonus upon triggering elemental reactions while on-field.',
        },
        {
          name: 'Hakushin Ring',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Inazuma craftable catalyst with Energy Recharge secondary stat. Grants up to 20% teamwide Elemental DMG Bonus for elements involved in Electro reactions.',
        },
        {
          name: 'Wandering Evenstar',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Converts Yae\'s EM into flat ATK for herself and the entire party every 10s. Highly effective in reaction teams with invested sub-DPS teammates.',
        },
      ],
    },
  },
];
