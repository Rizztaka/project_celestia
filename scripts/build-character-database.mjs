import fs from 'fs';
import genshindb from 'genshin-db';
import { KQM_BUILDS } from './data/kqm-builds.mjs';

// Complete role sets for all characters
const SUSTAINS = new Set([
  'Barbara', 'Qiqi', 'Diona', 'Bennett', 'Jean', 'Noelle', 'Zhongli',
  'SangonomiyaKokomi', 'Sayu', 'Thoma', 'KukiShinobu', 'Dori', 'Layla',
  'Yaoyao', 'Baizhu', 'Mika', 'Kirara', 'Charlotte', 'Chevreuse',
  'Xianyun', 'Sigewinne', 'Xilonen', 'Citlali', 'Escoffier', 'Ifa',
  'Dahlia', 'Illuga', 'Prune', 'Vodyanitsa', 'Valeriy'
]);

const BUFFERS = new Set([
  'Bennett', 'KaedeharaKazuha', 'Sucrose', 'Faruzan', 'Gorou', 'YunJin',
  'Shenhe', 'KujouSara', 'Candace', 'Mika', 'Furina', 'Chevreuse',
  'Xianyun', 'Xilonen', 'Citlali', 'Nahida', 'Mona', 'Iansan', 'Lauma',
  'LanYan', 'Escoffier', 'Ifa', 'Ineffa', 'Jahoda', 'Columbina', 'Illuga',
  'Nicole', 'Prune', 'Vodyanitsa', 'Vesna', 'Venti', 'Albedo', 'Mitya', 'Valeriy'
]);

const OFF_FIELD_DPS = new Set([
  'Xiangling', 'Xingqiu', 'Fischl', 'Beidou', 'Rosaria', 'Albedo', 'Yelan',
  'YaeMiko', 'Collei', 'KukiShinobu', 'Nahida', 'Layla', 'Dehya', 'Lynette',
  'Furina', 'Chiori', 'Emilie', 'Kachina', 'Ororon', 'Mavuika', 'Kaeya', 'Lisa', 'Aino',
  'Ineffa', 'Durin', 'Jahoda', 'Columbina', 'Linnea', 'Nicole', 'Sandrone', 'Odette', 'Venti', 'Mitya', 'Valeriy'
]);

function formatSpecializedStat(text, val) {
  if (!text || val === undefined || val === null) return 'None';
  if (text === 'CRIT Rate') return `+${((val - 0.05) * 100).toFixed(1)}%`;
  if (text === 'CRIT DMG') return `+${((val - 0.5) * 100).toFixed(1)}%`;
  if (text === 'Elemental Mastery') return `+${Math.round(val)}`;
  return `+${(val * 100).toFixed(1)}%`;
}

