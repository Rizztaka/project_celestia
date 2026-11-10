import type { ReviewedCharacterProfile } from './identity';

export const v23Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000057,
    skillDepotId: 5701,
    referenceKey: 'AratakiItto',
    displayName: 'Arataki Itto',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-itto-infographic', 'kqm-itto-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['normal', 'burst', 'skill'],
        mainStats: {
          Sands: ['defPercent'],
          Goblet: ['geoDmg', 'defPercent'],
          Circlet: ['critRate', 'critDmg'],
        },
        priorityStats: ['critRate', 'critDmg', 'defPercent', 'energyRecharge', 'atkPercent'],
        sets: [
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot (+54% DEF and +24% Geo DMG Bonus at 4 Curiosity stacks)',
          },
          {
            referenceKey: 'MarechausseeHunter',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Alternative with Furina (+36% Crit Rate on HP fluctuations)',
          },
          {
            referenceKey: 'RetracingBolide',
            pieces: 4,
            tier: 2,
            label:
              'Alternative with Shield (+35% Shield Strength and +40% Normal/Charged Attack DMG)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc DEF (+30% DEF)',
          },
          {
            referenceKey: 'ArchaicPetra',
            pieces: 2,
            tier: 2,
            label: 'Alternative 2pc Geo DMG (+15% Geo DMG)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/itto-quickguide/',
      playstyleSummary:
        'Premier on-field Geo hypercarry and DEF-scaling powerhouse. When activating Royal Descent: Behold, Itto the Evil! (Burst), Itto gains Raging Oni King, converting a massive portion of his DEF into ATK while infusing his attacks with non-overrideable Geo DMG and increasing his attack speed. He consumes Superlative Superstrength stacks to unleash consecutive Arataki Kesagiri slashes that cost zero stamina and culminate in an explosive final strike, complemented by throwing his trusty bull Ushi for monstrous upfront Geo damage.',
      energyRequirements:
        '120%–140% ER in standard Triple Geo or Mono Geo teams (with Gorou/Albedo/Xilonen and 1 Favonius proc); 135%–150% in Double Geo teams with 1 Favonius proc; 150%+ in teams without dedicated Geo batteries.',
      combatTips: [
        'Normal Attack talent is just as crucial as his Burst: Normal Attack talent levels directly dictate the damage multipliers of his signature Arataki Kesagiri slashes. Level Normal Attack and Burst equally.',
        'Superlative Superstrength stacks: Gained by N2 and N4 normal attack strikes, casting Ushi (Skill hit gives 1 stack), and whenever Ushi takes damage or leaves the field. When at max (5 stacks), hold Charged Attack to execute a full chain of Kesagiri slashes finishing with the high-multiplier Kesagiri Finisher.',
        'Masatsu Zetsugi: Akaushi Burst! (Ushi) deals enormous damage (~553% ATK scaling at Lv 10), taunts enemies, and generates 3–4 Geo particles. Always cast Ushi within his Burst window to benefit from his massive DEF-to-ATK conversion.',
        'Pre-stacking Husk of Opulent Dreams: Place Itto in party slots 2, 3, or 4 and wait ~10 seconds off-field before initiating Spiral Abyss chambers to start battle with all 4 Curiosity stacks active (+24% DEF and +24% Geo DMG).',
      ],
      weapons: [
        {
          name: 'Redhorn Stonethresher',
          tier: 1,
          rarity: 5,
          category: 'BiS',
          notes:
            'Signature weapon and undisputed Best in Slot. Grants an colossal 88.2% Crit DMG substat, unconditionally boosts DEF by 28%, and increases Normal and Charged Attack DMG by 40% of his DEF.',
        },
        {
          name: 'Serpent Spine',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Premier 4-star weapon. Provides 27.6% Crit Rate and up to a massive +50% All DMG bonus at 5 stacks (R5), performing close to R1 Redhorn when protected by shields.',
        },
        {
          name: 'Whiteblind',
          tier: 1,
          rarity: 4,
          category: 'F2P',
          notes:
            'Best in Slot accessible craftable weapon. Offers 51.7% DEF substat and stacks up to +48% ATK and +48% DEF on hit at R5, rivaling low-refinement Battle Pass options.',
        },
        {
          name: 'Skyward Pride',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'High Base ATK, 36.8% ER substat to satisfy his 70-cost Burst needs, +8% unconditional DMG bonus, and vacuum blade procs during his Burst duration.',
        },
        {
          name: 'Blackcliff Slasher',
          tier: 2,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Solid Starglitter weapon offering 55.1% Crit DMG and snowballing ATK% buffs upon defeating enemies.',
        },
      ],
    },
  },
  {
    avatarId: 10000055,
    skillDepotId: 5501,
    referenceKey: 'Gorou',
    displayName: 'Gorou',
    defaultRoleId: 'party_buff',
    evidenceIds: ['kqm-gorou'],
    roles: [
      {
        id: 'party_buff',
        talentPriority: ['skill', 'burst'],
        mainStats: {
          Sands: ['energyRecharge'],
          Goblet: ['defPercent', 'geoDmg'],
          Circlet: ['critRate'],
        },
        conditionalMainStats: { Circlet: { critRate: 'favonius_proc' } },
        priorityStats: ['energyRecharge', 'critRate', 'defPercent'],
        sets: [
          {
            referenceKey: 'TheExile',
            pieces: 4,
            tier: 1,
            label:
              'Best in Slot Team Battery (Regenerates 6 Energy for all party members post-Burst)',
          },
          {
            referenceKey: 'NoblesseOblige',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot Support Buffer (+20% Team ATK on Burst)',
          },
          {
            referenceKey: 'HuskOfOpulentDreams',
            pieces: 4,
            tier: 2,
            label: 'Alternative for C4 Healing Output (+54% DEF)',
          },
          {
            referenceKey: 'Instructor',
            pieces: 4,
            tier: 2,
            label: 'Alternative Support Buffer (+120 Team EM on Crystallize)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/gorou-quickguide/',
      playstyleSummary:
        "The dedicated Geo and DEF hyper-buffer. Through Inuzaka All-Round Defense (Skill) and Juuga: Forward Unto Victory (Burst), Gorou deploys General's War-Banner/General's Glory granting partywide buffs based on the number of Geo characters in the team: 1 Geo grants flat DEF, 2 Geo adds interruption resistance, and 3 Geo bestows +15% Geo DMG Bonus. At Constellation 6, he further amplifies Geo teammates with up to +40% Geo Crit DMG.",
      energyRequirements:
        'Extremely high 80-cost Burst with low personal particle generation. Requires 200%–250%+ ER to burst reliably every rotation to trigger A1 passive (+25% party DEF) and 4pc Exile/Noblesse bonuses.',
      combatTips: [
        "Gorou's flat DEF buff scales STRICTLY on his Elemental Skill talent level, NOT his own DEF stat. Artifact DEF% mainstats and substats do not increase the DEF passed to Itto, Noelle, or Chiori.",
        'Always play Gorou with at least 3 Geo characters (e.g. Itto + Gorou + Albedo/Chiori/Zhongli) to unlock the full tripartite tier: Standing Firm (+Flat DEF), Impregnable (+Resistance to Interruption), and Crunch (+15% Geo DMG Bonus).',
        'Constellation 6 (Valiant Amelioration): Unleashing Skill or Burst increases the Geo Crit DMG of all nearby party members by 10% / 20% / 40% for 12s when 1 / 2 / 3 Geo characters are present.',
        "At Constellation 4 (Lapping Paw), active characters standing within General's Glory are healed every 1.5s based on 50% of Gorou's own DEF, providing comfortable sustain in Furina or corrosion encounters.",
        'Favonius Warbow with a Crit Rate Circlet is his absolute best weapon setup, feeding clear white energy particles directly to energy-hungry Geo carries.',
      ],
      weapons: [
        {
          name: 'Favonius Warbow',
          tier: 1,
          rarity: 4,
          category: 'BiS',
          notes:
            'Undisputed Best in Slot weapon (given for free in early Archon quests). Provides 61.3% ER and generates neutral energy particles on crit, serving as an indispensable battery for Itto and Noelle.',
        },
        {
          name: 'Sacrificial Bow',
          tier: 1,
          rarity: 4,
          category: 'Alternative',
          notes:
            'Offers high ER and resets Skill cooldown, enabling a second cast for additional Geo particles at the cost of slight field-time extension.',
        },
        {
          name: 'Elegy for the End',
          tier: 2,
          rarity: 5,
          category: 'Alternative',
          notes:
            'Provides 55.1% ER and partywide +20% ATK and +100 EM upon triggering Millennial Movement, though less consistent to trigger than Favonius.',
        },
        {
          name: 'End of the Line',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Free fishing bow offering 45.9% ER substat as an alternative ER stat stick.',
        },
        {
          name: 'Fading Twilight',
          tier: 2,
          rarity: 4,
          category: 'F2P',
          notes: 'Event bow providing 30.6% ER substat when Favonius is unavailable.',
        },
      ],
    },
  },
];
