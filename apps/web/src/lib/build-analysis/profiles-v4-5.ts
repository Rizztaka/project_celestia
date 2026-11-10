import type { ReviewedCharacterProfile } from './identity';

export const v45Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000094,
    skillDepotId: 9401,
    referenceKey: 'Chiori',
    displayName: 'Chiori',
    defaultRoleId: 'off_field_damage',
    evidenceIds: ['kqm-chiori-info', 'kqm-chiori-guide'],
    roles: [
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['defPercent', 'atkPercent'],
          Goblet: ['geoDmg', 'defPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'defPercent', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+70% Elemental Skill DMG bonus while off-field; massively buffs Tamoto slashes, A1 sweeps, and C2/C4 Kinu dolls)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+54% DEF and +24% Geo DMG Bonus at full Curiosity stacks; competitive runner-up)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+30% DEF)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Geo DMG Bonus)',
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
        id: 'on_field_damage',
        talentPriority: ['skill', 'normal', 'burst'],
        talentPriorityGroups: [['skill'], ['normal'], ['burst']],
        mainStats: {
          Sands: ['defPercent', 'atkPercent'],
          Goblet: ['geoDmg', 'defPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'defPercent', 'atkPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+54% DEF and +24% Geo DMG Bonus at 4 Curiosity stacks; premier on-field set and BiS for C6)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+18% ATK and +35% Normal Attack DMG for sword wielders)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+30% DEF)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+15% Geo DMG Bonus)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/chiori-quickguide/',
      playstyleSummary:
        '5-star Geo Sword tailor from Inazuma residing in Fontaine, functioning primarily as a premier off-field Geo sub-DPS and secondary on-field Geo carry. Her Elemental Skill (Fluttering Hasode, 16s CD) dashes forward with an upward sweep dealing dual-scaling Geo DMG (scaling primarily on DEF with moderate ATK scaling) and summons the automaton doll "Tamoto" for 17s. Tamoto continuously slashes nearby foes dealing AoE Geo DMG. If a Geo Construct exists nearby or is created, an extra Tamoto is summoned (doubling her off-field damage). At C1, this requirement is eased to merely having another Geo character in the party. Following her Skill cast, her A1 Passive Tailor-Made triggers one of two branch modes: tapping Skill activates "Tapestry", instantly switching to the next party member (bypassing switch cooldown) and granting Seize the Moment (when the active character attacks, Tamoto performs 2 coordinated upward slashes dealing 100% sweep DMG); tapping Normal Attack activates "Tailoring", granting Chiori Geo Infusion for 5s for on-field combat. Her Elemental Burst (Hiyoku: Twin Blades, 50 Energy, 13.5s CD) unleashes a twin-blade slash dealing substantial burst Geo DMG, but is typically omitted in standard rotations to avoid building ER.',
      energyRequirements:
        'Burst costs 50 Energy with a 13.5s CD. In optimal rotations, building ER substats is not recommended because her Burst damage does not justify diverting offensive stats away from Skill damage. If casting Burst every rotation is desired: 110%–130% ER with triple Geo (Itto + Gorou + Zhongli); 150%–170% ER with Xilonen (2 Skills); 170%–190% ER with Navia (2 Skills); 200%–220% ER with Zhongli pillar hits; and 260%–290% ER in solo Geo (Noelle). Each Favonius proc reduces ER needs by 5%–15%.',
      combatTips: [
        "Automaton Tamoto Construct Synergy: Tamoto lasts 17s with slashes every 3.6s. To summon the second Tamoto and double off-field damage output at C0, ensure a Geo Construct (Zhongli pillar, Albedo solar isotoma, Geo Traveler boulders, Ushi) is on field when casting Skill or within Tamoto's duration. At C1, simply bringing any second Geo party member summons the second Tamoto and extends attack range by 50%.",
        "A1 Tapestry Quickswap Execution: Double-tapping Elemental Skill immediately triggers Tapestry, swapping instantly to the next character in line without triggering standard switch cooldowns. This enables seamless, ultra-fast rotations while priming Tamoto's Seize the Moment coordinated slashes.",
        'A1 Tailoring On-Field Infusion: Tapping Normal Attack after Skill grants 5s of Geo Infusion. In on-field driver or Lunar-Crystallize setups, execute N1C (Normal 1 -> Charged Attack) dash cancels for maximum motion value.',
        'Stat Allocation Priority: Prioritize CRIT Rate / CRIT DMG > DEF% > ATK%. While Chiori has dual ATK and DEF scaling, her DEF coefficients are vastly higher and benefit significantly from character level 90. DEF% Goblet can rival or outperform Geo DMG% Goblet depending on team buffs and weapon passive.',
        'A4 Passive The Finisher: Triggering Crystallize grants Chiori +20% Geo DMG Bonus for 20 seconds. In Geo + PHEC teams, Crystallize shields generated by Tamoto or teammates ensure permanent 100% uptime on this buff.',
        'Independent Tamoto Dolls: Tamoto dolls are indestructible automata, meaning boss attacks cannot shatter them unlike standard Geo Constructs (e.g. Zhongli pillars).',
      ],
      weapons: [
        {
          name: 'Uraku Misugiri',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 88.2% CRIT DMG, +16% DEF, and unconditionally increases Normal Attack DMG by 16% and Elemental Skill DMG by 24%. When a nearby active character deals Geo DMG, these bonuses double to +32% Normal DMG and +48% Elemental Skill DMG for 15s. Effortless 100% uptime.',
        },
        {
          name: 'Peak Patrol Song',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ sword of Xilonen offering massive DEF% and teamwide All-Elemental DMG buffs via Ode to Flowers stacks when hitting with Normal/Plunging attacks or Skill.',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '44.1% CRIT Rate and +20% HP with ATK bonus based on Max HP. Incredible universal stat stick for off-field Chiori.',
        },
        {
          name: 'Harbinger of Dawn',
          tier: 2,
          rarity: 3,
          category: 'Alternative',
          notes:
            'Premier 3★ F2P weapon. Provides 46.9% CRIT DMG and +28% CRIT Rate when HP is above 90%. Because Chiori spends virtually all her time off-field, maintaining the >90% HP threshold is effortless, making it outperform most 4★ swords.',
        },
        {
          name: 'Cinnabar Spindle',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            "Event-exclusive 4★ weapon providing 69.0% DEF and boosting Elemental Skill DMG by 80% of DEF. Outstanding synergy with Chiori's high base DEF and DEF scalings.",
        },
        {
          name: 'Flute of Ezpitzal',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Craftable Natlan 4★ sword offering 69.0% DEF substat and granting up to +32% DEF after casting Elemental Skill. Highly accessible craftable alternative on par with Cinnabar Spindle.',
        },
        {
          name: 'Light of Foliar Incision',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% CRIT DMG and +4% CRIT Rate stat stick. Normal Attacks triggering Elemental DMG grant Foliar Incision, increasing Skill and Normal Attack DMG based on EM.',
        },
        {
          name: 'Wolf-Fang',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass 4★ sword providing 27.6% CRIT Rate and +16% Skill DMG. While off-field Tamoto hits do not stack the passive CRIT Rate buff, the base stats remain solid.',
        },
        {
          name: 'Splendor of Tranquil Waters',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% CRIT DMG stat stick. In Furina teams where team HP fluctuates, activates up to +24% Elemental Skill DMG.',
        },
        {
          name: 'Mistsplitter Reforged',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '44.1% CRIT DMG and +12% All Elemental DMG Bonus. High base ATK stat stick with partial stack uptime.',
        },
      ],
    },
  },
];
