import type { ReviewedCharacterProfile } from './identity';

export const v34Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000078,
    skillDepotId: 7801,
    referenceKey: 'Alhaitham',
    displayName: 'Alhaitham',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-alhaitham-info', 'kqm-alhaitham-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'normal', 'burst'],
        talentPriorityGroups: [['skill'], ['normal', 'burst']],
        mainStats: {
          Sands: ['elementalMastery', 'atkPercent'],
          Goblet: ['dendroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'energyRecharge', 'atkPercent'],
        sets: [
          { referenceKey: 'GildedDreams', pieces: 4, tier: 1, label: 'Best in Slot (+80 EM, up to +150 EM and +14% ATK via Quicken/Bloom reactions)' },
          { referenceKey: 'DeepwoodMemories', pieces: 4, tier: 1, label: 'Best in Slot in Solo Dendro (-30% Dendro RES shred if no party holder)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'BiS with Furina (+15% NA/CA DMG, up to +36% Crit Rate via HP drain)' },
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 2, label: 'Competitive Alternative (+20% Skill DMG, +25% off-field/split rotation)' },
          { referenceKey: 'GildedDreams', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
          { referenceKey: 'WanderersTroupe', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 EM)' },
          { referenceKey: 'DeepwoodMemories', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Dendro DMG)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/alhaitham-quickguide/',
      playstyleSummary:
        'Premier 5-star Dendro on-field DPS carry and reaction driver. Universality: An Elaboration on Form (Elemental Skill) rushes forward to deal Dendro damage and generate Chisel-Light Mirrors. Holding the Skill allows aiming the rush or executing an instant plunge to generate 2 mirrors immediately. While mirrors are active, Normal, Charged, and Plunging Attacks are infused with Dendro and trigger coordinated Projection Attacks every 1.6s that scale dual-stat with ATK and EM. Particular Field: Fetters of Phenomena (Burst, 70 Energy cost) consumes existing mirrors to deal multiple rapid hits in an AoE, then restores 3/2/1/0 mirrors 2 seconds later based on mirrors consumed.',
      energyRequirements:
        'With Nahida + Fischl: 105%–115% ER. With Nahida: 120%–130% ER. With Fischl + Electro/Dendro: 130%–140% ER. With Yaoyao, Kirara, or Baizhu: 130%–140% ER. In Solo Dendro teams: 175%–220% ER (Favonius teammates reduce ER requirements by ~10% per proc). If using Burst every other rotation, ER requirements drop to baseline 100%.',
      combatTips: [
        'Chisel-Light Mirror Rain (3 Mirrors): 3-mirror Projection Attacks deal 8 hits per proc and constitute Alhaitham’s highest damage output. Maintaining 3 mirrors for 12 seconds is his core gameplay loop.',
        'Standard Continuous Rotation (Q -> Attack -> N1C -> Attack -> E): Cast Burst at 0 mirrors -> swap or wait 2s -> gain 3 mirrors -> perform 2 projection procs (~4s) -> N1C (Charged Attack triggers A1 to refresh back to 3 mirrors) -> 2 projection procs (~4s) -> tap Skill (E generates 1 mirror to refresh back to 3 mirrors) -> 2 projection procs (~4s), completing a full 12s 3-mirror uptime sequence.',
        'Aim-Cancel Skill + Plunge: Aiming Skill at the ground or slightly upward and immediately executing a Plunging Attack produces 2 mirrors instantly (1 from Skill cast, 1 from Plunging hit via A1), instantly enabling 3-mirror projection attacks without needing Burst.',
        'A4 EM Conversion (Mysteries Laid Bare): Each point of Elemental Mastery increases Projection Attack DMG and Burst DMG by 0.1% (capped at +100% damage bonus at 1,000 EM), heavily weighting EM over pure ATK%.',
        'Burst Swap Tech: After casting Burst at 0 mirrors, you have ~2 seconds before the 3 mirrors generate. You can swap to an off-field character (like Kuki Shinobu, Fischl, or Yelan) to cast a quick Skill/Burst before swapping back to Alhaitham without losing any mirrors.',
      ],
      weapons: [
        {
          name: 'Light of Foliar Incision',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature weapon. 88.2% Crit DMG, +4% Crit Rate, and adds 120% EM as Additive Base DMG to Normal and Projection Attacks.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '44.1% Crit Rate, unconditional +20% HP and ATK bonus based on Max HP. His top performer in multi-target scenarios.',
        },
        {
          name: 'Mistsplitter Reforged',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '674 Base ATK, 44.1% Crit DMG, and reliably maintains 3 stacks (+28% Elemental DMG bonus) when bursting every rotation.',
        },
        {
          name: 'Haran Geppaku Futsu',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '33.1% Crit Rate, +12% Elemental DMG bonus, and +40% Normal Attack DMG bonus; performs on par with Mistsplitter.',
        },
        {
          name: 'Uraku Misugiri',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% Crit DMG, +16% Normal Attack DMG, +24% Skill DMG (doubled to +32% / +48% if paired with a Geo teammate like Zhongli).',
        },
        {
          name: 'Wolf-Fang',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Premier Battle Pass option. 27.6% Crit Rate, +16%–32% Elemental Skill DMG, and stacks up to +16% Crit Rate on Skill/Burst hits.',
        },
        {
          name: 'Iron Sting',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable F2P BiS. 165 EM substat and provides an unconditional +12%–24% all DMG bonus after dealing elemental damage.',
        },
        {
          name: 'Toukabou Shigure',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            '165 EM substat and grants up to +32% DMG bonus against cursed targets; competitive with Iron Sting in single-target.',
        },
        {
          name: 'Harbinger of Dawn',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            '46.9% Crit DMG and +28% Crit Rate when HP is above 90%; competitive with 5-star swords when protected by a strong shielder like Zhongli.',
        },
        {
          name: 'Splendor of Tranquil Waters',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% Crit DMG stat stick; passive provides up to +24% Skill DMG and +28% Max HP in Furina Quickbloom or Bloom teams.',
        },
        {
          name: 'Freedom-Sworn',
          tier: 2,
          rarity: 5,
          category: 'Utility',
          notes:
            '198 EM substat, +10% DMG, and triggers teamwide +20% ATK and +16% NA/CA/PA DMG buff for party hypercarries.',
        },
        {
          name: 'The Black Sword',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '27.6% Crit Rate, +20%–40% Normal and Charged Attack DMG bonus, and minor self-healing.',
        },
        {
          name: "Xiphos' Moonlight",
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            '165 EM substat; converts EM into personal Energy Recharge and team energy generation, significantly easing party ER burdens.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine fishing sword. 45.9% ER, +16% Skill Crit Rate, and +32% ER after casting Skill; excellent in Solo Dendro high-ER teams.',
        },
      ],
    },
  },
  {
    avatarId: 10000077,
    skillDepotId: 7701,
    referenceKey: 'Yaoyao',
    displayName: 'Yaoyao',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-yaoyao-info', 'kqm-yaoyao-guide'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['energyRecharge', 'hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['healingBonus', 'hpPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'hpPercent', 'healingBonus', 'critRate', 'elementalMastery'],
        sets: [
          { referenceKey: 'DeepwoodMemories', pieces: 4, tier: 1, label: 'Best in Slot (-30% Dendro RES shred for 8s triggered reliably by Yuegui radishes)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 1, label: 'BiS ATK Buffer (+20% ATK and +30% Shield Strength with high uptime from Skill)' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Reaction Buffer (+120 EM to all party members for 8s upon triggering reaction)' },
          { referenceKey: 'MaidenBeloved', pieces: 4, tier: 2, label: 'Maximum Healing (+15% Healing Bonus and +20% incoming healing for the party)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 2, label: 'Healing & Sub-DPS (+15% Healing Bonus, Sea-Dyed Foam physical damage bubbles)' },
          { referenceKey: 'TheExile', pieces: 4, tier: 3, label: 'Team Battery (+20% ER, regenerates 6 flat energy for all teammates upon Burst)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% HP)' },
          { referenceKey: 'MaidenBeloved', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Healing Bonus)' },
          { referenceKey: 'OceanHuedClam', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Healing Bonus)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Energy Recharge)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/yaoyao-quickguide/',
      playstyleSummary:
        'Premier 4-star Dendro healer and flexible team enabler. Raphanus Sky Cluster (Elemental Skill) tosses Yuegui: Throwing Mode, which continuously fires White Jade Radishes at nearby targets for 10 seconds. Radishes explode on contact, dealing Dendro DMG and healing party members within the blast radius based on Yaoyao’s Max HP. Moonjade Descent (Elemental Burst, 80 Energy cost) enters the Adeptal Presence state for 5 seconds: Yaoyao gains 15% Movement SPD and 50% Dendro RES, summoning up to 3 hopping Yuegui: Jumping Mode while sprinting, jumping, or running, providing massive rapid teamwide emergency healing.',
      energyRequirements:
        'In Solo Dendro teams: 260%–270% ER (220%–230% at C2). In Double Dendro teams: 220%–240% ER (190%–210% at C2; dropping to ~200% with Nahida). In Triple Dendro teams: 200%–210% ER (170%–180% at C2). Each Favonius proc reduces requirements by ~15%–20%; Fischl reduces ER by ~25%; Kitain Cross Spear (R1–R5) reduces requirements by 15%–30%. In teams where Burst is used only as an emergency heal, ER requirements are negligible.',
      combatTips: [
        'Skill Toss Targeting: Short tap throws Yuegui directly in front of Yaoyao. Holding the Skill allows manual aiming to deploy Yuegui precisely onto clustered enemies or distant teammates.',
        'Burst On-Field Sprinting: Yaoyao MUST remain on-field for the full 5 seconds of Adeptal Presence. Swapping off immediately cancels the state and despawns all Jumping Yuegui. Constantly sprint and jump during Burst to summon all 3 Yuegui and maximize radish spawns.',
        'A1 Passive (Starscatter): While in Adeptal Presence, sprinting, jumping, or running constantly throws White Jade Radishes at nearby enemies, ensuring rapid continuous team healing and Dendro application.',
        'A4 Passive (In Others’ Shoes): When White Jade Radishes explode, active characters within their AoE regenerate HP every 1s for 5s based on 0.8% of Yaoyao’s Max HP, providing sustained passive regen even between radish hits.',
        'Favonius Lance Driving: In teams where Yaoyao does not use Burst frequently, perform 1–2 Normal Attacks immediately after deploying Skill to ensure Favonius Lance crits and generates clear particles for the team.',
      ],
      weapons: [
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '30.6% Energy Recharge; generates 6 clear elemental particles on CRIT hits, lowering ER requirements for Yaoyao and her entire team.',
        },
        {
          name: 'Dialogues of the Desert Sages',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Event polearm. 41.3% Max HP substat; restores 8–16 flat energy upon healing or overhealing allies, slashing her ER requirements.',
        },
        {
          name: 'Kitain Cross Spear',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable Inazuma polearm. 110 EM substat, +6%–12% Skill DMG, and regenerates 9–15 flat energy over 6s upon Skill cast.',
        },
        {
          name: 'Moonpiercer',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            'Craftable Sumeru polearm. 110 EM substat; triggering Dendro reactions spawns a Leaf of Revival granting +16%–32% ATK to whoever picks it up.',
        },
        {
          name: 'Black Tassel',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            'Premier 3-star budget healer polearm. Massive 46.9% HP substat directly maximizes Yuegui radish healing potency.',
        },
        {
          name: 'Rightful Reward',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable Fontaine polearm. 27.6% HP substat; restores 8–16 flat energy upon receiving healing, viable when bursting regularly.',
        },
        {
          name: "Dragon's Bane",
          tier: 3,
          rarity: 4,
          category: 'Alternative',
          notes:
            '221 EM substat; acts as a potent high-EM stat stick for Bountiful Bloom or Hyperbloom driver setups.',
        },
      ],
    },
  },
];
