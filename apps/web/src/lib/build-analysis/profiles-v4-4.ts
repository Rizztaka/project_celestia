import type { ReviewedCharacterProfile } from './identity';

export const v44Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000093,
    skillDepotId: 9301,
    referenceKey: 'Xianyun',
    displayName: 'Xianyun',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-xianyun-info', 'kqm-xianyun-guide'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['atkPercent'],
          Circlet: ['atkPercent', 'healingBonus', 'critRate'],
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'atk', 'healingBonus', 'critRate'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot (-40% Elemental RES Shred for Pyro, Hydro, Electro, Cryo plunge carries or off-field sub-DPS units)' },
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 1, label: 'Best in Slot (+15% Healing Bonus and Yearning additive damage buff based on recorded healing; premier choice for Xiao or Anemo/Geo teams)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (+20% Team ATK for 12s on Burst cast; top choice in Xiao teams if no teammate holds Noblesse)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot (+15% Healing Bonus and converts massive burst healing into 30,000 damage bubble detonations)' },
          { referenceKey: 'GladiatorsFinale', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+18% ATK)' },
          { referenceKey: 'ShimenawasReminiscence', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+18% ATK)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Energy Recharge)' },
        ],
      },
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['atkPercent'],
          Circlet: ['healingBonus', 'atkPercent'],
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'atk', 'healingBonus'],
        sets: [
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 1, label: 'Best in Slot (+15% Healing Bonus and Yearning team damage bonus)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot (Healing into Foam bubble damage)' },
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot (-40% RES Shred support)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative (+20% Team ATK on Burst)' },
        ],
      },
      {
        id: 'resistance_shred',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['atkPercent'],
          Circlet: ['atkPercent', 'critRate'],
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'critRate', 'atk'],
        sets: [
          { referenceKey: 'ViridescentVenerer', pieces: 4, tier: 1, label: 'Best in Slot (-40% Swirled Elemental RES Shred)' },
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 2, label: 'Alternative (Healing support)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/xianyun-quickguide/',
      playstyleSummary:
        '5-star Anemo Catalyst adeptus (Cloud Retainer) operating as a revolutionary plunging attack enabler, universal buffer, and premier teamwide burst healer. White Clouds at Dawn (Elemental Skill, 12s CD) enters Cloud Transmogrification, allowing her to leap forward using Skyladder up to 3 times before converting her Plunging Attack into Driftcloud Wave (generating 5 Anemo particles on hit and granting up to +10% Plunging Attack CRIT Rate for 16s via A1 Galefeather Pursuit). In standard combat, tapping Skill once (1x E -> Plunge) is optimal to minimize field time. Stars Gather at Dusk (Elemental Burst, 70 Energy cost, 18s CD, 16s duration) summons Starwicker, delivering instantaneous teamwide burst healing scaling with ATK followed by continuous active character healing. Starwicker grants 8 stacks of Adeptal Assistance, boosting party jump height so ANY character can perform continuous Plunging Attacks! Her A4 Passive Consider, the Adeptus in Her Realm increases active character Plunging Attack damage by 200% of Xianyun\'s ATK (capped at +9,000 base damage at 4,500 ATK), acting as an additive base DMG boost that scales with the plunge attacker\'s DMG% and CRIT multipliers.',
      energyRequirements:
        'Burst costs 70 Energy and must be cast every rotation to sustain Starwicker jumping and teamwide healing: With Crane\'s Echoing Call: Solo Anemo 190%–260% ER; With Xiao 140%–150% ER; With Xiao + C6 Faruzan 100%–120% ER. With Other Catalysts (Favonius / Oathsworn / ATK weapons): Solo Anemo 220%–300% ER (170%–190% with Favonius Codex); With Xiao 200%–210% ER; With Xiao + C6 Faruzan 120%–135% ER. Teammate Favonius procs reduce requirements by 10%–20% each.',
      combatTips: [
        'Adeptal Assistance Jump Mechanics: Starwicker grants 8 stacks of Adeptal Assistance during its 16s duration. Each time the active character jumps and unleashes a Plunging Attack, 1 stack is consumed, boosting jump height to maximum and triggering Xianyun\'s colossal A4 additive base damage bonus.',
        'Single E Tap vs Triple Jump: In pre-C6 combat rotations, always press Skill once (`1x E -> Plunge`). Leaping 3 times generates the exact same 5 Anemo particles and triggers the A1 buff, but wastes 2+ seconds of field time and cuts into teammate buff uptimes (Bennett, Furina, Faruzan).',
        'A4 4,500 ATK Cap Rule: Consider, the Adeptus in Her Realm grants 200% of Xianyun\'s ATK as flat base damage to Plunging Attacks up to a maximum cap of +9,000 damage at 4,500 ATK. Prioritize Energy Recharge first to ensure 100% Burst uptime, then invest all remaining stats into ATK% Sands, Goblet, and Circlet.',
        'C2 God-Tier Plunge Scaling: Constellation 2 grants +20% ATK for 15s after casting Skill and doubles her A4 buff to 400% of her ATK, with the cap doubled to an astounding +18,000 base damage at 4,500 ATK (the most transformative C2 support spike in Genshin history).',
        'Universal Enabler Synergies: Enables top-tier plunging carries: Xiao (eliminates energy and health attrition), Gaming (drastically amplifies Charmed Cloudstrider Pyro plunges), Diluc (Dragonstrike-tier plunge multipliers), Hu Tao (jump cancel into plunge), and Furina (effortlessly caps 300 Fanfare via massive teamwide healing).',
      ],
      weapons: [
        {
          name: "Crane's Echoing Call",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. Highest Base ATK of any catalyst in the game (741), +28% Plunging Attack DMG to teammates for 20s, and refunds up to 10 flat Energy per rotation.',
        },
        {
          name: 'Favonius Codex',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Universal utility BiS. 45.9% Energy Recharge and generates 6 clear neutral particles on CRIT, single-handedly solving steep ER requirements for Xianyun and her entire team.',
        },
        {
          name: 'Oathsworn Eye',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Event 4★ catalyst with 565 Base ATK, 27.6% ATK, and grants +48% Energy Recharge for 10s after using Elemental Skill; ideal balance of ATK and energy.',
        },
        {
          name: 'Memory of Dust',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '608 Base ATK and 49.6% ATK substat with shield-stacking ATK buffs; premier option to push towards the 4,500 ATK cap in Double Anemo teams.',
        },
        {
          name: 'Skyward Atlas',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Colossal 674 Base ATK, 33.1% ATK substat, and +12% Elemental DMG bonus; outstanding raw ATK stat stick when ER requirements are already satisfied.',
        },
        {
          name: 'Cashflow Supervision',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '674 Base ATK stat stick providing bonus ATK and Normal/Charged/Plunging bonuses upon HP fluctuations.',
        },
        {
          name: 'Flowing Purity',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine craftable catalyst with 565 Base ATK and 27.6% ATK; excellent craftable alternative for raw ATK scaling.',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          tier: 2,
          rarity: 3,
          category: 'Alternative',
          notes:
            '3★ support catalyst granting +48% ATK to the next swapped carry (Xiao, Gaming, Diluc); lower personal ATK contribution is compensated by the carry\'s massive ATK gain.',
        },
        {
          name: 'Prototype Amber',
          tier: 3,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Liyue catalyst providing up to 18 flat energy restoration and supplemental teamwide healing.',
        },
      ],
    },
  },
  {
    avatarId: 10000092,
    skillDepotId: 9201,
    referenceKey: 'Gaming',
    displayName: 'Gaming',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-gaming-info', 'kqm-gaming-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst', 'normal'],
        talentPriorityGroups: [['skill'], ['burst', 'normal']],
        mainStats: {
          Sands: ['elementalMastery', 'atkPercent', 'energyRecharge'],
          Goblet: ['pyroDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'atkPercent', 'energyRecharge', 'atk'],
        sets: [
          { referenceKey: 'CrimsonWitchOfFlames', pieces: 4, tier: 1, label: 'Best in Slot (+15% Pyro DMG, +15% Melt/Vape reaction DMG, and maxes out 3 stacks for +22.5% Pyro DMG via frequent Skill casts)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 1, label: 'Best in Slot (+36% CRIT Rate via Bestial Ascent HP drain and healing; beware of CRIT Rate overcap at C6)' },
          { referenceKey: 'LongNightsOath', pieces: 4, tier: 1, label: 'Best in Slot (+20% Skill/Burst DMG and stacking Plunging Attack DMG)' },
          { referenceKey: 'GildedDreams', pieces: 4, tier: 2, label: 'Alternative (+80 EM and stacking ATK/EM buffs for Melt and Vaporize teams)' },
          { referenceKey: 'VermillionHereafter', pieces: 4, tier: 2, label: 'Alternative (+18% ATK and stacking ATK% on continuous HP loss)' },
          { referenceKey: 'CrimsonWitchOfFlames', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Pyro DMG Bonus)' },
          { referenceKey: 'GildedDreams', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+80 Elemental Mastery)' },
          { referenceKey: 'GladiatorsFinale', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+18% ATK)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/gaming-quickguide/',
      playstyleSummary:
        '4-star Pyro Claymore guard of the Sword and Strongbox transport agency delivering premiere on-field Pyro plunging damage through his Wushou dance arts. Bestial Ascent (Elemental Skill, 6s CD) pounces forward, launching Gaming high into the air upon colliding with a target or surface; pressing Plunging Attack converts into Charmed Cloudstrider, dealing non-overrideable AoE Pyro Plunging Attack DMG (scaling with Skill level, NOT Normal Attack level!). Landing consumes 15% Max HP (cannot drop below 10%). Suanni\'s Gilded Dance (Elemental Burst, 60 Energy cost, 15s CD, 12s duration) summons companion Suanni Man Chai, dealing AoE Pyro damage and healing Gaming for 30% Max HP. Man Chai rolls to a nearby enemy and rushes back to Gaming: whenever Man Chai reunites with Gaming while above 50% HP, Bestial Ascent\'s cooldown is INSTANTLY reset! Landing a Charmed Cloudstrider plunge immediately summons Man Chai again, enabling 4 to 6 devastating forward Melt or reverse Vaporize Pyro plunges per rotation.',
      energyRequirements:
        'Burst costs 60 Energy and must be cast every rotation to summon Man Chai and reset Skill cooldowns: With C0–C3: In Melt teams 150%–180% ER (170%–180% with Bennett 1x Tap E; 150% with 2x Tap E); In Vape teams 125%–145% ER. With C4–C6 (refunds 2 Energy per Charmed Cloudstrider hit, generating 10–12 Energy per rotation): In Melt teams 115%–135% ER; In Vape teams 100%–110% ER. Each team Favonius proc reduces requirements by 15%–20%.',
      combatTips: [
        '50% HP Threshold Invariant: Bestial Ascent cooldown resets via Man Chai, A1 healing, and A4 +20% Charmed Cloudstrider damage bonus ALL require Gaming to remain strictly at or above 50% Max HP. Always pair Gaming with a dedicated healer (Xianyun, Bennett) to sustain continuous resets.',
        'Man Chai Flight Mechanics & N1 Filler: Man Chai rolls away and takes ~1.5s to run back to Gaming to reset his Skill. Use this brief window to execute 1 Normal Attack (`N1`) or reposition so you trigger coordinated attacks from Xingqiu/Yelan and catch Man Chai smoothly without awkward pauses.',
        'Blunt Damage & Shatter Warning: Charmed Cloudstrider is classified as a Heavy Blunt Plunging Attack. In Freeze/Melt teams with Cryo + Hydro, striking a Frozen enemy triggers Shatter, clearing the Cryo aura before Melt can trigger. Run pure Melt (Rosaria/Kaeya/Diona) or pure Vape (Xianyun/Furina/Yelan) to prevent Shatter interference.',
        'Constellation 6 God-Tier Watershed: C6 grants **+20% CRIT Rate, +40% CRIT DMG**, and expands the AoE radius of Charmed Cloudstrider. At C6, Gaming rivals and frequently surpasses top-tier 5★ Pyro carries (Hu Tao, Yoimiya, Diluc).',
        'Marechaussee Hunter CRIT Rate Overcap Caution: Because C6 provides +20% CRIT Rate and 4pc Marechaussee Hunter provides +36% CRIT Rate (total 56% free CRIT Rate), Gaming reaches 61% CRIT Rate with zero substats. Avoid pairing CRIT Rate claymores with Marechaussee Hunter at C6 to prevent wasting stats beyond the 100% cap.',
      ],
      weapons: [
        {
          name: 'Gest of the Mighty Wolf',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. Massive Base ATK, CRIT Rate, and stacking All DMG% bonuses, rivaling R5 Serpent Spine even without Hexerei synergies.',
        },
        {
          name: 'Serpent Spine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Battle Pass 4★ BiS. 27.6% CRIT Rate and up to +50% All DMG bonus at R5 when shielded or prestacked before chamber start.',
        },
        {
          name: 'Fruitful Hook',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Gacha 4★ claymore custom-tailored for plunging carries. 27.6% ATK, up to +32% Plunging Attack CRIT Rate, and +48% Plunging Attack DMG at R5.',
        },
        {
          name: 'Redhorn Stonethresher',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Colossal 88.2% CRIT DMG secondary stat and boosts Normal and Plunging damage based on DEF.',
        },
        {
          name: 'A Thousand Blazing Suns',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'High Base ATK, CRIT Rate, and stacking CRIT DMG and ATK% buffs on elemental hits.',
        },
        {
          name: 'Verdict',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '22.1% CRIT Rate and +20% ATK stat stick with high Base ATK.',
        },
        {
          name: 'Beacon of the Reed Sea',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '33.1% CRIT Rate and ATK buffs upon taking damage or hitting with Skill.',
        },
        {
          name: 'Mailed Flower',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Event 4★ claymore and best budget option in Melt teams. 110 EM substat, 24% ATK, and grants an extra +96 EM for 8s upon hitting with Elemental Skill.',
        },
        {
          name: 'Rainslasher',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '221 EM substat and +36% DMG bonus against enemies affected by Hydro at R5; top-tier 4★ option in Vaporize teams.',
        },
        {
          name: 'Tidal Shadow',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine craftable claymore offering 41.3% ATK substat and up to +48% ATK when receiving healing (easily triggered by Gaming\'s self-healing and team healers).',
        },
        {
          name: "Wolf's Gravestone",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Universal ATK% stat stick providing massive flat ATK% and teamwide ATK buffs against low-health enemies.',
        },
        {
          name: 'The Unforged',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High ATK% secondary stat and doubled ATK buffs when protected by a shield.',
        },
        {
          name: 'Blackcliff Slasher',
          tier: 3,
          rarity: 4,
          category: 'F2P',
          notes:
            'Starglitter shop claymore providing 55.1% CRIT DMG and ATK stacks upon defeating opponents.',
        },
      ],
    },
  },
];
