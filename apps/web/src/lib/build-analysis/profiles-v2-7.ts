import type { ReviewedCharacterProfile } from './identity';

export const v27Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000060,
    skillDepotId: 6001,
    referenceKey: 'Yelan',
    displayName: 'Yelan',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-yelan-infographic', 'kqm-yelan-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hydroDmg', 'hpPercent'],
          Circlet: ['critRate', 'critDmg', 'hpPercent'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'favonius_proc' },
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'maxHp'],
        sets: [
          { referenceKey: 'EmblemOfSeveredFate', pieces: 4, tier: 1, label: 'Uncontested Best in Slot (+20% ER, up to +75% Burst DMG)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'Best in Slot On-Field with Furina (+36% Crit Rate)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Supportive Alternative (+20% Team ATK on Burst)' },
          { referenceKey: 'HeartOfDepth', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Hydro DMG)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% ER)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Alternative 2pc Mix (+20% HP)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/yelan-quickguide/',
      playstyleSummary:
        'Premier 5-star off-field Hydro sub-DPS and universal damage buffer. Depth-Clarion Dice (Burst) summons an Exquisite Throw that executes coordinated 3-hit Hydro strikes alongside the active character\'s Normal Attacks. Her A4 passive (Adapt With Ease) grants a ramping damage bonus to the active on-field character up to a massive 50%. Virtually her entire kit scales with Max HP, rendering ATK stats entirely useless.',
      energyRequirements:
        'Solo Hydro (1 Skill): 215%–260% with Favonius Warbow (~265%–335% with Aqua/other weapons). Double Hydro (with Xingqiu/Furina): 185%–195% with Favonius (~220%–230% with Aqua). With Raiden: 150% (Solo Hydro) / 120%–130% (Double Hydro). C1 provides an additional Skill charge, lowering ER by ~40%–60%. Each teammate Favonius proc reduces ER needs by 10%–20%.',
      combatTips: [
        'Zero ATK Scaling: Every part of Yelan\'s damage—Skill, Burst, and Breakthrough Barb—scales strictly from Max HP. Flat ATK and ATK% buffs (Bennett, Noblesse Oblige) provide zero benefit to her personal damage!',
        'Level 90 Invariant: Leveling Yelan to 90 is critical because Base HP increases substantially from character level, resulting in direct damage gains across her entire kit.',
        'Lifeline Sprint (Lingering Lifeline): Holding Skill enters a rapid sprint that entangles opponents, detonating for massive AoE Hydro DMG on expiry and generating 4 Hydro particles. Can be used for seamless overworld traversal and enemy repositioning.',
        'A4 Ramping DMG Bonus (Adapt With Ease): While Exquisite Throw is active, the on-field character deals 1% more DMG initially, increasing by 3.5% every second up to a cap of 50%. Time your carry\'s highest-hitting attacks (e.g. Hu Tao/Raiden nukes) towards the end of the 15s window.',
        'Breakthrough Barb: When out of combat for 5s, Yelan gains Breakthrough, reducing Charged Shot charge time by 80% and firing an AoE Hydro damage barb based on Max HP. Open combats with this shot before casting Skill/Burst.',
        'Favonius Warbow Battery: Favonius Warbow is her premier all-round weapon; remember to build 50%+ Crit Rate so Lifeline reliably procs clear particles.',
      ],
      weapons: [
        {
          name: 'Aqua Simulacra',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature bow and undisputed peak personal damage. 88.2% Crit DMG, +16% Max HP, and unconditional +20% All DMG Bonus when near enemies. Requires high ER substats on artifacts.',
        },
        {
          name: 'Elegy for the End',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Top-tier team support bow. 55.1% ER secondary stat eases high energy requirements while buffing the party with +100 EM and +20% ATK upon triggering Millennial Movement.',
        },
        {
          name: 'Favonius Warbow',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed best all-round 4★ and F2P weapon. 61.3% ER and neutral energy particle generation solves both Yelan\'s and the entire team\'s energy requirements effortlessly.',
        },
        {
          name: 'The First Great Magic',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% Crit DMG stat stick with movement speed utility; solid alternative in low-ER or Double Hydro teams.',
        },
        {
          name: 'Silvershower Heartstrings',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% HP sub-stat provides a tremendous health pool that directly scales Yelan\'s entire kit.',
        },
        {
          name: 'Slingshot',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            'Phenomenal 3★ Crit Rate (31.2%) stat stick for personal damage that rivals non-signature 5★ bows when ER requirements are already satisfied by Double Hydro / Raiden.',
        },
        {
          name: "Mouun's Moon",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Passive scales Burst DMG up to 40%–80% based on combined party energy capacity; can be kept at Lv. 1 since Base ATK does not scale Yelan\'s damage.',
        },
        {
          name: 'The Stringless',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Grants 24%–48% Skill and Burst DMG Bonus; like Mouun\'s Moon, can be left at Lv. 1 due to irrelevant Base ATK.',
        },
        {
          name: 'Recurve Bow',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            'Free 3★ bow with massive 46.9% HP secondary stat; excellent budget option in Double Hydro teams with low ER requirements.',
        },
        {
          name: 'Fading Twilight',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Event 4★ bow providing 30.6% ER and cycling DMG bonuses from 12% to 28%.',
        },
        {
          name: 'Sacrificial Bow',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Offers 30.6% ER and resets Skill cooldown, effectively emulating C1 energy generation, but with a longer animation time.',
        },
      ],
    },
  },
  {
    avatarId: 10000065,
    skillDepotId: 6501,
    referenceKey: 'KukiShinobu',
    displayName: 'Kuki Shinobu',
    defaultRoleId: 'reaction_trigger',
    evidenceIds: ['kqm-shinobu-guide'],
    roles: [
      {
        id: 'reaction_trigger',
        talentPriority: ['skill'],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'maxHp', 'energyRecharge'],
        sets: [
          { referenceKey: 'FlowerOfParadiseLost', pieces: 4, tier: 1, label: 'Best in Slot for Hyperbloom Damage (+80 EM, up to +140% Hyperbloom DMG)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 1, label: 'Best in Slot Alternative (+80 EM, up to +150 EM in standard teams)' },
          { referenceKey: 'WanderersTroupe', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
          { referenceKey: 'GildedDreams', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
          { referenceKey: 'ThunderingFury', pieces: 4, tier: 2, label: 'Alternative Hyperbloom (+15% Electro DMG, +40% Hyperbloom DMG)' },
        ],
      },
      {
        id: 'healing_support',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['hpPercent', 'elementalMastery'],
          Goblet: ['hpPercent', 'elementalMastery'],
          Circlet: ['healingBonus', 'hpPercent', 'elementalMastery'],
        },
        priorityStats: ['maxHp', 'elementalMastery', 'energyRecharge', 'critRate'],
        sets: [
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 1, label: 'Best in Slot Support (+20% HP, +20% Team ATK constantly refreshed by Skill)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot Healing & Clam Bubbles (+15% Healing, physical foam damage)' },
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 1, label: 'Supportive Alternative (converts healing into flat active-character base DMG)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Supportive Alternative (+20% Team ATK on Burst)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/shinobu-quickguide/',
      playstyleSummary:
        'Premier 4-star Hyperbloom reaction trigger and portable healer. Sanctifying Ring (Skill) sacrifices a portion of Shinobu\'s current HP to encircle the active character with an Electro ring that pulses every 1.5 seconds, continuously healing nearby allies and detonating Dendro Cores into lethal homing Hyperbloom projectiles. Her A4 passive (Heart\'s Repose) converts Elemental Mastery into bonus healing and Skill damage, creating flawless synergy between her reaction trigger and defensive support capabilities.',
      energyRequirements:
        'In Hyperbloom teams, Shinobu rarely needs to Burst every rotation; her ER requirement is essentially 100% (cast Q when ready or for emergency i-frames). If Bursting every rotation (e.g. in Quickswap or Aggravate teams): 160%–190% ER in solo Electro; 120%–140% with a second Electro unit (Fischl / Beidou). C4 and teammate Favonius procs lower these requirements.',
      combatTips: [
        'Hyperbloom Level 90 Imperative: Hyperbloom is a transformative reaction scaling exclusively with Character Level and Elemental Mastery. Leveling Shinobu to Lv. 90 yields ~34% more Hyperbloom damage over Lv. 80!',
        'Sanctifying Ring Mechanics: Sacrifices 30% of current HP on cast (down to a minimum of 20% HP). The ring follows the active character for 12s (15s at C2, providing 100% uptime with its 15s cooldown!).',
        'A4 EM Conversion (Heart\'s Repose): Increases Sanctifying Ring healing by 75% of EM and Skill damage by 25% of EM. Stacking triple EM for Hyperbloom simultaneously strengthens her healing output!',
        'A1 Low HP Threshold (Breaking Free): When Shinobu\'s HP is at or below 50%, her Healing Bonus is increased by 15%. Operating at low HP is safe because her ring automatically heals the active character.',
        'Burst AoE Duration: Gyoei Narukami Kariyama Rite (Burst) creates an evil-cleansing barrier. If Shinobu\'s HP is <= 50% on cast, the field duration extends from 2s to 3.5s, significantly boosting Electro application instances.',
        'Tenacity 100% Uptime: Because the ring pulses every 1.5 seconds from off-field, Shinobu can maintain 100% uptime on the 4pc Tenacity of the Millelith team ATK buff effortlessly.',
      ],
      weapons: [
        {
          name: 'Freedom-Sworn',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Top-tier 5★ sword. 198 EM sub-stat maximizes Hyperbloom damage while triggering Millennial Movement to grant the party +20% ATK and +16% Normal/Charged/Plunging Attack DMG.',
        },
        {
          name: 'Key of Khaj-Nisut',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '66.2% HP secondary stat maximizes survivability, while its passive converts Max HP into massive EM buffs for Shinobu and the entire party!',
        },
        {
          name: "Xiphos' Moonlight",
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '165 EM sub-stat. Converts Shinobu\'s stacked EM into bonus Energy Recharge for herself and nearby party members, acting as a team battery.',
        },
        {
          name: 'Iron Sting',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Best accessible F2P craftable sword. Provides 165 EM to maximize Hyperbloom reaction scaling with zero gacha reliance.',
        },
        {
          name: 'Toukabou Shigure',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Event 4★ sword sharing identical 165 EM sub-stat with Iron Sting; top-tier F2P Hyperbloom pick.',
        },
        {
          name: "The Dockhand's Assistant",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '41.3% HP sub-stat with passive that generates EM and energy upon healing party members; premier 4★ healing sword.',
        },
        {
          name: 'Favonius Sword',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Generates clear energy particles for the entire team; requires a Crit Rate circlet or substats to reliably proc.',
        },
        {
          name: 'Dark Iron Sword',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            'Free 3★ sword obtained from Chen the Sharp in Liyue Harbor, offering 141 EM for budget Hyperbloom builds.',
        },
      ],
    },
  },
];
