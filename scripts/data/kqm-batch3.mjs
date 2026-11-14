// KeqingMains (KQM) Authoritative Builds - Batch 3: Anemo Swirlers, Crowd Controllers & Carries
export const KQM_BATCH_3 = {
  Venti: {
    weapons: [
      { name: 'Elegy for the End', rarity: 5, reason: 'Premier 5★ Support BiS: High ER granting party-wide +100 EM and +20% ATK buffs' },
      { name: 'The Stringless', rarity: 4, reason: 'Premier 4★ DPS BiS: High EM substat with up to +48% Skill and Burst DMG multipliers' },
      { name: 'Aqua Simulacra', rarity: 5, reason: '88.2% CRIT DMG with universal +20% damage bonus active in Grand Ode black holes' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Universal Battery: High 61.3% ER generating neutral particles for team burst rotations' },
      { name: 'Windblume Ode', rarity: 4, reason: 'Event F2P: High EM substat and +32% ATK buff upon triggering elemental skill' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Undisputed Best in Slot: +60% Swirl DMG and 40% elemental RES shred to swirled elements' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party-wide ATK buff if no other team member carries the set' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'Energy Recharge'],
      goblet: ['Elemental Mastery', 'Anemo DMG Bonus'],
      circlet: ['Elemental Mastery', 'CRIT Rate']
    },
    subStats: ['Elemental Mastery', 'Energy Recharge (to ~160-180%)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  Sucrose: {
    weapons: [
      { name: 'Sacrificial Fragments', rarity: 4, reason: 'Undisputed 4★ BiS: Massive 221 EM with skill reset for double particle generation and EM sharing' },
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Top Hypercarry Buffer: Passes massive +48% ATK buff to switching main carry' },
      { name: 'Favonius Codex', rarity: 4, reason: 'Reliable Battery: Generates neutral particles to feed high-cost bursts across the team' },
      { name: 'Hakushin Ring', rarity: 4, reason: 'Inazuma Craftable: High ER providing party elemental damage bonuses upon Electro reactions' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Undisputed Best in Slot: 40% elemental RES shred to swirled elements and +60% Swirl DMG' },
      { name: 'Instructor', pieces: 4, reason: 'Reaction Buffer: Grants party-wide +120 EM upon triggering an elemental reaction' }
    ],
    mainStats: {
      sands: ['Elemental Mastery'],
      goblet: ['Elemental Mastery'],
      circlet: ['Elemental Mastery']
    },
    subStats: ['Elemental Mastery (aim for 700-900+ EM)', 'Energy Recharge (~140-160%)', 'ATK%', 'CRIT Rate (for Favonius)']
  },
  Xiao: {
    weapons: [
      { name: 'Primordial Jade Winged-Spear', rarity: 5, reason: 'Signature BiS: High Base ATK, CRIT Rate, and progressive ramping damage bonus during plunges' },
      { name: 'Staff of Homa', rarity: 5, reason: 'Supreme 66.2% CRIT DMG powerhouse with bonus ATK scaling from Max HP' },
      { name: 'Calamity Queller', rarity: 5, reason: 'Highest 741 Base ATK with colossal ATK% buffs' },
      { name: 'Deathmatch', rarity: 4, reason: 'Battle Pass Top: 36.8% CRIT Rate making artifact building simple' },
      { name: 'Blackcliff Pole', rarity: 4, reason: 'Accessible F2P: 55.1% CRIT DMG with stacking ATK buffs upon defeating opponents' },
      { name: 'Missive Windspear', rarity: 4, reason: 'Event F2P: Provides solid ATK% and EM upon triggering elemental reactions' }
    ],
    artifacts: [
      { name: 'Vermillion Hereafter', pieces: 4, reason: 'Best in Slot: Stacks up to +66% massive ATK during burst plunge HP drain' },
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Best with Furina / HP drain: Effortlessly maintains permanent +36% CRIT Rate' },
      { name: 'Desert Pavilion Chronicle', pieces: 2, reason: '+15% Anemo DMG combined with 2pc ATK (+18% ATK) for balanced plunge numbers' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Anemo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~130-140% with battery)']
  },
  Wanderer: {
    weapons: [
      { name: "Tulaytullah's Remembrance", rarity: 5, reason: 'Signature BiS: 44.1% CRIT DMG, +10% Attack Speed, and up to +48% Normal Attack DMG bonus' },
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'High 33.1% CRIT Rate with movement speed and stacking elemental damage bonus' },
      { name: 'Memory of Dust', rarity: 5, reason: 'Massive ATK% scaling doubled when protected by shields (Zhongli / Thoma)' },
      { name: 'The Widsith', rarity: 4, reason: 'Premier 4★: 55.1% CRIT DMG with huge 10-second burst damage windows' },
      { name: 'Solar Pearl', rarity: 4, reason: 'Battle Pass Pick: High CRIT Rate with cycling Normal and Skill damage buffs' },
      { name: 'Flowing Purity', rarity: 4, reason: 'Craftable Fontaine Catalyst: High base ATK and all-elemental damage bonus' }
    ],
    artifacts: [
      { name: 'Desert Pavilion Chronicle', pieces: 4, reason: 'Signature Best in Slot: +10% Attack Speed and +40% Normal/Charged DMG on charged hit' },
      { name: "Shimenawa's Reminiscence", pieces: 4, reason: 'Alternative BiS: Converts 15 energy into +50% Normal/Charged Attack damage' },
      { name: 'Echoes of an Offering', pieces: 4, reason: 'Proc-based flat damage scaling for low-latency connections' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Anemo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~110-120%)']
  },
  Xianyun: {
    weapons: [
      { name: "Crane's Echoing Call", rarity: 5, reason: 'Signature BiS: Colossal 741 Base ATK granting party +28% Plunging Attack DMG and energy' },
      { name: 'Oathsworn Eye', rarity: 4, reason: 'Premier 4★ F2P BiS: High ATK% with colossal +48% ER after casting Elemental Skill' },
      { name: 'Favonius Codex', rarity: 4, reason: 'Universal Battery: High ER generating neutral particles to guarantee 100% burst uptime' },
      { name: 'Skyward Atlas', rarity: 5, reason: 'High 674 Base ATK and ATK% substat maximizing Adeptal buff scaling' },
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Hypercarry Buffer: Passes +48% ATK to the next switching plunge carry' }
    ],
    artifacts: [
      { name: 'Song of Days Past', pieces: 4, reason: 'Best in Slot for Plunge Buffer: Converts party healing into flat damage buffs for plunges' },
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Best for Elemental Plunge Teams: Provides 40% elemental RES shred on Swirl' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party ATK buff upon burst cast' }
    ],
    mainStats: {
      sands: ['ATK%', 'Energy Recharge'],
      goblet: ['ATK%'],
      circlet: ['ATK%', 'Healing Bonus']
    },
    subStats: ['Energy Recharge (to ~160-200% solo, ~130-150% double Anemo)', 'ATK% (aim for 4,500 ATK cap for plunge buff)', 'CRIT Rate (for Favonius)']
  },
  Faruzan: {
    weapons: [
      { name: 'Favonius Warbow', rarity: 4, reason: 'Universal Battery BiS: High 61.3% ER generating white particles on crit hits' },
      { name: 'Elegy for the End', rarity: 5, reason: 'Premier 5★ Support: High ER granting party-wide +100 EM and +20% ATK buffs' },
      { name: 'Skyward Harp', rarity: 5, reason: 'Highest 674 Base ATK scaling her A4 Anemo bonus damage at C6' },
      { name: 'Fading Twilight', rarity: 4, reason: 'F2P Event Bow: High Base ATK with ER substat and ramping damage' }
    ],
    artifacts: [
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Best in Slot at C6: 100% uptime on party +20% ATK from pressurized collapse pulses' },
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Best Pre-C6: Mitigates extreme 250%+ ER requirements and boosts burst damage' },
      { name: 'The Exile', pieces: 4, reason: 'Extreme Team Battery: Restores flat energy to all teammates on burst cast' }
    ],
    mainStats: {
      sands: ['Energy Recharge'],
      goblet: ['Anemo DMG Bonus', 'ATK%'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~250-280% pre-C6, ~190-210% at C6)', 'CRIT Rate (for Favonius)', 'ATK%', 'CRIT DMG']
  },
  Jean: {
    weapons: [
      { name: 'Favonius Sword', rarity: 4, reason: 'Team Battery BiS: High ER generating neutral energy particles on crit hits' },
      { name: 'Freedom-Sworn', rarity: 5, reason: 'Top Support 5★: Provides party-wide Normal/Charged and ATK% buffs' },
      { name: 'Amenoma Kageuchi', rarity: 4, reason: 'Best F2P Craftable: Restores massive flat energy upon casting Dandelion Breeze' },
      { name: 'Skyward Blade', rarity: 5, reason: 'High Base ATK, ER substat, and CRIT Rate for hybrid burst healing' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Undisputed Best in Slot: 40% elemental RES shred to swirled elements' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party-wide ATK buff if no other team member carries the set' },
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Best with Furina: Turns teamwide burst healing into 30,000 physical bubble damage' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['ATK%', 'Anemo DMG Bonus'],
      circlet: ['Healing Bonus', 'CRIT Rate']
    },
    subStats: ['Energy Recharge (to ~160-190%)', 'ATK%', 'CRIT Rate (for Favonius)', 'Elemental Mastery']
  },
  Sayu: {
    weapons: [
      { name: 'Favonius Greatsword', rarity: 4, reason: 'Universal Battery BiS: High 61.3% ER generating neutral particles during roll hits' },
      { name: 'Katsuragikiri Nagamasa', rarity: 4, reason: 'Craftable F2P: Restores flat burst energy and buffs skill damage' },
      { name: "Wolf's Gravestone", rarity: 5, reason: 'High ATK stat stick scaling Muji-Muji Daruma burst healing' },
      { name: 'Rainslasher', rarity: 4, reason: 'EM Stat Stick: High EM for heavy Swirl reaction damage' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Undisputed Best in Slot: 40% elemental RES shred while rolling through elements' },
      { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Converts continuous Daruma healing into physical bubble AoE pops' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'Elemental Mastery'],
      goblet: ['Elemental Mastery', 'ATK%'],
      circlet: ['Elemental Mastery', 'Healing Bonus']
    },
    subStats: ['Energy Recharge (to ~180-220%)', 'Elemental Mastery', 'ATK%', 'CRIT Rate (for Favonius)']
  },
  Lynette: {
    weapons: [
      { name: 'Sacrificial Sword', rarity: 4, reason: 'Premier 4★ BiS: Double skill thrust for rapid particle generation and Ousia triggers' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER generating neutral energy particles for teammates' },
      { name: 'Fleuve Cendre Ferryman', rarity: 4, reason: 'F2P Fishing Sword: High ER and +16% Skill CRIT Rate' },
      { name: 'Freedom-Sworn', rarity: 5, reason: 'Support 5★: Grants party Normal/Charged and ATK% buffs on triggering reactions' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Best Support BiS: 40% elemental RES shred to swirled elements' },
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Best for C6 On-Field Carry: Effortless +36% CRIT Rate via skill HP fluctuation' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Anemo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-220% off-field)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  ShikanoinHeizou: {
    weapons: [
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'High 33.1% CRIT Rate with on-field movement speed and elemental damage bonus' },
      { name: "Kagura's Verity", rarity: 5, reason: '66.2% CRIT DMG with skill damage buffs stacking on Heartstopper Strike' },
      { name: 'The Widsith', rarity: 4, reason: 'Premier 4★ Nuke: High CRIT DMG with massive 10s burst damage multipliers' },
      { name: 'Solar Pearl', rarity: 4, reason: 'Battle Pass Pick: Normal attacks buff skill, and skill buffs normal attacks' },
      { name: 'Mappa Mare', rarity: 4, reason: 'F2P Craftable: High EM substat with stacking elemental damage on reactions' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Best Driver BiS: Provides 40% elemental RES shred while driving off-field sub-DPS' },
      { name: 'Desert Pavilion Chronicle', pieces: 2, reason: '+15% Anemo DMG combined with 2pc ATK (+18% ATK) for punch nukes' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Anemo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery', 'Energy Recharge (~120%)']
  },
  Chasca: {
    weapons: [
      { name: "Astral Vulture's Crimson Plumage", rarity: 5, reason: 'Signature BiS: 66.2% CRIT DMG, massive ATK buffs, and +48% multi-elemental damage' },
      { name: 'The First Great Magic', rarity: 5, reason: 'High 66.2% CRIT DMG, movement speed, and charged attack damage bonus' },
      { name: 'Aqua Simulacra', rarity: 5, reason: 'Enormous 88.2% CRIT DMG with unconditional universal +20% damage bonus' },
      { name: 'Chain Breaker', rarity: 4, reason: 'Natlan Craftable BiS: Massive ATK% and EM buffs scaling with team elemental diversity' },
      { name: 'Song of Stillness', rarity: 4, reason: 'Fontaine Craftable: Up to +32% all-damage bonus upon receiving healing' }
    ],
    artifacts: [
      { name: 'Obsidian Codex', pieces: 4, reason: 'Undisputed Best in Slot: +40% CRIT Rate when consuming Nightsoul points during flight' },
      { name: 'Desert Pavilion Chronicle', pieces: 4, reason: '+10% Attack Speed and +40% Normal/Charged/Plunge DMG' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['ATK%'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate', 'ATK%', 'Elemental Mastery', 'Energy Recharge (~120%)']
  },
  LanYan: {
    weapons: [
      { name: 'Favonius Codex', rarity: 4, reason: 'Universal Battery BiS: High ER substat generating neutral energy particles for party' },
      { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Support 3★: Grants colossal +48% ATK buff to incoming carry' },
      { name: 'Sacrificial Fragments', rarity: 4, reason: 'Skill Reset: High EM and cooldown reset for double skill swirl application' },
      { name: 'Flowing Purity', rarity: 4, reason: 'Craftable Fontaine Catalyst: High base ATK and all-elemental DMG bonus' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Support BiS: 40% elemental RES shred to swirled elements' },
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Natlan Support BiS: +40% party-wide elemental damage bonus upon Nightsoul trigger' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Anemo DMG Bonus', 'ATK%'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~160-190%)', 'CRIT Rate (for Favonius)', 'ATK%', 'Elemental Mastery']
  }
};
