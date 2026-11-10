import type { ReviewedCharacterProfile } from './identity';

export const v46Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000096,
    skillDepotId: 9601,
    referenceKey: 'Arlecchino',
    displayName: 'Arlecchino',
    defaultRoleId: 'on_field_damage',
    evidenceIds: [
      'kqm-arlecchino-reaction-info',
      'kqm-arlecchino-pyro-info',
      'kqm-arlecchino-guide',
    ],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        talentPriorityGroups: [['normal'], ['burst', 'skill']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['pyroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
          Goblet: { atkPercent: 'team_buffs' },
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'FragmentOfHarmonicWhimsy',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+18% ATK and +54% All DMG Bonus at 3 stacks; effortlessly maintained via Bond of Life consumption)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+18% ATK and +35% Normal Attack DMG unconditionally for Polearms)',
          },
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 4,
            tier: 2,
            label:
              'Alternative in Burning Teams (+18% ATK and up to +50% DMG Bonus when enemies are Burning)',
          },
          {
            referenceKey: 'EchoesOfAnOffering',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+18% ATK and +70% ATK Normal Attack Valley Rite proc on stable low ping)',
          },
          {
            referenceKey: 'RetracingBolide',
            pieces: 4,
            tier: 2,
            label:
              'Alternative with Shield (+35% Shield Strength and +40% Normal/Charged Attack DMG while protected by a shield)',
          },
          {
            referenceKey: 'CrimsonWitchOfFlames',
            pieces: 4,
            tier: 2,
            label: 'Alternative in Reaction Teams (+15% Pyro DMG and +15% Vaporize/Melt DMG Bonus)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 2,
            label:
              'Alternative in Reaction Teams (+80 EM and dynamic ATK%/EM bonuses in Vaporize/Overvape teams)',
          },
          {
            referenceKey: 'FragmentOfHarmonicWhimsy',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
          {
            referenceKey: 'CrimsonWitchOfFlames',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Pyro DMG Bonus)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+80 Elemental Mastery)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/arlecchino-quickguide/',
      playstyleSummary:
        '5-star Pyro Polearm Fourth of the Fatui Harbingers ("The Knave") delivering immense frontloaded on-field Pyro hypercarry damage through her signature Bond of Life (BoL) mechanic. When Arlecchino possesses a Bond of Life equal to or greater than 30% of her Max HP, she enters the Masque of the Red Death state: her Normal, Charged, and Plunging Attacks convert into non-overrideable Pyro DMG, and her Normal Attacks gain massive flat damage scaling off her ATK multiplied by a percentage of her current Bond of Life ratio. Each Normal Attack consumes 7.5% of her current BoL and reduces her Elemental Skill cooldown by 0.8s. Her Elemental Skill (All Is Ash, 30s CD) dashes forward dealing AoE Pyro DMG and marks foes with Blood-Debt Directives. After 5 seconds, Directives mature into Blood-Debt Dues; absorbing them via Charged Attack grants a colossal 130% Bond of Life (up to a 145% BoL cap per cast). Crucially, her Passive The Balemoon Alone May Know grants +40% Pyro DMG Bonus in combat but renders her completely immune to all external healing (statues, healers, food). She can ONLY be healed by casting her own Elemental Burst (Balemoon Rising, 60 Energy, 15s CD), which clears all Directives and Bond of Life to restore 150% ATK + 50% of consumed BoL as HP.',
      energyRequirements:
        'Burst costs 60 Energy with a 15s CD. In optimal rotations, building ER substats is not recommended (100% ER baseline): her Burst resets her surplus Bond of Life accumulated across rotations and should only be used for emergency healing in shieldless teams. If casting Burst every rotation is required for survival: 120% ER in Triple Pyro (Bennett + Xiangling/Chevreuse); 140%–150% ER in Double Pyro (Bennett/Chevreuse); and 150%+ ER in Solo Pyro. Each Favonius proc lowers requirements by 10%–15%.',
      combatTips: [
        "Early Skill Rotation Flow (5-Second Directive Maturation): Pre-C2, always open the rotation with Arlecchino's Elemental Skill (E), then immediately swap off to teammates to cast their skills, bursts, and buffs (taking 5+ seconds). When swapping back to Arlecchino, the Blood-Debt Directives will have matured into Blood-Debt Dues, granting the full 130% Bond of Life upon Charged Attack (CA) absorption. Absorbing unmatured Directives yields only 65% BoL!",
        'In-Combat Healing Restriction & Defensive Support: Because Arlecchino cannot be healed by external healers in combat, shielders (Zhongli, Layla, Thoma, Citlali, Lan Yan) or damage-reduction buffers (Xingqiu, Beidou, Dehya) provide immense value and comfort, allowing her to stay alive without having to cast Burst and sacrifice her stored Bond of Life.',
        "No HP-Scaling Trap: Arlecchino's damage scales entirely with ATK and percentage-based Bond of Life. A higher Max HP stat does NOT increase the damage bonus of Masque of the Red Death nor the percentage of Bond of Life absorbed. Avoid HP% main stats and substats entirely.",
        'Burst Timing Discipline: Avoid casting Burst mid-combo. Casting Burst clears all remaining Bond of Life and cancels Pyro infusion. If emergency healing is needed, delay Burst to the start of the next rotation right as her Skill comes off cooldown, or execute E -> Q -> CA to quickly refresh infusion.',
        'Normal Attack Combo Strings: In standard combat, execute 3x N6D or N3D / N5D combos. Because damage is frontloaded when Bond of Life percentage is highest, cancel recovery frames with quick dashes to rapidly cycle attacks.',
        'Constellation 1 & 2 Watersheds: C1 increases Masque of the Red Death ratio by an absolute +100% and grants interruption resistance during Normal Attacks. C2 immediately converts Directives into Blood-Debt Dues upon Skill cast (removing the 5s delay) and unleashes a 900% ATK AoE Pyro Balemoon Bloodfire blast when absorbed.',
      ],
      weapons: [
        {
          name: "Crimson Moon's Semblance",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 22.1% CRIT Rate, 674 Base ATK, grants +25% Bond of Life on Charged Attack hit, and provides up to +36% All DMG Bonus based on current BoL percentage. Transforms into an exclusive glowing blood scythe on Arlecchino.',
        },
        {
          name: 'Primordial Jade Winged-Spear',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Outstanding 5★ BiS alternative. 22.1% CRIT Rate, 674 Base ATK, and easily stacks up to +22.4% ATK and +12% All DMG Bonus during Normal Attack combos.',
        },
        {
          name: 'Staff of the Scarlet Sands',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '44.1% CRIT Rate. Converts Elemental Mastery into substantial Flat ATK bonuses; top-tier competitor in Vaporize and Melt teams with EM Sands.',
        },
        {
          name: 'Staff of Homa',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '66.2% CRIT DMG, +20% HP, and converts Max HP to ATK. Outstanding stat stick even when Arlecchino is above 50% HP.',
        },
        {
          name: 'Deathmatch',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Premier Battle Pass 4★ polearm. 36.8% CRIT Rate and grants up to +32% ATK in single-target encounters (+24% ATK with multiple foes).',
        },
        {
          name: 'Ballad of the Fjords',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass 4★ polearm. 27.6% CRIT Rate and grants +120–240 Elemental Mastery when party includes at least 3 distinct elemental types (premier 4★ for Vaporize/Overvape).',
        },
        {
          name: 'White Tassel',
          tier: 2,
          rarity: 3,
          category: 'F2P',
          notes:
            'Exceptional 3★ F2P weapon. 23.4% CRIT Rate and +48% Normal Attack DMG at R5. Scales extraordinarily well when paired with Bennett to compensate for low base ATK.',
        },
        {
          name: 'Calamity Queller',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Massive 741 Base ATK stat stick with +12% All Elemental DMG Bonus and stacking ATK% buffs.',
        },
        {
          name: 'Lumidouce Elegy',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '33.1% CRIT Rate and +15% ATK stat stick, with additional DMG buffs in Burning/Burgeon teams.',
        },
        {
          name: "Dragon's Bane",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '221 Elemental Mastery and +20%–36% DMG against enemies affected by Hydro or Pyro in Vaporize and Overvape teams.',
        },
      ],
    },
  },
];
