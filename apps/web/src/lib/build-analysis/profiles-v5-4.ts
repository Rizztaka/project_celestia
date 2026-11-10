import type { ReviewedCharacterProfile } from './identity';

export const v54Profiles: ReviewedCharacterProfile[] = [
  {
    avatarId: 10000109,
    skillDepotId: 10901,
    referenceKey: 'YumemizukiMizuki',
    displayName: 'Yumemizuki Mizuki',
    defaultRoleId: 'on_field_damage',
    evidenceIds: ['kqm-mizuki-info', 'kqm-mizuki-guide'],
    roles: [
      {
        id: 'on_field_damage',
        talentPriority: ['skill', 'burst'],
        talentPriorityGroups: [['skill'], ['burst']],
        mainStats: {
          Sands: ['elementalMastery'],
          Goblet: ['elementalMastery'],
          Circlet: ['critRate', 'critDmg', 'elementalMastery'],
        },
        conditionalMainStats: {
          Circlet: {
            critRate: 'reaction_context',
            critDmg: 'reaction_context',
            elementalMastery: 'team_buffs',
          },
        },
        priorityStats: ['elementalMastery', 'critRate', 'critDmg', 'energyRecharge'],
        sets: [
          {
            referenceKey: 'GildedDreams',
            pieces: 4,
            tier: 1,
            label: 'Best in Slot for personal damage in Stellar Swirl teams (+80 EM and +100–150 EM from 4pc passive)',
          },
          {
            referenceKey: 'ScarletProof',
            pieces: 4,
            tier: 2,
            label: 'Alternative for Stellar Swirl damage; viable when farming Heart of the Furnace domain',
          },
          {
            referenceKey: 'ViridescentVenerer',
            pieces: 4,
            tier: 2,
            label: 'Alternative for Team Support (-40% Cryo RES shred for off-field Cryo damage dealers like Odette / Cryo Traveler; standard set outside SSW)',
          },
          {
            referenceKey: 'GildedDreams',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+80 EM; competitive with 4pc sets when rolling high-quality substats)',
          },
          {
            referenceKey: 'WanderersTroupe',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+80 EM)',
          },
          {
            referenceKey: 'FlowerOfParadiseLost',
            pieces: 2,
            tier: 3,
            label: 'Transitional 2pc Mix (+80 EM)',
          },
        ],
      },
    ],
    guide: {
      sourceUrl: 'https://keqingmains.com/q/mizuki-quickguide/',
      playstyleSummary:
        '5-star Anemo Catalyst character from Inazuma specializing as an on-field Stellar Swirl (SSW) DPS and team driver. Mizuki enters a floating "Dreamdrifter" state upon casting Elemental Skill (Aisa Utamakura Pilgrimage), where she autonomously unleashes Anemo attacks at fixed intervals without requiring manual attack inputs. When paired with characters who enable Stellar Swirl (Odette, Cryo Traveler, Sandrone) and off-field Cryo applicators, Mizuki deals massive direct Stellar Swirl damage via her Witch\'s Revelation Passive (Vast Be the Dream) while swirling Cryo. Her Elemental Burst (Anraku Secret Spring Therapy, 60 Energy, 18s CD) creates a restorative hot spring field that pulls in nearby enemies, deals AoE Anemo damage, and continuously heals active characters. In standard teams, her Burst is cast every other rotation as an emergency sustain panic button, allowing her to invest almost entirely in Elemental Mastery and CRIT stats.',
      energyRequirements:
        'Bursting every other rotation (recommended): 100% with C6 Faruzan, 100%–120% with Sucrose or pre-C6 Faruzan, 100%–130% in other teams. Bursting every rotation (not recommended): 160%–185% with C6 Faruzan, 200%+ in other teams. Building ER to burst every rotation is never a DPS gain over maximizing EM and CRIT; treat her Burst as an emergency panic heal or use whenever naturally available. Bursting with limited Cryo application can also desync the Stellar Swirl aura pattern.',
      combatTips: [
        'Automated Dreamdrifter Stance: In her Skill state, Mizuki floats above the ground and automatically releases Anemo dream strikes at fixed intervals. She does not use input-based Normal or Charged Attacks while floating; her gameplay consists purely of floating around near enemies while off-field Cryo teammates apply auras.',
        'Normal Attack Unleveled Invariant: Because Mizuki cannot execute normal attacks during Dreamdrifter, her Normal Attack talent contributes zero damage to her rotation and should remain at Level 1.',
        'Talent Priority Invariant (Skill > Level 90 >> Burst): Direct Stellar Swirl damage scales primarily with character level and Elemental Mastery. Her Elemental Skill provides direct Swirl and SSW DMG Bonus buffs to the team, making Skill her top talent priority. Burst levels provide extra healing comfort but negligible damage.',
        'CRIT vs EM Circlet Mechanics: In Stellar Swirl teams before C6, CRIT circlets generally outperform EM circlets due to how her Witch\'s Revelation passive direct SSW damage crits. At C6, CRIT and EM circlets perform similarly. When using 4pc Viridescent Venerer, EM circlets are preferred.',
        'Sacrificial Fragments Tech (Faruzan Downtime): In Faruzan rotations with slight cooldown downtime, using R5 Sacrificial Fragments to extend Mizuki\'s Skill by 1–2 seconds (E > wait 1-2s > E > E) triggers an additional instance of Witch\'s Revelation and C1, yielding higher overall team DPS.',
      ],
      weapons: [
        {
          name: 'Sunny Morning Sleep-In',
          rarity: 5,
          tier: 1,
          category: 'BiS',
          notes: '5★ Signature Catalyst and undisputed Best-in-Slot for personal damage. Provides 542 Base ATK, massive 265 EM secondary stat, and passive that further amplifies EM and Swirl / Stellar Swirl damage.',
        },
        {
          name: 'Reliquary of Truth',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Premier Stat Stick and second-best Catalyst. Provides 608 Base ATK, 66.2% CRIT DMG, CRIT Rate, and EM bonuses that scale both direct Swirl and reaction damage.',
        },
        {
          name: 'Starcaller\'s Watch',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ High EM Alternative. Provides 265 EM and massive EM stat share, offering top-tier performance for Stellar Swirl scaling.',
        },
        {
          name: 'A Thousand Floating Dreams',
          rarity: 5,
          tier: 1,
          category: 'Alternative',
          notes: '5★ Team EM Catalyst. Provides 265 EM and grants teamwide Elemental Mastery buffs based on party elemental composition.',
        },
        {
          name: 'The Widsith',
          rarity: 4,
          tier: 1,
          category: 'BiS',
          notes: '4★ Premier 4★ Best-in-Slot. Provides 510 Base ATK, 55.1% CRIT DMG, and massive EM roll from its Aria/Interlude song buffs, yielding exceptional burst window damage.',
        },
        {
          name: 'Sacrificial Fragments',
          rarity: 4,
          tier: 2,
          category: 'Utility',
          notes: '4★ High EM Utility Alternative. Provides 221 EM and Skill cooldown reset. In Faruzan teams with rotation downtime, extending Mizuki\'s Skill stance by 1–2s enables an additional proc of Witch\'s Revelation and C1.',
        },
        {
          name: 'Nightweaver\'s Looking Glass',
          rarity: 5,
          tier: 2,
          category: 'Alternative',
          notes: '5★ CRIT DMG Stat Stick. High base stat and consistent damage bonus matching R5 Widsith consistency.',
        },
        {
          name: 'Sacrificial Jade',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Battle Pass Alternative. Provides 36.8% CRIT Rate, +64% HP, and +80 EM when off-field before swapping in.',
        },
        {
          name: 'Dawning Frost',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Event Alternative. Provides EM and Elemental DMG bonuses for consistent Swirl damage output.',
        },
        {
          name: 'Clash of Kings',
          rarity: 4,
          tier: 2,
          category: 'Alternative',
          notes: '4★ Alternative. Provides solid offensive stats for on-field catalyst drivers.',
        },
        {
          name: 'Blackmarrow Lantern',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: '4★ F2P Alternative. EM secondary stat stick that matches baseline performance.',
        },
        {
          name: 'Etherlight Spindlelute',
          rarity: 4,
          tier: 3,
          category: 'F2P',
          notes: '4★ Craftable/Event Alternative. Provides EM and energy utility.',
        },
        {
          name: 'Magic Guide',
          rarity: 3,
          tier: 3,
          category: 'F2P',
          notes: '3★ F2P Budget Stat Stick. Provides 187 EM and +24% DMG against Hydro/Electro affected enemies.',
        },
        {
          name: 'Wandering Evenstar',
          rarity: 4,
          tier: 3,
          category: 'Utility',
          notes: '4★ Support Alternative. Provides 165 EM and converts Mizuki\'s EM into flat ATK buffs for teammates.',
        },
      ],
    },
  },
];
