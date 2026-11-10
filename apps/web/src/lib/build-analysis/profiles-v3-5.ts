import type { ReviewedCharacterProfile } from './identity';

export const v35Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000079,
    skillDepotId: 7901,
    referenceKey: 'Dehya',
    displayName: 'Dehya',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-dehya-support-info', 'kqm-dehya-dps-info', 'kqm-dehya-guide'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'elementalMastery'],
          Goblet: ['hpPercent', 'pyroDmg', 'elementalMastery'],
          Circlet: ['hpPercent', 'critRate', 'healingBonus', 'elementalMastery'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['maxHp', 'hpPercent', 'critRate', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% HP, +20% Team ATK and +30% Shield Strength with high off-field uptime)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot in Dendro teams (-30% Dendro RES shred maintained from off-field)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Reaction Buffer (+120 EM to all party members for 8s upon triggering reaction)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 4,
            tier: 2,
            label: "Alternative (+20% HP, stacks DMG bonus from Redmane's Blood self-damage)",
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent', 'hpPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot with Furina (+15% NA/CA DMG, up to +36% Crit Rate via Redmane self-damage / HP drain)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot without Furina (+20% HP, up to +50% Skill and Burst DMG via taking damage)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot High-ER (+20% ER, up to +75% Burst DMG based on ER)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% Energy Recharge)',
          },
        ],
      },
      {
        id: 'reaction_trigger',
        talentPriority: ['skill'],
        talentPriorityGroups: [['skill']],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'maxHp'],
        sets: [
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Burgeon (+80 EM, up to +140% Burgeon DMG bonus)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Burgeon (+80 EM, up to +150 EM via reactions)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot if no party holder (-30% Dendro RES shred)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 EM)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/dehya-quickguide/',
      playstyleSummary:
        "5-star Pyro claymore combatant offering dual utility as a defensive poise sustain and an on-field Burst carry. Molten Inferno (Elemental Skill) creates a Fiery Sanctum field: when active characters within the field take damage, 50% of the damage is mitigated and flowed into Redmane's Blood to be taken by Dehya over 10 seconds. Simultaneously, unleashing or relocating the field grants Gold-Forge Form, bestowing complete interruption immunity (super-armor) for 9 seconds. Coordinated Pyro AoE attacks strike every 2.5s when enemies inside take damage. Leonine Bite (Burst, 70 Energy cost) enters the Blazing Lioness state, automatically unleashing continuous Flame-Mane's Fists followed by an Incineration Drive kick.",
      energyRequirements:
        'In Off-Field Support / Burgeon builds, Dehya forgoes her Burst entirely (0% ER needed). In On-Field DPS builds, ER requirements are exceptionally steep: 160%–210% ER in Furina Vaporize; 180%–225% in Melt; 160%–180% in Mono Pyro / Burning; 150%–175% in Chevreuse Overloaded (dropping to 115%–135% with Raiden). C4 reduces ER needs by ~40%, while C6 reduces them by ~60%.',
      combatTips: [
        'Gold-Forge Form 9s Super-Armor (A1 Unstinting Succor): Within 6 seconds of deploying Fiery Sanctum, active characters gain absolute interruption immunity for 9 seconds. This enables hypercarries like Ganyu (Melt), Lyney (Mono Pyro), and Neuvillette (pre-C1) to charge their attacks without ever being staggered.',
        "A4 Stalwart and True Self-Healing: When Dehya's HP drops below 40%, she instantly restores 20% of her Max HP and restores 6% of her Max HP every 2s for the next 10s (50% HP total restored), ensuring she survives Redmane's Blood bleed-through from off-field.",
        "Burst Fist Speed Acceleration: During Leonine Bite, pressing Normal Attack or Skill within 0.4s of a Flame-Mane's Fist strike accelerates the next fist, maximizing total strikes (10 hits at C0–C5, up to 15–16 hits at C6).",
        'Burst Jump-Cancel Warning: Jumping during Leonine Bite IMMEDIATELY cancels the Burst state! If frozen or repositioning, dash or dash-cancel instead of jumping.',
        "C1 The Flame Incandescent Watershed: C1 increases Dehya's Max HP by 20%, and scales Molten Inferno DMG by 3.6% of Max HP and Leonine Bite DMG by 6% of Max HP, making HP% scaling directly competitive with ATK% for her personal damage.",
      ],
      weapons: [
        {
          name: 'Beacon of the Reed Sea',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature claymore. 33.1% Crit Rate, +20%–40% ATK on Skill hit and taking DMG, +32% Max HP when unshielded.',
        },
        {
          name: 'Redhorn Stonethresher',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes: '88.2% Crit DMG stat stick; converts DEF into Normal and Charged Attack DMG.',
        },
        {
          name: 'Verdict',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes: '22.1% Crit Rate, +20% ATK, and elemental seal stacks grant Elemental Skill DMG.',
        },
        {
          name: "Wolf's Gravestone",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes: 'Massive ATK% substat; triggers teamwide +40% ATK buff against low-HP enemies.',
        },
        {
          name: 'Serpent Spine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '27.6% Crit Rate; ramps up to +30%–50% all DMG bonus; her top 4-star offensive claymore when protected by shields.',
        },
        {
          name: 'Akuoumaru',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'ATK% substat; scales Burst DMG by up to +40%–80% based on combined party burst energy capacity.',
        },
        {
          name: 'Favonius Greatsword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Premier support weapon. 61.3% ER; generates 6 clear particles on Crit hits, easing party ER burdens.',
        },
        {
          name: 'Sacrificial Greatsword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '30.6% ER; Skill reset bypasses her 20s Skill cooldown, improving Fiery Sanctum uptime.',
        },
        {
          name: 'Rainslasher',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '165 EM substat, +20%–36% DMG against Hydro/Pyro-affected targets in Vaporize / Burgeon teams.',
        },
        {
          name: 'Mailed Flower',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Event claymore; 110 EM substat, grants +24% ATK and +96 EM upon Skill hit or reaction.',
        },
        {
          name: '"Ultimate Overlord\'s Mega Magic Sword"',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '30.6% ER, grants up to +48% ATK from helped Melusines; eases high ER requirements.',
        },
        {
          name: 'Bloodtainted Greatsword',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes: '187 EM substat; accessible 3-star budget stat stick for Burgeon triggers.',
        },
        {
          name: 'Makhaira Aquamarine',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes: '165 EM; converts EM into a flat teamwide ATK buff.',
        },
        {
          name: 'The Bell',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            "41.3% HP substat; expands Dehya's Max HP and Redmane's Blood damage absorption pool.",
        },
        {
          name: 'Portable Power Saw',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: '55.1% HP substat; provides massive HP pool and bonus EM upon receiving healing.',
        },
      ],
    },
  },
  {
    avatarId: 10000080,
    skillDepotId: 8001,
    referenceKey: 'Mika',
    displayName: 'Mika',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-mika-info', 'kqm-mika-guide', 'kqm-mika-full'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['healingBonus', 'hpPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'hpPercent', 'healingBonus', 'critRate'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% Team ATK on Burst; 12s duration matches Skill Soulwind buffs)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+15% Healing Bonus; Foam physical bubbles scale with Superconduct / Phys RES shred)',
          },
          {
            referenceKey: 'SongOfDaysPast',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+15% Healing Bonus & Additive Base DMG Bonus for active character)',
          },
          {
            referenceKey: 'TheExile',
            pieces: 4,
            tier: 3,
            label: 'Battery (+20% ER, +6 flat energy to party members upon Burst)',
          },
          {
            referenceKey: 'MaidenBeloved',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Healing Bonus)',
          },
          {
            referenceKey: 'OceanHuedClam',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Healing Bonus)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% Energy Recharge)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/mika-quickguide/',
      playstyleSummary:
        'Premier 4-star Cryo support specialist combining dedicated Physical hypercarry buffs, partywide Attack Speed increases, and team burst healing. Starfrost Swirl (Elemental Skill) fires a Flowfrost Arrow or Rimestar Flare crossbow shot, granting all party members Soulwind (+13% to +25% Attack SPD). Striking multiple enemies with Rimestar Flare grants Detector stacks (up to 3, or 4 at C2/C6), granting +10% Physical DMG per stack to active characters. Skyfeather Song (Burst, 70 Energy cost) grants Eagleplume, instantly restoring a large burst of teamwide HP based on Mika’s Max HP, and restoring active character HP upon landing Normal Attacks.',
      energyRequirements:
        'Pre-C4 ER requirements: 175%–230% with Favonius Lance (1 proc/rotation); 105%–140% with Dialogues of the Desert Sages R5; 160%–210% with Rightful Reward R3; 190%–250% with other weapons. C4 refunds up to 15 flat energy per Burst, lowering requirements by 40%–60%. Teaming with Raiden Shogun shaves ~60%–80% ER. When used purely as an Attack SPD buffer (for Wanderer, Ayato, or Yoimiya) without bursting every rotation, ER requirements are negligible.',
      combatTips: [
        'Hold Skill for Multiple Enemies: Tapping Skill pierces in a line but generates only 1 Detector stack. Holding Skill unleashes Rimestar Flare, exploding into Rimestar Shards that hit up to 3 additional targets, immediately capping Detector stacks (+30% to +40% Physical DMG bonus).',
        'A4 Suppressive Bullets Detector Synergy: When active characters in Soulwind land a Crit hit while in Eagleplume state, Mika’s A4 passive grants 1 additional Detector stack (capping at 4 stacks / +40% Physical DMG at C0).',
        "C6 Companion's Counsel Apex: C6 increases the maximum Detector stack limit by 1 (up to 5 stacks / +50% Physical DMG) and active characters affected by Soulwind gain +60% Physical Crit DMG, cementing Mika as Eula and Freminet’s premier dedicated buffer.",
        'Furina Fanfare Synergy: Mika’s Burst provides an instantaneous partywide team heal followed by continuous active healing on Normal Attacks, making him one of the fastest full-party Fanfare stack generators for Furina.',
        "Eula Burst Swap Warning: Eula must remain on-field when her Lightfall Sword detonates. Swapping off early to detonate early loses Mika's Physical DMG% and Crit buffs because Soulwind buffs only apply to the active on-field character!",
      ],
      weapons: [
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '30.6% ER; generates 6 clear elemental particles on CRIT hits, lowering team and personal ER requirements.',
        },
        {
          name: 'Dialogues of the Desert Sages',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Event polearm. 41.3% HP substat; restores 16–32 flat energy per rotation upon healing/overhealing allies.',
        },
        {
          name: 'Rightful Reward',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable Fontaine polearm. 27.6% HP, restores 8–16 flat energy upon receiving healing (procs twice with Furina).',
        },
        {
          name: 'Prototype Starglitter',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Craftable 45.9% ER stat stick; helps meet high Burst energy requirements.',
        },
        {
          name: 'Black Tassel',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            '46.9% HP pure healing stick when ER requirements are already satisfied by substats.',
        },
        {
          name: 'Skyward Spine',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'High base ATK, 36.8% ER, +8% Crit Rate, and +12% ATK SPD.',
        },
        {
          name: '"The Catch"',
          tier: 3,
          rarity: 4,
          category: 'F2P',
          notes: '45.9% ER stat stick if unused by other party members.',
        },
      ],
    },
  },
];
