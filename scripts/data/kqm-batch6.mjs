// KeqingMains (KQM) Authoritative Builds - Batch 6: Fontaine, Natlan & Specialized Regional Supports
export const KQM_BATCH_6 = {
  Kinich: {
    weapons: [
      { name: 'Fang of the Mountain King', rarity: 5, reason: 'Signature BiS: 11.0% CRIT Rate, massive flat ATK, and stacks +50% Skill DMG from Burning/Burgeon' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: Universal +50% all-DMG bonus amplifying massive Scalespiker cannon shots' },
      { name: 'Earth Shaker', rarity: 4, reason: 'Natlan Craftable BiS: High ATK% and +32% Elemental Skill DMG upon triggering Pyro reactions' },
      { name: 'Beacon of the Reed Sea', rarity: 5, reason: '33.1% CRIT Rate with reliable ATK% buffs upon using Elemental Skill' },
      { name: 'Tidal Shadow', rarity: 4, reason: 'Fontaine Craftable: Consistent +48% ATK buff easily triggered upon receiving healing' }
    ],
    artifacts: [
      { name: 'Obsidian Codex', pieces: 4, reason: 'Undisputed Best in Slot: Colossal +40% CRIT Rate when consuming Nightsoul points during loop grappling' },
      { name: 'Unfinished Reverie', pieces: 4, reason: 'Burning Specialist BiS: Massive +50% all-damage bonus while opponents are burning' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Dendro DMG Bonus'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate (aim for ~50-60% before Codex passive)', 'ATK%', 'Energy Recharge (~110-120%)']
  },
  Mualani: {
    weapons: [
      { name: "Surf's Up", rarity: 5, reason: 'Signature BiS: 88.2% CRIT DMG, +20% Max HP, and stacks up to +48% Normal Attack DMG on Vaporize' },
      { name: 'Ring of Yaxche', rarity: 4, reason: 'Natlan Craftable BiS: High HP% substat and scales up to +32% Normal Attack DMG based on Max HP' },
      { name: 'Sacrificial Jade', rarity: 4, reason: 'Battle Pass Top: 36.8% CRIT Rate with colossal +64% HP and +80 EM buff off-field' },
      { name: 'The Widsith', rarity: 4, reason: 'High CRIT DMG with massive 10s burst DMG or EM melody rolls' },
      { name: 'Wandering Evenstar', rarity: 4, reason: 'EM scaling weapon buffing personal reaction damage and party ATK' }
    ],
    artifacts: [
      { name: 'Obsidian Codex', pieces: 4, reason: 'Undisputed Best in Slot: Permanent +40% CRIT Rate triggered by Sharky Surfboard Nightsoul consumption' },
      { name: 'Heart of Depth', pieces: 4, reason: '+15% Hydro DMG and +30% Normal Attack damage upon using skill' }
    ],
    mainStats: {
      sands: ['HP%', 'Elemental Mastery'],
      goblet: ['Hydro DMG Bonus', 'HP%'],
      circlet: ['CRIT DMG']
    },
    subStats: ['CRIT DMG', 'HP%', 'Elemental Mastery (for massive Vaporize bites)', 'CRIT Rate (do not overcap 60% with Codex)']
  },
  Chevreuse: {
    weapons: [
      { name: 'Rightful Reward', rarity: 4, reason: 'Craftable Fontaine Polearm BiS: High HP% substat and restores flat energy upon healing teammates' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Team Battery: High ER generating neutral energy particles on crit hits' },
      { name: 'Black Tassel', rarity: 3, reason: 'Accessible F2P Stat Stick: 46.9% HP substat making reaching the 40,000 HP cap effortless' },
      { name: 'Dialogue of the Desert Sages', rarity: 4, reason: 'Event F2P: High HP% substat and restores energy upon providing healing' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: Stacks party +20% ATK buff alongside her innate 40% Overloaded shred' },
      { name: 'Song of Days Past', pieces: 4, reason: 'Active Carry Buffer: Buffs flat damage of next 5 attacks based on recorded healing' },
      { name: 'Tenacity of the Millelith', pieces: 2, reason: '+20% HP combined with 2pc Vourukasha Glow to easily reach the 40k HP benchmark' }
    ],
    mainStats: {
      sands: ['HP%'],
      goblet: ['HP%'],
      circlet: ['HP%', 'Healing Bonus']
    },
    subStats: ['HP% (aim for 40,000 HP cap for max +40% ATK buff)', 'Energy Recharge (~140-160%)', 'HP', 'CRIT Rate (for Favonius)']
  },
  Emilie: {
    weapons: [
      { name: 'Lumidouce Elegy', rarity: 5, reason: 'Signature BiS: 33.1% CRIT Rate, +15% ATK, and up to +36% DMG & energy in Burning' },
      { name: 'Calamity Queller', rarity: 5, reason: 'Highest Base ATK with massive off-field ATK% buffs' },
      { name: 'Staff of Homa', rarity: 5, reason: '66.2% CRIT DMG with bonus ATK scaling from Max HP' },
      { name: 'Deathmatch', rarity: 4, reason: 'Battle Pass Pick: 36.8% CRIT Rate with consistent ATK bonuses' },
      { name: 'Missive Windspear', rarity: 4, reason: 'Event F2P: High ATK% and flat ATK scaling on reaction trigger' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Team Battery: Solves energy requirements for continuous burst box uptime' }
    ],
    artifacts: [
      { name: 'Unfinished Reverie', pieces: 4, reason: 'Undisputed Best in Slot: Colossal +50% all-damage bonus while opponents are burning' },
      { name: 'Deepwood Memories', pieces: 4, reason: 'Solo Dendro BiS: Provides 30% Dendro RES shred if no other teammate carries the set' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Dendro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~120-130%)']
  },
  Lyney: {
    weapons: [
      { name: 'The First Great Magic', rarity: 5, reason: 'Signature BiS: 66.2% CRIT DMG, +16% Charged Attack DMG, and up to +48% ATK in Mono-Pyro' },
      { name: 'Aqua Simulacra', rarity: 5, reason: '88.2% CRIT DMG with unconditional universal +20% damage bonus' },
      { name: 'Thundering Pulse', rarity: 5, reason: '66.2% CRIT DMG with high Base ATK and passive ATK buffs' },
      { name: 'Song of Stillness', rarity: 4, reason: 'Best F2P Craftable: Up to +32% all-damage bonus upon receiving any healing' },
      { name: 'Prototype Crescent', rarity: 4, reason: 'Craftable F2P: Up to +72% massive ATK buff upon hitting weak spots with Prop Arrows' }
    ],
    artifacts: [
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Undisputed Best in Slot: Effortlessly stacks +36% CRIT Rate via Prop Arrow HP drain and self-heal' },
      { name: 'Lavawalker', pieces: 4, reason: 'Mono-Pyro Alternative: Permanent +35% all-damage bonus against burning targets' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate (aim for ~50-60% before Marechaussee)', 'ATK%', 'Energy Recharge (~120%)']
  },
  Kachina: {
    weapons: [
      { name: 'Footprint of the Rainbow', rarity: 4, reason: 'Natlan Craftable BiS: High DEF% substat directly scaling Turbo Twirly drill damage' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Universal Battery BiS: High ER generating neutral energy particles for party carries' },
      { name: 'Rightful Reward', rarity: 4, reason: 'Craftable Fontaine Polearm: HP/DEF stat stick with flat burst energy recovery' }
    ],
    artifacts: [
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Undisputed Best in Slot: Grants party-wide +40% elemental damage bonus on Nightsoul trigger' },
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Sub-DPS BiS: Stacks up to +54% DEF and +24% Geo DMG' }
    ],
    mainStats: {
      sands: ['DEF%', 'Energy Recharge'],
      goblet: ['Geo DMG Bonus', 'DEF%'],
      circlet: ['DEF%', 'CRIT Rate']
    },
    subStats: ['Energy Recharge (to ~160-190%)', 'DEF%', 'CRIT Rate (for Favonius Lance)', 'Flat DEF']
  },
  Ororon: {
    weapons: [
      { name: 'Elegy for the End', rarity: 5, reason: 'Premier 5★ Support: High ER granting party-wide +100 EM and +20% ATK buffs' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Universal Battery BiS: High 61.3% ER generating neutral particles for team rotations' },
      { name: 'The Stringless', rarity: 4, reason: 'Sub-DPS BiS: High EM with +48% Skill and Burst DMG multipliers in Electro-Charged' },
      { name: 'Chain Breaker', rarity: 4, reason: 'Natlan Craftable: High ATK% and EM scaling based on team elemental variety' }
    ],
    artifacts: [
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Undisputed Best in Slot: Grants party-wide +40% elemental damage bonus on Nightsoul trigger' },
      { name: 'Golden Troupe', pieces: 4, reason: 'Sub-DPS BiS: Up to +70% off-field Elemental Skill DMG for spirit strikes' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~160-180%)', 'CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery']
  },
  Thoma: {
    weapons: [
      { name: 'Kitain Cross Spear', rarity: 4, reason: 'Burgeon BiS: High EM substat and restores up to 15 flat energy upon using skill' },
      { name: "Dragon's Bane", rarity: 4, reason: 'Burgeon EM Stat Stick: 221 EM maximizing Fiery Collapse core explosion damage' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Shield Support BiS: High ER generating neutral particles to solve 80 energy burst' },
      { name: 'Rightful Reward', rarity: 4, reason: 'Craftable Fontaine Polearm: HP substat with flat energy restore upon receiving healing' }
    ],
    artifacts: [
      { name: 'Flower of Paradise Lost', pieces: 4, reason: 'Burgeon BiS: Stacks up to +80% Burgeon reaction damage' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Burgeon Alternative: Massive triple-EM stat efficiency' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Shield Support BiS: +20% party ATK buff upon burst cast' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'Elemental Mastery'],
      goblet: ['Elemental Mastery', 'HP%'],
      circlet: ['Elemental Mastery', 'HP%']
    },
    subStats: ['Energy Recharge (to ~200-240% without Kitain, ~170-190% with Kitain R5)', 'Elemental Mastery (Burgeon)', 'HP%', 'Flat HP']
  },
  Xinyan: {
    weapons: [
      { name: 'Redhorn Stonethresher', rarity: 5, reason: '88.2% CRIT DMG with Normal Attack and DEF scaling' },
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Massive ATK stat stick with teamwide execution ATK buff' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Battle Pass Top: Universal +50% all-DMG bonus' },
      { name: 'Sacrificial Greatsword', rarity: 4, reason: 'Shield Support: Resets skill cooldown for 100% Sweeping Fervor shield uptime' },
      { name: 'Whiteblind', rarity: 4, reason: 'Craftable DEF% Claymore directly scaling shield damage absorption' }
    ],
    artifacts: [
      { name: 'Pale Flame', pieces: 4, reason: 'Physical Carry BiS: Stacks +50% Physical DMG and +18% ATK' },
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Shield Support BiS: +20% party ATK and +30% shield strength from pulsed pyro ticks' }
    ],
    mainStats: {
      sands: ['ATK%', 'DEF%'],
      goblet: ['Physical DMG Bonus', 'DEF%'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG (100% CRIT Rate at C2 on Burst)', 'ATK%', 'DEF%', 'Energy Recharge (~140-160%)']
  },
  Amber: {
    weapons: [
      { name: 'Elegy for the End', rarity: 5, reason: 'Premier 5★ Support BiS: High ER granting party-wide +100 EM and +20% ATK buffs on burst' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Universal Battery: High ER generating neutral particles for team rotations' },
      { name: 'The Stringless', rarity: 4, reason: 'Nuke Support: High EM with +48% Skill and Burst DMG multipliers' },
      { name: "Sharpshooter's Oath", rarity: 3, reason: 'F2P Weak-Spot Gem: 46.9% CRIT DMG and +48% DMG on headshot hits' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best Support BiS: Low 40-cost burst provides 100% uptime on party +20% ATK buff' },
      { name: 'Instructor', pieces: 4, reason: 'Reaction Buffer: Grants party-wide +120 EM on applying Pyro for Vaporize carries' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~160-180%)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  Razor: {
    weapons: [
      { name: 'Beacon of the Reed Sea', rarity: 5, reason: '33.1% CRIT Rate with reliable stacking ATK% buffs' },
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Massive ATK stat stick with teamwide execute buff' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: Universal +50% all-DMG bonus' },
      { name: 'Mailed Flower', rarity: 4, reason: 'Thundering Furry BiS: High EM and ATK% buffs for Rainbow Hyperbloom/Burgeon triggers' },
      { name: 'Rainslasher', rarity: 4, reason: 'High EM substat and +36% DMG against Hydro/Electro affected opponents' }
    ],
    artifacts: [
      { name: 'Pale Flame', pieces: 4, reason: 'Physical Carry BiS: Stacks up to +50% Physical DMG and +18% ATK' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Thundering Furry BiS: Massive EM for Rainbow overload, electro-charged, and hyperbloom triggers' },
      { name: "Gladiator's Finale", pieces: 4, reason: 'Accessible Classic: Permanent +35% Normal Attack damage' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Physical DMG Bonus', 'Elemental Mastery'],
      circlet: ['CRIT Rate', 'Elemental Mastery']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery', 'Energy Recharge (~120%)']
  },
  Ineffa: {
    weapons: [
      { name: 'Staff of the Scarlet Sands', rarity: 5, reason: '44.1% CRIT Rate converting high EM into massive flat ATK' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Universal Battery BiS: High ER generating neutral energy particles' },
      { name: 'Ballad of the Fjords', rarity: 4, reason: 'Battle Pass Top: High CRIT Rate and +240 EM in multi-element teams' },
      { name: "Dragon's Bane", rarity: 4, reason: 'Reaction Master: High EM substat with +36% DMG against Hydro/Electro targets' }
    ],
    artifacts: [
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Best in Slot Support: Grants party-wide +40% elemental damage bonus on Nightsoul trigger' },
      { name: 'Golden Troupe', pieces: 4, reason: 'Sub-DPS BiS: Up to +70% off-field Elemental Skill DMG' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Reaction DPS BiS: Massive EM and ATK buffs in reaction teams' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'ATK%'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Elemental Mastery', 'CRIT Rate', 'CRIT DMG', 'Energy Recharge (~130-150%)', 'ATK%']
  }
};
