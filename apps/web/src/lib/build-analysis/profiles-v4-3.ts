import type { ReviewedCharacterProfile } from './identity';

export const v43Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000091,
    skillDepotId: 9101,
    referenceKey: 'Navia',
    displayName: 'Navia',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-navia-info', 'kqm-navia-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'normal', 'burst'],
        talentPriorityGroups: [['skill'], ['normal', 'burst']],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['geoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge', 'atk'],
        sets: [
          { referenceKey: 'NighttimeWhispersInTheEchoingWoods', pieces: 4, tier: 1, label: 'Best in Slot (+18% ATK, +20% Geo DMG on Skill, increased to +50% Geo DMG while protected by a Crystallize shield)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'Best in Slot (with Furina - +36% CRIT Rate and +15% Normal and Charged Attack DMG via HP fluctuations)' },
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 2, label: 'Alternative (+70% Elemental Skill DMG bonus; optimal when quickswapping or swapping out before 2nd Skill)' },
          { referenceKey: 'ArchaicPetra', pieces: 4, tier: 2, label: 'Alternative (+35% Elemental DMG Bonus to teammates upon picking up corresponding Crystallize shard)' },
          { referenceKey: 'GladiatorsFinale', pieces: 4, tier: 2, label: 'Alternative (+18% ATK and +35% Normal Attack DMG for Claymore users)' },
          { referenceKey: 'NighttimeWhispersInTheEchoingWoods', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+18% ATK)' },
          { referenceKey: 'GoldenTroupe', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)' },
          { referenceKey: 'ArchaicPetra', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Geo DMG Bonus)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill', 'burst']],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['geoDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge'],
        sets: [
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Best in Slot (+70% Skill DMG bonus for quickswap Gunbrella bursts)' },
          { referenceKey: 'NighttimeWhispersInTheEchoingWoods', pieces: 4, tier: 1, label: 'Best in Slot (+18% ATK and Geo DMG bonuses)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative (+20% Team ATK on Burst cast)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/navia/',
      playstyleSummary:
        '5-star Geo Claymore President of Spina di Rosula delivering catastrophic burst damage through her signature Gunbrella and the Crystallize reaction. Ceremonial Crystalshot (Elemental Skill, 2 charges, 9s CD) expels Rosula Shardshots consuming accumulated Crystal Shrapnel stacks. At 0/1/2/3 stacks, fires 5/7/9/11 Shardshots; when all 11 strike the same enemy, deals 200% of base damage! Every stack consumed beyond 3 (stacks 4, 5, 6) grants an additional +15% Gunbrella DMG bonus (up to +45% extra DMG at 6 stacks). Crystal Shrapnel stacks are gained whenever party members collect Crystallize shards or periodically when As the Sunlit Sky\'s Singing Salute (Elemental Burst, 60 Energy cost, 15s CD) bombards opponents with cannonades (generating 1 stack every 2.4s). Her A1 Passive Mutual Objective infuses her Normal, Charged, and Plunging Attacks with non-overrideable Geo and grants +40% DMG for 4s after firing Skill, enabling fluid on-field Crystallize generation.',
      energyRequirements:
        'Burst costs 60 Energy and is essential to cast every rotation to bombard foes and generate Crystal Shrapnel stacks: 100%–130% ER when paired with Xilonen, Geo Traveler, or C2+ Ningguang; 130%–150% ER with Chiori, Kachina, Albedo, or Zhongli; 155%–180% ER with broken pillars or short rotations. C1 restores 3 Energy per stack consumed on Skill (up to 9 Energy per Skill / 18 Energy per rotation), slashing ER needs down to 100%–120%.',
      combatTips: [
        'Point-Blank Gunbrella Positioning: Rosula Shardshots fire in a shotgun-style spread. Stand at close point-blank range to ensure all 11 Shardshots hit the primary target to activate the full 200% damage multiplier.',
        'Crystal Shrapnel Stack Economy: Skill holds up to 6 stacks. Firing at 3 stacks ensures all 11 Shardshots fire; firing at 6 stacks maximizes both shot count and adds an extra +45% multiplicative Skill DMG bonus. Stacks refresh their 300s duration whenever a new stack is acquired.',
        'Hold Skill Shard Vacuum Tech: Holding Skill enters Aiming Mode, which continuously vacuums up all nearby Crystallize shards into Navia, instantly stacking Shrapnel without having to manually run around the arena.',
        'A4 Mutual Assistance Team Composition Rule: For each Pyro, Electro, Cryo, or Hydro party member, Navia gains +20% ATK (max 2 stacks / +40% ATK). Standard teams run Double Geo + Double PHEC (e.g. Navia + Zhongli/Chiori/Xilonen + Bennett + Xiangling/Furina).',
        'Standard On-Field Combo Flow: Open with Burst -> swap to teammates for buffs/crystallize setups -> swap back to Navia -> `Hold E -> N3D -> N2 -> Hold E -> N3D` to cleanly discharge two fully stacked Gunbrella blasts with full Geo Infusion uptime.',
        'Ousia Arkhe Alignment: Periodically, firing her Gunbrella unleashes a Surging Blade dealing Ousia-aligned Geo DMG to disable Pneuma Clockwork Meka.',
      ],
      weapons: [
        {
          name: 'Verdict',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 22.1% CRIT Rate, +20% ATK, and gains Seals of Chivalric Heresy upon party Crystallize pickups to grant up to +36% Elemental Skill DMG.',
        },
        {
          name: 'A Thousand Blazing Suns',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Outstanding 5★ alternative matching Verdict at full passive uptime. Massive Base ATK, CRIT Rate, CRIT DMG, and ATK% buffs.',
        },
        {
          name: 'Serpent Spine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Battle Pass claymore and top-tier competitor. 27.6% CRIT Rate and up to +50% All DMG bonus at R5 when shielded by Crystallize; rivals and can surpass 5★ weapons.',
        },
        {
          name: 'Beacon of the Reed Sea',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '33.1% CRIT Rate and +20% ATK upon hitting with Elemental Skill; exceptional raw stat stick.',
        },
        {
          name: 'Redhorn Stonethresher',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Colossal 88.2% CRIT DMG secondary stat and boosts Normal Attack damage based on DEF.',
        },
        {
          name: 'Fang of the Mountain King',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High Base ATK, CRIT Rate, and stacking Skill/Burst DMG bonus from elemental hits.',
        },
        {
          name: 'The Unforged',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Huge ATK% substat and doubles ATK% buff while protected by a Crystallize shield.',
        },
        {
          name: "Wolf's Gravestone",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Universal ATK% powerhouse providing massive personal ATK and teamwide ATK buffs against low-health enemies.',
        },
        {
          name: 'Tidal Shadow',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine craftable claymore and best F2P option. 41.3% ATK substat and up to +48% ATK for 8s when receiving healing (phenomenal in Furina or Bennett teams).',
        },
        {
          name: 'Earth Shaker',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Natlan craftable claymore granting +32% Skill DMG bonus for 8s upon triggering Pyro reactions.',
        },
        {
          name: 'Skyward Pride',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High Base ATK, 36.8% Energy Recharge to guarantee Burst every rotation, +8% All DMG, and vacuum blades.',
        },
        {
          name: 'Talking Stick',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass claymore offering 18.4% CRIT Rate and ATK/DMG buffs when self-infused with Pyro from Bennett.',
        },
        {
          name: 'Katsuragikiri Nagamasa',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Inazuma claymore providing 45.9% ER, +12% Skill DMG, and flat energy regeneration.',
        },
        {
          name: 'Prototype Archaic',
          tier: 3,
          rarity: 4,
          category: 'F2P',
          notes:
            'Accessible baseline craftable claymore providing 27.6% ATK and periodic burst AoE physical strikes.',
        },
      ],
    },
  },
  {
    avatarId: 10000090,
    skillDepotId: 9001,
    referenceKey: 'Chevreuse',
    displayName: 'Chevreuse',
    defaultRoleId: 'resistance_shred',
    evidenceIds: ['kqm-chevreuse-guide', 'kqm-chevreuse-support-info', 'kqm-chevreuse-dps-info'],
    roles: [
      {
        id: 'resistance_shred',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent', 'healingBonus', 'critRate'],
        },
        priorityStats: ['maxHp', 'hpPercent', 'energyRecharge', 'critRate', 'atk'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (+20% Team ATK for 12s on Burst cast, stacking with A4 buff)' },
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 1, label: 'Best in Slot (+15% Healing Bonus and Yearning damage buff based on healing recorded, especially potent at C6)' },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4, tier: 1, label: 'Best in Slot (+12% Elemental DMG Bonus for Pyro and Electro teammates on reaction trigger)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 2, label: 'Alternative (2pc +20% HP helps reach 40k HP cap; 4pc grants +20% Team ATK for 3s upon Skill hit)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 2, label: 'Alternative (+15% Healing Bonus and extra damage via Sea-Dyed Foam bubbles)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% HP)' },
          { referenceKey: 'OceanHuedClam', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Healing Bonus)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Energy Recharge)' },
        ],
      },
      {
        id: 'healing_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent', 'healingBonus'],
        },
        priorityStats: ['maxHp', 'hpPercent', 'healingBonus', 'energyRecharge'],
        sets: [
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 1, label: 'Best in Slot (+15% Healing Bonus and Yearning team damage bonus)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (+20% Team ATK on Burst)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 2, label: 'Alternative (Healing into Foam bubble damage)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% HP)' },
          { referenceKey: 'OceanHuedClam', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Healing Bonus)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst', 'skill']],
        mainStats: {
          Sands: ['atkPercent', 'energyRecharge'],
          Goblet: ['pyroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'atkPercent', 'energyRecharge', 'hpPercent'],
        sets: [
          { referenceKey: 'EmblemOfSeveredFate', pieces: 4, tier: 1, label: 'Best in Slot (+20% ER and converts ER into up to +75% Burst DMG bonus)' },
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Best in Slot (C4+ multi-Skill spam build - +70% Skill DMG)' },
          { referenceKey: 'CrimsonWitchOfFlames', pieces: 4, tier: 2, label: 'Alternative (+15% Pyro DMG and Overload damage buff)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative (Team ATK buffer)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/chevreuse-quickguide/',
      playstyleSummary:
        '4-star Pyro Polearm Captain of the Special Security and Surveillance Patrol acting as the premier dedicated Overload support, resistance shredder, and healer. Vanguard\'s Coordinated Tactics (A1 Passive) activates when all party members are Pyro and Electro (at least one of each): triggering Overloaded shreds both Pyro and Electro RES of affected enemies by 40% for 6s (persisting across waves and matching Viridescent Venerer without needing Anemo!). Short-Range Rapid Interdiction Fire (Elemental Skill, 15s CD) fires a musket shot dealing AoE Pyro damage and continuously heals the active character every 2s for 12s based on her Max HP. When nearby party members trigger Overloaded, Chevreuse gains 1 Overcharged Ball; firing her Hold Skill expels the Overcharged Ball to trigger Vertical Force Coordination (A4 Passive), granting all Pyro and Electro party members +1% ATK per 1,000 Max HP of Chevreuse for 30s (capped at +40% ATK at 40,000 Max HP). Ring of Bursting Grenades (Elemental Burst, 60 Energy cost, 15s CD) fires explosive secondary shells for AoE Pyro damage. At C6, healing teammates grants a stacking +20% Pyro and Electro DMG Bonus up to 3 times (+60% DMG total!).',
      energyRequirements:
        'Burst costs 60 Energy. Burst is not required to activate her core A1 RES shred (-40%) or A4 ATK buff (+40%): Burst when available 100% (zero ER needed, allowing full investment into HP); Burst every rotation 175%–205% ER; Burst every rotation with on-field Raiden Shogun 105%–135% ER. Each Favonius weapon trigger lowers requirements by 10%–20%.',
      combatTips: [
        'Team Element Restriction Invariant: Vanguard\'s Coordinated Tactics (-40% Pyro/Electro RES Shred) ONLY functions when the party consists exclusively of Pyro and Electro characters. Introducing any Hydro, Cryo, Anemo, Dendro, or Geo character completely disables the A1 passive (though C6 DMG buffs still function in other teams).',
        'Overcharged Ball Aimed Shot Execution: Always trigger an Overloaded reaction first before firing Chevreuse\'s Skill. Once the Overcharged Ball indicator appears, Hold Skill to target an enemy and fire to activate her A4 +40% ATK buff for 30 seconds.',
        '40,000 Max HP Cap Rule: Vertical Force Coordination grants +1% ATK per 1,000 Max HP up to a hard cap of 40,000 HP (+40% teamwide ATK). Stacking HP% Sands, Goblet, and Circlet with weapons like Black Tassel or Rightful Reward easily reaches this ceiling.',
        'C6 Transformative Damage Spikes: Constellation 6 provides partywide healing after her Skill ends and grants +20% Pyro and Electro DMG Bonus every time a character receives healing from Chevreuse (stacking 3 times for a massive +60% Pyro and Electro DMG Bonus lasting 8s).',
        'Burst Skip Freedom: In pure support builds, Chevreuse does not need to Burst every rotation. Skipping her Burst saves field time and completely removes all ER substat requirements, allowing 100% focus on reaching 40,000 HP.',
        'Ousia Arkhe Alignment: Periodically, firing her Skill summons a Surging Blade dealing Ousia-aligned Pyro DMG to incapacitate Pneuma opponents.',
      ],
      weapons: [
        {
          name: 'Favonius Lance',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Universal support BiS. 30.6% Energy Recharge and clear neutral energy particles on CRIT, batterying high-cost teammates like Xiangling, Beidou, and Raiden.',
        },
        {
          name: 'Black Tassel',
          tier: 1,
          rarity: 3,
          category: 'F2P',
          notes:
            'Colossal 46.9% HP substat. The cheapest and most reliable weapon to reach Chevreuse\'s 40,000 Max HP cap for maximum healing and the full +40% ATK buff.',
        },
        {
          name: 'Rightful Reward',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine craftable polearm providing 27.6% HP and flat energy restoration upon receiving healing; excellent synergy with her self-healing.',
        },
        {
          name: 'Dialogues of the Desert Sages',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Event 4★ polearm providing 41.3% HP and restores 16 flat Energy upon performing healing.',
        },
        {
          name: 'Symphonist of Scents',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% CRIT DMG stat stick granting +28% ATK and buffs the active character\'s ATK by +32% when healed by Chevreuse.',
        },
        {
          name: 'Staff of Homa',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% CRIT DMG, +20% Max HP, and bonus ATK based on Max HP; premier hybrid support/DPS polearm.',
        },
        {
          name: 'Engulfing Lightning',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '55.1% Energy Recharge and ATK conversion for Burst-every-rotation quickswap DPS builds.',
        },
        {
          name: 'Deathmatch',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '36.8% CRIT Rate and ATK buffs for quickswap damage builds.',
        },
      ],
    },
  },
];
