// KeqingMains (KQM) Authoritative Builds - Batch 2: Dendro & Electro Reaction Enablers & Carries
export const KQM_BATCH_2 = {
  Alhaitham: {
    weapons: [
      { name: 'Light of Foliar Incision', rarity: 5, reason: 'Signature BiS: 88.2% CRIT DMG converting EM directly into Normal and Skill DMG' },
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'High Base ATK, CRIT DMG, and continuous elemental damage bonus' },
      { name: 'Primordial Jade Cutter', rarity: 5, reason: '44.1% CRIT Rate with bonus ATK scaling from base HP' },
      { name: 'Harbinger of Dawn', rarity: 3, reason: 'Legendary F2P 3★: 46.9% CRIT DMG and +28% CRIT Rate when above 90% HP with shields/heals' },
      { name: 'Iron Sting', rarity: 4, reason: 'Reliable F2P Craftable: High EM substat and stacking elemental damage on reactions' },
      { name: 'Toukabou Shigure', rarity: 4, reason: 'Event Sword: High EM substat with single-target damage amplification' }
    ],
    artifacts: [
      { name: 'Gilded Dreams', pieces: 4, reason: 'Best in Slot: Massive +230 EM and ATK% buffs when paired with another Deepwood holder' },
      { name: 'Deepwood Memories', pieces: 4, reason: 'Solo Dendro BiS: Provides 30% Dendro RES shred if no teammate carries the set' },
      { name: 'Gilded Dreams', pieces: 2, reason: '+80 EM combined with 2pc Deepwood (+15% Dendro DMG) for balanced stats' }
    ],
    mainStats: {
      sands: ['Elemental Mastery'],
      goblet: ['Dendro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'Energy Recharge (~120-140%)', 'ATK%']
  },
  Tighnari: {
    weapons: [
      { name: "Hunter's Path", rarity: 5, reason: 'Signature BiS: 44.1% CRIT Rate converting EM into colossal Charged Attack damage' },
      { name: 'The First Great Magic', rarity: 5, reason: 'High 66.2% CRIT DMG with movement speed and Charged Attack damage bonuses' },
      { name: 'Aqua Simulacra', rarity: 5, reason: 'Enormous 88.2% CRIT DMG with unconditional universal +20% damage bonus' },
      { name: 'Slingshot', rarity: 3, reason: 'Premier 3★ F2P: 31.2% CRIT Rate and +60% DMG on close-range Wreath Arrows in Spread' },
      { name: 'The Stringless', rarity: 4, reason: 'High EM substat providing up to +48% Burst and Skill damage multipliers' }
    ],
    artifacts: [
      { name: 'Gilded Dreams', pieces: 4, reason: 'Best in Slot: Maximizes reaction EM scaling across rapid-fire Spread arrow barrages' },
      { name: "Wanderer's Troupe", pieces: 4, reason: 'Consistent BiS: +80 EM and unconditional +35% Charged Attack DMG for bow users' },
      { name: 'Deepwood Memories', pieces: 4, reason: '30% Dendro RES shred when running as the sole Dendro unit in party' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'ATK%'],
      goblet: ['Dendro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'ATK%', 'Energy Recharge (~120%)']
  },
  Cyno: {
    weapons: [
      { name: 'Staff of the Scarlet Sands', rarity: 5, reason: 'Signature BiS: 44.1% CRIT Rate converting up to 136% EM into raw bonus ATK' },
      { name: 'Staff of Homa', rarity: 5, reason: 'Universal 66.2% CRIT DMG powerhouse with HP-to-ATK conversion' },
      { name: 'Primordial Jade Winged-Spear', rarity: 5, reason: 'High Base ATK, CRIT Rate, and progressive ramping damage bonus during burst' },
      { name: 'White Tassel', rarity: 3, reason: 'Top F2P 3★: 23.4% CRIT Rate and +48% Normal Attack DMG during Pactsworn stance' },
      { name: 'Ballad of the Fjords', rarity: 4, reason: 'Battle Pass Top: High CRIT Rate and +240 EM in multi-element Quickbloom teams' }
    ],
    artifacts: [
      { name: 'Gilded Dreams', pieces: 4, reason: 'Best in Slot (Quickbloom): Massive EM and ATK buffs fueling hyperbloom and aggravate' },
      { name: 'Thundering Fury', pieces: 4, reason: 'Highest Ceiling: Reduces skill cooldown by 1s allowing continuous Endseer skill procs' },
      { name: "Gladiator's Finale", pieces: 4, reason: '+35% Normal Attack damage throughout long burst duration' }
    ],
    mainStats: {
      sands: ['Elemental Mastery'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'Energy Recharge (~130-140% with TF, ~150-160% without)', 'ATK%']
  },
  Keqing: {
    weapons: [
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'Undisputed 5★ BiS: High Base ATK, CRIT DMG, and effortless 3-stack Electro DMG bonus' },
      { name: 'Primordial Jade Cutter', rarity: 5, reason: '44.1% CRIT Rate providing massive consistency and flat ATK scaling' },
      { name: "Lion's Roar", rarity: 4, reason: 'Premier 4★ BiS: Up to +36% DMG against Electro/Pyro affected targets in Aggravate' },
      { name: 'The Black Sword', rarity: 4, reason: 'Battle Pass Staple: High CRIT Rate with Normal/Charged Attack bonuses and self-healing' },
      { name: 'Iron Sting', rarity: 4, reason: 'F2P Craftable: High EM substat amplifying Aggravate reaction coefficients' }
    ],
    artifacts: [
      { name: 'Thundering Fury', pieces: 4, reason: 'Best in Slot: +20% Aggravate DMG and constant skill cooldown resets for 100% infusion' },
      { name: 'Thundering Fury', pieces: 2, reason: '+15% Electro DMG paired with 2pc ATK or 2pc EM (+80 EM)' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery']
  },
  YaeMiko: {
    weapons: [
      { name: "Kagura's Verity", rarity: 5, reason: 'Signature BiS: 66.2% CRIT DMG stacking up to +36% Skill DMG and +12% all-elemental DMG' },
      { name: 'A Thousand Floating Dreams', rarity: 5, reason: 'High EM substat providing personal damage buffs and sharing EM with teammates' },
      { name: 'The Widsith', rarity: 4, reason: 'Premier 4★: 55.1% CRIT DMG with massive 10s burst buffs across ATK, DMG, and EM' },
      { name: 'Sacrificial Jade', rarity: 4, reason: 'Battle Pass Top: 36.8% CRIT Rate with off-field Max HP and +80 EM buff' },
      { name: 'Hakushin Ring', rarity: 4, reason: 'Inazuma Craftable: High ER providing team elemental damage buffs on Electro reactions' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Best in Slot (Off-Field Sub-DPS): Up to +70% Sesshou Sakura turret damage while off-field' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Best for Aggravate/On-Field: Massive EM and ATK scaling in Quicken compositions' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery', 'Energy Recharge (~130-150% if using burst every 22s)']
  },
  Fischl: {
    weapons: [
      { name: 'Aqua Simulacra', rarity: 5, reason: 'Top 5★ Ceiling: 88.2% CRIT DMG with universal +20% damage bonus active off-field' },
      { name: 'Polar Star', rarity: 5, reason: 'High CRIT Rate and skill damage buffs stacking with on-field summon' },
      { name: 'The Stringless', rarity: 4, reason: 'Premier 4★ BiS: Up to +48% Skill and Burst DMG with EM for Aggravate triggers' },
      { name: 'Skyward Harp', rarity: 5, reason: 'Stat Stick: High Base ATK, CRIT Rate, and CRIT DMG for consistent damage' },
      { name: 'Alley Hunter', rarity: 4, reason: 'Off-Field Specialist: Up to +40% all-damage bonus while remaining off the field' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Support Utility: Generates neutral particles to battery team carries' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Undisputed Best in Slot: Colossal +70% off-field Elemental Skill DMG for Oz strikes' },
      { name: 'Thundering Fury', pieces: 2, reason: '+15% Electro DMG paired with 2pc ATK as a transitional set' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery (Aggravate teams)', 'Energy Recharge (~110-120%)']
  },
  Beidou: {
    weapons: [
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Enormous ATK stat stick with teamwide execution buff on low health targets' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: 27.6% CRIT Rate with up to +50% universal damage bonus' },
      { name: 'Beacon of the Reed Sea', rarity: 5, reason: 'High CRIT Rate and ATK buffs activated upon skill cast and taking damage' },
      { name: 'Favonius Greatsword', rarity: 4, reason: 'Energy Solution: 61.3% ER guaranteeing continuous Stormbreaker burst uptime' },
      { name: 'Akuoumaru', rarity: 4, reason: 'Wavebreaker Claymore: Scales massive burst damage based on party energy capacity' }
    ],
    artifacts: [
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Undisputed Best in Slot: Directly converts necessary ER into massive chain-lightning burst damage' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Support Alternative: Grants +20% teamwide ATK on burst cast' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-220% solo, ~140-160% with Fischl)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  KukiShinobu: {
    weapons: [
      { name: 'Freedom-Sworn', rarity: 5, reason: 'Top 5★ Support BiS: High EM substat granting party-wide Normal/Charged and ATK buffs' },
      { name: "Xiphos' Moonlight", rarity: 4, reason: 'Premier 4★ BiS: Converts high EM into personal and party-wide Energy Recharge' },
      { name: 'Iron Sting', rarity: 4, reason: 'Accessible F2P: Craftable 165 EM sword maximizing hyperbloom reaction damage' },
      { name: 'Toukabou Shigure', rarity: 4, reason: 'Event F2P: High EM substat with single-target damage amplification' },
      { name: 'Key of Khaj-Nisut', rarity: 5, reason: 'Colossal HP% scaling converting maximum HP into party-wide EM buffs' }
    ],
    artifacts: [
      { name: 'Flower of Paradise Lost', pieces: 4, reason: 'Best in Slot for Hyperbloom DMG: Stacks up to +80% Hyperbloom reaction damage' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Stat Efficiency: Grants up to +230 EM for massive reaction triggers' },
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Healer Support BiS: 100% uptime on party +20% ATK buff from off-field skill pulses' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'HP%'],
      goblet: ['Elemental Mastery', 'HP%'],
      circlet: ['Elemental Mastery', 'Healing Bonus']
    },
    subStats: ['Elemental Mastery (aim for 900-1000+ EM for Hyperbloom)', 'HP%', 'HP', 'Energy Recharge']
  },
  Clorinde: {
    weapons: [
      { name: 'Absolution', rarity: 5, reason: 'Signature BiS: 44.1% CRIT DMG, CRIT DMG bonus, and +48% DMG from Bond of Life fluctuations' },
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'High Base ATK, CRIT DMG, and reliable elemental damage bonus stacks' },
      { name: 'Haran Geppaku Futsu', rarity: 5, reason: '33.1% CRIT Rate and +40% Normal Attack damage from team skill casts' },
      { name: 'Finale of the Deep', rarity: 4, reason: 'Best F2P Craftable: Synergizes with Bond of Life mechanics to grant high flat ATK' },
      { name: 'The Black Sword', rarity: 4, reason: 'High CRIT Rate and Normal Attack damage amplification with self-heal' }
    ],
    artifacts: [
      { name: 'Fragment of Harmonic Whimsy', pieces: 4, reason: 'Best in Slot: Stacks up to +54% all-damage bonus as Bond of Life increases and clears' },
      { name: "Gladiator's Finale", pieces: 4, reason: 'Consistent Alternative: Permanent +35% Normal Attack damage during pistol-and-thrust stance' },
      { name: 'Thundering Fury', pieces: 4, reason: 'Quick-Cooldown Option: Reduces skill cooldown for frequent stance refreshes' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery', 'Energy Recharge (~110-120%)']
  },
  Sethos: {
    weapons: [
      { name: "Hunter's Path", rarity: 5, reason: 'Top 5★ BiS: 44.1% CRIT Rate and converts EM directly into massive Charged Attack damage' },
      { name: 'The First Great Magic', rarity: 5, reason: '66.2% CRIT DMG with movement speed and charged attack damage bonus' },
      { name: 'Slingshot', rarity: 3, reason: 'Top F2P 3★ BiS: 31.2% CRIT Rate and +60% DMG on close-range Shadowpiercing shots' },
      { name: 'Cloudforged', rarity: 4, reason: 'Tailored Event Bow: High EM substat and ramps up to +160 additional EM when consuming energy' },
      { name: 'The Stringless', rarity: 4, reason: 'Burst DPS: High EM substat amplifying burst damage multiplier' }
    ],
    artifacts: [
      { name: "Wanderer's Troupe", pieces: 4, reason: 'Best in Slot: +80 EM and unconditional +35% Charged Attack DMG for bow wielders' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Reaction Master: High EM and ATK% buffs fueling Aggravate reaction numbers' }
    ],
    mainStats: {
      sands: ['Elemental Mastery'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Elemental Mastery', 'CRIT Rate', 'CRIT DMG', 'Energy Recharge (~120-130%)', 'ATK%']
  },
  Baizhu: {
    weapons: [
      { name: 'Prototype Amber', rarity: 4, reason: 'Premier F2P BiS: High HP% substat, refunds 18 personal energy, and heals entire team on burst' },
      { name: "Jadefall's Splendor", rarity: 5, reason: 'Signature: High HP% substat with continuous energy regeneration and elemental damage' },
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Hypercarry Buffer: Passes massive +48% ATK buff to switching DPS carry' },
      { name: 'Favonius Codex', rarity: 4, reason: 'Team Battery: Generates neutral particles to solve party-wide energy demands' }
    ],
    artifacts: [
      { name: 'Deepwood Memories', pieces: 4, reason: 'Best Support BiS: Provides continuous 30% Dendro RES shred from off-field shield attacks' },
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Healer Carry Hybrid: Converts huge healing output into 30k physical bubble damage' },
      { name: 'Song of Days Past', pieces: 4, reason: 'Active Carry Buffer: Buffs flat damage of next 5 attacks based on recorded healing' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'HP%'],
      goblet: ['HP%'],
      circlet: ['HP%', 'Healing Bonus']
    },
    subStats: ['Energy Recharge (to ~180-220% solo, ~140-160% with Nahida/Alhaitham)', 'HP% (aim for 50,000 HP cap for A4 buff)', 'HP']
  },
  Yaoyao: {
    weapons: [
      { name: 'Favonius Lance', rarity: 4, reason: 'Universal Battery BiS: High ER substat generating neutral particles on crit hits' },
      { name: 'Rightful Reward', rarity: 4, reason: 'Craftable Fontaine Polearm: HP% substat and refunds burst energy upon healing' },
      { name: 'Black Tassel', rarity: 3, reason: 'F2P Stat Stick: Readily accessible 46.9% HP substat for maximum Yuegui healing' },
      { name: 'Moonpiercer', rarity: 4, reason: 'Sumeru Craftable: Spawns a Leaf of Revival granting +32% ATK to the picking carry' }
    ],
    artifacts: [
      { name: 'Deepwood Memories', pieces: 4, reason: 'Best Support BiS: 30% Dendro RES shred easily triggered by Yuegui radish strikes' },
      { name: 'Tenacity of the Millelith', pieces: 4, reason: '+20% party ATK and +30% shield strength from off-field skill hits' },
      { name: 'Instructor', pieces: 4, reason: 'Reaction Buffer: Grants party-wide +120 EM upon triggering an elemental reaction' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'HP%'],
      goblet: ['HP%'],
      circlet: ['Healing Bonus', 'HP%']
    },
    subStats: ['Energy Recharge (to ~160-200%)', 'HP%', 'CRIT Rate (for Favonius Lance)', 'HP']
  },
  Kirara: {
    weapons: [
      { name: "The Dockhand's Assistant", rarity: 4, reason: 'Premier 4★ BiS: High HP% substat directly scaling cat box shield durability' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Team Battery: High ER generating neutral energy particles for teammates' },
      { name: 'Key of Khaj-Nisut', rarity: 5, reason: 'Colossal HP% stat stick converting massive shield HP into party EM buffs' },
      { name: 'Sapwood Blade', rarity: 4, reason: 'Sumeru Craftable: High ER generating an EM Leaf of Consciousness for teammates' }
    ],
    artifacts: [
      { name: 'Deepwood Memories', pieces: 4, reason: 'Best Support BiS: 30% Dendro RES shred triggered by skill and burst box explosions' },
      { name: 'Tenacity of the Millelith', pieces: 2, reason: '+20% HP combined with 2pc Vourukasha Glow (+40% HP total) for indestructible shields' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party ATK buff upon dropping her heavy burst package' }
    ],
    mainStats: {
      sands: ['HP%'],
      goblet: ['HP%'],
      circlet: ['HP%', 'CRIT Rate']
    },
    subStats: ['HP%', 'Energy Recharge (~140-160%)', 'HP', 'CRIT Rate (for Favonius)']
  },
  Collei: {
    weapons: [
      { name: 'Elegy for the End', rarity: 5, reason: 'Premier 5★ Support: High ER granting party-wide +100 EM and +20% ATK buffs' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Universal Battery BiS: High ER generating white energy particles for party rotations' },
      { name: 'Sacrificial Bow', rarity: 4, reason: 'Skill Reset: Double floral ring throw for rapid energy and Dendro application' },
      { name: 'The Stringless', rarity: 4, reason: 'Sub-DPS Damage: High EM substat amplifying Cuilein-Anbar burst DMG' }
    ],
    artifacts: [
      { name: 'Deepwood Memories', pieces: 4, reason: 'Best Support BiS: 30% Dendro RES shred easily sustained by off-field burst zone' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party-wide ATK buff on low 60-energy burst cast' },
      { name: 'Instructor', pieces: 4, reason: 'Early / Reaction Buffer: Grants party-wide +120 EM on reaction trigger' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Dendro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-220%)', 'CRIT Rate (for Favonius)', 'CRIT DMG', 'ATK%', 'Elemental Mastery']
  },
  Kaveh: {
    weapons: [
      { name: 'Mailed Flower', rarity: 4, reason: 'Top F2P BiS: High EM substat and stacking ATK% buffs on elemental skill procs' },
      { name: 'Favonius Greatsword', rarity: 4, reason: 'Energy Engine: Solves high 80-cost burst requirements for comfortable rotations' },
      { name: 'Rainslasher', rarity: 4, reason: 'High EM substat and +36% DMG against Hydro/Electro affected opponents' },
      { name: 'Makhaira Aquamarine', rarity: 4, reason: 'Team Buffer: Converts high EM into personal and party ATK bonus' }
    ],
    artifacts: [
      { name: 'Deepwood Memories', pieces: 4, reason: 'Dendro Shred BiS: 30% Dendro RES shred if no other team member holds the set' },
      { name: 'Flower of Paradise Lost', pieces: 4, reason: 'Bloom Driver BiS: Maximizes personal core rupturing damage on-field' },
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Turns self-core healing absorption into 30k physical bubble explosions' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'Elemental Mastery'],
      goblet: ['Elemental Mastery', 'Dendro DMG Bonus'],
      circlet: ['Elemental Mastery', 'Healing Bonus']
    },
    subStats: ['Energy Recharge (to ~180-200%)', 'Elemental Mastery', 'HP%', 'CRIT Rate']
  },
  Dori: {
    weapons: [
      { name: 'Favonius Greatsword', rarity: 4, reason: 'Team Energy Engine BiS: 61.3% ER generating neutral particles on Jinni link hits' },
      { name: 'Sacrificial Greatsword', rarity: 4, reason: 'Skill Reset: Double troublemaker cannon shot for rapid particle generation' },
      { name: 'Forest Regalia', rarity: 4, reason: 'Sumeru Craftable: Spawns an EM Leaf of Consciousness for the on-field carry' },
      { name: 'The Bell', rarity: 4, reason: 'High HP% substat maximizing Jinni healing volume' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: +20% party-wide ATK buff on burst cast' },
      { name: 'The Exile', pieces: 4, reason: 'Extreme Team Battery: Restores flat energy to all teammates upon burst activation' },
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Converts continuous Jinni tether healing into physical bubble AoE pops' }
    ],
    mainStats: {
      sands: ['Energy Recharge'],
      goblet: ['HP%'],
      circlet: ['Healing Bonus', 'HP%']
    },
    subStats: ['Energy Recharge (to ~200-240%)', 'HP%', 'HP', 'CRIT Rate (for Favonius)']
  },
  KujouSara: {
    weapons: [
      { name: 'Skyward Harp', rarity: 5, reason: 'Premier 5★ BiS: Highest 674 Base ATK scaling her Crowfeather ATK buff to maximum' },
      { name: 'Elegy for the End', rarity: 5, reason: 'High ER and grants party-wide +100 EM and +20% ATK buffs' },
      { name: "Mouun's Moon", rarity: 4, reason: 'High Base ATK for 4★ weapons with massive party-energy scaled burst DMG' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Support Comfort: Solves her 80 energy burst and batteries Electro carries' },
      { name: 'Fading Twilight', rarity: 4, reason: 'High Base ATK with ER substat and stacking damage amplification' }
    ],
    artifacts: [
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Best in Slot: Solves steep ER needs and converts ER into massive Subakuhou burst nukes' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party-wide ATK buff if no other character holds the set' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-220%)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  Lisa: {
    weapons: [
      { name: "Kagura's Verity", rarity: 5, reason: '66.2% CRIT DMG stat stick boosting tap/hold skill DMG' },
      { name: 'A Thousand Floating Dreams', rarity: 5, reason: 'High EM substat maximizing Aggravate and Hyperbloom damage' },
      { name: 'The Widsith', rarity: 4, reason: 'Premier 4★ Nuke: High CRIT DMG with massive 10s burst damage multipliers' },
      { name: 'Hakushin Ring', rarity: 4, reason: 'Craftable Team Buffer: Grants +20% Electro and Dendro DMG bonuses on Aggravate' },
      { name: 'Favonius Codex', rarity: 4, reason: 'Support Enabler: Generates particles and mitigates her 80 energy burst cost' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: Pairs with A4 15% DEF shred to provide +20% party ATK buff' },
      { name: 'Thundering Fury', pieces: 4, reason: 'Aggravate DPS BiS: Cooldown reduction allowing frequent Hold Skill casts' },
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Burst Sub-DPS BiS: Converts ER into continuous lightning storm damage' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'Elemental Mastery', 'ATK%'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-220% for Burst DEF shred)', 'CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'ATK%']
  }
};
