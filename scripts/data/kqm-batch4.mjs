// KeqingMains (KQM) Authoritative Builds - Batch 4: Cryo Freeze, Melt & Physical Specialists
export const KQM_BATCH_4 = {
  KamisatoAyaka: {
    weapons: [
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'Signature BiS: 44.1% CRIT DMG, high 674 Base ATK, and effortless 3-stack +28% Cryo DMG bonus' },
      { name: 'Amenoma Kageuchi', rarity: 4, reason: 'Premier F2P Craftable BiS: Restores up to 36 energy, lowering ER requirements to near zero' },
      { name: 'Finale of the Deep', rarity: 4, reason: 'High ATK Craftable: Bond of Life synergy providing massive flat ATK for burst slashes' },
      { name: 'The Black Sword', rarity: 4, reason: 'Battle Pass Pick: Normal and Charged attack DMG with CRIT Rate' },
      { name: 'Skyward Blade', rarity: 5, reason: 'Energy Comfort: High ER with Base ATK and bonus CRIT Rate' }
    ],
    artifacts: [
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Undisputed Best in Slot: +15% Cryo DMG and colossal +40% CRIT Rate against Frozen opponents' },
      { name: 'Blizzard Strayer', pieces: 2, reason: '+15% Cryo DMG paired with 2pc ATK (+18% ATK) for Boss / non-freezable encounters' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT DMG']
    },
    subStats: ['CRIT DMG', 'ATK%', 'Energy Recharge (~130-140% without Amenoma, ~110-120% with Amenoma)', 'CRIT Rate (aim for 35-45% max)']
  },
  Ganyu: {
    weapons: [
      { name: "Hunter's Path", rarity: 5, reason: 'Melt BiS: 44.1% CRIT Rate converting EM into colossal Frostflake Arrow bloom damage' },
      { name: 'The First Great Magic', rarity: 5, reason: '66.2% CRIT DMG with movement speed and stacking Charged Attack damage bonus' },
      { name: "Amos' Bow", rarity: 5, reason: 'Classic Signature: High ATK% and up to +52% Charged Attack DMG scaling with flight time' },
      { name: 'Aqua Simulacra', rarity: 5, reason: '88.2% CRIT DMG with unconditional universal +20% damage bonus' },
      { name: 'Hamayumi', rarity: 4, reason: 'Best F2P Craftable (Melt): Doubles Charged Attack damage bonus when burst energy is 100%' },
      { name: 'Prototype Crescent', rarity: 4, reason: 'Best F2P Craftable (Freeze): Up to +72% massive ATK buff upon hitting weak spots' }
    ],
    artifacts: [
      { name: "Wanderer's Troupe", pieces: 4, reason: 'Best in Slot for Melt: +80 EM and unconditional +35% Charged Attack DMG for bow users' },
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Best in Slot for Freeze: Effortless +40% CRIT Rate against frozen targets' },
      { name: "Shimenawa's Reminiscence", pieces: 4, reason: '+50% Charged Attack damage for pure arrow-focused play' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate', 'ATK%', 'Elemental Mastery (Melt teams)', 'Energy Recharge (~120% for Freeze)']
  },
  Wriothesley: {
    weapons: [
      { name: 'Cashflow Supervision', rarity: 5, reason: 'Signature BiS: 22.1% CRIT Rate, ATK buffs, and +48% Normal/Charged Attack damage on HP shifts' },
      { name: "Tulaytullah's Remembrance", rarity: 5, reason: '44.1% CRIT DMG, +10% Attack Speed, and up to +48% Normal Attack ramping damage' },
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: '33.1% CRIT Rate with movement speed and sustained elemental damage bonus' },
      { name: 'The Widsith', rarity: 4, reason: 'Premier 4★ Burst: 55.1% CRIT DMG with massive 10s ATK, DMG, or EM melody buffs' },
      { name: 'Flowing Purity', rarity: 4, reason: 'Best F2P Craftable: High base ATK and all-elemental damage bonus upon clearing Bond of Life' }
    ],
    artifacts: [
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Undisputed Best in Slot: Effortlessly stacks +36% CRIT Rate from Rebuke HP drain and self-heal' },
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Freeze Alternative: +40% CRIT Rate against frozen opponents in permafrost teams' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate (do not overcap past 64% with Marechaussee)', 'ATK%', 'Elemental Mastery (Melt)']
  },
  Shenhe: {
    weapons: [
      { name: 'Calamity Queller', rarity: 5, reason: 'Signature BiS: Colossal 741 Base ATK and massive off-field ATK% buffs maximizing Icy Quill damage' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Premier Support 4★ BiS: High ER generating neutral particles to battery Ayaka/Ganyu' },
      { name: 'Engulfing Lightning', rarity: 5, reason: 'Massive ER substat converting energy directly into bonus ATK for Quill scaling' },
      { name: 'Skyward Spine', rarity: 5, reason: 'High 674 Base ATK with ER substat and bonus CRIT Rate' },
      { name: 'Missive Windspear', rarity: 4, reason: 'Event F2P: High ATK% and flat ATK scaling on reaction trigger' }
    ],
    artifacts: [
      { name: "Gladiator's Finale", pieces: 2, reason: '+18% ATK paired with 2pc Shimenawa (+18% ATK) for maximum flat Quill buff transfer' },
      { name: "Shimenawa's Reminiscence", pieces: 2, reason: 'Stacks maximum pure ATK% to amplify every Cryo hit across the party' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party-wide ATK buff if no other team member carries the set' }
    ],
    mainStats: {
      sands: ['ATK%', 'Energy Recharge'],
      goblet: ['ATK%'],
      circlet: ['ATK%']
    },
    subStats: ['Energy Recharge (to ~180-200% solo, ~150-170% double Cryo)', 'ATK%', 'HP', 'CRIT Rate (for Favonius Lance)']
  },
  Rosaria: {
    weapons: [
      { name: 'Staff of Homa', rarity: 5, reason: '66.2% CRIT DMG with bonus ATK scaling from Max HP' },
      { name: 'Deathmatch', rarity: 4, reason: 'Premier 4★ BiS: 36.8% CRIT Rate maximizing her A4 team CRIT Rate share (up to +15%)' },
      { name: 'The Catch', rarity: 4, reason: 'Premier F2P BiS: +32% Burst DMG and +12% Burst CRIT Rate with vital ER' },
      { name: "Wavebreaker's Fin", rarity: 4, reason: 'Enormous party-energy scaled Elemental Burst DMG bonus at high refinements' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Battery Support: High ER generating neutral particles on crit hits' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: +20% party-wide ATK combined with A4 team CRIT Rate share' },
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Melt Sub-DPS BiS: Converts necessary ER directly into massive Rites of Termination damage' },
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Freeze BiS: Free CRIT Rate allowing full investment into CRIT DMG' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%', 'Elemental Mastery'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT Rate']
    },
    subStats: ['CRIT Rate (aim for 88-100% for A4 passive share)', 'Energy Recharge (~140-160%)', 'CRIT DMG', 'ATK%']
  },
  Kaeya: {
    weapons: [
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'Highest ceiling: High Base ATK, CRIT DMG, and stacking Cryo DMG bonus' },
      { name: 'Primordial Jade Cutter', rarity: 5, reason: '44.1% CRIT Rate converting base HP into bonus ATK' },
      { name: 'Amenoma Kageuchi', rarity: 4, reason: 'Craftable F2P: Restores flat energy on burst to ensure continuous Glacial Waltz' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Battery Support: High ER generating neutral energy particles for teammates' },
      { name: "Lion's Roar", rarity: 4, reason: 'Reverse Melt BiS: Up to +36% DMG against Pyro-affected targets' }
    ],
    artifacts: [
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Freeze BiS: +15% Cryo DMG and +40% CRIT Rate against frozen opponents' },
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Reverse Melt BiS: Directly scales rotating icicle burst damage with ER' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Support BiS: +20% party ATK buff upon burst cast' }
    ],
    mainStats: {
      sands: ['ATK%', 'Energy Recharge'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~130-150%)', 'Elemental Mastery (Melt)']
  },
  Eula: {
    weapons: [
      { name: 'Song of Broken Pines', rarity: 5, reason: 'Signature BiS: 741 Base ATK, Physical DMG substat, +12% Attack Speed, and party ATK buff' },
      { name: 'Beacon of the Reed Sea', rarity: 5, reason: '33.1% CRIT Rate and unconditional stacking ATK% buffs' },
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Massive ATK stat stick with teamwide execution buff on low health enemies' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Battle Pass Staple: 27.6% CRIT Rate and up to +50% universal damage bonus' },
      { name: 'Tidal Shadow', rarity: 4, reason: 'Best F2P Craftable: Up to +48% ATK buff triggered effortlessly upon healing' },
      { name: 'Snow-Tombed Starsilver', rarity: 4, reason: 'Dragonspine F2P: Physical DMG substat and dropping icicle AoE hits' }
    ],
    artifacts: [
      { name: 'Pale Flame', pieces: 4, reason: 'Undisputed Best in Slot: Stacks up to +50% Physical DMG and +18% ATK via Hold Skill' },
      { name: 'Bloodstained Chivalry', pieces: 2, reason: '+25% Physical DMG paired with 2pc Pale Flame (+25% Physical DMG) for unconditional +50%' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Physical DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~130-150% with Cryo battery)']
  },
  Charlotte: {
    weapons: [
      { name: 'Favonius Codex', rarity: 4, reason: 'Team Battery BiS: High ER generating neutral particles to solve steep 80 energy burst' },
      { name: 'Prototype Amber', rarity: 4, reason: 'Craftable Team Engine: Restores party energy and provides extra team burst healing' },
      { name: 'Oathsworn Eye', rarity: 4, reason: 'Event F2P BiS: High ATK% with colossal +48% ER after casting Elemental Skill' },
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Hypercarry Buffer: Passes +48% ATK buff to switching carry if ER needs are met' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: +20% party-wide ATK buff on burst activation' },
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Burst Healing Converter: Turns teamwide burst healing into 30,000 physical bubble damage' },
      { name: 'Song of Days Past', pieces: 4, reason: 'Active Carry Buffer: Buffs flat damage of next 5 attacks based on recorded healing' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['ATK%'],
      circlet: ['Healing Bonus', 'ATK%', 'CRIT Rate']
    },
    subStats: ['Energy Recharge (to ~190-230%)', 'ATK%', 'CRIT Rate (for Favonius Codex)', 'HP']
  },
  Diona: {
    weapons: [
      { name: 'Sacrificial Bow', rarity: 4, reason: 'Premier 4★ BiS: Immediate skill cooldown reset for double shield generation and energy' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Universal Battery: High 61.3% ER generating neutral particles on crit hits' },
      { name: 'Recurve Bow', rarity: 3, reason: 'Accessible F2P: 46.9% HP substat directly scaling Icy Paws shield absorption' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: +20% party-wide ATK buff on burst cast' },
      { name: 'Tenacity of the Millelith', pieces: 2, reason: '+20% HP combined with 2pc Vourukasha Glow (+40% HP total) for maximum shield health' },
      { name: 'Maiden Beloved', pieces: 4, reason: 'Maximum raw healing output for challenging encounters' }
    ],
    mainStats: {
      sands: ['HP%', 'Energy Recharge'],
      goblet: ['HP%'],
      circlet: ['HP%', 'Healing Bonus']
    },
    subStats: ['HP%', 'Energy Recharge (~160-190%)', 'HP', 'CRIT Rate (for Favonius)']
  },
  Layla: {
    weapons: [
      { name: "The Dockhand's Assistant", rarity: 4, reason: 'Premier 4★ BiS: High HP% substat directly scaling Curtain of Slumber shield durability' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER generating neutral energy particles for teammates' },
      { name: 'Key of Khaj-Nisut', rarity: 5, reason: 'Colossal HP% stat stick converting massive shield HP into party EM buffs' },
      { name: 'Fleuve Cendre Ferryman', rarity: 4, reason: 'F2P Fishing Sword: High ER with bonus Skill CRIT Rate' }
    ],
    artifacts: [
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Undisputed Best in Slot: 100% uptime on party +20% ATK from flying shooting stars' },
      { name: 'Tenacity of the Millelith', pieces: 2, reason: '+20% HP combined with 2pc Vourukasha Glow (+40% HP total) for indestructible shields' }
    ],
    mainStats: {
      sands: ['HP%'],
      goblet: ['HP%'],
      circlet: ['HP%', 'CRIT Rate']
    },
    subStats: ['HP% (aim for 40,000+ HP)', 'Energy Recharge (~130-150%)', 'HP', 'CRIT Rate (for Favonius)']
  },
  Mika: {
    weapons: [
      { name: 'Favonius Lance', rarity: 4, reason: 'Universal Battery BiS: High ER substat generating neutral particles on crit hits' },
      { name: 'Rightful Reward', rarity: 4, reason: 'Craftable Fontaine Polearm: HP% substat and refunds burst energy upon healing' },
      { name: 'Black Tassel', rarity: 3, reason: 'F2P Stat Stick: Readily accessible 46.9% HP substat for maximum burst healing' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: +20% party-wide ATK buff combined with Attack Speed buff' },
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Converts continuous team burst healing into physical bubble AoE pops' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'HP%'],
      goblet: ['HP%'],
      circlet: ['Healing Bonus', 'HP%', 'CRIT Rate']
    },
    subStats: ['Energy Recharge (to ~180-210%)', 'HP%', 'CRIT Rate (for Favonius Lance)', 'HP']
  },
  Freminet: {
    weapons: [
      { name: 'Song of Broken Pines', rarity: 5, reason: '741 Base ATK with Physical DMG bonus and party ATK speed buff' },
      { name: 'Redhorn Stonethresher', rarity: 5, reason: '88.2% CRIT DMG with Normal Attack flat damage scaling' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Universal +50% all-DMG bonus from Battle Pass' },
      { name: 'Tidal Shadow', rarity: 4, reason: 'Best F2P Craftable: Up to +48% ATK buff easily triggered by Shatter healing' },
      { name: 'Snow-Tombed Starsilver', rarity: 4, reason: 'Craftable Physical DMG claymore with dropping icicles' }
    ],
    artifacts: [
      { name: 'Pale Flame', pieces: 4, reason: 'Physical Carry BiS: Easily stacks +50% Physical DMG and +18% ATK through Pers timer pressure' },
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Cryo Carry BiS: +40% CRIT Rate in permafrost Shatter compositions' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Physical DMG Bonus', 'Cryo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~120-130%)']
  },
  Chongyun: {
    weapons: [
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Enormous ATK stat stick with teamwide execution buff on low health targets' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: 27.6% CRIT Rate with up to +50% universal damage bonus' },
      { name: 'Mailed Flower', rarity: 4, reason: 'Event F2P BiS (Melt): High EM and ATK% buffs on elemental skill procs' },
      { name: 'Akuoumaru', rarity: 4, reason: 'Wavebreaker Claymore: Scales massive 3-blade burst damage based on party energy' },
      { name: 'Sacrificial Greatsword', rarity: 4, reason: 'Field Infusion Reset: Double skill field for 100% Cryo normal attack infusion' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: Low 40-cost burst allows 100% uptime on party +20% ATK buff' },
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Melt Burst Nuker: Converts ER directly into triple/quadruple blade nuke damage' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery (Melt)', 'Energy Recharge (~120%)']
  },
  Aloy: {
    weapons: [
      { name: 'Thundering Pulse', rarity: 5, reason: '66.2% CRIT DMG with stacking Normal Attack damage in Rushing Ice state' },
      { name: 'Polar Star', rarity: 5, reason: 'High CRIT Rate and skill damage buffs stacking with freeze bombs' },
      { name: 'The Stringless', rarity: 4, reason: 'Burst Nuke BiS: High EM with +48% Skill and Burst DMG multipliers' },
      { name: 'Rust', rarity: 4, reason: 'Normal Attack focus during Cryo infused rapid bow fire' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Battery Support: High ER generating neutral energy particles for teammates' }
    ],
    artifacts: [
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Freeze BiS: +15% Cryo DMG and +40% CRIT Rate against frozen targets' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Burst Support BiS: +20% party-wide ATK buff on low 40-cost burst' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~120-130%)']
  },
  Qiqi: {
    weapons: [
      { name: 'Sacrificial Sword', rarity: 4, reason: 'Undisputed BiS: Resets her massive 30s skill cooldown for 100% Herald of Frost uptime' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER generating neutral energy particles on crit hits' },
      { name: 'Amenoma Kageuchi', rarity: 4, reason: 'Craftable F2P: High ATK% scaling with flat burst energy refund' },
      { name: 'Skyward Blade', rarity: 5, reason: 'High Base ATK, ER substat, and bonus CRIT Rate' }
    ],
    artifacts: [
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Undisputed Best in Slot: Effortlessly caps 30,000 AoE physical bubble explosions every 3.5s' },
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Support BiS: +20% party ATK buff triggered by rotating Herald of Frost' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['ATK%'],
      circlet: ['Healing Bonus', 'ATK%', 'CRIT Rate']
    },
    subStats: ['Energy Recharge (to ~200-240% without Sacrificial)', 'ATK%', 'HP', 'CRIT Rate (for Favonius Sword)']
  }
};
