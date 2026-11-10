import type { ReviewedCharacterProfile } from './identity';

export const v50Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000102,
    skillDepotId: 10201,
    referenceKey: 'Mualani',
    displayName: 'Mualani',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-mualani-info', 'kqm-mualani-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'elementalMastery'],
          Goblet: ['hydroDmg', 'hpPercent'],
          Circlet: ['critDmg', 'hpPercent'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
          Goblet: { hpPercent: 'team_buffs' },
          Circlet: { hpPercent: 'team_buffs' },
        },
        priorityStats: ['critDmg', 'hpPercent', 'elementalMastery', 'critRate', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'ObsidianCodex',
            pieces: 4,
            tier: 1,
            label:
              "Best in Slot (+15% Universal DMG Bonus and +40% CRIT Rate during Nightsoul's Blessing; unrivaled uptime and damage)",
          },
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 4,
            tier: 2,
            label:
              'Alternative in Burnvape Teams (+18% ATK and +50% All DMG Bonus when opponents are Burning)',
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+15% Hydro DMG Bonus and +30% Normal Attack DMG)',
          },
          {
            referenceKey: 'ObsidianCodex',
            pieces: 2,
            tier: 3,
            label: "Transitional 2pc Mix (+15% DMG in Nightsoul's Blessing)",
          },
          {
            referenceKey: 'HeartOfDepth',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Hydro DMG Bonus)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+20% HP)',
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
      sourceUrl: 'https://keqingmains.com/q/mualani-quickguide/',
      playstyleSummary:
        '5-star Hydro Catalyst watersports guide of the People of the Springs (Meztli) delivering devastating, single-hit Forward Vaporize burst damage. Activating Surfshark Wavebreaker (Skill, 20s CD) enters the Nightsoul\'s Blessing state, mounting her Sharky Surfboard with 60 Nightsoul Points. In this state, moving into opponents marks them with "Wave-Marked" and stacks Wavechaser (up to 3 stacks). Normal Attacks are converted into Sharky\'s Bite (scaling with Skill level and Max HP!). At 3 Wavechaser stacks, Sharky\'s Bite transforms into "Sharky\'s Surging Bite", dealing colossal Max HP-scaling Hydro DMG and firing Shark Missiles at up to 5 Wave-Marked opponents. Touching a Pufferball created by her A1 Passive restores 20 Nightsoul Points, enabling 3 to 4 full Surging Bites per Skill stance. Her Elemental Burst (Boomsharka-laka, 60 Energy, 15s CD) fires a giant Super Shark Missile dealing massive AoE Hydro DMG scaling off Max HP.',
      energyRequirements:
        'Burst costs 60 Energy with a 15s CD. It is not recommended to sacrifice offensive HP% or CRIT substats for ER: Mualani should simply cast her Burst whenever available (~every other rotation) with 100% baseline ER. If bursting every rotation in Solo Hydro is desired, ER needs reach 160%–200% (or 130%–160% with Favonius procs).',
      combatTips: [
        "Forward Vaporize Multiplier Mastery: Mualani's damage is heavily concentrated into 3 to 4 gigantic hits per rotation (Sharky's Surging Bite and Burst). Because Forward Vape multiplies Hydro damage by 2.0x, maintaining constant Pyro aura on opponents (via Xiangling, Mavuika, Pyro Traveler, or Burnvape with Emilie/Nahida) is paramount.",
        "Pufferball Collection Tech: After landing Sharky's Surging Bite, a Pufferball drops into the field. Move Mualani to collect the Pufferball to immediately restore 20 Nightsoul Points, allowing you to chain another 3-stack bite before Nightsoul ends.",
        'CRIT Rate Overcap Warning: Mualani ascends with CRIT Rate (19.2% + 5% base = 24.2%). With 4pc Obsidian Codex granting +40% CRIT Rate, she already possesses 64.2% CRIT Rate with zero artifact substats. Avoid CRIT Rate circlets and weapons like Sacrificial Jade (which pushes her over 100% CRIT Rate immediately) in favor of CRIT DMG or HP% circlets.',
        "Normal Attack Talent Unleveled Invariant: Sharky's Bite multipliers scale entirely off her Elemental Skill talent and Max HP. Her Normal Attack talent level contributes nothing to her damage and can be left at Level 1.",
        'Nightsoul Phlogiston Mobility: In Natlan, Mualani can surf across water, liquid Phlogiston, and land using Phlogiston points without consuming Nightsoul Points.',
      ],
      weapons: [
        {
          name: "Surf's Up",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 88.2% CRIT DMG, +20% HP, and grants up to +48% Normal Attack DMG Bonus via Scorching Summer stacks when triggering Vaporize.',
        },
        {
          name: 'Tome of the Eternal Flow',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Outstanding 5★ BiS alternative. 88.2% CRIT DMG, +16% HP, and grants +42% Charged/Normal DMG upon HP fluctuations.',
        },
        {
          name: 'A Thousand Floating Dreams',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '265 Elemental Mastery and teamwide EM / Elemental DMG buffs; premier stat stick for Forward Vaporize teams.',
        },
        {
          name: 'Ring of Yaxche',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Natlan 4★ F2P BiS. 41.3% HP substat and grants up to +32% Normal Attack DMG based on Max HP after casting Skill. Consistent and fully accessible.',
        },
        {
          name: 'The Widsith',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '55.1% CRIT DMG. Two of the three theme songs (Aria: +96% All DMG and Interlude: +480 EM at R5) yield astronomical nuke damage.',
        },
        {
          name: 'Sacrificial Jade',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass 4★ catalyst. 36.8% CRIT Rate, +32%–64% HP, and +40–80 EM. However, causes severe CRIT Rate overcapping with 4pc Obsidian Codex.',
        },
        {
          name: 'Prototype Amber',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            '41.3% HP substat craftable catalyst providing team healing and flat energy restoration.',
        },
      ],
    },
  },
  {
    avatarId: 10000101,
    skillDepotId: 10101,
    referenceKey: 'Kinich',
    displayName: 'Kinich',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-kinich-info', 'kqm-kinich-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent'],
          Goblet: ['dendroDmg', 'atkPercent'],
          Circlet: ['critDmg', 'critRate'],
        },
        priorityStats: ['critDmg', 'critRate', 'atkPercent', 'energyRecharge', 'atk'],
        sets: [
          {
            referenceKey: 'ObsidianCodex',
            pieces: 4,
            tier: 1,
            label:
              "Best in Slot (+15% Universal DMG Bonus and +40% CRIT Rate in Nightsoul's Blessing; massive boost to Scalespiker Cannon shots)",
          },
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+18% ATK and +50% All DMG Bonus with permanent uptime in Burning and Burgeon teams)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 4,
            tier: 2,
            label: 'Alternative (-30% Dendro RES shred support set if no teammate holds Deepwood)',
          },
          {
            referenceKey: 'GoldenTroupe',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+70% Elemental Skill DMG bonus)',
          },
          {
            referenceKey: 'ObsidianCodex',
            pieces: 2,
            tier: 3,
            label: "Transitional 2pc Mix (+15% DMG in Nightsoul's Blessing)",
          },
          {
            referenceKey: 'UnfinishedReverie',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
          {
            referenceKey: 'DeepwoodMemories',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Dendro DMG Bonus)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/kinich-quickguide/',
      playstyleSummary:
        '5-star Dendro Claymore Saurian Hunter of the Scions of the Canopy (Huitztlan) delivering high-mobility, single-target Dendro burst damage through his signature grapple-loop combat. Canopy Hunter: Riding High (Skill, 10s duration, 18s CD) hooks onto a target, entering Nightsoul\'s Blessing with 0 Nightsoul Points. While grappled, his Normal Attack is converted into "Loop Shots" dealing Dendro DMG and generating 2 Nightsoul Points (or 3 Points in blind spots). When Nightsoul Points max out at 20, his Elemental Skill transforms into "Scalespiker Cannon", an enormous sniper shot dealing massive AoE Dendro DMG (scaling purely off ATK). In Burning and Burgeon teams, his A1 Passive Nightrealm\'s Gift generates 7 Nightsoul Points whenever opponents take Burning or Burgeon damage, dramatically accelerating his Cannon fire rate from 2 to 4–5 Cannons per stance! His Elemental Burst (Hail to the Almighty Dragonlord, 70 Energy, 18s CD) summons K\'uhul Ajaw to unleash periodic Dragon Breath dealing AoE Dendro DMG.',
      energyRequirements:
        "Burst costs 70 Energy with an 18s CD. Bursting every rotation requires 200%–245% ER in Solo Dendro or 175%–220% ER in Double Dendro. Because Ajaw's damage is a secondary component of his overall output, bursting every other rotation (100%–120% ER) is heavily recommended to channel substats into CRIT and ATK%.",
      combatTips: [
        'Burning/Burgeon Blind Spot Generation Loop: A1 Passive grants 7 Nightsoul Points when Burning/Burgeon damage occurs (0.8s CD), and moving into the marked Blind Spot zone generates an extra +3 Points. In Burning teams (with Bennett, Xiangling, Dehya, Thoma, or Emilie), you can fire a max-power Scalespiker Cannon every 2 to 3 seconds for 4 to 5 total Cannons per skill!',
        'Normal Attack Talent Unleveled Invariant: Loop Shots deal Elemental Skill DMG and scale strictly with Skill talent multipliers. Normal Attack talent levels do not increase Loop Shot or Cannon damage and should be left unleveled.',
        'Blind Spot Positioning: While grappled, steer Kinich toward the highlighted circle on the ground ("Blind Spot"). Entering it generates 3 Nightsoul Points immediately and resets the Blind Spot to another sector around the enemy.',
        'Scalespiker Cannon Stacking with 4pc Obsidian Codex: Although the set description mentions consuming Nightsoul points, Scalespiker Cannon successfully receives the +40% CRIT Rate buff upon firing.',
        'Exploration Grapple: In Natlan and the open world, tapping Skill grapples forward or mid-air, allowing Kinich to swing across chasms and cliffs.',
      ],
      weapons: [
        {
          name: 'Fang of the Mountain King',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            "Signature 5★ BiS. 11.0% CRIT Rate, massive 741 Base ATK, and grants Canopy's Might stacks upon hitting with Skill or triggering Burning/Burgeon to boost Elemental Skill and Burst DMG by up to +60%.",
        },
        {
          name: 'A Thousand Blazing Suns',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Exceptional 5★ BiS alternative. 11.0% CRIT Rate, 741 Base ATK, and provides immense CRIT DMG and ATK% buffs.',
        },
        {
          name: 'Beacon of the Reed Sea',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '33.1% CRIT Rate and +20% ATK on Skill hit, with an additional +20% ATK upon taking damage (effortlessly triggered by Burning or Burgeon self-damage).',
        },
        {
          name: 'Earth Shaker',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Natlan 4★ F2P BiS. 27.6% ATK substat and grants up to +32% Elemental Skill DMG after a party member triggers a Pyro-related reaction (Burning/Burgeon). Exceptional synergy.',
        },
        {
          name: 'Serpent Spine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            '27.6% CRIT Rate Battle Pass claymore. Grants up to +50% All DMG Bonus at R5 when shielded by teammates like Zhongli, Thoma, or Dehya.',
        },
        {
          name: 'Verdict',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '22.1% CRIT Rate, 674 Base ATK, and +20% ATK stat stick.',
        },
        {
          name: 'Redhorn Stonethresher',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '88.2% CRIT DMG stat stick.',
        },
        {
          name: "Wolf's Gravestone",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes: '608 Base ATK and massive teamwide ATK% buffs.',
        },
      ],
    },
  },
  {
    avatarId: 10000100,
    skillDepotId: 10001,
    referenceKey: 'Kachina',
    displayName: 'Kachina',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-kachina-info', 'kqm-kachina-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['defPercent', 'energyRecharge'],
          Goblet: ['defPercent', 'geoDmg'],
          Circlet: ['defPercent', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['energyRecharge', 'defPercent', 'critRate', 'def'],
        sets: [
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 1,
            label:
              "Best in Slot (Natlan premier support set granting +40% Teamwide Elemental DMG Bonus to all elements involved in reactions triggered during Nightsoul's Blessing)",
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+35% Elemental DMG Bonus upon collecting corresponding Crystallize shard)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+20% Team ATK maintained via independent Turbo Twirly ground slams)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% Team ATK on Burst cast)',
          },
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+6 Energy on Nightsoul Burst)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+30% DEF)',
          },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['defPercent'],
          Goblet: ['geoDmg', 'defPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'defPercent', 'energyRecharge', 'def'],
        sets: [
          {
            referenceKey: 'ScrollOfTheHeroOfCinderCity',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+40% Teamwide DMG Bonus while dealing off-field Geo damage)',
          },
          {
            referenceKey: 'ObsidianCodex',
            pieces: 4,
            tier: 2,
            label:
              "Alternative for Personal DPS (+15% DMG and +40% CRIT Rate during Nightsoul's Blessing)",
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+54% DEF and +24% Geo DMG Bonus)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/kachina-quickguide/',
      playstyleSummary:
        '4-star Geo Polearm warrior of the Children of Echoes (Nanatzcayan) functioning as Natlan\'s universal generalist support and off-field Geo sub-DPS. Activating Go, Turbo Twirly! (Skill, 20s CD) summons her drill vehicle "Turbo Twirly" with 60 Nightsoul Points, dealing DEF-scaling AoE Geo DMG. Kachina can either ride Turbo Twirly or leave it on field to independently slam the ground periodically dealing AoE Geo DMG (considered Elemental Skill DMG and a Geo Construct). Her A1 Passive Mountain Echoes and Natlan heritage allow her to trigger Nightsoul-related effects effortlessly. Most importantly, Kachina is the primary 4-star enabler for the revolutionary 4pc Scroll of the Hero of Cinder City artifact set, granting a massive +40% Teamwide Elemental DMG Bonus to all reaction elements simply by tapping Skill. Her Elemental Burst (Time to Get Serious!, 70 Energy, 20s CD) creates a Turbo Toll Field that expands Turbo Twirly\'s attack AoE and movement speed.',
      energyRequirements:
        "Burst costs 70 Energy with a 20s CD. Because Kachina's primary role is enabling 4pc Scroll of the Hero of Cinder City through her Elemental Skill, casting Burst every rotation is NOT required. If casting Burst every rotation: 210%–285% ER in Solo Geo (with Favonius) or 165%–195% ER in Double Geo (with Favonius). Operating with 100%–140% ER and skipping Burst in standard rotations is completely viable.",
      combatTips: [
        "4pc Scroll of the Hero of Cinder City Universal Buffer: Tapping Skill summons Turbo Twirly into Nightsoul's Blessing. When Turbo Twirly deals Geo damage and triggers Crystallize with Hydro, Pyro, Electro, or Cryo, 4pc Scroll grants a titanic +40% Elemental DMG Bonus to BOTH Geo and the reacted element for 20 seconds. This buff applies teamwide and does not expire on multi-wave spawns unlike Viridescent Venerer!",
        'Independent Off-Field Slamming: After pressing Skill (`tE`), Kachina immediately leaves Turbo Twirly on field to slam independently every ~2s for 16s. Do not stay riding Turbo Twirly in support rotations; swap off immediately to your main DPS carries.',
        "Geo Construct & C1 Geo Shard Magnet: Turbo Twirly is classified as a Geo Construct, triggering Chiori's second Tamoto doll. Her C1 passive automatically pulls nearby Crystallize shards to the active character upon mounting or dismounting Turbo Twirly, instantly granting shields and Geo DMG buffs.",
        "Level 90 Defense Scaling: Because Kachina's damage and shield absorption scale with DEF, leveling her to Level 90 provides an enormous base DEF increase.",
        'Natlan Cliff Climbing Mobility: In the open world, riding Turbo Twirly allows Kachina to effortlessly scale vertical cliffs and traverse liquid Phlogiston.',
      ],
      weapons: [
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Universal 4★ Support BiS. 30.6% Energy Recharge and generates neutral particles on CRIT hits, solving team and personal Energy needs.',
        },
        {
          name: 'Footprint of the Rainbow',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            "Craftable Natlan 4★ F2P BiS. 51.7% DEF substat and grants up to +32% DEF after using Elemental Skill. Maximizes Kachina's personal damage and scaling.",
        },
        {
          name: 'Deathmatch',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes: '36.8% CRIT Rate Battle Pass polearm with DEF% and ATK% bonuses from its passive.',
        },
        {
          name: 'Staff of the Scarlet Sands',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '44.1% CRIT Rate stat stick facilitating Favonius-like CRIT procs or personal damage.',
        },
      ],
    },
  },
];
