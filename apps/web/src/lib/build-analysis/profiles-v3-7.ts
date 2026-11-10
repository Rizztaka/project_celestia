import type { ReviewedCharacterProfile } from './identity';

export const v37Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000061,
    skillDepotId: 6101,
    referenceKey: 'Kirara',
    displayName: 'Kirara',
    defaultRoleId: 'shield_support',
    evidenceIds: ['kqm-kirara-info', 'kqm-kirara-guide'],
    roles: [
      {
        id: 'shield_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent', 'dendroDmg'],
          Circlet: ['hpPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['maxHp', 'hpPercent', 'energyRecharge', 'critRate', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (-30% Dendro RES shred in Spread, Bloom, and Hyperbloom teams)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+120 EM teamwide buffer for reaction carries in quickswap)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% HP, +20% Team ATK and +30% Shield Strength on Skill hits)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% Team ATK for 12s on Burst)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 1,
            label: 'Transitional 2pc Mix (+20% HP for maximum shield strength)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 1,
            label: 'Transitional 2pc Mix (+20% HP for maximum shield strength)',
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
      sourceUrl: 'https://keqingmains.com/q/kirara-quickguide/',
      playstyleSummary:
        "4-star Dendro sword shielder and agile delivery specialist. Meow-teor Kick (Elemental Skill) leaps into the air with a flying kick, deploying a Shield of Safe Transport that absorbs Dendro DMG with 250% effectiveness based on Kirara's Max HP. Holding the Skill enters the Urgent Neko Parcel cat-box state for up to 10 seconds: Kirara's Movement SPD, jump height, and climbing speed are significantly increased, crashing into opponents to deal Dendro DMG and stack shield absorption up to her maximum limit. Secret Art: Surprise Dispatch (Burst, 60 Energy cost) smashes a Special Delivery Package onto enemies, dealing AoE Dendro DMG and scattering into 6 Cat Grass Cardamoms that detonate on enemy contact or after 12 seconds.",
      energyRequirements:
        "Kirara's Burst costs only 60 Energy, and her ER requirements are modest: 100%–120% ER in Double Dendro teams; 120%–140% with Electro Resonance; 160% in Solo Dendro. Each Favonius proc reduces requirements by ~10%. Bursting every other rotation allows dropping all ER investment in favor of pure Max HP stacking.",
      combatTips: [
        'Short Hold Skill Tech: Briefly holding the Skill (just enough to tap an enemy once in Urgent Neko Parcel before exiting) grants 1 stack of A1 Reinforced Packaging, providing a 20% thicker shield than a pure tap while keeping animation time under 1 second!',
        'Shield Stacking & Refresh: Absorptions from new Shields of Safe Transport stack with existing ones, and their durations refresh to 12s. Shield durability caps at 160% of a single Tap Skill shield.',
        'A4 Pupillary Variance Team Scaling: Every 1,000 Max HP Kirara possesses increases Meow-teor Kick DMG by 0.4% and Secret Art: Surprise Dispatch DMG by 0.3%, rewarding pure HP% stat building even for her burst damage.',
        "Constellation 4 Coordinated Dendro Attacks (Steed of Skanda): When active characters protected by Kirara's shield hit opponents with Normal, Charged, or Plunging Attacks, Kirara unleashes a coordinated Small Cat Grass Cardamom attack dealing 200% ATK as Dendro DMG once every 3.8s, enabling off-field Dendro application and reaction maintenance from off-field.",
        'Constellation 6 All-Elemental DMG Buff (Countless Sights to See): After casting Skill or Burst, all nearby party members gain +12% all Elemental DMG bonus for 15 seconds, transforming Kirara into a potent universal party buffer.',
      ],
      weapons: [
        {
          name: 'Favonius Sword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '61.3% ER; generates 6 clear elemental particles on CRIT hits, lowering team and personal ER requirements.',
        },
        {
          name: 'Key of Khaj-Nisut',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '66.2% HP substat; maximizes shield strength and converts Max HP into teamwide Elemental Mastery.',
        },
        {
          name: "The Dockhand's Assistant",
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '41.3% HP substat; 4-star HP sword providing Stoic passive EM and flat energy refund upon receiving healing.',
        },
        {
          name: 'Sacrificial Sword',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '61.3% ER; Skill reset instantly allows a second kick, generating extra particles and immediately maxing shield stacks.',
        },
        {
          name: 'Sapwood Blade',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Sumeru sword; 30.6% ER; leaves a Leaf of Consciousness granting +60 to +120 EM to whoever collects it.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine fishing sword; 45.9% ER, +16% Skill Crit Rate, and +32% ER after Skill cast.',
        },
        {
          name: 'Freedom-Sworn',
          tier: 2,
          rarity: 5,
          category: 'Utility',
          notes:
            '198 EM; triggers teamwide +20% ATK and +16% NA/CA/PA DMG buff for party hypercarries.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '44.1% Crit Rate, +20% HP passive, and converts Max HP into bonus ATK for hybrid sub-DPS builds.',
        },
      ],
    },
  },
];
