import type { ReviewedCharacterProfile } from './identity';

export const v40Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000084,
    skillDepotId: 8401,
    referenceKey: 'Lyney',
    displayName: 'Lyney',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-lyney-info', 'kqm-lyney-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'skill', 'burst'],
        talentPriorityGroups: [['normal'], ['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['pyroDmg', 'atkPercent'],
          Circlet: ['critDmg', 'critRate'],
        },
        priorityStats: ['critDmg', 'critRate', 'atkPercent', 'atk', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+36% CRIT Rate and +15% Charged Attack DMG via Prop Arrow HP consumption)',
          },
          {
            referenceKey: 'Lavawalker',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+35% DMG unconditionally against enemies affected by Pyro in Mono Pyro)',
          },
          {
            referenceKey: 'VermillionHereafter',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Massive ATK% stacking when Bursting every rotation)',
          },
          {
            referenceKey: 'ShimenawasReminiscence',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+50% Charged Attack DMG when Bursting every other rotation)',
          },
          {
            referenceKey: 'WanderersTroupe',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+35% Charged Attack DMG unconditionally for bow users)',
          },
          {
            referenceKey: 'RetracingBolide',
            pieces: 4,
            tier: 3,
            label: 'Transitional (+40% Charged Attack DMG when protected by a shield)',
          },
          {
            referenceKey: 'DesertPavilionChronicle',
            pieces: 4,
            tier: 3,
            label: 'Transitional (+40% Charged Attack DMG after hitting with a Charged Attack)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/lyney-quickguide/',
      playstyleSummary:
        "5-star Pyro bow on-field carry specializing in Charged Prop Arrows, Grin-Malkin Hat taunts, and explosive Pyrotechnic Strike detonators. Lyney charges his Bow to Level 2 to fire Prop Arrows, which summon taunting Grin-Malkin Hats and consume up to 20% of his HP (when above 60% HP) to generate Prop Surplus stacks. Bewildering Lights (Elemental Skill) detonates active Hats into AoE Pyrotechnic Strikes and cashes in all Prop Surplus stacks to deal heavy frontloaded Pyro damage and regenerate Lyney's HP. Wondrous Trick: Miracle Parade (Elemental Burst) transforms Lyney into an agile Grin-Malkin Cat, showering flames upon nearby foes before detonating into fireworks and granting an additional Hat and Prop Surplus stack. His A4 Passive Conclusive Ovation grants an astonishing +60% to +100% universal DMG bonus against Pyro-affected enemies when fielding 3 Pyro teammates, making him the premier Mono Pyro hypercarry.",
      energyRequirements:
        '125%–150% ER when casting Burst every rotation (favored for maximizing invulnerability frames, Prop Surplus stacks, and AoE burst). 100% (base ER) when casting Burst every other rotation or skipping Burst in favor of additional Charged Shots.',
      combatTips: [
        'Prop Surplus Stacking Loop: Fire 3–4 Level 2 Prop Arrows while above 60% Max HP to build maximum Prop Surplus stacks before casting Skill to maximize damage and self-healing.',
        'Burst Early-Cancel Tech: Press Skill while in Grin-Malkin Cat Burst form to immediately detonate into fireworks without wasting valuable on-field buff uptime.',
        "VV Shred Window Alignment: To ensure his Burst explosion benefits from 4pc Viridescent Venerer's 10-second Pyro RES shred, cast Burst no later than after 2 Charged Shots in standard rotations.",
        'A4 Conclusive Ovation Mono Pyro Rule: Lyney receives +60% DMG against Pyro-affected enemies, plus an additional +20% for each Pyro party member other than Lyney (capped at +100% DMG bonus with 3 Pyro teammates). Avoid triggering Vaporize or Melt which wipe off the Pyro aura!',
        'Dedicated Healer Requirement: Prop Arrows only consume HP and generate Prop Surplus stacks when Lyney is strictly above 60% Max HP. Bennett is essential to keep Lyney continuously above this threshold while providing massive Flat ATK buffs.',
      ],
      weapons: [
        {
          name: 'The First Great Magic',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. Massive 66.2% CRIT DMG, +16% Charged Attack DMG bonus, and up to +48% ATK in triple Pyro teams with Movement SPD buffs.',
        },
        {
          name: 'Aqua Simulacra',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG stat stick granting universal +20% DMG bonus within close-to-mid range. Exceptional synergy with 4pc Marechaussee Hunter.',
        },
        {
          name: 'Thundering Pulse',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes: 'High 608 Base ATK, 66.2% CRIT DMG, and unconditional +20% ATK buff.',
        },
        {
          name: 'Skyward Harp',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High 674 Base ATK with 22.1% CRIT Rate and 20% CRIT DMG; modest CRIT Rate stat helps avoid overcapping with 4pc MH.',
        },
        {
          name: "Amos' Bow",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High ATK% with strong Charged Attack DMG buffs; Grin-Malkin Hats also inherit flight-time damage bonuses upon detonation.',
        },
        {
          name: 'Song of Stillness',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Fontaine bow and best 4★ F2P option. Grants +16% to +32% universal DMG bonus for 8s after receiving healing from Bennett or Skill.',
        },
        {
          name: 'Prototype Crescent',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable bow granting high ATK% and Movement SPD upon hitting weak points, though situational against weakpoint-less bosses.',
        },
        {
          name: 'Scion of the Blazing Sun',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass bow providing 18.4% CRIT Rate and Sunfire Arrow debuff increasing Charged Attack DMG taken by enemies.',
        },
        {
          name: 'Polar Star',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '33.1% CRIT Rate stat stick with stacking ATK buffs; risks overcapping CRIT Rate when combined with 4pc Marechaussee Hunter.',
        },
        {
          name: "Hunter's Path",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '44.1% CRIT Rate stat stick; EM passive is largely inactive in Mono Pyro, but high base CRIT remains usable.',
        },
        {
          name: 'Blackcliff Warbow',
          tier: 3,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Starglitter shop bow providing 36.8% CRIT DMG; passive ATK stacks are difficult to trigger in single-target boss fights.',
        },
        {
          name: 'Slingshot',
          tier: 3,
          rarity: 3,
          category: 'F2P',
          notes:
            "Early-game 3-star option providing 31.2% CRIT Rate and +60% DMG bonus within 0.3s arrow flight when buffed by Bennett's Flat ATK.",
        },
      ],
    },
  },
  {
    avatarId: 10000083,
    skillDepotId: 8301,
    referenceKey: 'Lynette',
    displayName: 'Lynette',
    defaultRoleId: 'resistance_shred',
    evidenceIds: [
      'kqm-lynette-support',
      'kqm-lynette-reaction',
      'kqm-lynette-dps',
      'kqm-lynette-guide',
    ],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['burst', 'skill', 'normal'],
        talentPriorityGroups: [['burst'], ['skill'], ['normal']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['anemoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'atkPercent', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (-40% Elemental RES shred and +60% Swirl DMG for Pyro/Hydro/Electro/Cryo carries)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+20% Team ATK on Burst cast if another teammate already holds 4pc VV)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Converts high ER requirements into substantial Burst DMG bonus)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+36% CRIT Rate triggered by Skill HP drain and healing)',
          },
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Anemo DMG)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+20% Energy Recharge)',
          },
        ],
      },
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        talentPriorityGroups: [['normal'], ['burst'], ['skill']],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['anemoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge', 'atk'],
        sets: [
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+36% CRIT Rate and +15% NA/CA DMG stacked via Skill HP drain and heal)',
          },
          {
            referenceKey: 'DesertPavilionChronicle',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+15% Anemo, +10% Attack SPD, and +40% NA/CA DMG after Charged Attack)',
          },
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (Dual-carry driver shredding teammate elements while dealing Anemo carry damage)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Burst-focused on-field carry build)',
          },
          {
            referenceKey: 'DesertPavilionChronicle',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Anemo DMG)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Normal and Charged Attack DMG)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill', 'normal'],
        talentPriorityGroups: [['burst'], ['skill'], ['normal']],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['elementalMastery'],
          Circlet: ['elementalMastery'],
        },
        priorityStats: ['elementalMastery', 'energyRecharge', 'critRate', 'atkPercent'],
        sets: [
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+60% Swirl DMG and -40% Elemental RES shred for Hyperbloom/Electro-Charged)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+80 EM and up to +140% Hyperbloom reaction damage)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+80 EM and high flat EM stacking via elemental diversity)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 Elemental Mastery)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+80 Elemental Mastery)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/lynette-quickguide/',
      playstyleSummary:
        '4-star Anemo sword support, off-field buffer, and C6 on-field driver. Enigmatic Feint (Elemental Skill) executes a swift Enigma Thrust (Tap) or enters a high-speed Pilfering Shadow sprint (Hold) to mark an opponent, restoring HP before draining HP over 4s while generating 4 Anemo particles and delivering an Ousia-aligned Surging Blade every 10s. Magic Trick: Astonishing Shift (Elemental Burst, 70 Energy cost) summons a giant Bogglecat Box that continuously taunts nearby foes and deals Anemo DMG, absorbing Pyro, Hydro, Cryo, or Electro to fire coordinated Vivid Shots of the absorbed element. Her A1 Passive Sophisticated Synergy grants up to +20% teamwide ATK based on party elemental diversity. At C6 (Watchful Eye), using Skill grants 6 seconds of Anemo Infusion and +20% Anemo DMG bonus, unlocking dynamic on-field Swirl driver and hypercarry capabilities.',
      energyRequirements:
        'Burst costs 70 Energy. Off-field Support: Solo Anemo (1 Skill) requires 240%+ ER (180%–200% with Favonius); Solo Anemo with 2 Skills (C4 or Sacrificial) requires 140%–175% ER (115%–160% with Favonius); Double Anemo requires 145%–175% ER (105%–145% with Favonius); Triple Anemo with Faruzan requires 120%–160% ER (100%–120% with Favonius). On-field C6 Carry: 100%–130% ER.',
      combatTips: [
        'Bogglecat Box Indestructible Taunt: Unlike many player summons, the Bogglecat Box cannot take damage or be destroyed prematurely, providing 12 seconds of guaranteed aggro distraction in multi-target encounters.',
        "Dynamic Burst Mechanics: Lynette's Burst does NOT snapshot stats; its damage continuously updates as buffs (such as Bennett's Burst or Furina's Fanfare) are gained or expired.",
        'C1 Vortex Grouping & C4 Extra Charge: C1 unleashes a suction vortex at the target struck by Hold Skill; C4 grants a second Skill charge, allowing two consecutive Skills to double particle generation, grouping, and C6 infusion uptime.',
        'C6 Anemo Infusion Rotation: Stagger Skill uses (`E -> combo -> E -> combo`) to sustain up to 12s of uninterrupted Anemo Infusion. `N2C` is her highest DPS combo, while `N3D` produces the highest Swirl trigger frequency for reaction driving.',
        "Bennett C6 Infusion Warning: Bennett's C6 Pyro Infusion overrides Lynette's C6 Anemo Infusion! Avoid pairing C6 Lynette Anemo carry with C6 Bennett.",
      ],
      weapons: [
        {
          name: 'Favonius Sword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '61.3% ER; undisputed support BiS, completely solving her steep 70-cost Burst ER requirements while batterying the entire party.',
        },
        {
          name: 'Sacrificial Sword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '61.3% ER; resets Skill cooldown on hit to emulate her C4 extra charge, doubling Anemo particle generation and grouping vortexes.',
        },
        {
          name: 'Freedom-Sworn',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '198 EM support sword; grants teamwide +20% ATK and +16% Normal/Charged/Plunging Attack DMG upon triggering reactions.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine fishing sword; 45.9% ER with +16% Skill CRIT Rate and +32% ER for 5s after casting Skill.',
        },
        {
          name: 'Mistsplitter Reforged',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High 674 Base ATK and 44.1% CRIT DMG; premier 5★ weapon for C6 on-field Anemo carry, gaining all 3 Elemental DMG stacks.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '44.1% CRIT Rate with bonus HP and HP-to-ATK conversion; incredible universal stat stick for personal damage.',
        },
        {
          name: 'Uraku Misugiri',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG stat stick granting massive Normal Attack (+16%) and Skill DMG (+24%) buffs, doubled when paired with Geo.',
        },
        {
          name: 'Absolution',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High Base ATK, 44.1% CRIT DMG, and universal DMG bonus scaling with Bond of Life.',
        },
        {
          name: "Xiphos' Moonlight",
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'EM substat with passive teamwide ER% generation; top-tier choice for transformative Swirl and Hyperbloom builds.',
        },
        {
          name: 'Wolf-Fang',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '27.6% CRIT Rate Battle Pass sword; buffs Skill and Burst DMG by up to 32% and grants stacking CRIT Rate on hits.',
        },
        {
          name: 'Finale of the Deep',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            "Craftable Fontaine sword; grants 25% Bond of Life on Skill, which Lynette's innate 25% Max HP heal clears instantly to gain +150 to +300 Flat ATK.",
        },
        {
          name: 'Iron Sting',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '165 EM craftable sword; boosts all DMG upon dealing Elemental DMG, ideal for F2P Swirl/Hyperbloom drivers.',
        },
        {
          name: 'Toukabou Shigure',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '165 EM event sword; provides +32% DMG bonus against cursed enemies in single-target reaction encounters.',
        },
        {
          name: 'Skyward Blade',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'High 608 Base ATK with 55.1% ER and CRIT Rate; usable 5★ ER stat stick.',
        },
        {
          name: 'Amenoma Kageuchi',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Inazuma sword; grants ATK% and refunds up to 24-36 flat Energy upon casting Burst, lowering ER thresholds.',
        },
        {
          name: 'Skyrider Sword',
          tier: 3,
          rarity: 3,
          category: 'F2P',
          notes: 'Accessible 3★ ER sword providing 51.7% ER for budget support setups.',
        },
      ],
    },
  },
  {
    avatarId: 10000085,
    skillDepotId: 8501,
    referenceKey: 'Freminet',
    displayName: 'Freminet',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-freminet-guide', 'kqm-freminet-phys-info', 'kqm-freminet-cryo-info'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'normal', 'burst'],
        talentPriorityGroups: [['skill'], ['normal'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['physicalDmg', 'cryoDmg', 'atkPercent'],
          Circlet: ['critDmg', 'critRate'],
        },
        priorityStats: ['critDmg', 'critRate', 'atkPercent', 'energyRecharge', 'elementalMastery'],
        sets: [
          {
            referenceKey: 'PaleFlame',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+50% Physical DMG and +18% ATK for Physical Skill DPS)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+36% CRIT Rate and +15% NA/CA DMG with Furina)',
          },
          {
            referenceKey: 'BlizzardStrayer',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (Up to +40% CRIT Rate for Cryo Skill Level 0 spam in Freeze teams)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+45% to +70% Skill DMG for Cryo Level 0 Shattering Pressure spam)',
          },
          {
            referenceKey: 'PaleFlame',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+25% Physical DMG)',
          },
          {
            referenceKey: 'BloodstainedChivalry',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+25% Physical DMG)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 3,
            label: 'Transitional (+18% ATK and +35% Normal Attack DMG)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/freminet-quickguide/',
      playstyleSummary:
        "4-star Cryo Claymore on-field carry blending Physical damage, Cryo strikes, and Shatter reaction mechanics. Pressurized Floe (Elemental Skill) performs an upward Cryo thrust and enters Pers Timer for 10s: while active, his Skill converts into Shattering Pressure, and Normal Attacks release waves of frost dealing Cryo DMG while raising Pers's Pressure Level from 0 to 4. Level 0 deals 100% Cryo DMG; Levels 1–3 deal mixed Cryo and Physical DMG; Level 4 borrows the power of fully-pressurized Pers to deliver a devastating 100% Physical strike. Shadowhunter's Ambush (Burst, 60 Energy cost) deals AoE Cryo DMG, resets Skill cooldown, and activates Subnautical Hunter for 10s: Skill cooldown is reduced by 70%, frost wave damage is doubled, and each Normal Attack increases Pressure Level by 2 instead of 1. His A4 Passive Parallel Condensers grants +40% Shattering Pressure DMG for 5s after triggering Shatter, uniquely rewarding pairing with off-field Hydro teammates.",
      energyRequirements:
        'Burst costs 60 Energy. Pre-C2: 150%–200% ER (Solo Cryo) or 130%–160% ER (Double Cryo). Post-C2: 110%–140% ER (C2 refunds 2–3 Energy per Shattering Pressure cast, generating 9–12 flat Energy per rotation and slashing ER requirements drastically).',
      combatTips: [
        'Pressure Level Mechanics: Level 0 Shattering Pressure is 100% Cryo DMG (ideal for Cryo builds); Level 4 Shattering Pressure is 100% Physical DMG (ideal for Physical builds).',
        'Physical Carry Combo: Under Burst, execute `E -> Q -> N2E -> 3x [E -> N2E -> N1] -> E -> N3E`. Because each Normal Attack grants +2 Pressure Levels during Burst, just 2 Normal Attacks instantly charge Pers to Level 4!',
        'Cryo Carry Combo: Under Burst, execute `E -> Q -> E -> 4x [E -> N1 -> E] -> E` to spam 5 to 6 Level 0 Shattering Pressure strikes per rotation.',
        'A4 Parallel Condensers Shatter Synergy: Triggering Shatter grants +40% Shattering Pressure DMG for 5 seconds. Pairing Freminet with an off-field Hydro applier (Furina, Xingqiu, Yelan) is essential to freeze enemies and trigger Shatter with his heavy claymore hits.',
        "Preemptive Skill Before Burst: Freminet's Pers Timer state carries over when casting Burst. Always cast Skill before Burst (`E -> Q`) to reset the cooldown and maximize Subnautical Hunter buff duration.",
        'Constellation 2 Energy Watershed: C2 restores 2 Energy upon unleashing Shattering Pressure (3 Energy for Level 4), virtually eliminating his energy concerns and allowing full offensive stat investment.',
      ],
      weapons: [
        {
          name: 'A Thousand Blazing Suns',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Premier 5★ weapon across both Physical and Cryo Skill playstyles; exceptional Base ATK, CRIT stats, and combat buffs.',
        },
        {
          name: 'Fang of the Mountain King',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High CRIT Rate with massive Skill and Burst DMG bonuses, providing exceptional performance across his rotations.',
        },
        {
          name: 'Song of Broken Pines',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Colossal 741 Base ATK, 20.7% Physical DMG substat, and Millennial Movement buff granting +20% ATK and +12% Attack SPD.',
        },
        {
          name: 'Beacon of the Reed Sea',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '33.1% CRIT Rate with up to +40% ATK upon hitting Skill and taking damage, plus bonus HP.',
        },
        {
          name: 'Redhorn Stonethresher',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Colossal 88.2% CRIT DMG stat stick with bonus DEF and Normal Attack flat damage scaling.',
        },
        {
          name: 'Tidal Shadow',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Craftable Fontaine claymore and undisputed 4★ F2P BiS. R5 provides +48% ATK for 8s after receiving healing, rivaling top 5★ weapons in Furina teams.',
        },
        {
          name: 'Serpent Spine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '27.6% CRIT Rate Battle Pass weapon granting up to +30% to +50% universal DMG bonus at max stacks (pair with a shielder to prevent stack loss).',
        },
        {
          name: "Wolf's Gravestone",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High Base ATK (608) with massive ATK% scaling and partywide +40% ATK execute buff against targets below 30% HP.',
        },
        {
          name: 'The Unforged',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: 'High ATK% stat stick doubling its ATK buffs when protected by a shield.',
        },
        {
          name: 'Verdict',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '674 Base ATK and 22.1% CRIT Rate; grants +20% ATK and boosts Skill DMG upon collecting Crystallize shards.',
        },
        {
          name: 'Skyward Pride',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '674 Base ATK, 36.8% ER, and vacuum blade Physical damage procs; excellent pre-C2 when ER requirements are high.',
        },
        {
          name: 'Mailed Flower',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '110 EM event claymore; grants +24% ATK and +96 EM upon hitting with Skill or triggering elemental reactions.',
        },
        {
          name: 'Snow-Tombed Starsilver',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Dragonspine claymore providing 34.5% Physical DMG and Everfrost icicle drops against Cryo-affected targets.',
        },
        {
          name: 'Prototype Archaic',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Accessible craftable baseline providing 27.6% ATK and AoE physical burst strikes.',
        },
        {
          name: '"Ultimate Overlord\'s Mega Magic Sword"',
          tier: 3,
          rarity: 4,
          category: 'F2P',
          notes:
            '30.6% ER event claymore providing up to +48% ATK based on Melusine quests completed in Merusea Village.',
        },
      ],
    },
  },
  {
    avatarId: 10000005,
    skillDepotId: 503,
    referenceKey: 'TravelerHydro',
    displayName: 'Hydro Traveler',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-hydro-traveler-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        talentPriorityGroups: [['skill'], ['burst'], ['normal']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['hydroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: [
          'critRate',
          'critDmg',
          'atkPercent',
          'elementalMastery',
          'hpPercent',
          'energyRecharge',
        ],
        sets: [
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+36% CRIT Rate stacked rapidly via Suffusion HP drain during Hold Skill)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+45% Skill DMG bonus boosting Dewdrop and Torrent Surge damage)',
          },
          {
            referenceKey: 'NymphsDream',
            pieces: 4,
            tier: 2,
            label: 'Alternative (Stacking Hydro DMG% and ATK% buffs)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+15% Hydro DMG and +30% Normal/Charged Attack DMG)',
          },
          {
            referenceKey: 'Lavawalker',
            pieces: 4,
            tier: 3,
            label:
              'Transitional (+35% DMG against Pyro-affected enemies in Forward Vaporize teams)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Hydro DMG Bonus)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst', 'normal'],
        talentPriorityGroups: [['skill'], ['burst'], ['normal']],
        mainStats: {
          Sands: ['energyRecharge', 'elementalMastery'],
          Goblet: ['hydroDmg', 'elementalMastery'],
          Circlet: ['critRate', 'elementalMastery', 'healingBonus'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'elementalMastery', 'critRate', 'maxHp', 'hpPercent'],
        sets: [
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+20% Team ATK on Burst cast for supportive rotations)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+120 EM teamwide buffer upon triggering elemental reactions)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Maximizes Bountiful Bloom core damage in Nilou Bloom teams)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (-30% Dendro RES shred in Nilou Bloom / Hyperbloom if no ally equips it)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (High flat EM stacking for Bloom reactions)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% HP and team ATK buff on Torrent Surge hit)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/hydro-traveler-quickguide/',
      playstyleSummary:
        '5-star Hydro Sword ranged gunner, Bloom enabler, and Ousia-aligned mechanic solver. Aquacrest Saber (Elemental Skill) fires a single Torrent Surge on Tap, or enters an Aiming Mode on Hold to continuously fire up to 22 Dewdrops dealing Hydro DMG over 6 seconds before finishing with a Torrent Surge. While above 50% HP, Hold Skill triggers Suffusion: Dewdrops deal increased DMG based on Max HP while consuming 4% Max HP every second. Rising Waters (Elemental Burst, 80 Energy cost) unleashes a slow-moving floating bubble dealing continuous Hydro DMG as it moves forward. A1 Spotless Waters creates up to 4 Sourcewater Droplets on Dewdrop hits that restore 7% HP each, while A4 Clear Waters adds bonus DMG to Torrent Surge based on total HP consumed via Suffusion (up to 5,000 flat damage).',
      energyRequirements:
        'Personal DPS / Hold Skill: 100%–120% ER (Burst is clunky and generally skipped or used every other rotation in favor of pure offensive stats). Support / Noblesse Buffer / Bloom Enabler: 200%–260% ER (80 energy cost demands high ER investment or Favonius Sword to cast Burst reliably every 20-second rotation).',
      combatTips: [
        "Suffusion HP Manipulation: Hold Skill drains HP continuously while above 50% HP, allowing Hydro Traveler to effortlessly maintain max stacks on 4pc Marechaussee Hunter and charge Furina's Fanfare stacks.",
        'Interruption Vulnerability: The Traveler is stationary during Hold Skill and can be easily staggered, which cancels the skill prematurely and prevents Torrent Surge and particle generation! Always pair with a strong shielder (Zhongli, Layla, Kirara) or unlock C4 Aquacrest Aegis.',
        'Sourcewater Droplets & C1 Energy: Hold Skill drops up to 4 Sourcewater Droplets. Collecting them restores 7% HP each, and at C1 restores 2 Energy per droplet.',
        'Rising Waters Bubble Trajectory: The Burst bubble moves straight forward through enemies and cannot be stopped by Geo constructs or walls. Cast it directly into large enemy hitboxes or dense mobs to maximize hit counts.',
        "C6 Teammate Healing Nuance: At C6, picking up a Sourcewater Droplet restores 6% Max HP to the party member with the lowest HP percentage. Note: this healing scales with the teammate's Max HP, NOT the Traveler's HP!",
        'Pneuma Arkhe Thorn: Torrent Surge unleashes a Spiritbreath Thorn every 9s dealing Pneuma-aligned Hydro DMG to stun Ousia Fontaine clockwork meka.',
      ],
      weapons: [
        {
          name: 'Splendor of Tranquil Waters',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG; innate HP drain guarantees maximum stacks of Skill DMG% buff and bonus HP, especially when paired with Furina.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '44.1% CRIT Rate, bonus HP%, and HP-to-ATK conversion; premier universal stat stick for Hold Skill personal damage.',
        },
        {
          name: 'Uraku Misugiri',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG stat stick granting massive Skill DMG bonuses (doubled to +48% when paired with a Geo teammate).',
        },
        {
          name: 'Mistsplitter Reforged',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High 674 Base ATK and 44.1% CRIT DMG; excellent stat stick providing elemental DMG bonus.',
        },
        {
          name: 'Wolf-Fang',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Battle Pass sword providing 27.6% CRIT Rate and direct stacking buffs to Skill DMG and Skill CRIT Rate on Dewdrop hits.',
        },
        {
          name: 'Favonius Sword',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '61.3% ER; undisputed support BiS, generating clear particles for the team and making 80-cost Burst rotations manageable.',
        },
        {
          name: 'Freedom-Sworn',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '198 EM support sword; grants teamwide +20% ATK and Normal/Charged Attack buffs, excellent in Bloom and reaction teams.',
        },
        {
          name: 'Key of Khaj-Nisut',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '66.2% HP substat; boosts self-healing and converts Max HP into teamwide Elemental Mastery upon landing Dewdrops.',
        },
        {
          name: 'Finale of the Deep',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Fontaine sword; grants substantial ATK% from Bond of Life cleared by Sourcewater Droplet self-healing.',
        },
        {
          name: 'Amenoma Kageuchi',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Craftable Inazuma sword; grants ATK% and refunds flat Energy upon casting Burst.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine fishing sword; 45.9% ER with +16% Skill CRIT Rate and +32% ER after casting Skill.',
        },
        {
          name: 'Festering Desire',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes: '45.9% ER event sword granting +32% Skill DMG and +12% Skill CRIT Rate.',
        },
        {
          name: 'Sacrificial Sword',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '61.3% ER; resets Skill cooldown on Torrent Surge hit, allowing a second Hold Skill cast.',
        },
        {
          name: "Lion's Roar",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'High ATK% and up to +36% DMG bonus against enemies affected by Pyro or Electro (Forward Vaporize / Electro-Charged).',
        },
        {
          name: "Xiphos' Moonlight",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'EM substat with passive party ER% sharing; top pick for Nilou Bloom and reaction-focused setups.',
        },
        {
          name: 'Iron Sting',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '165 EM craftable sword boosting all DMG upon dealing elemental damage, great for Bloom triggers.',
        },
        {
          name: 'Dark Iron Sword',
          tier: 3,
          rarity: 3,
          category: 'F2P',
          notes:
            'Accessible 3★ EM sword providing 141 EM and ATK buffs upon triggering Electro reactions.',
        },
      ],
    },
  },
];
