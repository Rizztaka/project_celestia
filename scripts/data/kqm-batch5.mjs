// KeqingMains (KQM) Authoritative Builds - Batch 5: Geo Construct, Defense & Plunge Archetypes
export const KQM_BATCH_5 = {
  Navia: {
    weapons: [
      { name: 'Verdict', rarity: 5, reason: 'Signature BiS: 22.1% CRIT Rate, +20% ATK, and stacks up to +36% Elemental Skill DMG from Crystallize shards' },
      { name: 'The Unforged', rarity: 5, reason: 'High ATK% Claymore doubling its damage buffs when shielded by Crystallize' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: Universal +50% damage bonus elevating massive gunbrella blasts' },
      { name: "Ultimate Overlord's Mega Magic Sword", rarity: 4, reason: 'Top F2P Event BiS: High ER with up to +48% ATK based on helped Melusines' },
      { name: 'Tidal Shadow', rarity: 4, reason: 'Fontaine Craftable: Consistent +48% ATK buff easily triggered upon receiving any healing' }
    ],
    artifacts: [
      { name: 'Nighttime Whispers in the Echoing Woods', pieces: 4, reason: 'Signature Best in Slot: +18% ATK and colossal +50% Geo DMG while protected by Crystallize shields' },
      { name: 'Golden Troupe', pieces: 4, reason: 'Quickswap Nuker BiS: Up to +70% massive Elemental Skill DMG for instant burst gunbrella shots' },
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Best with Furina: Permanent +36% CRIT Rate from party HP fluctuations' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Geo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~120-130%)']
  },
  Chiori: {
    weapons: [
      { name: 'Uraku Misugiri', rarity: 5, reason: 'Signature BiS: 88.2% CRIT DMG, +20% DEF, and +48% Skill DMG on triggering Geo damage/constructs' },
      { name: 'Cinnabar Spindle', rarity: 4, reason: 'Legendary Event BiS: 69% DEF substat directly converting DEF into massive Sode doll damage' },
      { name: 'Harbinger of Dawn', rarity: 3, reason: 'Top F2P 3★ BiS: 46.9% CRIT DMG and permanent +28% CRIT Rate safely maintained off-field' },
      { name: 'Primordial Jade Cutter', rarity: 5, reason: '44.1% CRIT Rate with bonus ATK scaling from base HP' },
      { name: 'Wolf-Fang', rarity: 4, reason: 'Battle Pass Pick: High CRIT Rate with stacking Elemental Skill damage and CRIT Rate' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Undisputed Best in Slot: Colossal +70% off-field Elemental Skill DMG for continuous twin Sode slashes' },
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Dual Scaling BiS: Stacks up to +54% DEF and +24% Geo DMG across all abilities' }
    ],
    mainStats: {
      sands: ['DEF%'],
      goblet: ['Geo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'DEF%', 'ATK%', 'Energy Recharge (~110-120%)']
  },
  AratakiItto: {
    weapons: [
      { name: 'Redhorn Stonethresher', rarity: 5, reason: 'Signature BiS: 88.2% CRIT DMG, +28% DEF, and converts 40% DEF directly into Normal/Charged Attack damage' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: 27.6% CRIT Rate with up to +50% universal damage bonus' },
      { name: 'Whiteblind', rarity: 4, reason: 'Best F2P Craftable: Stacks up to +48% DEF and ATK% on consecutive hits' }
    ],
    artifacts: [
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Undisputed Best in Slot: Stacks up to +54% DEF and +24% Geo DMG throughout battle' },
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Best with Furina: Permanent +36% CRIT Rate from HP fluctuations' }
    ],
    mainStats: {
      sands: ['DEF%'],
      goblet: ['Geo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'DEF%', 'Energy Recharge (~130-140% with Gorou)']
  },
  Albedo: {
    weapons: [
      { name: 'Cinnabar Spindle', rarity: 4, reason: 'Undisputed Signature Event BiS: High DEF% converting DEF directly into massive Solar Isotoma damage' },
      { name: 'Uraku Misugiri', rarity: 5, reason: '88.2% CRIT DMG with DEF% buffs and +48% Elemental Skill damage bonus' },
      { name: 'Harbinger of Dawn', rarity: 3, reason: 'Top F2P 3★: 46.9% CRIT DMG and +28% CRIT Rate safely maintained 100% off-field' }
    ],
    artifacts: [
      { name: 'Golden Troupe', pieces: 4, reason: 'Best in Slot: Colossal +70% off-field Elemental Skill DMG for Transient Blossom procs' },
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Classic BiS: Stacks up to +54% DEF and +24% Geo DMG' }
    ],
    mainStats: {
      sands: ['DEF%'],
      goblet: ['Geo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'DEF%', 'ATK%']
  },
  Gorou: {
    weapons: [
      { name: 'Favonius Warbow', rarity: 4, reason: 'Undisputed BiS: 61.3% ER generating neutral particles to battery Itto/Noelle' },
      { name: 'Elegy for the End', rarity: 5, reason: 'High ER providing team ATK buffs and EM support' },
      { name: 'Sacrificial Bow', rarity: 4, reason: 'Skill Reset: Double banner repositioning for emergency particle generation' }
    ],
    artifacts: [
      { name: 'The Exile', pieces: 4, reason: 'Undisputed Team Battery BiS: Restores flat energy to all party members on burst cast' },
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Maximizes personal DEF% for C4 healing and burst damage' },
      { name: 'Noblesse Oblige', pieces: 4, reason: '+20% party ATK buff upon burst activation' }
    ],
    mainStats: {
      sands: ['Energy Recharge'],
      goblet: ['DEF%'],
      circlet: ['CRIT Rate', 'DEF%']
    },
    subStats: ['Energy Recharge (to ~200-240%)', 'CRIT Rate (for Favonius Warbow)', 'DEF%', 'HP']
  },
  YunJin: {
    weapons: [
      { name: 'Favonius Lance', rarity: 4, reason: 'Undisputed BiS: High ER generating neutral energy particles to fuel burst on cooldown' },
      { name: 'Rightful Reward', rarity: 4, reason: 'Craftable Fontaine Polearm: Restores burst energy upon receiving healing' },
      { name: 'Prototype Starglitter', rarity: 4, reason: 'F2P Craftable ER stat stick for rotation consistency' }
    ],
    artifacts: [
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Undisputed Best in Slot: Stacks maximum DEF% to scale Flying Cloud Flag normal attack buff' },
      { name: 'The Exile', pieces: 4, reason: 'Team Energy Engine: Restores flat energy to teammates upon burst cast' }
    ],
    mainStats: {
      sands: ['DEF%', 'Energy Recharge'],
      goblet: ['DEF%'],
      circlet: ['DEF%', 'CRIT Rate']
    },
    subStats: ['Energy Recharge (to ~200-240%)', 'DEF%', 'CRIT Rate (for Favonius Lance)', 'Flat DEF']
  },
  Noelle: {
    weapons: [
      { name: 'Redhorn Stonethresher', rarity: 5, reason: 'Top 5★ BiS: 88.2% CRIT DMG, DEF bonus, and huge flat damage scaling on Sweeping Time swings' },
      { name: 'Serpent Spine', rarity: 4, reason: 'Premier 4★ BiS: 27.6% CRIT Rate with up to +50% universal damage bonus' },
      { name: 'Whiteblind', rarity: 4, reason: 'Best F2P Craftable: Stacks high DEF% and ATK% on consecutive normal attacks' },
      { name: 'Favonius Greatsword', rarity: 4, reason: 'Battery Driver: Solves self-energy generation and fuels off-field sub-DPS' }
    ],
    artifacts: [
      { name: 'Marechaussee Hunter', pieces: 4, reason: 'Best in Slot with Furina: Permanent +36% CRIT Rate maintained via team healing/drain' },
      { name: 'Husk of Opulent Dreams', pieces: 4, reason: 'Classic BiS: Stacks up to +54% DEF and +24% Geo DMG' },
      { name: "Gladiator's Finale", pieces: 4, reason: 'Accessible Classic: Permanent +35% Normal Attack damage' }
    ],
    mainStats: {
      sands: ['DEF%'],
      goblet: ['Geo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'DEF%', 'Energy Recharge (~130-150% with battery)']
  },
  Ningguang: {
    weapons: [
      { name: 'Lost Prayer to the Sacred Winds', rarity: 5, reason: 'High 33.1% CRIT Rate with on-field movement speed and stacking Geo DMG bonus' },
      { name: 'Memory of Dust', rarity: 5, reason: 'Massive ATK% scaling doubled when protected by Crystallize shields' },
      { name: 'The Widsith', rarity: 4, reason: 'Premier 4★ Nuke: High CRIT DMG with massive 10s burst damage multipliers' },
      { name: 'Solar Pearl', rarity: 4, reason: 'Battle Pass Pick: Normal attacks buff skill/burst, and skill/burst buffs normal attacks' },
      { name: 'Flowing Purity', rarity: 4, reason: 'Craftable Fontaine Catalyst: High base ATK and all-elemental damage bonus' }
    ],
    artifacts: [
      { name: 'Nighttime Whispers in the Echoing Woods', pieces: 4, reason: 'Best in Slot: +18% ATK and +50% Geo DMG while protected by Crystallize shields' },
      { name: 'Archaic Petra', pieces: 2, reason: '+15% Geo DMG combined with 2pc ATK (+18% ATK) for consistent jade burst damage' }
    ],
    mainStats: {
      sands: ['ATK%'],
      goblet: ['Geo DMG Bonus'],
      circlet: ['CRIT Rate', 'CRIT DMG']
    },
    subStats: ['CRIT Rate', 'CRIT DMG', 'ATK%', 'Energy Recharge (~120%)']
  }
};
