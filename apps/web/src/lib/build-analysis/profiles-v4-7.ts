import type { ReviewedCharacterProfile } from './identity';

export const v47Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000098,
    skillDepotId: 9801,
    referenceKey: 'Clorinde',
    displayName: 'Clorinde',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-clorinde-general-info', 'kqm-clorinde-overload-info', 'kqm-clorinde-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['atkPercent', 'elementalMastery'],
          Goblet: ['electroDmg', 'atkPercent'],
          Circlet: ['critDmg', 'critRate'],
        },
        conditionalMainStats: {
          Sands: { elementalMastery: 'reaction_context' },
          Goblet: { atkPercent: 'team_buffs' },
        },
        priorityStats: ['critDmg', 'critRate', 'atkPercent', 'elementalMastery', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'FragmentOfHarmonicWhimsy',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+18% ATK and +54% All DMG Bonus easily stacked via frequent Bond of Life generation and clearing)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+15% Electro DMG, +20% reaction DMG, and reduces Skill CD by 1s on Quicken/Electro reactions; synchronizes rotations with Fischl)',
          },
          {
            referenceKey: 'EchoesOfAnOffering',
            pieces: 4,
            tier: 2,
            label:
              'Alternative (+18% ATK and +70% ATK proc on Normal Attack shots; competitive with Whimsy in Overload teams on low ping)',
          },
          {
            referenceKey: 'GladiatorsFinale',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+18% ATK and +35% Normal Attack DMG unconditionally)',
          },
          {
            referenceKey: 'FragmentOfHarmonicWhimsy',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+18% ATK)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Electro DMG Bonus)',
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
      sourceUrl: 'https://keqingmains.com/q/clorinde-quickguide/',
      playstyleSummary:
        '5-star Electro Sword Champion Duelist of Fontaine delivering rapid-fire on-field Electro DPS through dual pistolet and rapier combat. Activating Hunter\'s Vigil (Skill, 7.5s stance duration, 16s CD) enters the Nightvigil state, converting Normal Attacks into "Swift Hunt" piercing pistolet shots and replacing her Elemental Skill with "Impale the Night" lunging thrusts. While in Nightvigil, her attacks deal non-overrideable Electro DMG (scaling off Skill level, NOT Normal Attack level!). Swift Hunt fires 3 penetrating bullets that grant Bond of Life (35% BoL per shot when BoL < 100%). Impale the Night lunges forward, clearing Bond of Life to deal massive Electro DMG and heal Clorinde based on the cleared BoL percentage. At BoL >= 100%, Impale the Night deals its highest damage multiplier, strikes in a wider AoE, and heals for 110% of Max HP over 3 strikes! Her standard combo string is 3x Normal Attack -> Skill (3N1E). Her Elemental Burst (Last Lightfall, 60 Energy, 15s CD) unleashes 5 slashing strikes and immediately grants 120% Bond of Life, priming an empowered Impale the Night.',
      energyRequirements:
        'Burst costs 60 Energy with a 15s CD. In Double Electro teams (Fischl), Clorinde needs 120%–140% ER to Burst every rotation, or 100% ER when bursting every other rotation. In Solo Electro teams, ER requirements are 200%+ for bursting every rotation or 110%–130% every other rotation. Each Favonius proc reduces requirements by ~10%.',
      combatTips: [
        'Standard 3N1E Rotation Rhythm: In Nightvigil, fire 3 Swift Hunt pistolet shots to stack Bond of Life past the 100% threshold (35% * 3 = 105%), then immediately press Skill to execute the max-tier Impale the Night lunging slash. Repeat 3N1E up to 5 to 6 times per stance.',
        'Burst Opener vs Finisher: Casting Burst immediately before Skill grants 120% Bond of Life upfront. This allows opening Nightvigil with an immediate max-tier Impale the Night (Q -> E -> E -> 3N1E...) without needing initial pistolet shots.',
        "Normal Attack Talent Leveling Invariant: Clorinde's Nightvigil pistolet shots and lunges scale strictly with her Elemental Skill talent multipliers. Do NOT invest resources into her Normal Attack talent, as it provides zero damage increase to her combat stance.",
        'Self-Sustaining Healerless Mobility: Every max-tier Impale the Night heals Clorinde for 110% of Max HP (based on cleared BoL), granting extraordinary self-sustain. Additionally, her lunging rapier dashes allow her to effortlessly reposition, chase teleporting enemies, and dodge incoming attacks without sacrificing DPS.',
        "A1 Passive Dark-Shattering Flame: When nearby party members trigger Electro-related reactions (Electro-Charged, Aggravate, Overload, Superconduct, Swirl, Crystallize), Clorinde's Normal Attack and Burst DMG increases by 20% of her ATK (stacks up to 3 times for +60% ATK additive base damage).",
        'A4 Passive Lawful Retribution: When Bond of Life increases or decreases, Clorinde gains +10% CRIT Rate for 15s (stacks up to 2 times / +20% CRIT Rate). Combined with her CRIT Rate ascension (19.2% + 5% base = 24.2%), Clorinde naturally possesses 44.2% CRIT Rate, making CRIT DMG circlets and weapons highly favored.',
      ],
      weapons: [
        {
          name: 'Absolution',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 44.1% CRIT DMG, 674 Base ATK, +20% CRIT DMG unconditionally, and increases DMG dealt by 16%–48% when Bond of Life increases.',
        },
        {
          name: 'Haran Geppaku Futsu',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Outstanding 5★ BiS alternative. 33.1% CRIT Rate, +12% All Elemental DMG Bonus, and +40% Normal Attack DMG bonus perfectly fitting Nightvigil pistolet attacks.',
        },
        {
          name: 'Uraku Misugiri',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG stat stick with +16%–32% Normal Attack DMG and +24%–48% Skill DMG.',
        },
        {
          name: 'Mistsplitter Reforged',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '44.1% CRIT DMG, 674 Base ATK, and +12%–28% All Elemental DMG Bonus with reliable stack uptime.',
        },
        {
          name: 'The Black Sword',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Premier Battle Pass 4★ sword. 27.6% CRIT Rate and +20%–40% Normal Attack DMG with supplementary self-healing.',
        },
        {
          name: 'Finale of the Deep',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Fontaine 4★ F2P BiS. 27.6% ATK substat, grants +12% ATK on Skill, creates a 25% Bond of Life, and grants up to +300 Flat ATK when cleared. Seamless kit synergy.',
        },
        {
          name: 'Harbinger of Dawn',
          tier: 2,
          rarity: 3,
          category: 'Alternative',
          notes:
            "Strong 3★ F2P stat stick. 46.9% CRIT DMG and +28% CRIT Rate when HP > 90%, sustained via Clorinde's frequent Impale the Night self-heals.",
        },
      ],
    },
  },
  {
    avatarId: 10000095,
    skillDepotId: 9501,
    referenceKey: 'Sigewinne',
    displayName: 'Sigewinne',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-sigewinne-info', 'kqm-sigewinne-guide'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent', 'hydroDmg'],
          Circlet: ['hpPercent', 'healingBonus', 'critRate'],
        },
        conditionalMainStats: {
          Circlet: { critRate: 'favonius_proc' },
        },
        priorityStats: ['maxHp', 'hpPercent', 'energyRecharge', 'critRate', 'critDmg'],
        sets: [
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+15% Healing Bonus and converts massive continuous team healing into 30,000 damage physical Sea-Dyed Foam bubble explosions)',
          },
          {
            referenceKey: 'SongOfDaysPast',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+15% Healing Bonus and Yearning team damage bonus based on recorded healing; competitive in single-target)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% HP and +20% Team ATK triggered on bouncing bubble hits)',
          },
          {
            referenceKey: 'EmblemOfSeveredFate',
            pieces: 4,
            tier: 2,
            label:
              'Alternative for Burst Sub-DPS playstyles (+20% ER and converts ER into Burst DMG)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% Team ATK on Burst cast)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
        ],
      },
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['hpPercent'],
          Goblet: ['hpPercent'],
          Circlet: ['hpPercent'],
        },
        priorityStats: ['maxHp', 'hpPercent', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'OceanHuedClam',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Healing into 30k Foam bubble damage)',
          },
          {
            referenceKey: 'SongOfDaysPast',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (Yearning flat damage buff)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 4,
            tier: 2,
            label: 'Alternative (+20% Team ATK)',
          },
          {
            referenceKey: 'TenacityOfTheMillelith',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
          {
            referenceKey: 'VourukashasGlow',
            pieces: 2,
            tier: 2,
            label: 'Transitional 2pc Mix (+20% HP)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/sigewinne-quickguide/',
      playstyleSummary:
        "5-star Hydro Bow Head Nurse of Meropide serving as a premier teamwide healer and dedicated off-field Elemental Skill damage buffer. Rebound Hydrotherapy (Skill, 18s CD) blows a bouncing Bolstering Bubblegum that bounces 5 times (dealing Hydro DMG and trapping smaller enemies), healing all nearby party members (except Sigewinne herself) based on her Max HP on each bounce. When the bubble disappears after 5 bounces, it restores a massive chunk of HP to Sigewinne herself (50% Max HP). Holding Skill inflates the bubble, increasing damage and healing. Her A1 Passive (Semi-Strict Supervision) is her hallmark mechanic: casting Skill grants 10 stacks of Convalescence; while active, off-field party members deal flat additive damage based on Sigewinne's Max HP above 30,000 (up to +2,800 flat DMG at 65,000 Max HP!). Her Elemental Burst (Super Saturated Syringing, 70 Energy, 18s CD) fires a syringe gun dealing AoE Hydro DMG over 2.5s and absorbing nearby Sourcewater Droplets to grant Bond of Life.",
      energyRequirements:
        'Burst costs 70 Energy with an 18s CD. Bursting every rotation requires 155%–190% ER in Double Hydro (with Furina) and 115%–160% ER in Triple Hydro. In teams where Burst is skipped to save field time, Sigewinne operates with 100% ER and invests purely into HP% and flat HP substats to cap her A1 passive.',
      combatTips: [
        "A1 Off-Field Skill Damage Buff Synergy: Sigewinne's A1 grants 10 stacks boosting off-field Elemental Skill damage by up to +2,800 flat base damage based on HP above 30k (reaching maximum bonus at 65,000 HP). This synergizes extraordinarily with multi-hitting off-field Skill carries like Furina (Salon Solitaire), Nahida (Tri-Karma), Fischl (Oz), Yae Miko (Sesshou Sakura), and Chiori (Tamoto).",
        'Bouncing Bubble Healing Timing: The Bolstering Bubblegum bounces once every 1.5–2s. Unlike instantaneous burst healers, Sigewinne heals the entire party continuously across 8–10s, ensuring sustained Fanfare generation for Furina and constant Ocean-Hued Clam bubble detonations.',
        'Sourcewater Droplets & Energy: Casting Skill generates two Sourcewater Droplets. Absorbing Droplets grants Sigewinne 10% Bond of Life each; clearing Bond of Life restores 1 Energy per 2% BoL cleared (up to 5 Energy per droplet / 10 Energy per Skill).',
        "Furina Premier Synergy: Sigewinne and Furina form one of the strongest defensive/offensive pairings in the game: Sigewinne easily caps Furina's 300 Fanfare with teamwide healing, while Furina's Salon members consume Sigewinne's A1 Convalescence flat damage stacks with full DMG% and CRIT scaling.",
        'Tap vs Hold Skill: Holding Skill increases bubble size and grants interruption resistance, but takes extra field time. In timed rotations, tapping Skill (tE) is generally preferred.',
      ],
      weapons: [
        {
          name: 'Silvershower Heartstrings',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 66.2% HP substat, 542 Base ATK, grants Remedy stacks on healing, absorbing BoL, and casting Skill to boost Max HP by up to +28% and grant +28% Burst CRIT Rate.',
        },
        {
          name: 'Elegy for the End',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Premier 5★ Support BiS. 55.1% Energy Recharge, grants Millennial Movement buffing party ATK by +20% and EM by +100 upon landing 4 Skill/Burst hits.',
        },
        {
          name: 'Aqua Simulacra',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG, +16% HP, and +20% All DMG Bonus; premier bow for Sigewinne personal Burst DPS.',
        },
        {
          name: 'Recurve Bow',
          tier: 1,
          rarity: 3,
          category: 'F2P',
          notes:
            'Exceptional 3★ F2P BiS. 46.9% HP substat, enabling Sigewinne to effortlessly reach the 65,000 Max HP cap for her A1 team buff with zero gacha investment.',
        },
        {
          name: 'Favonius Warbow',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            '61.3% Energy Recharge and generates neutral particles on CRIT hits to lower teamwide ER thresholds.',
        },
        {
          name: 'Sacrificial Bow',
          tier: 2,
          rarity: 4,
          category: 'Utility',
          notes:
            '30.6% Energy Recharge and resets Skill cooldown, enabling a second Bolstering Bubblegum for double A1 buff instances.',
        },
      ],
    },
  },
  {
    avatarId: 10000097,
    skillDepotId: 9701,
    referenceKey: 'Sethos',
    displayName: 'Sethos',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-sethos-info', 'kqm-sethos-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['burst', 'normal', 'skill'],
        talentPriorityGroups: [['burst', 'normal'], ['skill']],
        mainStats: {
          Sands: ['elementalMastery', 'energyRecharge'],
          Goblet: ['electroDmg'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'elementalMastery', 'energyRecharge', 'atkPercent'],
        sets: [
          {
            referenceKey: 'WanderersTroupe',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot (+80 Elemental Mastery and +35% unconditional Charged Attack DMG Bonus; buffs both Charged Shots and Burst Dusk Bolts)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Alternative (+80 EM and up to +150 EM / +14% ATK in Quicken teams)',
          },
          {
            referenceKey: 'DesertPavilionChronicle',
            pieces: 4,
            tier: 2,
            label: 'Alternative for Burst playstyle (+10% Attack SPD and +40% Normal/Charged DMG)',
          },
          {
            referenceKey: 'WanderersTroupe',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+80 Elemental Mastery)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+80 Elemental Mastery)',
          },
          {
            referenceKey: 'ThunderingFury',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Electro DMG Bonus)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+15% Normal and Charged Attack DMG)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/sethos-quickguide/',
      playstyleSummary:
        "4-star Electro Bow Temple of Silence heir functioning as a versatile on-field Electro damage dealer centered around Elemental Mastery dual scaling and fast-paced Quicken reactions. Sethos features two distinct, fully realized playstyles: (1) Charged Shot DPS, firing Level 2 Shadowpiercing Shots that pierce through all opponents along their path dealing dual ATK + EM-scaling Electro DMG. His A1 Passive Black Kite's Enigma consumes up to 20 Energy to slash charge time by 0.285s per point of Energy, reducing his charge time to near-instantaneous (~0.3s!); and (2) Normal Attack Burst DPS via Secret Rite: Twilight Shadowpiercer (Burst, 60 Energy, 8s duration), which converts his Normal Attacks into piercing Dusk Bolts dealing EM-scaling Electro damage (coded as Charged Attack DMG). In both stances, his Ancient Rite: The Thundering Sands (Skill, 8s CD) deals AoE Electro DMG and restores 12 Energy if it triggers an Electro reaction (Aggravate, Electro-Charged, Overload, Superconduct, Swirl, Crystallize).",
      energyRequirements:
        'Burst costs 60 Energy with an 8s CD. In Double Electro teams with Fischl, Sethos needs 100% ER for Normal Attack Burst DPS (with 1 or 2 Skills) and 100%–110% ER for Charged Shot DPS (with 2 Skills). In Double Electro teams without Fischl, ER requirements rise to 130%–160% (1 Skill) or 100%–120% (2 Skills). Solo Electro setups are not recommended due to extreme ER demands (150%–270%).',
      combatTips: [
        "Dual Playstyle Identity: Sethos can be built as a Burst Dusk Bolt driver or a Shadowpiercing Shot sniper. Because Burst Dusk Bolts are coded as Charged Attack DMG, artifacts like 4pc Wanderer's Troupe and bows like Slingshot buff both playstyles identically.",
        'A1 Energy-to-Charge-Time Reduction: When aiming a Level 2 Shadowpiercing Shot, each point of current Energy reduces charge time by 0.285s. Having 20+ Energy reduces the charge time from 6s down to ~0.3s, allowing him to fire instant piercing arrows in rapid succession.',
        "Skill Energy Restoration & Quicken Synergy: Casting Skill against an enemy affected by Dendro immediately triggers Quicken/Aggravate and restores 12 Energy via his A1 passive. Always apply Dendro (Nahida, Baizhu, Kirara) before casting Sethos's Skill to fund his Energy-consuming mechanics.",
        "Slingshot 3★ Powerhouse: 3★ Slingshot provides 31.2% CRIT Rate and an astounding +60% Normal and Charged Attack DMG bonus within 0.3s arrow flight time. Because Sethos scales heavily with Elemental Mastery rather than Base ATK, Slingshot rivals and can surpass most 5★ bows (including Skyward Harp and Amos' Bow), trailing only Hunter's Path.",
        "A4 Passive The Sand-King's Boon: Every 15s, consuming Energy through a Shadowpiercing Shot grants The Sand-King's Boon, increasing the damage of the next Shadowpiercing Shot by 700% of Sethos's Elemental Mastery.",
      ],
      weapons: [
        {
          name: "Hunter's Path",
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. 44.1% CRIT Rate, +12% All Elemental DMG Bonus, and increases Charged Attack DMG by 160% of Elemental Mastery.',
        },
        {
          name: 'Slingshot',
          tier: 1,
          rarity: 3,
          category: 'F2P',
          notes:
            'Premier 3★ F2P BiS. 31.2% CRIT Rate and +60% Normal & Charged Attack DMG at R5. Outstanding performance rivaling 5★ weapons due to EM scaling bypassing low Base ATK.',
        },
        {
          name: 'Aqua Simulacra',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG, +16% HP, and +20% All DMG Bonus; exceptional universal stat stick.',
        },
        {
          name: 'The First Great Magic',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes: '66.2% CRIT DMG, +16% Charged Attack DMG, and team ATK% scaling.',
        },
        {
          name: 'Cloudforged',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '165 Elemental Mastery substat; grants up to +240 EM when Elemental Energy decreases.',
        },
        {
          name: 'Scion of the Blazing Sun',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass 4★ bow. 27.6% CRIT Rate and inflicts Sunfire Arrow dealing AoE damage and +28% Charged Attack vulnerability.',
        },
      ],
    },
  },
];
