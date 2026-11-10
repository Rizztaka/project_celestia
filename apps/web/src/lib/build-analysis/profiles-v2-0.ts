import type { ReviewedCharacterProfile } from './identity';

export const v20Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000005,
    skillDepotId: 507,
    referenceKey: 'TravelerElectro',
    displayName: 'Electro Traveler',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-electro-traveler'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['electroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk'],
        sets: [
          { referenceKey: 'EmblemOfSeveredFate', pieces: 4, tier: 1, label: 'Best in Slot (+20% ER and converts ER to Burst DMG)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot Support (Team +20% ATK on Burst)' },
          { referenceKey: 'TheExile', pieces: 4, tier: 2, label: 'Alternative (Team Flat Energy Battery)' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative (Team +120 EM on Reaction)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atk'],
        sets: [
          { referenceKey: 'EmblemOfSeveredFate', pieces: 4, tier: 1, label: 'Best in Slot (ER & Burst DMG)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/electro-traveler/',
      playstyleSummary:
        'Universal single-target battery and Energy Recharge buffer. Lightning Blade (E) generates Abundance Amulets that restore flat energy and grant +20% ER (increased by 10% of Traveler\'s own ER via A4 Passive) to whichever character collects them. Bellowing Thunder (Burst) triggers coordinated Falling Thunder strikes whenever the active character attacks, regenerating additional flat energy.',
      energyRequirements:
        'Extreme 80-cost Burst with low personal particle generation. Needs 200% - 250%+ ER to burst every rotation and maximize A4 team ER sharing.',
      combatTips: [
        'A4 Passive (Resounding Roar): Increases the ER provided by Abundance Amulets by 10% of Electro Traveler\'s own Energy Recharge. Stacking high ER directly boosts the battery power passed to your carry (e.g. Eula, Xiao, Noelle).',
        'Amulet Pickup Priority: Make sure your energy-hungry hypercarry or burst-reliant DPS is the one who actively steps on the Abundance Amulets to receive both flat energy and the ER buff.',
        'Skill particle mechanics: Lightning Blade drops Abundance Amulets instead of standard elemental particles on hit; relying on Favonius Sword or team white particles is vital for Traveler\'s own burst uptime.',
        'C2 reduces hit enemies\' Electro RES by 15% for 8 seconds when struck by Falling Thunder.',
        'C6 increases Falling Thunder damage on every 3rd strike by 100% and regenerates 1 additional flat energy.',
      ],
      weapons: [
        {
          name: 'Favonius Sword',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Top weapon choice; 61.3% ER and party white particles, vital to sustain both Traveler and the team',
        },
        {
          name: 'Sacrificial Sword',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: '61.3% ER and resets Skill cooldown, enabling 2 sets of Abundance Amulets for massive flat energy',
        },
        {
          name: 'Skyward Blade',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'High base ATK and 55.1% ER substat',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Fontaine fishing sword; 45.9% ER, +16% Skill Crit Rate, and +32% ER after casting Skill',
        },
        {
          name: 'Amenoma Kageuchi',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Craftable sword refunding flat energy after Burst cast',
        },
      ],
    },
  },
  {
    avatarId: 10000002,
    skillDepotId: 201,
    referenceKey: 'KamisatoAyaka',
    displayName: 'Kamisato Ayaka',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-ayaka'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'normal', 'skill'],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['cryoDmg'],
          Circlet: ['critDmg', 'atkPercent'],
        },
        priorityStats: ['critDmg', 'atk', 'energyRecharge', 'critRate'],
        sets: [
          { referenceKey: 'BlizzardStrayer', pieces: 4, tier: 1, label: 'Best in Slot (+15% Cryo DMG, up to +40% Crit Rate in Freeze)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'Best in Slot (with Furina: +36% Crit Rate, +15% Normal/Charged)' },
          { referenceKey: 'GladiatorsFinale', pieces: 2, tier: 2, label: 'Alternative 2pc (+18% ATK)' },
          { referenceKey: 'BlizzardStrayer', pieces: 2, tier: 2, label: 'Alternative 2pc (+15% Cryo DMG)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://kqm-uploads.keqingmains.com/wp-content/uploads/2024/04/Ayaka_6.0_-_angtahimik_cote__auraolis.png',
      playstyleSummary:
        'Premier Cryo on-field hypercarry renowned for catastrophic Freeze burst windows. Alternate Sprint (Senho) applies Cryo infusion and grants +18% Cryo DMG bonus. Unleashes Kamisato Art: Soumetsu (Burst), launching a piercing snowstorm whirlwind that slashes enemies 20 times over 5s for over 4000% total talent multiplier.',
      energyRequirements:
        '80-energy Burst cost. 130% - 145% ER with a Cryo battery (Shenhe, Rosaria, Diona) or Favonius teammates; drops to 100% - 110% ER when using R5 Amenoma Kageuchi.',
      combatTips: [
        'Optimal Burst Rotation: Dash to apply Senho Cryo infusion & trigger A4 (+18% Cryo DMG) -> Normal Attack 1 (to trigger Mistsplitter stack) -> Elemental Skill (A1 +30% NA/CA DMG buff) -> Elemental Burst (Soumetsu).',
        'Alternate Sprint (Senho): When Ayaka emerges from her sprint and hits an enemy, she restores 10 stamina and gains +18% Cryo DMG bonus for 10 seconds (A4 Passive Kanten Senmyou Blessing).',
        'Freeze Locking: Soumetsu Frostflake Sekki whirlwind passes through unfreezable large bosses but stays completely locked onto frozen enemies, guaranteeing all 20 slashing hits connect.',
        'Charged Attack range: Ayaka\'s Charged Attack hits in a wide three-slash spatial sphere that can hit flying or elevated enemies (such as Specters or Ruin Drakes).',
      ],
      weapons: [
        {
          name: 'Mistsplitter Reforged',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Signature 5-star sword; 674 high base ATK, 44.1% Crit DMG, and up to +28% elemental DMG bonus easily maxed on Ayaka',
        },
        {
          name: 'Haran Geppaku Futsu',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: '33.1% Crit Rate, +12% elemental DMG bonus, and Normal Attack buff (careful not to overcap Crit Rate with 4pc Blizzard Strayer)',
        },
        {
          name: 'Primordial Jade Cutter',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: 'Massive 44.1% Crit Rate and HP-to-ATK conversion; best with Crit DMG circlet and non-Blizzard sets',
        },
        {
          name: 'Amenoma Kageuchi',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: 'Craftable F2P weapon; ATK% substat and refunds up to 36 flat energy at R5, drastically lowering ER requirements',
        },
        {
          name: 'Finale of the Deep',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: 'Fontaine craftable sword; high ATK% and grants massive flat ATK when Bond of Life is cleared by a healer',
        },
        {
          name: 'The Black Sword',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Battle Pass sword offering Crit Rate and Normal/Charged Attack damage bonus',
        },
        {
          name: 'Blackcliff Longsword',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: 'Starglitter shop sword offering 36.8% Crit DMG and stacking ATK after enemy defeats',
        },
      ],
    },
  },
  {
    avatarId: 10000049,
    skillDepotId: 4901,
    referenceKey: 'Yoimiya',
    displayName: 'Yoimiya',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-yoimiya'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: { Sands: { elementalMastery: 'reaction_context' } },
        priorityStats: ['critRate', 'critDmg', 'atk', 'elementalMastery'],
        sets: [
          { referenceKey: 'ShimenawasReminiscence', pieces: 4, tier: 1, label: 'Best in Slot (+50% Normal Attack DMG at cost of 15 Energy)' },
          { referenceKey: 'CrimsonWitchOfFlames', pieces: 4, tier: 1, label: 'Best in Slot (Vaporize / Overload: +15% Pyro & Reaction DMG)' },
          { referenceKey: 'EchoesOfAnOffering', pieces: 4, tier: 1, label: 'Best in Slot (at ping <100ms: +70% ATK damage bonus on Normal Attacks)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'Best in Slot (with Furina: +36% Crit Rate, +15% Normal Attack DMG)' },
          { referenceKey: 'CrimsonWitchOfFlames', pieces: 2, tier: 2, label: 'Alternative 2pc (+15% Pyro DMG)' },
          { referenceKey: 'GladiatorsFinale', pieces: 2, tier: 2, label: 'Alternative 2pc (+18% ATK)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/yoimiya-quickguide/',
      playstyleSummary:
        'Premier single-target Pyro ranged carry. Niwabi Fire-Dance (E) infuses Normal Attacks with Pyro and dramatically multiplies their damage for 10s. Best played in Vaporize (with Xingqiu/Yelan), Overvape (with Fischl/Chevreuse), or Mono Pyro teams with a defensive shielder.',
      energyRequirements:
        '100% - 120% ER; Burst is low priority when using 4pc Shimenawa\'s Reminiscence (either burst every other rotation or omit burst to keep energy for 4pc Shimenawa proc).',
      combatTips: [
        'Complete Normal Attack Strings: Yoimiya\'s damage is heavily concentrated on the 3rd and 5th hits of her 5-attack string. Dodging or suffering stagger resets the combo and ruins DPS; running a strong shielder (Zhongli, Layla, Thoma) is strongly advised.',
        'Normal Attack Talent Scaling: Niwabi Fire-Dance multiplies Normal Attack damage; level Normal Attack FIRST before Skill.',
        'A1 Passive (Tricks of the Trouble-Maker): During Skill, Normal Attack hits grant +2% Pyro DMG bonus (up to 10 stacks for +20% Pyro DMG).',
        'A4 Passive (Summer Night\'s Dawn): Casting Burst grants party members +10% ATK for 15s + 1% extra ATK per A1 stack Yoimiya had.',
        'Slingshot 0.3s Rule: When using Slingshot, ensure Yoimiya stays within medium/close range of targets so arrows land within 0.3 seconds to activate the +60% damage bonus.',
      ],
      weapons: [
        {
          name: 'Thundering Pulse',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Signature 5-star bow; 66.2% Crit DMG, +20% ATK, and up to +40% Normal Attack DMG at 3 stacks',
        },
        {
          name: 'Aqua Simulacra',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: 'Huge 88.2% Crit DMG with unconditional 20% all-DMG bonus in close/medium range',
        },
        {
          name: 'Rust',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Custom 4-star weapon for Yoimiya; ATK% substat and up to +80% Normal Attack DMG at R5, rivaling 5-star weapons',
        },
        {
          name: 'Slingshot',
          rarity: 3,
          tier: 1,
          category: 'F2P',
          notes: 'Outstanding 3-star weapon; 31.2% Crit Rate and +60% Normal Attack DMG at R5 (stay within 0.3s arrow flight distance; best paired with Bennett/Yun Jin)',
        },
        {
          name: 'The First Great Magic',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '66.2% Crit DMG, movement speed, and ATK% buffs',
        },
        {
          name: 'Polar Star',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '33.1% Crit Rate and stacking ATK% buffs',
        },
        {
          name: 'Hamayumi',
          rarity: 4,
          tier: 2,
          category: 'F2P',
          notes: 'Inazuma craftable bow boosting Normal Attacks (anti-synergistic with Shimenawa)',
        },
      ],
    },
  },
  {
    avatarId: 10000053,
    skillDepotId: 5301,
    referenceKey: 'Sayu',
    displayName: 'Sayu',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-sayu-off-field', 'kqm-sayu-on-field'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery', 'atkPercent'],
          Goblet: ['elementalMastery', 'atkPercent'],
          Circlet: ['elementalMastery', 'healingBonus', 'critRate'],
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'atk', 'critRate'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot (-40% Elemental RES shred, +60% Swirl DMG)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 2, label: 'Alternative (Healing & Sea-Dyed Foam Physical DMG)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative (Team +20% ATK on Burst)' },
          { referenceKey: 'Instructor', pieces: 4, tier: 2, label: 'Alternative (Team +120 EM on Reaction)' },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'atk'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot (Swirl DMG & Resistance Shred)' },
        ],
      },
      {
        id: 'resistance_shred',
        talentPriority: ['burst', 'skill'],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['energyRecharge', 'elementalMastery'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot (-40% Elemental RES on Swirl)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://kqm-uploads.keqingmains.com/wp-content/uploads/2024/10/Sayu-Off-Field-Infographic.png',
      playstyleSummary:
        'Versatile Anemo healer, Viridescent Venerer resistance shredder, and high-speed rolling Swirl driver. Fuufuu Windwheel (Hold E) curls Sayu into a rolling ball for up to 10s, absorbing elements and triggering rapid Swirls. Mujina Flurry (Burst) summons Muji-Muji Daruma to heal party members and strike nearby enemies with Anemo DMG.',
      energyRequirements:
        '80-energy Burst cost. Off-field: 180% - 220% ER (drops to 150% - 170% with Favonius Greatsword or double Anemo). On-field (full roll): 140% - 160% ER.',
      combatTips: [
        'A1 Passive (Someone More Capable): When Sayu triggers a Swirl reaction while on field, heals all nearby party members for 300 HP + 1.2 HP per point of Sayu\'s EM (2s cooldown).',
        'C1 Synergy: At C0, Muji-Muji Daruma only attacks if active character HP > 70% and only heals if HP <= 70%. At C1, it simultaneously attacks and heals regardless of character HP!',
        'C6 EM Scaling: Constellation 6 makes Muji-Muji Daruma damage and healing scale directly with Sayu\'s Elemental Mastery (up to +400% ATK damage and +6000 HP healing per tick at 2000 EM), making Full EM builds optimal for both healing and Swirl damage.',
        'Rolling Fuufuu Windwheel: Tapping E produces a quick dash-kick for quickswap particle generation; holding E rolls for up to 10s, spreading elemental application and absorbing Pyro/Hydro/Electro/Cryo.',
      ],
      weapons: [
        {
          name: 'Favonius Greatsword',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: 'Top utility claymore; massive 61.3% ER and generates party white particles to easily sustain 80-cost Burst',
        },
        {
          name: 'Katsuragikiri Nagamasa',
          rarity: 4,
          tier: 1,
          category: 'F2P',
          notes: 'Inazuma craftable claymore; 45.9% ER and passive refunds flat energy after using Skill',
        },
        {
          name: 'Makhaira Aquamarine',
          rarity: 4,
          tier: 1,
          category: 'Alternative',
          notes: '165 EM and converts EM into an ATK buff for both Sayu and the team',
        },
        {
          name: 'Rainslasher',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '165 EM with damage bonus against opponents affected by Hydro or Electro (great for C6 or Aggravate/Electro-Charged)',
        },
        {
          name: 'Wolf\'s Gravestone',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High base ATK and ATK% substat to scale baseline healing, plus party ATK buff against low-HP enemies',
        },
        {
          name: 'Skyward Pride',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: 'High base ATK and 36.8% ER comfort',
        },
        {
          name: 'Bloodtainted Greatsword',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: 'Accessible 3-star claymore offering 187 EM for Swirl builds',
        },
      ],
    },
  },
];
