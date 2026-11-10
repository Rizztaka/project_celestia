import type { ReviewedCharacterProfile } from './identity';

export const v26Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000066,
    skillDepotId: 6601,
    referenceKey: 'KamisatoAyato',
    displayName: 'Kamisato Ayato',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-ayato'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { energyRecharge: 'reaction_context' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'hpPercent'],
        sets: [
          {
            referenceKey: 'HeartOfDepth',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+15% Hydro DMG, +35% Normal Attack DMG after Skill)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+18% ATK, +35% Normal Attack DMG for Swords)',
          },
          {
            referenceKey: 'NymphsDream',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+15% Hydro DMG, up to +25% ATK & +15% Hydro DMG from stacks)',
          },
          {
            referenceKey: 'EchoesOfAnOffering',
            pieces: 4,
            tier: 1,
            label: 'Competitive Best in Slot (Valley Rite proc adds +70% ATK to Normal Attacks)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot with Furina (+36% Crit Rate from HP fluctuation)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 4,
            tier: 2,
            label: 'Double Electro CD Reduction (-1s Skill CD on reactions for 2x Skill rotations)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Hydro DMG)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot for Off-Field Burst (+20% ER, up to +75% Burst DMG)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Supportive Alternative (+20% Team ATK on Burst)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc Mix (+15% Hydro DMG)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc Mix (+20% ER)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/ayato-quickguide/',
      playstyleSummary:
        "Premier on-field Hydro carry and versatile off-field Hydro enabler. Entering the Takimeguri Kanka state via Elemental Skill converts Ayato's attacks into Shunsuiken—blistering Hydro slashes that deal AoE damage scaling off both ATK and Ayato's Max HP (via Namisen stacks). Kamisato Art: Suiyuu (Burst) creates a massive rain garden that rains Hydro Blooms in a wide area for 18 seconds, continuously applying Hydro and buffing active party members' Normal Attack damage by up to 20%.",
      energyRequirements:
        'On-field (2 Skills per rotation): Solo Hydro requires 130%–160% ER; Solo Hydro + Double Electro (Fischl) requires 115%–145% ER; Double Hydro (Yelan/Furina/Xingqiu) requires 120%–135% ER; Triple Hydro requires 100%–120% ER. Off-field / Burst-oriented (1 Skill): Solo Hydro requires 155%–175% ER; Double Hydro requires 135%–170% ER. Favonius procs reduce requirements by ~10%–15% each. His A4 passive recharges 2 energy per second off-field when below 40 energy.',
      combatTips: [
        'Hold to Attack: During the Takimeguri Kanka state, you can simply hold down the Normal Attack button to unleash all 15 Shunsuiken slashes seamlessly.',
        'Normal Attack Talent Irrelevance: Kamisato Art: Marobashi (Normal Attack talent) does NOT need to be leveled! Shunsuiken attack multipliers scale exclusively from the Elemental Skill talent.',
        "Namisen HP Scaling: Each Shunsuiken hit generates a Namisen stack (up to 4 stacks, or 5 at C2), adding flat damage scaling with Ayato's Max HP. Level 90 is recommended to maximize base HP.",
        'Water Illusion Mechanics: Casting Skill leaves behind a Water Illusion that explodes when enemies are nearby or when it expires, dealing AoE Hydro damage and generating 1–2 Hydro particles. A1 instantly grants 2 Namisen stacks upon E cast and max stacks upon illusion explosion.',
        'Burst Snapshotting & Rotation Order: Kamisato Art: Suiyuu snapshots buffs upon cast. In Bennett or buffer setups, cast Q inside the buff circle (e.g. Bennett Q -> Ayato Q -> Team -> Ayato E). In reaction/Bloom teams, start with Ayato Q first to enable off-field Hydro while your team sets up auras.',
        'A4 Passive (Off-Field Energy): Michiyuku Hagetsu regenerates 2 energy every 1s when Ayato is off-field with energy < 40. Casting Burst early in the rotation maximizes passive energy regeneration.',
      ],
      weapons: [
        {
          name: 'Haran Geppaku Futsu',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature sword and undisputed BiS. 33.1% Crit Rate, 608 Base ATK. Provides +12% All Elemental DMG Bonus and consumes Wavespike stacks built by teammates to grant +40% Normal Attack DMG Bonus.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            "Tied for best weapon with Haran. 44.1% Crit Rate, +20% Max HP passive that synergizes perfectly with Ayato's Namisen HP scaling, and converts Max HP to massive flat ATK.",
        },
        {
          name: 'Mistsplitter Reforged',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Top-tier 5★ weapon providing 44.1% Crit DMG and elemental damage stacks; performs exceptionally well, especially in off-field Burst or quickswap styles.',
        },
        {
          name: 'The Black Sword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Best 4★ weapon overall. 27.6% Crit Rate, +20% to +40% Normal Attack DMG Bonus, and restores HP on critical hits.',
        },
        {
          name: 'Calamity of Eshu',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Top 4★ option that can surpass Black Sword when protected by a shield (e.g. Thoma in Burgeon, Kirara in Bloom, or Zhongli/Lan Yan in hypercarry).',
        },
        {
          name: 'Uraku Misugiri',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% Crit DMG stat stick that provides Normal Attack and Skill DMG bonuses, which double when paired with Geo teammates like Xilonen or Zhongli.',
        },
        {
          name: 'Light of Foliar Incision',
          tier: 1,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% Crit DMG stat stick; gains competitive ground in Dendro/Bloom teams receiving external EM buffs (Nahida, Sucrose, Kazuha C2).',
        },
        {
          name: 'Finale of the Deep',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Fontaine sword providing high ATK% and flat ATK bonuses upon clearing Bond of Life with a healer.',
        },
        {
          name: 'Kagotsurube Isshin',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Free story quest sword offering reliable ATK% and a flat ATK passive that can be snapshotted onto his Burst by opening with a Normal Attack.',
        },
        {
          name: 'Sturdy Bone',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Solid 4★ option with high ATK and Normal Attack DMG bonus; performs near 5★ levels in single-target buffed scenarios, but capped at 18 hit instances.',
        },
        {
          name: 'Skyward Blade',
          tier: 2,
          rarity: 5,
          category: 'Utility',
          notes:
            'Provides 55.1% ER and an Attack SPD buff after Burst that enables Ayato to squeeze in additional Shunsuiken slashes.',
        },
        {
          name: 'Harbinger of Dawn',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            'High value 3★ option providing 46.9% Crit DMG and +28% Crit Rate when maintained above 90% HP via strong shielders or healers.',
        },
      ],
    },
  },
];