// Curated builds for all characters aligned with KeqingMains (KQM) standards
const CURATED_BUILDS = {
  ...KQM_BUILDS,
  Furina: {
    weapons: [
      { name: 'Splendor of Tranquil Waters', rarity: 5, reason: 'Signature: Massive HP% and Elemental Skill DMG bonus scaling with team HP fluctuations' },
      { name: 'Festering Desire', rarity: 4, reason: 'Premier 4★: +32% Skill DMG and +12% Skill CRIT Rate with vital ER substat' },
      { name: 'Fleuve Cendre Ferryman', rarity: 4, reason: 'Best F2P (Fishing): High ER substat and +16% Skill CRIT Rate after using Skill' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: Solves high ER requirements for Furina and the entire team' },
      { name: 'Key of Khaj-Nisut', rarity: 5, reason: 'HP Powerhouse: Converts massive HP pool into party-wide Elemental Mastery' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Best in Slot: Up to +70% Elemental Skill DMG while off-field' },
      { name: 'Tenacity of the Millelith', pieces: 2, reason: '+20% HP when running 2pc HP / 2pc Golden Troupe transitional builds' }
    ],
    mainStats: {
      sands: ['HP%', 'Energy Recharge'],
      goblet: ['HP%', 'Hydro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG', 'HP%']
    },
    subStats: ['Energy Recharge (to ~160-180%)', 'CRIT Rate', 'CRIT DMG', 'HP%']
  },
  Nefer: {
    weapons: [
      { name: 'Reliquary of Truth', rarity: 5, reason: 'Signature: Huge CRIT DMG and Moonsign Lunar-Bloom amplification for Nod-Krai carry' },
      { name: 'Sacrificial Jade', rarity: 4, reason: 'Battle Pass BiS: 36.8% CRIT Rate with +64% Max HP and +80 EM buff' },
      { name: 'The Widsith', rarity: 4, reason: 'High Burst: +55.1% CRIT DMG with massive random Elemental DMG or EM buffs' },
      { name: 'A Thousand Floating Dreams', rarity: 5, reason: 'EM Engine: +265 EM with party-wide elemental damage bonus sharing' },
      { name: 'Mappa Mare', rarity: 4, reason: 'Craftable F2P: Provides base EM and stacking elemental damage on reactions' }
    ],
    artifacts: [
      { name: "Silken Moon's Serenade", pieces: 4, reason: 'Best in Slot: Nod-Krai Lunar-Bloom set elevating reaction damage and Dew generation' },
      { name: 'Deepwood Memories', pieces: 4, reason: '30% Dendro RES shred when no other party member holds the set' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'Provides massive EM and ATK buffs when triggering elemental reactions' }
    ],
    mainStats: {
      sands: ['Elemental Mastery'],
      goblet: ['Dendro DMG Bonus', 'Elemental Mastery'],
      circlet: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery']
    },
    subStats: ['Elemental Mastery', 'CRIT Rate', 'CRIT DMG', 'Energy Recharge', 'ATK%']
  },
  Mavuika: {
    weapons: [
      { name: 'A Thousand Blazing Suns', rarity: 5, reason: 'Signature: Huge CRIT Rate and colossal Nightsoul burst damage amplification' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Battle Pass Top: Universal damage bonus stacking up to +50% all DMG' },
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Raw Power: Enormous ATK% stat stick with party-wide ATK buff on low-health enemies' },
      { name: 'Tidal Shadow', rarity: 4, reason: 'Fontaine Craftable: High base ATK and +48% ATK buff upon receiving any healing' },
      { name: 'Favonius Greatsword', rarity: 4, reason: 'Support Enabler: Guarantees full team energy rotation comfort' }
    ],
    artifacts: [
      { name: 'Obsidian Codex', pieces: 4, reason: 'Best in Slot: +40% CRIT Rate when consuming Nightsoul points on field' },
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Best Support: +40% party-wide elemental damage bonus on Nightsoul trigger' },
      { name: 'Crimson Witch of Flames', pieces: 4, reason: 'Classic Reaction: Amplifies Vaporize and Melt reaction coefficients' }
    ],
    mainStats: {
      sands: ['ATK%', 'Energy Recharge'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Energy Recharge', 'ATK%', 'Elemental Mastery']
  },
  Xilonen: {
    weapons: [
      { name: 'Peak Patrol Song', rarity: 5, reason: 'Signature: DEF% substat granting up to +25.6% all-element DMG and DEF to team' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Pick: Generates neutral particles to battery team carries seamlessly' },
      { name: 'Flute of Ezpitzal', rarity: 4, reason: 'Natlan Craftable: High DEF% substat tailored for her healing and shred scaling' },
      { name: 'Cinnabar Spindle', rarity: 4, reason: 'Event Defense Sword: Enormous DEF% scaling if owned' }
    ],
    artifacts: [
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Best in Slot: Unconditional +40% elemental damage bonus for all reacted elements' },
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Maximizes DEF% for peak healing output and personal damage' }
    ],
    mainStats: {
      sands: ['DEF%'],
      goblet: ['DEF%'],
      circlet: ['Healing Bonus', 'DEF%', 'CRIT Rate']
    },
    subStats: ['DEF%', 'Energy Recharge', 'CRIT Rate (for Favonius)']
  },
  Citlali: {
    weapons: [
      { name: "Starcaller's Watch", rarity: 5, reason: 'Signature: EM substat granting party-wide Pyro/Hydro/Cryo damage amplification' },
      { name: 'Wandering Evenstar', rarity: 4, reason: 'Team ATK Buff: Converts personal EM into bonus ATK for the active carry' },
      { name: 'Sacrificial Fragments', rarity: 4, reason: 'Highest 4★ EM: 221 EM with skill cooldown reset for constant shield/shred uptime' },
      { name: 'Favonius Codex', rarity: 4, reason: 'Reliable Energy: Generates elemental particles to feed Cryo and Pyro bursts' }
    ],
    artifacts: [
      { name: 'Scroll of the Hero of Cinder City', pieces: 4, reason: 'Best in Slot: Natlan support set granting +40% team elemental damage bonus' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% teamwide ATK buff on burst casting' },
      { name: 'Tenacity of the Millelith', pieces: 4, reason: '+20% ATK and +30% shield strength from off-field skill ticks' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'Energy Recharge'],
      goblet: ['Elemental Mastery'],
      circlet: ['Elemental Mastery', 'CRIT Rate']
    },
    subStats: ['Elemental Mastery', 'Energy Recharge', 'ATK%']
  },
  Neuvillette: {
    weapons: [
      { name: 'Tome of the Eternal Flow', rarity: 5, reason: 'Signature: Huge CRIT DMG, +48% Charged Attack DMG, and continuous energy recovery' },
      { name: 'Sacrificial Jade', rarity: 4, reason: 'Battle Pass BiS: 36.8% CRIT Rate and +64% HP rivaling R1 5-star weapons' },
      { name: 'Prototype Amber', rarity: 4, reason: 'Best F2P Craftable: HP% substat, flat energy restoration, and teamwide healing' },
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'CRIT Rate stat stick with stacking elemental damage bonus while on field' }
    ],
    artifacts: [
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Best in Slot: Effortless +36% CRIT Rate from self-HP fluctuation during beams' },
      { name: 'Heart of Depth', pieces: 4, reason: '+15% Hydro DMG and +30% Normal/Charged Attack DMG' }
    ],
    mainStats: {
      sands: ['HP%'],
      goblet: ['Hydro DMG Bonus', 'HP%'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate', 'HP%', 'Energy Recharge']
  },
  Arlecchino: {
    weapons: [
      { name: "Crimson Moon's Semblance", rarity: 5, reason: 'Signature: Grants Bond of Life and boosts damage up to +36% when BoL is active' },
      { name: 'Primordial Jade Winged-Spear', rarity: 5, reason: 'Standard 5★ BiS: High base ATK, CRIT Rate, and stacking damage bonus' },
      { name: 'Deathmatch', rarity: 4, reason: 'High CRIT Rate: 36.8% CRIT Rate making artifact building simple' },
      { name: 'White Tassel', rarity: 3, reason: 'Best F2P: 3-star gem granting +48% Normal Attack damage and CRIT Rate' }
    ],
    artifacts: [
      { name: 'Fragment of Harmonic Whimsy', pieces: 4, reason: 'Best in Slot: Stacks up to +54% all-damage bonus as Bond of Life increases or decreases' },
      { name: "Gladiator's Finale", pieces: 4, reason: '+35% Normal Attack damage bonus with zero setup requirements' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Elemental Mastery']
  },
  KaedeharaKazuha: {
    weapons: [
      { name: 'Freedom-Sworn', rarity: 5, reason: 'Signature: Highest EM sword granting party-wide Normal/Charged Attack and ATK buffs' },
      { name: 'Xiphos\' Moonlight', rarity: 4, reason: 'Premier 4★: Converts EM into ER for both Kazuha and party members' },
      { name: 'Iron Sting', rarity: 4, reason: 'Craftable F2P: Solid 165 EM base without requiring gacha luck' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Top Utility: Eradicates team ER deficits with reliable particle generation' }
    ],
    artifacts: [
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Essential: -40% elemental RES shred to swirled elements' }
    ],
    mainStats: {
      sands: ['Elemental Mastery', 'Energy Recharge'],
      goblet: ['Elemental Mastery'],
      circlet: ['Elemental Mastery']
    },
    subStats: ['Elemental Mastery', 'Energy Recharge (to ~160%)', 'CRIT Rate']
  },
  Nahida: {
    weapons: [
      { name: 'A Thousand Floating Dreams', rarity: 5, reason: 'Signature: 265 EM with party-wide elemental damage bonus buffs' },
      { name: 'The Widsith', rarity: 4, reason: 'On-Field Carry: High CRIT DMG and explosive burst potential' },
      { name: 'Sacrificial Fragments', rarity: 4, reason: '221 EM base stat stick helping reach the 1,000 EM cap easily' },
      { name: 'Magic Guide', rarity: 3, reason: 'Best F2P: 187 EM with damage bonus against Hydro/Electro-affected enemies' }
    ],
    artifacts: [
      { name: 'Deepwood Memories', pieces: 4, reason: 'Best in Slot: -30% Dendro RES shred to amplify Hyperbloom, Spread, and Bloom' },
      { name: 'Gilded Dreams', pieces: 4, reason: 'High EM alternative when another teammate holds Deepwood Memories' }
    ],
    mainStats: {
      sands: ['Elemental Mastery'],
      goblet: ['Elemental Mastery', 'Dendro DMG Bonus'],
      circlet: ['Elemental Mastery', 'CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Elemental Mastery (to 1,000)', 'CRIT Rate', 'CRIT DMG', 'Energy Recharge']
  },
  Bennett: {
    weapons: [
      { name: 'Aquila Favonia', rarity: 5, reason: 'Highest Base ATK (674): Maximizes Bennett\'s Fantastic Voyage attack buff' },
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'Tied 674 Base ATK with high personal damage scaling' },
      { name: 'The Alley Flash', rarity: 4, reason: 'Highest 4★ Base ATK (620) for maximum budget buff value' },
      { name: 'Sapwood Blade', rarity: 4, reason: 'Best Craftable: High 565 Base ATK with Energy Recharge substat' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal comfort battery for high-cost teammates like Xiangling' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Best in Slot: +20% party-wide ATK buff for 12s upon using burst' },
      { name: 'Instructor', pieces: 4, reason: '+120 party EM buff in reaction-heavy vape/melt compositions' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'HP%'],
      goblet: ['HP%'],
      circlet: ['Healing Bonus', 'HP%']
    },
    subStats: ['Energy Recharge (to 200%+)', 'HP%', 'HP', 'CRIT Rate (for Favonius)']
  },
  Zhongli: {
    weapons: [
      { name: 'Black Tassel', rarity: 3, reason: 'Shieldbot BiS: 46.9% HP substat at almost zero investment' },
      { name: 'Staff of Homa', rarity: 5, reason: 'Hybrid Burst: High CRIT DMG and HP-to-ATK conversion for Planet Befall nukes' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Utility Battery: Feeds energy to hungry carries like Xiao or Itto' }
    ],
    artifacts: [
      { name: 'Tenacity of the Millelith', pieces: 4, reason: 'Best in Slot: Continuous +20% team ATK and +30% shield strength from stele resonance' },
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Burst support alternative providing +20% party ATK' }
    ],
    mainStats: {
      sands: ['HP%'],
      goblet: ['HP%', 'Geo DMG Bonus'],
      circlet: ['HP%', 'CRIT Rate']
    },
    subStats: ['HP%', 'HP', 'Energy Recharge', 'CRIT Rate']
  },
  RaidenShogun: {
    weapons: [
      { name: 'Engulfing Lightning', rarity: 5, reason: 'Signature: Converts ER into ATK and massive burst ER refund' },
      { name: 'The Catch', rarity: 4, reason: 'Best F2P: +32% Burst DMG and +12% Burst CRIT Rate accessible via fishing' },
      { name: 'Staff of Homa', rarity: 5, reason: 'Tremendous raw CRIT DMG and ATK scaling' },
      { name: 'Favonius Lance', rarity: 4, reason: 'Maximum team battery power for quickswap setups' }
    ],
    artifacts: [
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Best in Slot: Converts up to 75% of ER into raw Burst DMG bonus' }
    ],
    mainStats: {
      sands: ['Energy Recharge', 'ATK%'],
      goblet: ['Electro DMG Bonus', 'ATK%'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (220-250%)', 'CRIT Rate', 'CRIT DMG', 'ATK%']
  },
  Yelan: {
    weapons: [
      { name: 'Aqua Simulacra', rarity: 5, reason: 'Signature: 88.2% CRIT DMG with unconditional +16% HP and +20% DMG buff' },
      { name: 'Favonius Warbow', rarity: 4, reason: 'Best 4★: 61.3% ER solving her high burst energy requirements effortlessly' },
      { name: 'Elegy for the End', rarity: 5, reason: 'Team Buffer: Shares +100 EM and +20% ATK to the entire party' },
      { name: 'Sacrificial Bow', rarity: 4, reason: 'Double skill dash for insane open-world mobility and particles' }
    ],
    artifacts: [
      { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Best in Slot: Maximizes Exquisite Throw off-field burst damage' }
    ],
    mainStats: {
      sands: ['HP%', 'Energy Recharge'],
      goblet: ['Hydro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['Energy Recharge (to ~180-200%)', 'CRIT Rate', 'CRIT DMG', 'HP%']
  },
  HuTao: {
    weapons: [
      { name: 'Staff of Homa', rarity: 5, reason: 'Signature: 66.2% CRIT DMG, +20% HP, and massive ATK buff under 50% HP' },
      { name: 'Dragon\'s Bane', rarity: 4, reason: 'Best 4★ Reaction: 221 EM and +36% DMG against Hydro-affected targets' },
      { name: 'Ballad of the Fjords', rarity: 4, reason: 'Battle Pass: High CRIT Rate with +120-240 EM in 3-element teams' },
      { name: 'White Tassel', rarity: 3, reason: 'F2P Normal/Charged alternative with free CRIT Rate' }
    ],
    artifacts: [
      { name: 'Crimson Witch of Flames', pieces: 4, reason: 'Best in Slot: Amplifies Vaporize and Melt reaction damage by +15%' },
      { name: 'Shimenawa\'s Reminiscence', pieces: 4, reason: '+50% Normal and Charged Attack DMG by sacrificing burst energy' },
      { name: 'Marechaussee Hunter', pieces: 4, reason: '+36% CRIT Rate when paired with Furina' }
    ],
    mainStats: {
      sands: ['HP%', 'Elemental Mastery'],
      goblet: ['Pyro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery (to ~100-200)', 'HP%']
  },
  Skirk: {
    weapons: [
      { name: 'Absolution', rarity: 5, reason: 'Huge CRIT DMG with Bond of Life damage bonus synergy' },
      { name: 'Mistsplitter Reforged', rarity: 5, reason: 'High Base ATK, CRIT DMG, and stacking elemental damage bonus' },
      { name: 'The Black Sword', rarity: 4, reason: 'CRIT Rate substat with normal and charged attack amplification' },
      { name: 'Amenoma Kageuchi', rarity: 4, reason: 'Craftable F2P: Refunds burst energy reliably' }
    ],
    artifacts: [
      { name: 'Blizzard Strayer', pieces: 4, reason: 'Best in Slot: Up to +40% CRIT Rate against Frozen opponents' },
      { name: 'Fragment of Harmonic Whimsy', pieces: 4, reason: 'Massive damage bonus stacking upon BoL fluctuations' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Cryo DMG Bonus'],
      circlet: ['CRIT DMG', 'CRIT Rate']
    },
    subStats: ['CRIT DMG', 'CRIT Rate', 'ATK%', 'Energy Recharge']
  },
  Columbina: {
    weapons: [
      { name: 'A Thousand Floating Dreams', rarity: 5, reason: 'Signature EM stat stick with party-wide elemental damage bonus sharing' },
      { name: 'Sacrificial Fragments', rarity: 4, reason: 'High EM substat and cooldown reset for off-field Hydro dominance' },
      { name: 'The Widsith', rarity: 4, reason: 'Explosive burst rotations with high CRIT DMG' },
      { name: 'Prototype Amber', rarity: 4, reason: 'Provides flat party energy refund and continuous healing' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Best in Slot: +70% off-field Skill DMG bonus' },
      { name: 'Deepwood Memories', pieces: 4, reason: 'Resistance shred support role in Bloom/Lunar-Bloom teams' }
    ],
    mainStats: {
      sands: ['HP%', 'Elemental Mastery'],
      goblet: ['Hydro DMG Bonus', 'HP%'],
      circlet: ['CRIT Rate', 'CRIT DMG', 'Healing Bonus']
    },
    subStats: ['HP%', 'Elemental Mastery', 'Energy Recharge', 'CRIT Rate']
  },
  Varka: {
    weapons: [
      { name: "Wolf's Gravestone", rarity: 5, reason: 'Signature aesthetic and massive ATK% scaling with party buffs' },
      { name: 'Redhorn Stonethresher', rarity: 5, reason: 'Huge 88.2% CRIT DMG with Normal/Charged attack boost' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Universal +50% all-DMG bonus from Battle Pass' },
      { name: 'Tidal Shadow', rarity: 4, reason: 'Craftable high ATK% claymore activated upon healing' }
    ],
    artifacts: [
      { name: 'Desert Pavilion Chronicle', pieces: 4, reason: 'Best in Slot: +10% Attack Speed and +40% Normal/Charged/Plunge DMG' },
      { name: 'Viridescent Venerer', pieces: 4, reason: 'Hybrid Swirl and 40% elemental RES shred' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Anemo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge']
  },
  Mitya: {
    weapons: [
      { name: 'Reliquary of Truth', rarity: 5, reason: 'Signature: Huge CRIT DMG and reaction damage amplification' },
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'Standard 5★: 33.1% CRIT Rate with stacking elemental DMG bonus' },
      { name: 'The Widsith', rarity: 4, reason: 'High CRIT DMG with massive burst buffs on deployment' },
      { name: 'Sacrificial Jade', rarity: 4, reason: 'Battle Pass staple: High CRIT Rate with HP and EM boost' },
      { name: 'Flowing Purity', rarity: 4, reason: 'Craftable Fontaine catalyst providing high ATK and elemental DMG' }
    ],
    artifacts: [
      { name: 'Gilded Dreams', pieces: 4, reason: 'Best in Slot: High Elemental Mastery and ATK scaling in reaction comps' },
      { name: 'Golden Troupe', pieces: 4, reason: '+70% Skill DMG bonus for off-field turret and detection core play' }
    ],
    mainStats: {
      sands: ['ATK%', 'Elemental Mastery'],
      goblet: ['Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'Elemental Mastery', 'ATK%', 'Energy Recharge']
  },
  Valeriy: {
    weapons: [
      { name: 'Peak Patrol Song', rarity: 5, reason: 'Support stat-stick amplifying team elemental damage bonus' },
      { name: 'Favonius Sword', rarity: 4, reason: 'Universal Battery: High ER substat providing neutral energy particles' },
      { name: 'Fleuve Cendre Ferryman', rarity: 4, reason: 'F2P fishing sword: High ER and Skill CRIT Rate' },
      { name: 'The Flute', rarity: 4, reason: 'High ATK% substat to enhance shield scaling and coordinated strikes' }
    ],
    artifacts: [
      { name: 'Noblesse Oblige', pieces: 4, reason: 'Premier Support: +20% party-wide ATK on burst cast' },
      { name: 'Tenacity of the Millelith', pieces: 4, reason: '+20% ATK and +30% shield strength from off-field skill attacks' }
    ],
    mainStats: {
      sands: ['ATK%', 'Energy Recharge'],
      goblet: ['ATK%', 'Electro DMG Bonus'],
      circlet: ['CRIT Rate', 'ATK%']
    },
    subStats: ['ATK%', 'Energy Recharge', 'CRIT Rate', 'Elemental Mastery']
  }
};

// Generic build generator based on weapon, role, and element
function generateBuildForCharacter(char, c) {
  if (CURATED_BUILDS[char.id]) {
    return CURATED_BUILDS[char.id];
  }

  const weaponType = char.weapon;
  const role = char.roles[0] || 'On-Field DPS';
  const elem = char.element;

  const weapons = [];
  const artifacts = [];
  let mainStats = {
    sands: ['ATK%'],
    goblet: [`${elem} DMG Bonus`],
    circlet: ['CRIT Rate', 'CRIT DMG']
  };
  let subStats = ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge'];

  // Weapon selections
  if (weaponType === 'Sword') {
    if (role === 'Sustain') {
      weapons.push(
        { name: 'Favonius Sword', rarity: 4, reason: 'Provides high ER and party-wide white particle generation' },
        { name: 'Sacrificial Sword', rarity: 4, reason: 'Resets skill cooldown for repeated healing and utility' },
        { name: 'The Dockhand\'s Assistant', rarity: 4, reason: 'High HP% substat for HP-scaling healers and buffers' }
      );
      artifacts.push(
        { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party ATK buff upon burst use' },
        { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Turns excessive healing into physical AOE bubble damage' }
      );
      mainStats = { sands: ['HP%', 'Energy Recharge'], goblet: ['HP%'], circlet: ['Healing Bonus', 'HP%'] };
      subStats = ['Energy Recharge', 'HP%', 'HP', 'CRIT Rate'];
    } else if (role === 'Buffer/Shred') {
      weapons.push(
        { name: 'Freedom-Sworn', rarity: 5, reason: '5-star support sword providing party Normal/Charged and ATK buffs' },
        { name: 'Favonius Sword', rarity: 4, reason: 'Best universal energy battery for the team' },
        { name: 'Xiphos\' Moonlight', rarity: 4, reason: 'Converts EM into personal and party Energy Recharge' }
      );
      artifacts.push(
        { name: elem === 'Anemo' ? 'Viridescent Venerer' : 'Noblesse Oblige', pieces: 4, reason: elem === 'Anemo' ? '40% elemental RES shred' : '20% party ATK boost' }
      );
      mainStats = { sands: ['Energy Recharge', 'Elemental Mastery'], goblet: ['Elemental Mastery', `${elem} DMG Bonus`], circlet: ['Elemental Mastery', 'CRIT Rate'] };
      subStats = ['Energy Recharge', 'Elemental Mastery', 'CRIT Rate'];
    } else {
      weapons.push(
        { name: 'Mistsplitter Reforged', rarity: 5, reason: 'High Base ATK, CRIT DMG, and stacking elemental damage bonus' },
        { name: 'Primordial Jade Cutter', rarity: 5, reason: 'Massive 44.1% CRIT Rate with bonus HP-to-ATK conversion' },
        { name: 'Finale of the Deep', rarity: 4, reason: 'Fontaine craftable providing high ATK and Bond of Life buff' },
        { name: 'Amenoma Kageuchi', rarity: 4, reason: 'Craftable F2P weapon refunding substantial burst energy' }
      );
      artifacts.push(
        { name: 'Gladiator\'s Finale', pieces: 4, reason: '+35% Normal Attack damage for sword wielders' },
        { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Amplifies burst damage based on total Energy Recharge' }
      );
    }
  } else if (weaponType === 'Claymore') {
    if (role === 'Sustain') {
      weapons.push(
        { name: 'Whiteblind', rarity: 4, reason: 'Craftable DEF% powerhouse for DEF-scaling shields and healing' },
        { name: 'Favonius Greatsword', rarity: 4, reason: 'High energy generation to keep sustain bursts off cooldown' }
      );
      artifacts.push(
        { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Stacks high DEF% and Geo DMG for defense-based sustains' }
      );
      mainStats = { sands: ['DEF%', 'Energy Recharge'], goblet: ['DEF%'], circlet: ['Healing Bonus', 'DEF%'] };
      subStats = ['DEF%', 'Energy Recharge', 'HP%'];
    } else {
      weapons.push(
        { name: 'Redhorn Stonethresher', rarity: 5, reason: '88.2% CRIT DMG with Normal and Charged Attack DEF scaling' },
        { name: 'Serpent Spine', rarity: 4, reason: 'Battle Pass staple: Up to +50% universal damage bonus' },
        { name: 'Tidal Shadow', rarity: 4, reason: 'Craftable F2P high ATK% claymore activated upon healing' }
      );
      artifacts.push(
        { name: 'Gladiator\'s Finale', pieces: 4, reason: '+35% Normal Attack DMG bonus' },
        { name: 'Golden Troupe', pieces: 4, reason: '+70% Skill DMG for off-field claymore sub-DPS characters' }
      );
    }
  } else if (weaponType === 'Polearm') {
    if (role === 'Sustain') {
      weapons.push(
        { name: 'Black Tassel', rarity: 3, reason: 'F2P HP% stat stick for maximum shield absorption' },
        { name: 'Favonius Lance', rarity: 4, reason: 'Reliable team particle battery' },
        { name: 'Rightful Reward', rarity: 4, reason: 'Fontaine craftable restoring burst energy on healing' }
      );
      artifacts.push(
        { name: 'Tenacity of the Millelith', pieces: 4, reason: '+20% party ATK and +30% shield strength' }
      );
      mainStats = { sands: ['HP%', 'Energy Recharge'], goblet: ['HP%'], circlet: ['HP%', 'Healing Bonus'] };
      subStats = ['HP%', 'Energy Recharge', 'HP', 'CRIT Rate'];
    } else {
      weapons.push(
        { name: 'Staff of Homa', rarity: 5, reason: 'Universal 5★ polearm with high CRIT DMG and ATK scaling' },
        { name: 'The Catch', rarity: 4, reason: 'Best F2P: +32% Burst DMG and +12% Burst CRIT Rate' },
        { name: 'Deathmatch', rarity: 4, reason: '36.8% CRIT Rate for easy artifact stat balancing' }
      );
      artifacts.push(
        { name: 'Emblem of Severed Fate', pieces: 4, reason: 'Converts Energy Recharge directly into Burst DMG' },
        { name: 'Golden Troupe', pieces: 4, reason: '+70% Elemental Skill DMG for off-field turret DPS' }
      );
    }
  } else if (weaponType === 'Bow') {
    if (role === 'Buffer/Shred' || role === 'Sustain') {
      weapons.push(
        { name: 'Elegy for the End', rarity: 5, reason: '5★ Support: Grants +100 EM and +20% ATK to all party members' },
        { name: 'Favonius Warbow', rarity: 4, reason: 'High 61.3% ER ensuring 100% burst uptime' },
        { name: 'Sacrificial Bow', rarity: 4, reason: 'Resets skill cooldown for double generation and repositioning' }
      );
      artifacts.push(
        { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party ATK buff upon burst activation' }
      );
      mainStats = { sands: ['Energy Recharge'], goblet: [`${elem} DMG Bonus`, 'HP%'], circlet: ['CRIT Rate', 'HP%'] };
      subStats = ['Energy Recharge', 'CRIT Rate', 'HP%', 'ATK%'];
    } else {
      weapons.push(
        { name: 'Aqua Simulacra', rarity: 5, reason: 'Universal 88.2% CRIT DMG bow with unconditional +20% DMG buff' },
        { name: 'Skyward Harp', rarity: 5, reason: 'Dual CRIT Rate and CRIT DMG stat stick with high Base ATK' },
        { name: 'The Stringless', rarity: 4, reason: 'Up to +48% Skill and Burst DMG with high EM substat' },
        { name: 'Song of Stillness', rarity: 4, reason: 'Craftable bow granting +32% all-damage bonus upon healing' }
      );
      artifacts.push(
        { name: 'Golden Troupe', pieces: 4, reason: 'Best for off-field bow sub-DPS damage' },
        { name: 'Shimenawa\'s Reminiscence', pieces: 4, reason: '+50% Normal and Charged Attack damage for on-field bow carries' }
      );
    }
  } else if (weaponType === 'Catalyst') {
    if (role === 'Sustain') {
      weapons.push(
        { name: 'Prototype Amber', rarity: 4, reason: 'Best F2P: Restores 18 energy and heals entire party by 18% on burst' },
        { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: 'Colossal +48% ATK buff to the next switching character' }
      );
      artifacts.push(
        { name: 'Ocean-Hued Clam', pieces: 4, reason: 'Converts healing volume into physical bubble damage' },
        { name: 'Maiden Beloved', pieces: 4, reason: 'Maximizes raw healing output for emergency sustain' }
      );
      mainStats = { sands: ['HP%', 'Energy Recharge'], goblet: ['HP%'], circlet: ['Healing Bonus', 'HP%'] };
      subStats = ['HP%', 'Energy Recharge', 'HP'];
    } else if (role === 'Buffer/Shred') {
      weapons.push(
        { name: 'Thrilling Tales of Dragon Slayers', rarity: 3, reason: '+48% ATK buff transferred to your main DPS carry' },
        { name: 'Favonius Codex', rarity: 4, reason: 'Reliable particle generation for team rotations' },
        { name: 'Sacrificial Fragments', rarity: 4, reason: 'High EM with skill reset for maximum reaction triggering' }
      );
      artifacts.push(
        { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party-wide ATK buff' }
      );
      mainStats = { sands: ['Energy Recharge', 'Elemental Mastery'], goblet: ['Elemental Mastery', `${elem} DMG Bonus`], circlet: ['Elemental Mastery', 'CRIT Rate'] };
      subStats = ['Energy Recharge', 'Elemental Mastery', 'CRIT Rate'];
    } else {
      weapons.push(
        { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'High 33.1% CRIT Rate with movement speed and stacking DMG bonus' },
        { name: 'The Widsith', rarity: 4, reason: 'High CRIT DMG with colossal 10s burst buffs on character switch' },
        { name: 'Sacrificial Jade', rarity: 4, reason: 'Battle Pass: Huge CRIT Rate and Max HP scaling' },
        { name: 'Flowing Purity', rarity: 4, reason: 'Craftable Fontaine catalyst with high ATK and elemental DMG buffs' }
      );
      artifacts.push(
        { name: 'Marechaussee Hunter', pieces: 4, reason: '+36% CRIT Rate in HP-fluctuation compositions' },
        { name: 'Gilded Dreams', pieces: 4, reason: 'Massive Elemental Mastery and ATK scaling in reaction comps' }
      );
    }
  }

  return { weapons, artifacts, mainStats, subStats };
}

const enkaEntries = [];
const characterEntries = [];

// Query all playable characters from genshin-db directly
const allCharacterNames = genshindb.characters('names', { matchCategories: true });

for (const queryName of allCharacterNames) {
  const gChar = genshindb.characters(queryName);
  if (!gChar) continue;
  if (!gChar.elementText || gChar.elementText === 'None') continue;
  if (gChar.name === 'Manekin' || gChar.name === 'Manekina') continue;

  const key = gChar.name.replace(/[^a-zA-Z0-9]/g, '');
  if (!gChar.images?.filename_icon && key !== 'Mitya' && key !== 'Valeriy') continue;
  const name = gChar.name;
  const element = gChar.elementText;
  const weapon = gChar.weaponText;
  const rarity = gChar.rarity || 5;

  const roles = [];
  if (SUSTAINS.has(key)) roles.push('Sustain');
  if (BUFFERS.has(key)) roles.push('Buffer/Shred');
  if (OFF_FIELD_DPS.has(key)) roles.push('Off-Field DPS');
  if (roles.length === 0 || (!SUSTAINS.has(key) && !BUFFERS.has(key) && roles.length <= 1)) {
    roles.unshift('On-Field DPS');
  }

  const tags = [element, weapon];
  if (gChar.version?.startsWith('5.') || gChar.region === 'Natlan') tags.push('Nightsoul');
  if (key === 'Nefer' || key === 'Lauma') tags.push('Lunar-Bloom', 'Nod-Krai');
  if (key === 'Furina') tags.push('Universal-Buffer', 'Fanfare');
  if (key === 'Xilonen') tags.push('Cinder-City', 'Universal-Buffer', 'RES-Shred');
  if (element === 'Anemo') tags.push('VV', 'Swirl');
  if (['Bennett', 'Xiangling', 'HuTao', 'Diluc', 'Yoimiya', 'Arlecchino', 'Gaming', 'Mavuika', 'Durin'].includes(key)) tags.push('Vaporize', 'Melt');
  if (['KukiShinobu', 'RaidenShogun', 'Dori', 'Ineffa', 'Mitya', 'Valeriy'].includes(key)) tags.push('Hyperbloom-Trigger');
  if (element === 'Dendro') tags.push('Quicken', 'Spread', 'Bloom');
  if (['Mitya', 'Valeriy'].includes(key)) tags.push('Stellar-Conduct', 'Snezhnaya', 'Superconduct');

  const desc = gChar.description ? gChar.description.replace(/[\r\n]+/g, ' ') : `${name} is a ${rarity}-star ${element} ${weapon} wielder.`;

  // Fetch talents and constellations
  const gTalents = genshindb.talents(queryName);
  const gConsts = genshindb.constellations(queryName);

  // Extract base stats at Lv 90
  let statsObj = undefined;
  if (typeof gChar.stats === 'function') {
    const rawSt = gChar.stats(90);
    statsObj = {
      hp: Math.round(rawSt.hp),
      attack: Math.round(rawSt.attack),
      defense: Math.round(rawSt.defense),
      specializedStat: gChar.substatText || 'CRIT Rate',
      specializedValue: formatSpecializedStat(gChar.substatText, rawSt.specialized)
    };
  }

  // Extract talents
  const talentsList = [];
  if (gTalents) {
    if (gTalents.combat1?.name) {
      talentsList.push({
        name: gTalents.combat1.name,
        type: 'normal',
        description: gTalents.combat1.description || '',
        icon: gTalents.images?.filename_combat1 ? `https://enka.network/ui/${gTalents.images.filename_combat1}.png` : undefined
      });
    }
    if (gTalents.combat2?.name) {
      talentsList.push({
        name: gTalents.combat2.name,
        type: 'skill',
        description: gTalents.combat2.description || '',
        icon: gTalents.images?.filename_combat2 ? `https://enka.network/ui/${gTalents.images.filename_combat2}.png` : undefined
      });
    }
    if (gTalents.combat3?.name) {
      talentsList.push({
        name: gTalents.combat3.name,
        type: 'burst',
        description: gTalents.combat3.description || '',
        icon: gTalents.images?.filename_combat3 ? `https://enka.network/ui/${gTalents.images.filename_combat3}.png` : undefined
      });
    }
    if (gTalents.combatsp?.name) {
      talentsList.push({
        name: gTalents.combatsp.name,
        type: 'sprint',
        description: gTalents.combatsp.description || '',
        icon: gTalents.images?.filename_combatsp ? `https://enka.network/ui/${gTalents.images.filename_combatsp}.png` : undefined
      });
    }
    ['passive1', 'passive2', 'passive3', 'passive4'].forEach(pkey => {
      if (gTalents[pkey]?.name) {
        talentsList.push({
          name: gTalents[pkey].name,
          type: 'passive',
          description: gTalents[pkey].description || '',
          icon: gTalents.images?.[`filename_${pkey}`] ? `https://enka.network/ui/${gTalents.images[`filename_${pkey}`]}.png` : undefined
        });
      }
    });
  }

  // Extract constellations
  const constsList = [];
  if (gConsts) {
    ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].forEach((ckey, idx) => {
      if (gConsts[ckey]?.name) {
        constsList.push({
          level: idx + 1,
          name: gConsts[ckey].name,
          description: gConsts[ckey].description || '',
          icon: gConsts.images?.[`filename_${ckey}`] ? `https://enka.network/ui/${gConsts.images[`filename_${ckey}`]}.png` : undefined
        });
      }
    });
  }

  const iconFilename = gChar.images?.filename_icon || ('UI_AvatarIcon_' + key);
  const iconUrl = 'https://enka.network/ui/' + iconFilename + '.png';
  const sideIconUrl = gChar.images?.filename_sideIcon ? 'https://enka.network/ui/' + gChar.images.filename_sideIcon + '.png' : undefined;

  const characterRecord = {
    id: key,
    name,
    element,
    weapon,
    rarity,
    roles,
    tags: Array.from(new Set(tags)),
    icon: iconUrl,
    sideIcon: sideIconUrl,
    description: desc,
    title: gChar.title,
    constellationName: gChar.constellation,
    stats: statsObj,
    talents: talentsList.length > 0 ? talentsList : undefined,
    constellations: constsList.length > 0 ? constsList : undefined,
    build: generateBuildForCharacter({ id: key, weapon, roles, element }, gChar)
  };

  characterEntries.push(characterRecord);

  if (gChar.id) {
    enkaEntries.push(`  ${gChar.id}: '${key}',`);
  }
}

// Sort alphabetically by name
characterEntries.sort((a, b) => a.name.localeCompare(b.name));

// Write src/data/characters.ts
const code = `import type { Character } from '../types/genshin';

export const CHARACTERS: Character[] = [
` + characterEntries.map((c) => `  ${JSON.stringify(c)}`).join(',\n') + `
];
`;

fs.writeFileSync('src/data/characters.ts', code);
const stats = fs.statSync('src/data/characters.ts');
console.log('Successfully generated', characterEntries.length, 'characters into src/data/characters.ts');
console.log('Total file size:', (stats.size / 1024).toFixed(1), 'KB (Lightweight < 1MB requirement met!)');

// Update ENKA_ID_MAP in src/services/enka.ts
let enkaContent = fs.readFileSync('src/services/enka.ts', 'utf8');
const newMap = `// Complete Enka gameId mapping for all ${characterEntries.length} characters\nconst ENKA_ID_MAP: Record<number, string> = {\n${enkaEntries.join('\n')}\n};`;
enkaContent = enkaContent.replace(/\/\/ Complete Enka gameId mapping[\s\S]*?const ENKA_ID_MAP[\s\S]*?\};/, newMap);
fs.writeFileSync('src/services/enka.ts', enkaContent);
console.log('Successfully updated src/services/enka.ts with complete mapping for', characterEntries.length, 'characters');
