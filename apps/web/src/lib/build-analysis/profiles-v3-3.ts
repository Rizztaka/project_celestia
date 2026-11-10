import type { ReviewedCharacterProfile } from './identity';

export const v33Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000075,
    skillDepotId: 7501,
    referenceKey: 'Wanderer',
    displayName: 'Wanderer',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-wanderer-info', 'kqm-wanderer-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        talentPriorityGroups: [['normal'], ['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['anemoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Goblet: {
            atkPercent: 'team_buffs',
          },
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          { referenceKey: 'DesertPavilionChronicle', pieces: 4, tier: 1, label: 'Best in Slot (+15% Anemo DMG, +10% NA SPD, +40% NA/CA/PA DMG bonus)' },
          { referenceKey: 'ShimenawasReminiscence', pieces: 4, tier: 1, label: 'Resin-Efficient BiS (+18% ATK, +50% NA/CA DMG bonus for 15 Energy)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'BiS with Furina (+15% NA/CA DMG, up to +36% Crit Rate)' },
          { referenceKey: 'EchoesOfAnOffering', pieces: 4, tier: 2, label: 'Alternative (+18% ATK, 70% ATK NA proc; competitive at C6 and low ping)' },
          { referenceKey: 'DesertPavilionChronicle', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Anemo DMG)' },
          { referenceKey: 'ViridescentVenerer', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Anemo DMG)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/wanderer-quickguide/',
      playstyleSummary:
        'Premier 5-star Anemo on-field hypercarry and aerial specialist. Hanega: Song of the Wind (Skill) elevates Wanderer into the Windfavored state, converting his stamina into 100 Kuugoryoku Points and granting sustained mid-air flight. While airborne, his Normal and Charged Attacks convert into Windflicker and Song of the Wind with vastly increased damage and AoE. Kyogen: Five Ceremonial Plays (Burst, 60 Energy cost) compresses the atmosphere into a singular vacuum that stomps the ground 5 times in rapid succession, dealing massive burst AoE Anemo damage and concluding the Windfavored state.',
      energyRequirements:
        'Burst is optional at C0–C1; zero ER is needed if bursting every other rotation (100% ER with C6 Faruzan or 105%–115% Solo Anemo). If bursting every rotation at C2+: 115%–135% ER with C6 Faruzan; 180%–220% ER with pre-C6 Faruzan; 210%–230% ER in Solo Anemo. A1 Electro absorption refunds ~13 flat energy, cutting ER needs by 30%–40%.',
      combatTips: [
        'A1 Elemental Contact Buffs (Jade-Claimed Flower): When casting Skill, coming into contact with elements grants up to 2 simultaneous buffs (3 at C4): Pyro (+30% ATK), Hydro (+20 Kuugoryoku Points / 2s extra airtime), Cryo (+20% Crit Rate), Electro (regenerates 0.8 energy per hit up to ~13 energy).',
        'Combo Sequences: N2C spam is his standard all-rounder string for high DPS and off-field ability procs; N3 spam is optimal with Tulaytullah’s Remembrance or Attack Speed buffs (Mika/Yun Jin); Charged Attack spam (canceling animation with another CA) excels in multi-target grouping scenarios.',
        '4pc Desert Pavilion Chronicle Activation: Execute a Charged Attack either immediately before or right after activating Skill to trigger the +10% Attack SPD and +40% DMG bonus for his entire flight duration.',
        'A4 Free Dash / Wind Arrow (Gales of Reverie): When hitting enemies during flight, Wanderer has a 16% chance (+12% per non-proc hit) to gain the Descent effect: his next air sprint consumes 0 Kuugoryoku Points and fires 4 homing Wind Arrows dealing 35% ATK each.',
        'Burst Timing: At C0, Burst can be cast upfront before Skill; at C2 (which buffs Burst DMG by up to +200% based on remaining Kuugoryoku Points), Burst must ALWAYS be cast at the very end of his flight right before landing.',
      ],
      weapons: [
        {
          name: "Tulaytullah's Remembrance",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature weapon. High 674 Base ATK, 44.1% Crit DMG, +10% Normal Attack SPD, and ramps Normal Attack DMG by up to 48% after Skill.',
        },
        {
          name: 'Lost Prayer to the Sacred Winds',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '33.1% Crit Rate, +10% Movement SPD, and reliably maintains 2 stacks of +8% Elemental DMG bonus (+16% total) during his extended flight time.',
        },
        {
          name: 'Cashflow Supervision',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '674 Base ATK, 22.1% Crit Rate, and grants +16% ATK, +48% Normal Attack DMG, and +42% Charged Attack DMG through HP fluctuations in Furina teams.',
        },
        {
          name: 'The Widsith',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '55.1% Crit DMG; ATK% and Elemental DMG song buffs deliver monstrous frontloaded burst damage.',
        },
        {
          name: 'Flowing Purity',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Fontaine catalyst; grants +16% to +32% Elemental DMG bonus upon casting Skill; his premier free-to-play weapon.',
        },
        {
          name: 'Tome of the Eternal Flow',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% Crit DMG stat stick; exceptional in Furina teams when spamming Charged Attacks.',
        },
        {
          name: 'Skyward Atlas',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High base ATK, +33.1% ATK substat, and unconditional +12% Elemental DMG bonus.',
        },
        {
          name: 'Solar Pearl',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '27.6% Crit Rate; alternating Skill and Normal Attacks grants consistent +20% to +40% damage bonuses.',
        },
        {
          name: 'Dodoco Tales',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Event weapon buffing Charged Attacks and ATK%; strong for Charged Attack spam rotations.',
        },
      ],
    },
  },
  {
    avatarId: 10000076,
    skillDepotId: 7601,
    referenceKey: 'Faruzan',
    displayName: 'Faruzan',
    defaultRoleId: 'resistance_shred',
    evidenceIds: ['kqm-faruzan-info', 'kqm-faruzan-guide'],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['anemoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Circlet: {
            critRate: 'favonius_proc',
          },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent'],
        sets: [
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 1, label: 'Best in Slot at C6 (+20% HP, 100% uptime on party +20% ATK and +30% Shield Strength)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Pre-C6 BiS (+20% party ATK for 12s on Burst cast)' },
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Dual-Carry BiS (-40% Pyro/Hydro/Electro/Cryo RES shred to buff sub-DPS teammates)' },
          { referenceKey: 'TheExile', pieces: 4, tier: 2, label: 'Team Battery (+20% ER, restores 6 flat energy to party on Burst)' },
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 2, label: 'Personal Damage BiS at C6 (+70% Skill DMG on Pressurized Collapses)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% ER)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/faruzan-quickguide/',
      playstyleSummary:
        'The dedicated 4-star premier Anemo support and indispensable cornerstone for all Anemo DPS characters (Wanderer, Xiao, Heizou). The Wind’s Secret Ways (Burst, 80 Energy cost) deploys a Dazzling Polyhedron that moves in a triangular path, releasing Whirlwind Pulses every few seconds. Each Pulse confers two game-defining buffs: the Prayerful Wind’s Benefit (buffing all party members’ Anemo DMG Bonus based on Burst talent level) and Whirlwind’s Bane (shredding enemy Anemo RES by 30% for 4s). Wind Realm of Nasamjnin (Skill) deals AoE Anemo damage and enters the Manifest Gale state, empowering her next Aimed Shot into a Hurricane Arrow that creates a Pressurized Collapse vortex.',
      energyRequirements:
        'Extremely steep 80 Energy Burst cost. Pre-C6 Faruzan: Double Anemo requires 220%–260% ER (catching 2 Pressurized Collapse particle sets) or 275%–300% ER (catching 1 set); Triple Anemo requires 190%–225% ER. C6 Faruzan: Drops dramatically to 175%–200% ER (Double Anemo) or 160%–185% ER (Triple Anemo). Favonius Warbow is virtually mandatory across all pre-C6 setups.',
      combatTips: [
        'The C6 Watershed Constellation (The Wondrous Path of Truth): C6 is arguably the strongest 4-star constellation in Genshin Impact: active characters affected by Prayerful Wind gain +40% Anemo Crit DMG, and dealing damage automatically fires a Pressurized Collapse vortex every 3 seconds from off-field, generating continuous Anemo particles, grouping enemies, and maintaining 100% uptime on 4pc Tenacity of the Millelith!',
        'Pre-C6 Particle Catching: Outside C6, Faruzan’s Skill produces zero energy particles on cast! Particles are ONLY generated when her Hurricane Arrow charged shot impacts and collapses. Always execute E -> Charged Shot -> Q and catch the particles on Faruzan.',
        'A4 Flat Damage Buff (Lost Wisdom of the Seven Caverns): When characters deal Anemo DMG under Prayerful Wind, their damage is increased by 32% of Faruzan’s Base ATK once every 0.8s. High base ATK bows directly scale this bonus.',
        'Constellation 2 Duration Extension: C2 extends the Dazzling Polyhedron duration by 6 seconds (from 12s to 18s, giving 22s total buff uptime), allowing Faruzan to be deployed at the very beginning of rotations without buffs expiring.',
      ],
      weapons: [
        {
          name: 'Favonius Warbow',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed best-in-slot weapon. 61.3% ER and neutral energy particle generation solves both Faruzan’s massive 80-cost Burst requirements and her carry’s energy needs.',
        },
        {
          name: 'Elegy for the End',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '55.1% ER secondary stat and high 608 Base ATK; easily stacks Millennial Movement to grant the team +20% ATK and +100 EM (instant activation at C6).',
        },
        {
          name: 'Fading Twilight',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '30.6% ER and high 565 Base ATK to boost A4 flat damage scaling.',
        },
        {
          name: 'End of the Line',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fishing bow with 45.9% ER; comfortable stat stick for meeting high ER thresholds.',
        },
        {
          name: 'Sacrificial Bow',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '30.6% ER; resets Skill cooldown for an extra grouping shot (note: internal 5.5s cooldown prevents extra particle generation).',
        },
        {
          name: 'Skyward Harp',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High 674 Base ATK maximizes A4 flat damage bonus in C6 setups with sufficient team ER batteries.',
        },
      ],
    },
  },
];
