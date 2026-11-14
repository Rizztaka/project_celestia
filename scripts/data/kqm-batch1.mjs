// KeqingMains (KQM) Authoritative Builds - Batch 1: Pyro & Hydro Carries and Off-Field Enablers
export const KQM_BATCH_1 = {
  Xiangling: {
    weapons: [
      { name: 'The Catch', rarity: 4, reason: 'Premier F2P BiS: Grants +32% Burst DMG and +12% Burst CRIT Rate with vital ER substat' },
      { name: 'Staff of the Scarlet Sands', rarity: 5, reason: 'Top 5★ Ceiling: Converts massive EM into huge flat ATK in Vaporize teams' },
      { name: 'Engulfing Lightning', rarity: 5, reason: 'Supreme Energy Comfort: Massive ER that scales directly into bonus ATK' },
      { name: "Wavebreaker's Fin", rarity: 4, reason: 'Top 4★ Burst Nuker: Enormous party energy-scaled Elemental Burst DMG bonus at high refinements' },
      { name: "Dragon's Bane", rarity: 4, reason: 'Classic Vaporize Pick: High EM substat and +36% DMG against Pyro/Hydro affected targets' }
    ],
    artifacts: [
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Undisputed Best in Slot: Solves steep ER needs and converts up to 75% ER into raw Burst DMG' },
      { name: 'Crimson Witch of Flames', pieces: 2, reason: '+15% Pyro DMG transitional option paired with 2pc ATK or 2pc ER' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'Elemental Mastery', 'ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-220% with Bennett)', 'CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'ATK%']
  },
  Xingqiu: {
    weapons: [
      { name: 'Sacrificial Sword', rarity: 4, reason: 'Premier 4★ BiS: Resets Skill cooldown for double hydro particles and immediate burst readiness' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER substat providing neutral team particles on CRIT hits' },
      { name: 'Primordial Jade Cutter', rarity: 5, reason: 'Top DPS Weapon: Massive 44.1% CRIT Rate when paired with sufficient team ER' },
      { name: 'Fleuve Cendre Ferryman', rarity: 4, reason: 'Reliable F2P Fishing Sword: High ER with +16% Skill CRIT Rate' },
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'High Base ATK and stacking Hydro DMG bonus for high-investment sub-DPS' }
    ],
    artifacts: [
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Best in Slot: Maximizes Raincutter burst damage while satisfying high energy requirements' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support Option: +20% party-wide ATK on burst cast if no other party member carries it' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Hydro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-200% with Sacrificial, ~220-240% without C6)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  Tartaglia: {
    weapons: [
      { name: 'Polar Star', rarity: 5, reason: 'Signature BiS: Stacks massive ATK% and Skill/Burst damage through all combat stances' },
      { name: 'Aqua Simulacra', rarity: 5, reason: 'Colossal 88.2% CRIT DMG with unconditional universal +20% damage bonus' },
      { name: 'Thundering Pulse', rarity: 5, reason: 'High Base ATK, 66.2% CRIT DMG, and stacking Normal Attack damage' },
      { name: 'The Stringless', rarity: 4, reason: 'Premier Vaporize Nuker: High EM substat amplifying melee burst damage' },
      { name: 'Rust', rarity: 4, reason: 'Consistent Normal Attacker: Up to +80% Normal Attack damage in melee stance' }
    ],
    artifacts: [
      { name: "Nymph's Dream", pieces: 4, reason: 'Best in Slot: Stacks up to +30% Hydro DMG and +25% ATK via normal, charged, and skill hits' },
      { name: 'Heart of Depth', pieces: 4, reason: '+15% Hydro DMG and +30% Normal/Charged Attack damage upon skill activation' },
      { name: 'Heart of Depth', pieces: 2, reason: 'Classic 2pc Hydro / 2pc ATK or 2pc Noblesse hybrid build' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Hydro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery (for Vaporize Burst)', 'Energy Recharge (~120-130%)']
  },
  Diluc: {
    weapons: [
      { name: 'Redhorn Stonethresher', rarity: 5, reason: 'Colossal 88.2% CRIT DMG stat stick elevating weave attack rotations' },
      { name: 'Beacon of the Reed Sea', rarity: 5, reason: 'Top 5★ Claymore: High 33.1% CRIT Rate with unconditional ATK% buffs' },
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Raw Power: Enormous ATK% scaling with party-wide execute buff' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Battle Pass Top: Universal damage bonus stacking up to +50% all DMG' },
      { name: 'Mailed Flower', rarity: 4, reason: 'Great F2P Event Option: High EM and ATK% procs on elemental skill hits' }
    ],
    artifacts: [
      { name: 'Crimson Witch of Flames', pieces: 4, reason: 'Undisputed BiS: Diluc is uniquely capable of fully stacking the 3-tier Skill passive' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Strong Alternative: Provides heavy EM and ATK buffs in dedicated Vaporize/Melt teams' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'ATK%', 'Energy Recharge (~110-120%)']
  },
  Yoimiya: {
    weapons: [
      { name: 'Thundering Pulse', rarity: 5, reason: 'Signature BiS: 66.2% CRIT DMG and massive scaling Normal Attack damage bonus' },
      { name: 'Aqua Simulacra', rarity: 5, reason: 'Enormous 88.2% CRIT DMG with effortless close-range DMG bonus' },
      { name: 'Rust', rarity: 4, reason: 'Premier 4★ BiS: Up to +80% Normal Attack DMG rivaling high-refinement 5-star bows' },
      { name: 'Slingshot', rarity: 3, reason: 'Astonishing 3★ F2P Gem: 31.2% CRIT Rate and +60% DMG when paired with Bennett/Yun Jin' },
      { name: 'The Viridescent Hunt', rarity: 4, reason: 'Battle Pass Pick: High CRIT Rate with cyclone grouping utility' }
    ],
    artifacts: [
      { name: "Shimenawa's Reminiscence", pieces: 4, reason: 'Best in Slot: Converts 15 energy into +50% massive Normal Attack damage for 10s' },
      { name: 'Crimson Witch of Flames', pieces: 4, reason: 'Vaporize/Overload specialist set boosting Pyro reaction coefficients' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery']
  },
  Gaming: {
    weapons: [
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: Up to +50% all-DMG bonus amplifying massive plunge strikes' },
      { name: 'Beacon of the Reed Sea', rarity: 5, reason: 'High CRIT Rate and consistent ATK buffs on taking/dealing damage' },
      { name: 'Redhorn Stonethresher', rarity: 5, reason: 'Supreme 88.2% CRIT DMG stat stick for high melt/vape numbers' },
      { name: 'Tidal Shadow', rarity: 4, reason: 'Best F2P Craftable: Consistent +48% ATK buff easily triggered by self-healing mechanic' },
      { name: 'Rainslasher', rarity: 4, reason: 'Vaporize Specialist: High EM substat with +36% DMG against Hydro-affected targets' }
    ],
    artifacts: [
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Best in Slot: Effortlessly stacks +36% CRIT Rate from inherent HP consumption and self-heal' },
      { name: 'Crimson Witch of Flames', pieces: 4, reason: 'Reaction Master: Maximizes Vaporize and Melt plunge damage multiplier' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate', 'Elemental Mastery', 'Energy Recharge (~120-140%)', 'ATK%']
  },
  Yanfei: {
    weapons: [
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'Top 5★ BiS: 33.1% CRIT Rate, movement speed, and stacking elemental damage bonus' },
      { name: 'The Widsith', rarity: 4, reason: 'Premier 4★ Burst: 55.1% CRIT DMG with colossal ATK, Elemental DMG, or EM melody buffs' },
      { name: 'Sacrificial Jade', rarity: 4, reason: 'Battle Pass Top: 36.8% CRIT Rate and massive HP/EM scaling' },
      { name: 'Flowing Purity', rarity: 4, reason: 'Craftable Fontaine Catalyst: High base ATK and all-elemental damage bonus' },
      { name: 'Solar Pearl', rarity: 4, reason: 'Weaves Normal and Skill attacks into continuous Charged Attack amplification' }
    ],
    artifacts: [
      { name: "Wanderer's Troupe", pieces: 4, reason: 'Best in Slot: Grants +80 EM and unconditional +35% Charged Attack DMG for catalyst users' },
      { name: 'Crimson Witch of Flames', pieces: 4, reason: 'Amplifies all Pyro reaction multipliers for consistent Vaporize play' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'Energy Recharge (~130-150%)', 'ATK%']
  },
  Klee: {
    weapons: [
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'Premier 5★: Sustained on-field movement speed and progressive elemental DMG boost' },
      { name: "Kagura's Verity", rarity: 5, reason: 'High CRIT DMG with stacking skill damage buffs on multi-charge Jumpy Dumpties' },
      { name: 'The Widsith', rarity: 4, reason: 'High CRIT DMG delivering huge initial 10-second burst damage windows' },
      { name: 'Dodoco Tales', rarity: 4, reason: 'Tailored Event Weapon: Seamlessly buffs Normal and Charged Attack cycles' },
      { name: 'Flowing Purity', rarity: 4, reason: 'Craftable Fontaine catalyst with reliable ATK% and elemental DMG bonuses' }
    ],
    artifacts: [
      { name: 'Crimson Witch of Flames', pieces: 4, reason: 'Best in Slot for Reaction Teams: Amplifies Pyro damage and reaction damage' },
      { name: 'Lavawalker', pieces: 4, reason: 'Best in Slot for Mono-Pyro: Unconditional +35% all-damage bonus against burning opponents' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~120-130%)']
  },
  KamisatoAyato: {
    weapons: [
      { name: 'Haran Geppaku Futsu', rarity: 5, reason: 'Signature BiS: 33.1% CRIT Rate with team-triggered +40% Normal Attack damage' },
      { name: 'Primordial Jade Cutter', rarity: 5, reason: 'Supreme 44.1% CRIT Rate converting Ayato HP scaling into bonus ATK' },
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'High Base ATK with universal elemental damage stacks' },
      { name: 'The Black Sword', rarity: 4, reason: 'Battle Pass Pick: High CRIT Rate with +40% Normal Attack damage and self-sustain' },
      { name: 'Amenoma Kageuchi', rarity: 4, reason: 'Craftable F2P: Substantially solves burst energy requirements' }
    ],
    artifacts: [
      { name: 'Heart of Depth', pieces: 4, reason: 'Best Generalist BiS: +15% Hydro DMG and +30% Normal Attack damage on skill cast' },
      { name: 'Echoes of an Offering', pieces: 4, reason: 'High Damage Potential: Proc-based flat damage scaling for low-latency connections' },
      { name: "Gladiator's Finale", pieces: 4, reason: 'Accessible Classic: Permanent +35% Normal Attack damage for sword wielders' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Hydro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~130-140%)', 'HP%']
  },
  SangonomiyaKokomi: {
    weapons: [
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Best Team Support: Massive +48% ATK transfer to your main hypercarry upon switching' },
      { name: 'Everlasting Moonglow', rarity: 5, reason: 'Signature: Maximizes personal burst healing and on-field normal attack damage' },
      { name: 'Prototype Amber', rarity: 4, reason: 'Best Craftable: High HP% substat with party-wide energy restoration and healing' },
      { name: 'Sacrificial Fragments', rarity: 4, reason: 'Freeze & Bloom Specialist: 100% Jellyfish repositioning uptime and high EM' }
    ],
    artifacts: [
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Best in Slot (General & Driver): Converts overhealing into 30,000 AoE physical bubble damage every 3.5s' },
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Best in Slot (Freeze Support): 100% off-field uptime on party-wide +20% ATK buff' }
    ],
    mainStats: {
      sands: ['HP%', 'Energy Recharge'],
      goblet: ['HP%', 'Hydro DMG Bonus'],
      circlet: ['Healing Bonus']
    },
    subStats: ['HP%', 'Energy Recharge (~140-160% on-field, ~180-200% off-field)', 'HP', 'Elemental Mastery']
  },
  Mona: {
    weapons: [
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Premier Support: Passes colossal +48% ATK buff directly to your main DPS' },
      { name: 'Favonius Codex', rarity: 4, reason: 'Best Battery: Generates neutral particles to fuel high-cost bursts across the party' },
      { name: 'The Widsith', rarity: 4, reason: 'Sub-DPS Nuker: Huge CRIT DMG for massive Stellaris Phantasm burst multipliers' },
      { name: 'Prototype Amber', rarity: 4, reason: 'Utility Healer Compression: Grants team healing and personal energy refund on burst' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: Stacks party +20% ATK buff alongside Omen damage amplification' },
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Sub-DPS BiS: Converts Mona high ER stat directly into massive burst nuke damage' }
    ],
    mainStats: {
      sands: ['Energy Recharge'],
      goblet: ['Hydro DMG Bonus', 'ATK%'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~200-240%)', 'CRIT Rate (for Favonius)', 'CRIT DMG', 'ATK%']
  },
  Nilou: {
    weapons: [
      { name: 'Key of Khaj-Nisut', rarity: 5, reason: 'Signature BiS: Colossal 86.2% Max HP bonus converting personal HP into party-wide EM' },
      { name: "The Dockhand's Assistant", rarity: 4, reason: 'Top 4★ Gacha: High HP% substat and flat elemental mastery buff' },
      { name: 'Iron Sting', rarity: 4, reason: 'Accessible F2P: Craftable EM sword increasing personal reaction damage' },
      { name: "Xiphos' Moonlight", rarity: 4, reason: 'Team Energy: Converts EM into personal and party Energy Recharge' }
    ],
    artifacts: [
      { name: 'Tenacity of the Millelith', pieces: 2, reason: '+20% HP when paired with 2pc Vourukasha Glow to reach the 74,400 HP Bountiful Core cap' },
      { name: "Vourukasha's Glow", pieces: 2, reason: '+20% HP maximizing A4 passive Bountiful Core damage bonus (+400% max)' }
    ],
    mainStats: {
      sands: ['HP%'],
      goblet: ['HP%'],
      circlet: ['HP%']
    },
    subStats: ['HP% (aim for 74,400 HP cap)', 'HP', 'Elemental Mastery', 'Energy Recharge']
  },
  Sigewinne: {
    weapons: [
      { name: 'Silvershower Heartstrings', rarity: 5, reason: 'Signature BiS: Massive HP% scaling and +28% Elemental Burst CRIT Rate' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Universal Battery: High ER substat generating neutral energy particles for teammates' },
      { name: 'Recurve Bow', rarity: 3, reason: 'Premier F2P Stat Stick: Readily accessible 46.9% HP substat boosting healing and buffs' },
      { name: 'Sacrificial Bow', rarity: 4, reason: 'Resets Skill cooldown for repeated mini-bubble healing and Hydro application' }
    ],
    artifacts: [
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Best in Slot: Easily caps 30,000 physical bubble damage with bounce healing' },
      { name: 'Song of Days Past', pieces: 4, reason: 'Top Buffer BiS: Converts recorded healing into flat damage buffs for active carries' }
    ],
    mainStats: {
      sands: ['HP%'],
      goblet: ['HP%'],
      circlet: ['HP%', 'Healing Bonus']
    },
    subStats: ['HP% (aim for 65,000 HP cap)', 'Energy Recharge (~140-160%)', 'HP', 'CRIT Rate']
  },
  Candace: {
    weapons: [
      { name: 'Favonius Lance', rarity: 4, reason: 'Top Support BiS: Solves personal burst energy and provides party energy recharge' },
      { name: 'The Catch', rarity: 4, reason: 'F2P Pick: High ER with bonus Burst damage and CRIT Rate' },
      { name: 'Black Tassel', rarity: 3, reason: 'Maximum Normal Attack Buff: 46.9% HP substat directly scaling A4 infusion DMG bonus' },
      { name: 'Rightful Reward', rarity: 4, reason: 'Craftable Fontaine Polearm: HP substat with flat burst energy restoration' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: Party-wide +20% ATK buff combined with Hydro infusion' },
      { name: 'The Exile', pieces: 4, reason: 'Extreme Energy Battery: Fuels energy-hungry hypercarries upon burst trigger' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'HP%'],
      goblet: ['HP%'],
      circlet: ['HP%', 'CRIT Rate']
    },
    subStats: ['Energy Recharge (to ~180-220%)', 'HP%', 'CRIT Rate (for Favonius)', 'HP']
  },
  Barbara: {
    weapons: [
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Best Support BiS: +48% ATK buff to switching hypercarry and HP% scaling' },
      { name: 'Prototype Amber', rarity: 4, reason: 'Craftable Team Engine: Restores party energy and provides extra burst team healing' },
      { name: 'Favonius Codex', rarity: 4, reason: 'Generates white energy particles for teammates when on field' }
    ],
    artifacts: [
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Best in Slot: Converts continuous party healing into 30k physical bubble damage' },
      { name: 'Maiden Beloved', pieces: 4, reason: 'Pure Healing Focus: Maximizes raw healing output for challenging encounters' },
      { name: 'Instructor', pieces: 4, reason: 'Reaction Buffer: Grants party-wide +120 EM upon triggering an elemental reaction' }
    ],
    mainStats: {
      sands: ['HP%', 'Energy Recharge'],
      goblet: ['HP%'],
      circlet: ['Healing Bonus', 'HP%']
    },
    subStats: ['HP%', 'Energy Recharge (~140-160%)', 'HP', 'Elemental Mastery']
  },
  Dehya: {
    weapons: [
      { name: 'Beacon of the Reed Sea', rarity: 5, reason: 'Signature BiS: 33.1% CRIT Rate, ATK buffs, and +32% Max HP when taking damage' },
      { name: "Wolf's Gravestone", rarity: 5, reason: 'High ATK stat stick with teamwide execution ATK buff' },
      { name: 'Favonius Greatsword', rarity: 4, reason: 'Support Enabler: Generates particles and mitigates steep burst energy costs' },
      { name: 'Mailed Flower', rarity: 4, reason: 'Burgeon Trigger: High EM and ATK buffs when triggering elemental reactions' },
      { name: 'The Bell', rarity: 4, reason: 'High HP% substat maximizing Fiery Sanctum damage mitigation absorption' }
    ],
    artifacts: [
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Best Support BiS: +20% party ATK and +30% shield strength from off-field skill ticks' },
      { name: "Vourukasha's Glow", pieces: 4, reason: 'Best DPS BiS: Stacks up to +50% Skill and Burst DMG upon taking damage' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Best for Burgeon: Maximizes triple-EM scaling for explosive core detonating' }
    ],
    mainStats: {
      sands: ['HP%', 'ATK%', 'Elemental Mastery'],
      goblet: ['Pyro DMG Bonus', 'HP%'],
      circlet: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery']
    },
    subStats: ['Energy Recharge (~180-200% for Burst)', 'HP%', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  }
};
