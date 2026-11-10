import type { ReviewedCharacterProfile } from './identity';

export const v42Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000089,
    skillDepotId: 8901,
    referenceKey: 'Furina',
    displayName: 'Furina',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-furina', 'kqm-furina-guide', 'kqm-furina-info'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst', 'skill']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent', 'hydroDmg'],
          Circlet: ['critRate', 'critDmg', 'hpPercent'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'hpPercent', 'maxHp'],
        sets: [
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Best in Slot (+70% Elemental Skill DMG while off-field, maximizing Salon Member damage output)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 2, label: 'Alternative (+20% HP and 100% uptime on +20% Team ATK and +30% Shield Strength via Salon Member attacks)' },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4, tier: 2, label: 'Alternative (+12% to +40% Elemental DMG Bonus for teammates in Natlan/Nightsoul compositions)' },
          { referenceKey: 'SilkenMoonsSerenade', pieces: 4, tier: 2, label: 'Alternative (Team EM buff in Nod-Krai compositions)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 2, label: 'Alternative (Decent option for C6 carry playstyles)' },
          { referenceKey: 'GoldenTroupe', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% HP)' },
          { referenceKey: 'HeartOfDepth', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Hydro DMG Bonus)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill', 'burst']],
        mainStats: {
          Sands: ['hpPercent', 'energyRecharge'],
          Goblet: ['hpPercent', 'hydroDmg'],
          Circlet: ['critRate', 'critDmg', 'hpPercent'],
        },
        priorityStats: ['energyRecharge', 'critRate', 'critDmg', 'hpPercent', 'maxHp'],
        sets: [
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Best in Slot (+70% Elemental Skill DMG while off-field, maximizing Salon Member damage output)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 2, label: 'Alternative (+20% HP and 100% uptime on +20% Team ATK and +30% Shield Strength via Salon Member attacks)' },
          { referenceKey: 'ScrollOfTheHeroOfCinderCity', pieces: 4, tier: 2, label: 'Alternative (+12% to +40% Elemental DMG Bonus for teammates in Natlan/Nightsoul compositions)' },
          { referenceKey: 'SilkenMoonsSerenade', pieces: 4, tier: 2, label: 'Alternative (Team EM buff in Nod-Krai compositions)' },
          { referenceKey: 'MarechausseeHunter', pieces: 4, tier: 2, label: 'Alternative (Decent option for C6 carry playstyles)' },
          { referenceKey: 'GoldenTroupe', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% HP)' },
          { referenceKey: 'HeartOfDepth', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Hydro DMG Bonus)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/furina-quickguide/',
      playstyleSummary:
        '5-star Hydro Sword archon-level universal damage buffer and premier off-field sub-DPS. Salon Solitaire (Elemental Skill) summons 3 Salon Members (Gentilhomme Usher, Surintendante Chevalmarin, Mademoiselle Crabaletta) for 30s (20s CD) that independently attack nearby enemies from off-field, dealing HP-scaling Hydro damage while continuously draining the HP of all party members above 50% HP (boosting attack damage up to 140% with 4 eligible allies). Charged Attacks deal Physical DMG and toggle her Arkhe alignment between Ousia (damage turrets) and Pneuma (Singer of Many Waters that heals the active character). Let the People Rejoice (Elemental Burst, 60 Energy cost, 15s CD) places the party in Universal Revelry for 18s, recording Fanfare points whenever party members HP increases or decreases (up to 300 Fanfare points at C0, granting up to +75% Teamwide DMG Bonus and +30% Incoming Healing Bonus at Talent Level 10). A dedicated teamwide healer is recommended to keep allies above 50% HP and continuously stack Fanfare across multiple rotations.',
      energyRequirements:
        'Burst costs 60 Energy and must be cast every rotation to sustain Universal Revelry: Solo Hydro 200%–220%+ (170%–190% with Favonius Sword); Double Hydro 160%–180% (140%–160% with Favonius); Double Hydro with Neuvillette (longer rotations / ample particles) 130%–150%; Triple Hydro 120%–140%. Each team Favonius proc reduces ER by ~20%–30%; C4 restores 4 Energy every 5s, slashing ER needs by ~30%–40%.',
      combatTips: [
        'Ousia vs Pneuma Stances: Ousia (dark dress/hair) is her primary combat stance summoning the 3 Salon Member turrets for off-field damage, Hydro application, and particle generation. Pneuma (light dress/hair) summons the Singer of Many Waters for single-target healing, but deals no damage, drains no HP, and generates zero energy particles.',
        'Teamwide Healer Mandate: Without active healing, the entire team drops to 50% HP, cutting Salon Member damage buffs and halting Fanfare accumulation. Pair with strong teamwide healers (Baizhu, Xianyun, Jean, Charlotte, Kokomi) or high-self-healing carries (Neuvillette, Wriothesley).',
        'A1 Endless Waltz Overheal Synergy: When the active character receives healing from an external source and overheals, Furina heals all party members for 2% of their Max HP once every 2s for 4s (total 4%), generating additional Fanfare and team sustain.',
        'A4 40,000 HP Threshold: Unheard Confession increases Salon Member damage by 0.7% per 1,000 Max HP (max +28% at 40,000 HP) and decreases Singer healing intervals by 0.4% per 1,000 Max HP (max 16%). Stacking up to 40,000 HP maximizes her passive efficiency.',
        'HP% vs Hydro DMG% Goblet: Before C2, an HP% Goblet is generally preferred over a Hydro DMG% Goblet due to the massive DMG% bonuses Furina already receives from Fanfare and Golden Troupe.',
        'Constellation Power Spikes: C1 grants 150 Fanfare instantly upon Burst cast (+37.5% base DMG buff) and increases the Fanfare cap to 400 (+100% DMG buff). C2 increases Fanfare gain by 250% (3.5x speed) and converts overflow Fanfare into up to +140% Max HP. C4 restores 4 Energy every 5s on Skill hits, drastically easing ER requirements. C6 unlocks 6 Hydro-infused Normal Attacks after Skill cast that deal massive HP-scaling damage and provide immense team healing (Ousia) or HP drain (Pneuma).',
      ],
      weapons: [
        {
          name: 'Splendor of Tranquil Waters',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature 5★ BiS. Massive 88.2% CRIT DMG, +24% Elemental Skill DMG when HP fluctuates, and +28% Max HP when allies receive healing; maximizes personal damage when ER requirements are met.',
        },
        {
          name: 'Festering Desire',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Event 4★ BiS. 45.9% Energy Recharge, +32% Elemental Skill DMG, and +12% Elemental Skill CRIT Rate; phenomenal balance of energy and personal damage.',
        },
        {
          name: 'Fleuve Cendre Ferryman',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine Fishing Association 4★ F2P BiS. 45.9% Energy Recharge, +16% Elemental Skill CRIT Rate, and grants an extra +32% ER for 5s after casting Skill.',
        },
        {
          name: 'Key of Khaj-Nisut',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '66.2% HP substat and +20% HP passive, converting Furina\'s massive HP pool into a partywide Elemental Mastery buff for team damage in Vaporize, Bloom, and reaction setups.',
        },
        {
          name: 'Favonius Sword',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Universal support BiS. 61.3% Energy Recharge and clear neutral energy particle generation, single-handedly solving high ER requirements for Furina and her teammates in Solo Hydro.',
        },
        {
          name: 'Uraku Misugiri',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '88.2% CRIT DMG stat stick granting +16% DEF and +24% Skill DMG, doubled to +48% Skill DMG when a Geo ally deals Geo damage (Xilonen, Navia, Chiori).',
        },
        {
          name: 'Primordial Jade Cutter',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            '44.1% CRIT Rate, +20% Max HP, and bonus ATK based on Max HP; outstanding generalist offensive stat stick.',
        },
        {
          name: "The Dockhand's Assistant",
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            '41.3% HP substat and energy refunds from Stoic symbols generated by healing or taking damage.',
        },
        {
          name: 'Wolf-Fang',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Battle Pass sword providing 27.6% CRIT Rate, +16% Skill DMG, and stacking Skill CRIT Rate while on-field.',
        },
        {
          name: 'Freedom-Sworn',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '198 EM and teamwide +20% ATK and +16% Normal/Charged/Plunging Attack DMG buff triggered from off-field reactions.',
        },
        {
          name: 'Light of Foliar Incision',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '88.2% CRIT DMG and +4% CRIT Rate stat stick when ER requirements are already satisfied.',
        },
        {
          name: 'Harbinger of Dawn',
          tier: 3,
          rarity: 3,
          category: 'F2P',
          notes:
            'Budget 3★ stat stick offering 46.9% CRIT DMG and +28% CRIT Rate, but only maintainable with continuous heavy teamwide healing keeping Furina above 90% HP.',
        },
      ],
    },
  },
  {
    avatarId: 10000088,
    skillDepotId: 8801,
    referenceKey: 'Charlotte',
    displayName: 'Charlotte',
    defaultRoleId: 'healing_support',
    evidenceIds: ['kqm-charlotte-info', 'kqm-charlotte-guide'],
    roles: [
      {
        id: 'healing_support',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst'], ['skill']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['atkPercent', 'cryoDmg'],
          Circlet: ['healingBonus', 'critRate', 'atkPercent'],
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'atk', 'critRate', 'healingBonus'],
        sets: [
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 1, label: 'Best in Slot (+20% Team ATK for 12s on Burst cast every rotation)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 1, label: 'Best in Slot (+15% Healing Bonus and converts massive burst healing into 30,000 damage bubble detonations)' },
          { referenceKey: 'TenacityOfTheMillelith', pieces: 4, tier: 2, label: 'Alternative (+20% Team ATK with Hold Skill Finisher Frame 12s mark duration)' },
          { referenceKey: 'BlizzardStrayer', pieces: 4, tier: 2, label: 'Alternative (+40% CRIT Rate in Freeze teams for 100% Favonius Codex proc consistency)' },
          { referenceKey: 'SongOfDaysPast', pieces: 4, tier: 2, label: 'Alternative (+15% Healing Bonus and Yearning damage buff based on healing recorded)' },
          { referenceKey: 'MaidenBeloved', pieces: 4, tier: 2, label: 'Alternative (+15% Healing Bonus and +20% Team Healing for 10s on Skill/Burst)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Energy Recharge)' },
          { referenceKey: 'OceanHuedClam', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Healing Bonus)' },
          { referenceKey: 'NoblesseOblige', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Elemental Burst DMG)' },
        ],
      },
      {
        id: 'off_field_damage',
        talentPriority: ['burst', 'skill'],
        talentPriorityGroups: [['burst', 'skill']],
        mainStats: {
          Sands: ['energyRecharge', 'atkPercent'],
          Goblet: ['cryoDmg', 'atkPercent'],
          Circlet: ['critRate', 'critDmg', 'healingBonus'],
        },
        priorityStats: ['energyRecharge', 'atkPercent', 'critRate', 'critDmg', 'atk'],
        sets: [
          { referenceKey: 'GoldenTroupe', pieces: 4, tier: 1, label: 'Best in Slot (+70% Skill DMG for Hold Skill Focused Impression ticks)' },
          { referenceKey: 'BlizzardStrayer', pieces: 4, tier: 1, label: 'Best in Slot (+40% CRIT Rate in Freeze teams)' },
          { referenceKey: 'OceanHuedClam', pieces: 4, tier: 2, label: 'Alternative (Healing to Clam bubble damage)' },
          { referenceKey: 'NoblesseOblige', pieces: 4, tier: 2, label: 'Alternative (Team ATK buffer)' },
          { referenceKey: 'GoldenTroupe', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Elemental Skill DMG)' },
          { referenceKey: 'BlizzardStrayer', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+15% Cryo DMG Bonus)' },
          { referenceKey: 'EmblemOfSeveredFate', pieces: 2, tier: 2, label: 'Transitional 2pc Mix (+20% Energy Recharge)' },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/charlotte-quickguide/',
      playstyleSummary:
        '4-star Cryo Catalyst investigative journalist from Fontaine specializing in instantaneous teamwide burst healing and sustained off-field Cryo application. Still Photo: Comprehensive Confirmation (Elemental Burst, 80 Energy cost, 20s CD) summons a Kamera Newsroom field providing immediate massive partywide healing scaling with Charlotte\'s ATK, followed by continuous active character healing and AoE Cryo damage for 4s. Framing: Freezing Point Composition (Elemental Skill) can be Tapped for a quick snapshot applying Snappy Silhouette (deals Cryo DMG every 1.5s for 6s; generates 3 Cryo particles; 12s CD) or Held up to 2s to expand a viewfinder to Finisher Frame, applying Focused Impression to up to 5 enemies (deals Cryo DMG every 1.5s for 12s, 8 ticks; generates 5 Cryo particles; 18s CD). Charlotte shines as one of the premier 4★ teamwide healers for Furina teams, instantly capping Fanfare points while providing Freeze synergy for Cryo and Hydro carries.',
      energyRequirements:
        'Burst costs 80 Energy and is essential for party survival and Furina Fanfare generation: With R5 Prototype Amber: Solo Cryo ~185%–200%; Double Cryo ~160%–180%; Triple Cryo ~140%–160%. With Other Weapons (Favonius Codex / TTDS): Solo Cryo ~230%–260%+; Double Cryo ~190%–220%; Triple Cryo ~170%–190%. Favonius procs reduce ER by ~15%–20%; C4 refunds up to 10 Energy, reducing ER by ~20%–25%.',
      combatTips: [
        'Furina Synergy & Instant Fanfare: Charlotte\'s Burst provides colossal instantaneous teamwide healing, instantly maxing out Furina\'s Fanfare stacks from 0 to full in a single frame. When equipped with Prototype Amber, the subsequent 6s team healing also triggers Furina\'s A1 Endless Waltz for further team HP restoration.',
        'Tap vs Hold Skill Optimization: Tap Skill has a swift animation and 12s CD (generating 3 particles); Hold Skill requires standing vulnerable for ~2s to reach Finisher Frame, but lasts 12s and generates 5 particles (with 18s CD). In standard fast rotations, Tap Skill (`tEQ`) is strongly preferred to maintain smooth rotations unless pairing with 4pc Tenacity.',
        'Prototype Amber Supremacy: Despite Charlotte healing from ATK and Prototype Amber carrying an HP% substat, Prototype Amber\'s 18 flat energy refund and +18% team HP healing (further amplified by Charlotte\'s Healing Bonus circlet) make it her mathematically superior weapon over all ATK% weapons.',
        'Favonius Battery Utility: Favonius Codex provides 45.9% ER and generates 6 neutral energy particles on CRIT. Charlotte\'s multi-hit Burst (9 hits) easily triggers Favonius particles even with modest CRIT Rate (25%–35%).',
        'Pneuma Arkhe Strike: Charged Attack calls down a Spiritbreath Thorn dealing Pneuma-aligned Cryo damage every 6s to disable Ousia Clockwork Meka.',
        'C4 Energy Refund: Constellation 4 restores 2 Energy whenever Charlotte\'s Burst hits enemies marked by her Skill (up to 5 times / 10 Energy total per Burst), noticeably reducing her high ER requirements.',
      ],
      weapons: [
        {
          name: 'Prototype Amber',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Craftable Liyue catalyst and undisputed BiS for healing. Refunds up to 18 flat Energy over 6s and heals the entire team for 18% Max HP, drastically easing Charlotte\'s ER requirements and triggering Furina\'s A1 overheal.',
        },
        {
          name: 'Favonius Codex',
          tier: 1,
          rarity: 4,
          category: 'Utility',
          notes:
            'Universal utility BiS. 45.9% Energy Recharge and generates 6 neutral energy particles on CRIT, batterying Charlotte and her entire team.',
        },
        {
          name: 'Thrilling Tales of Dragon Slayers',
          tier: 2,
          rarity: 3,
          category: 'Alternative',
          notes:
            '3★ support catalyst granting a massive +48% ATK buff to the next swapped character; only recommended in teams with very low ER requirements or double Cryo + multiple Favonius weapons.',
        },
        {
          name: 'Oathsworn Eye',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Event 4★ catalyst with high 565 Base ATK, 27.6% ATK, and +48% Energy Recharge for 10s after using Elemental Skill.',
        },
        {
          name: 'Ballad of the Boundless Blue',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Event 4★ catalyst providing 30.6% Energy Recharge and Normal/Charged Attack buffs.',
        },
        {
          name: "Kagura's Verity",
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            '66.2% CRIT DMG stat stick buffing Skill DMG stacks; strong option for sub-DPS builds in Shenhe Cryo teams when ER is satisfied.',
        },
        {
          name: 'Skyward Atlas',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Colossal 674 Base ATK and 33.1% ATK substat, boosting Charlotte\'s raw ATK scaling for massive healing numbers at very low ER thresholds.',
        },
        {
          name: 'Flowing Purity',
          tier: 3,
          rarity: 4,
          category: 'F2P',
          notes:
            'Fontaine craftable catalyst offering 27.6% ATK and elemental DMG bonus via Bond of Life clearing.',
        },
        {
          name: 'The Widsith',
          tier: 3,
          rarity: 4,
          category: 'Alternative',
          notes:
            '55.1% CRIT DMG catalyst for aggressive sub-DPS burst damage.',
        },
      ],
    },
  },
];
