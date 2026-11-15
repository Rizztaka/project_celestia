import type { WeaponData, WeaponType } from '../types/genshin';

export function normalizeWeaponKey(nameOrKey: string): string {
  if (!nameOrKey) return '';
  return nameOrKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export const WEAPONS_DATA: WeaponData[] = [
  {
    "key": "Absolution",
    "name": "Absolution",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critDMG_",
    "subStatValue": "44.1%",
    "passiveName": "Deathly Pact",
    "passiveDesc": "CRIT DMG increased by 20%. Increasing the value of a Bond of Life increases the DMG the equipping character deals by 16% for 6s. Max 3 stacks.",
    "tags": [
      "crit"
    ]
  },
  {
    "key": "Akuoumaru",
    "name": "Akuoumaru",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Watatsumi Wavewalker",
    "passiveDesc": "For every point of the entire party's combined maximum Energy capacity, the Elemental Burst DMG of the character equipping this weapon is increased by 0.12%. A maximum of 40% increased Elemental Burst DMG can be achieved this way.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "burst-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Maria.png"
  },
  {
    "key": "AlleyHunter",
    "name": "Alley Hunter",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Oppidan Ambush",
    "passiveDesc": "While the character equipped with this weapon is in the party but not on the field, their DMG increases by 2% every second up to a max of 20%. When the character is on the field for more than 4s, the aforementioned DMG buff decreases by 4% per second until it reaches 0%.",
    "tags": [
      "em",
      "team-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Outlaw.png"
  },
  {
    "key": "AmenomaKageuchi",
    "name": "Amenoma Kageuchi",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "atk_",
    "subStatValue": "55.1%",
    "passiveName": "Iwakura Succession",
    "passiveDesc": "After casting an Elemental Skill, gain 1 Succession Seed. This effect can be triggered once every 5s. The Succession Seed lasts for 30s. Up to 3 Succession Seeds may exist simultaneously. After using an Elemental Burst, all Succession Seeds are consumed and after 2s, the character regenerates 6 Energy for each seed consumed.",
    "tags": [
      "energy",
      "em",
      "burst-buff",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Bakufu.png"
  },
  {
    "key": "AmosBow",
    "name": "Amos' Bow",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "atk_",
    "subStatValue": "49.6%",
    "passiveName": "Strong-Willed",
    "passiveDesc": "Increases Normal and Charged Attack DMG by 12%. After a Normal or Charged Attack is fired, DMG dealt increases by a further 8% every 0.1s the arrow is in the air for up to 5 times.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Amos.png"
  },
  {
    "key": "AngelosHeptades",
    "name": "Angelos' Heptades",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 741,
    "subStatType": "atk_",
    "subStatValue": "16.5%",
    "passiveName": "Crown of the Final Scion",
    "passiveDesc": "ATK is increased by 12%. After the equipping character creates a Shield, they gain \"Pathfinder's Light\" for 20s: Increases your active party member's DMG by 10% for every 1,000 ATK the equipping character has, up to a maximum of 26%. Additionally, when the equipping character creates a Shield, they will also gain \"Guide's Contentment\": Restores 14 Elemental Energy to the equipping character. The aforementioned effect can trigger once every 14s, and can also be triggered when any type of chest is opened outside of combat. The equipping character may trigger this effect even when they are an off-field.\nHexerei: Secret Rite: When your own Hexerei character is off-field in the party, they will also gain 50% of the DMG increase from Pathfinder's Light.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "atk"
    ]
  },
  {
    "key": "AquaSimulacra",
    "name": "Aqua Simulacra",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "The Cleansing Form",
    "passiveDesc": "HP is increased by 16%. When there are opponents nearby, the DMG dealt by the wielder of this weapon is increased by 20%. This will take effect whether the character is on-field or not.",
    "tags": [
      "crit",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Kirin.png"
  },
  {
    "key": "AquilaFavonia",
    "name": "Aquila Favonia",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "physical_dmg_",
    "subStatValue": "41.3%",
    "passiveName": "Falcon's Defiance",
    "passiveDesc": "ATK is increased by 20%. Triggers on taking DMG: the soul of the Falcon of the West awakens, holding the banner of resistance aloft, regenerating HP equal to 100% of ATK and dealing 200% of ATK as DMG to surrounding opponents. This effect can only occur once every 15s.",
    "tags": [
      "hp",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Falcon.png"
  },
  {
    "key": "AshGravenDrinkingHorn",
    "name": "Ash-Graven Drinking Horn",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "hp_",
    "subStatValue": "41.3%",
    "passiveName": "Tupac's Grip",
    "passiveDesc": "When an attack hits an opponent, deal AoE DMG equal to 40% of Max HP at the target location. This effect can be triggered once every 15s.",
    "tags": [
      "hp"
    ]
  },
  {
    "key": "AstralVultureSCrimsonPlumage",
    "name": "Astral Vulture's Crimson Plumage",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critDMG_",
    "subStatValue": "66.2%",
    "passiveName": "The Moonring Sighted",
    "passiveDesc": "For 12s after triggering a Swirl or Stellar Swirl reaction, ATK increases by 24%. In addition, when 1/2 or more characters in the party are of a different Elemental Type from the equipping character, the DMG dealt by the equipping character's Charged Attacks is increased by 20%/48%, and Elemental Burst DMG dealt is increased by 10%/24%.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "burst-buff",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "ATeaspoonOfTranscendence",
    "name": "A Teaspoon of Transcendence",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critDMG_",
    "subStatValue": "44.1%",
    "passiveName": "White Fairy's Queening",
    "passiveDesc": "ATK is increased by 28%.\nAdditionally, each time the equipping character hits an opponent with their Charged Attack, they attain \"Transcendence\" for a short time: their Stellar-Conduct and Stellar Swirl reaction DMG is increased by 16% for 5s. This effect can stack once every 0.2s, max 3 stacks.",
    "tags": [
      "crit",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "AthameArtis",
    "name": "Athame Artis",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Day King's Splendor Solis",
    "passiveDesc": "CRIT DMG from Elemental Bursts is increased by 16%. When an Elemental Burst hits an opponent, gain the Blade of the Daylight Hours effect: ATK is increased by 20%. Nearby active party members other than the equipping character have their ATK increased by 16% for 3s.\nAdditionally, when the party possesses Hexerei: Secret Rite effects, the effects of Blade of the Daylight Hours are increased by an additional 75%. This effect can be triggered even if the equipping character is off-field.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "burst-buff",
      "atk"
    ]
  },
  {
    "key": "AThousandBlazingSuns",
    "name": "A Thousand Blazing Suns",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 741,
    "subStatType": "critRate_",
    "subStatValue": "11.0%",
    "passiveName": "Sunset Reignites the Dawn",
    "passiveDesc": "Gain the \"Scorching Brilliance\" effect when using an Elemental Skill or Burst: CRIT DMG increased by 20% and ATK increased by 28% for 6s. This effect can trigger once every 10s.\nWhile a \"Scorching Brilliance\" instance is active, its duration is increased by 2s after Normal or Charged attacks deal Elemental DMG. This effect can trigger once every second, and the max duration increase is 6s.\nAdditionally, when the equipping character is in the Nightsoul's Blessing state, \"Scorching Brilliance\" effects are increased by 75%, and its duration will not count down when the equipping character is off-field.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "AThousandFloatingDreams",
    "name": "A Thousand Floating Dreams",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "eleMas",
    "subStatValue": "265",
    "passiveName": "A Thousand Nights' Dawnsong",
    "passiveDesc": "Party members other than the equipping character will provide the equipping character with buffs based on whether their Elemental Type is the same as the latter or not. If their Elemental Types are the same, increase Elemental Mastery by 32. If not, increase the equipping character's DMG Bonus from their Elemental Type by 10%. Each of the aforementioned effects can have up to 3 stacks. Additionally, all nearby party members other than the equipping character will have their Elemental Mastery increased by 40. Multiple such effects from multiple such weapons can stack.",
    "tags": [
      "em",
      "team-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Ayus.png"
  },
  {
    "key": "Azurelight",
    "name": "Azurelight",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Whitehill's Bestowal",
    "passiveDesc": "Within 12s after an Elemental Skill is used, ATK is increased by 24%. During this time, when the equipping character has 0 Energy, ATK will be further increased by 24%, and CRIT DMG will be increased by 40%.",
    "tags": [
      "crit",
      "energy",
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "BalladOfTheBoundlessBlue",
    "name": "Ballad of the Boundless Blue",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Azure Skies",
    "passiveDesc": "Within 6s after Normal or Charged Attacks hit an opponent, Normal Attack DMG will be increased by 8% and Charged Attack DMG will be increased by 6%. Max 3 stacks. This effect can be triggered once every 0.3s.",
    "tags": [
      "energy",
      "normal-buff"
    ]
  },
  {
    "key": "BalladOfTheFjords",
    "name": "Ballad of the Fjords",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Tales of the Tundra",
    "passiveDesc": "When there are at least 3 different Elemental Types in your party, Elemental Mastery will be increased by 120.",
    "tags": [
      "crit",
      "em",
      "team-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Shanty.png"
  },
  {
    "key": "BeaconOfTheReedSea",
    "name": "Beacon of the Reed Sea",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Desert Watch",
    "passiveDesc": "After the character's Elemental Skill hits an opponent, their ATK will be increased by 20% for 8s. After the character takes DMG, their ATK will be increased by 20% for 8s. The 2 aforementioned effects can be triggered even when the character is not on the field. Additionally, when not protected by a shield, the character's Max HP will be increased by 32%.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Deshret.png"
  },
  {
    "key": "BeyondTheChrysalis",
    "name": "Beyond the Chrysalis",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critDMG_",
    "subStatValue": "44.1%",
    "passiveName": "Dance of Wings Unbound",
    "passiveDesc": "Each time the equipping character uses their Elemental Skill or Elemental Burst, they gain one of the following three effects in sequence:\nWinds of Devotion: Increases the equipping character's CRIT DMG by 56% for 10s;\nWinds of Defiance: Increases Stellar Swirl reaction DMG dealt by the equipping character by 36% for 10s; and\nWinds of Plenty: Regenerates 5 Elemental Energy for the equipping character. Up to 5 Elemental Energy can be regenerated in this way every 4s.\nThe aforementioned effects are removed and the sequence is reset when the equipping character leaves the field.",
    "tags": [
      "crit",
      "energy",
      "em",
      "burst-buff",
      "skill-buff",
      "def"
    ]
  },
  {
    "key": "BlackcliffAgate",
    "name": "Blackcliff Agate",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critDMG_",
    "subStatValue": "55.1%",
    "passiveName": "Press the Advantage",
    "passiveDesc": "After defeating an enemy, ATK is increased by 12% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others.",
    "tags": [
      "crit",
      "em",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Blackrock.png"
  },
  {
    "key": "BlackcliffLongsword",
    "name": "Blackcliff Longsword",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "critDMG_",
    "subStatValue": "36.8%",
    "passiveName": "Press the Advantage",
    "passiveDesc": "After defeating an opponent, ATK is increased by 12% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others.",
    "tags": [
      "crit",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Blackrock.png"
  },
  {
    "key": "BlackcliffPole",
    "name": "Blackcliff Pole",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critDMG_",
    "subStatValue": "55.1%",
    "passiveName": "Press the Advantage",
    "passiveDesc": "After defeating an enemy, ATK is increased by 12% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others.",
    "tags": [
      "crit",
      "em",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Blackrock.png"
  },
  {
    "key": "BlackcliffSlasher",
    "name": "Blackcliff Slasher",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critDMG_",
    "subStatValue": "55.1%",
    "passiveName": "Press the Advantage",
    "passiveDesc": "After defeating an opponent, ATK is increased by 12% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others.",
    "tags": [
      "crit",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Blackrock.png"
  },
  {
    "key": "BlackcliffWarbow",
    "name": "Blackcliff Warbow",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "critDMG_",
    "subStatValue": "36.8%",
    "passiveName": "Press the Advantage",
    "passiveDesc": "After defeating an enemy, ATK is increased by 12% for 30s. This effect has a maximum of 3 stacks, and the duration of each stack is independent of the others.",
    "tags": [
      "crit",
      "em",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Blackrock.png"
  },
  {
    "key": "BlackmarrowLantern",
    "name": "Blackmarrow Lantern",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "eleMas",
    "subStatValue": "221",
    "passiveName": "Token of Covenant",
    "passiveDesc": "Bloom DMG is increased by 48%, and Lunar-Bloom DMG is increased by 12%. Moonsign: Ascendant Gleam: Lunar-Bloom DMG is increased by an additional 12%.",
    "tags": [
      "em"
    ]
  },
  {
    "key": "BlackTassel",
    "name": "Black Tassel",
    "weaponType": "Polearm",
    "rarity": 3,
    "baseAtk": 354,
    "subStatType": "hp_",
    "subStatValue": "46.9%",
    "passiveName": "Bane of the Soft",
    "passiveDesc": "Increases DMG against slimes by 40%.",
    "tags": [
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Noire.png"
  },
  {
    "key": "BladeOfAtonement",
    "name": "Blade of Atonement",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Repentance and Redemption",
    "passiveDesc": "Triggering an Elemental Reaction increases the equipping character's Elemental Mastery by 64 for 12s, while triggering a Stellar Glimmer reaction increases their ATK by 16% for 12s. The aforementioned effects can trigger even when the character is not on the field.",
    "tags": [
      "em",
      "atk"
    ]
  },
  {
    "key": "BloodsoakedRuins",
    "name": "Bloodsoaked Ruins",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Mournful Tribute",
    "passiveDesc": "For 3.5s after using an Elemental Burst, the equipping character's Lunar-Charged DMG dealt to opponents is increased by 36%. Additionally, after triggering a Lunar-Charged reaction, the equipping character will gain Requiem of Ruin: CRIT DMG is increased by 28% for 6s. They will also regain 12 Elemental Energy. Elemental Energy can be restored this way once every 14s.",
    "tags": [
      "crit",
      "energy",
      "em",
      "burst-buff"
    ]
  },
  {
    "key": "BloodtaintedGreatsword",
    "name": "Bloodtainted Greatsword",
    "weaponType": "Claymore",
    "rarity": 3,
    "baseAtk": 354,
    "subStatType": "eleMas",
    "subStatValue": "187",
    "passiveName": "Bane of Fire and Thunder",
    "passiveDesc": "Increases DMG dealt against opponents affected by Pyro or Electro by 12%.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Siegfry.png"
  },
  {
    "key": "BreezeborneRefrain",
    "name": "Breezeborne Refrain",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Viper's Ballad",
    "passiveDesc": "Increases Energy Recharge by 20%. When the equipping character hits the opponent with their Elemental Skill or Elemental Burst, they gain a stack of \"Hymn of the Pure.\" This effect can trigger once every 0.03s, max 3 stacks, and at 3 stacks, all instances of \"Hymn of the Pure\" are cleared to give the equipping character \"Thus Lied the Viper\" instead. This grants nearby party members a 24% Stellar Glimmer reaction DMG boost for 12s, during which no stacks of \"Hymn of the Pure\" can be obtained. The aforementioned effects can still trigger even when the equipping character is not on the field.",
    "tags": [
      "crit",
      "energy",
      "em",
      "team-buff",
      "burst-buff",
      "skill-buff"
    ]
  },
  {
    "key": "CalamityOfEshu",
    "name": "Calamity of Eshu",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Diffusing Boundary",
    "passiveDesc": "While characters are protected by a Shield, DMG dealt by Normal and Charged Attacks is increased by 20%, and Normal and Charged Attack CRIT Rate is increased by 8%.",
    "tags": [
      "crit",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "CalamityQueller",
    "name": "Calamity Queller",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 741,
    "subStatType": "atk_",
    "subStatValue": "16.5%",
    "passiveName": "Extinguishing Precept",
    "passiveDesc": "Gain 12% All Elemental DMG Bonus. Obtain Consummation for 20s after using an Elemental Skill, causing ATK to increase by 3.2% per second. This ATK increase has a maximum of 6 stacks. When the character equipped with this weapon is not on the field, Consummation's ATK increase is doubled.",
    "tags": [
      "em",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Santika.png"
  },
  {
    "key": "CashflowSupervision",
    "name": "Cashflow Supervision",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Golden Blood-Tide",
    "passiveDesc": "ATK is increased by 16%. When current HP increases or decreases, Normal Attack DMG is increased by 16%, Charged Attack DMG is increased by 14%, and Stellar-Conduct DMG is increased by 14% for 4s. Max 3 stacks. This effect can be triggered once every 0.3s. When the wielder has 3 stacks, ATK SPD will be increased by 8%.",
    "tags": [
      "crit",
      "normal-buff",
      "hp",
      "atk"
    ]
  },
  {
    "key": "ChainBreaker",
    "name": "Chain Breaker",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Flower-Feather Song",
    "passiveDesc": "For every party member from Natlan or who has a different Elemental Type from the equipping character, the equipping character gains 4.8% increased ATK. When there are no less than 3 of the aforementioned characters, the equipping character gains 24 Elemental Mastery.",
    "tags": [
      "em",
      "team-buff",
      "atk"
    ]
  },
  {
    "key": "CinnabarSpindle",
    "name": "Cinnabar Spindle",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "def_",
    "subStatValue": "69.0%",
    "passiveName": "Spotless Heart",
    "passiveDesc": "Elemental Skill DMG is increased by 40% of DEF. The effect will be triggered no more than once every 1.5s and will be cleared 0.1s after the Elemental Skill deals DMG.",
    "tags": [
      "em",
      "skill-buff",
      "def"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Opus.png"
  },
  {
    "key": "ClashOfKings",
    "name": "Clash of Kings",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Without Heed for Day nor Night",
    "passiveDesc": "Using an Elemental Skill grants the equipping character \"Laws of the Board,\" which increases their ATK by 20% and their Elemental Mastery by 100. This effect lasts 6s and can trigger once every 12s. Does not stack. The duration of this effect will also be extended by 6s if the equipping character hits an opponent with a Charged Attack while it is active. The effect can be extended for max 6s in this way.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "Cloudforged",
    "name": "Cloudforged",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Crag-Chiseled Forge",
    "passiveDesc": "After Elemental Energy is decreased, the equipping character's Elemental Mastery will increase by 40 for 18s. Max 2 stacks.",
    "tags": [
      "energy",
      "em"
    ]
  },
  {
    "key": "CompoundBow",
    "name": "Compound Bow",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "physical_dmg_",
    "subStatValue": "69.0%",
    "passiveName": "Infusion Arrow",
    "passiveDesc": "Normal Attack and Charged Attack hits increase ATK by 4% and Normal ATK SPD by 1.2% for 6s. Max 4 stacks. Can only occur once every 0.3s.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Exotic.png"
  },
  {
    "key": "CoolSteel",
    "name": "Cool Steel",
    "weaponType": "Sword",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "atk_",
    "subStatValue": "35.2%",
    "passiveName": "Bane of Water and Ice",
    "passiveDesc": "Increases DMG against opponents affected by Hydro or Cryo by 12%.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Steel.png"
  },
  {
    "key": "CovenantOfFrostAndSnow",
    "name": "Covenant of Frost and Snow",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "def_",
    "subStatValue": "51.7%",
    "passiveName": "The Law's Equilibrium",
    "passiveDesc": "For 12s after the equipping character uses an Elemental Skill, their Elemental Mastery is increased by 120.",
    "tags": [
      "em",
      "skill-buff",
      "def"
    ]
  },
  {
    "key": "CraneSEchoingCall",
    "name": "Crane's Echoing Call",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 741,
    "subStatType": "atk_",
    "subStatValue": "16.5%",
    "passiveName": "Cloudfall Axiom",
    "passiveDesc": "After the equipping character hits an opponent with a Plunging Attack, all nearby party members' Plunging Attacks will deal 28% increased DMG for 20s. When nearby party members hit opponents with Plunging Attacks, they will restore 2.5 Energy to the equipping character. Energy can be restored this way every 0.7s. This energy regain effect can be triggered even if the equipping character is not on the field.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "atk"
    ]
  },
  {
    "key": "CrescentPike",
    "name": "Crescent Pike",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "physical_dmg_",
    "subStatValue": "34.5%",
    "passiveName": "Infusion Needle",
    "passiveDesc": "After picking up an Elemental Orb/Particle, Normal and Charged Attacks deal additional DMG equal to 20% of ATK for 5s.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Exotic.png"
  },
  {
    "key": "CrimsonMoonSSemblance",
    "name": "Crimson Moon's Semblance",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Ashen Sun's Shadow",
    "passiveDesc": "Grants a Bond of Life equal to 25% of Max HP when a Charged Attack hits an opponent. This effect can be triggered up to once every 14s. In addition, when the equipping character has a Bond of Life, they gain a 12% DMG Bonus; if the value of the Bond of Life is greater than or equal to 30% of Max HP, then gain an additional 24% DMG Bonus.",
    "tags": [
      "crit",
      "normal-buff",
      "hp"
    ]
  },
  {
    "key": "DarkIronSword",
    "name": "Dark Iron Sword",
    "weaponType": "Sword",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "eleMas",
    "subStatValue": "141",
    "passiveName": "Overloaded",
    "passiveDesc": "Upon causing an Overloaded, Superconduct, Stellar-Conduct, Electro-Charged, Quicken, Aggravate, Hyperbloom, Lunar-Charged, or Electro-infused Swirl reaction, ATK is increased by 20% for 12s.",
    "tags": [
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Darker.png"
  },
  {
    "key": "DawningFrost",
    "name": "Dawning Frost",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critDMG_",
    "subStatValue": "55.1%",
    "passiveName": "Nocturnal Dreams",
    "passiveDesc": "For 10s after a Charged Attack hits an opponent, Elemental Mastery is increased by 72. For 10s after an Elemental Skill hits an opponent, Elemental Mastery is increased by 48.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "normal-buff"
    ]
  },
  {
    "key": "Deathmatch",
    "name": "Deathmatch",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "critRate_",
    "subStatValue": "36.8%",
    "passiveName": "Gladiator",
    "passiveDesc": "If there are at least 2 opponents nearby, ATK is increased by 16% and DEF is increased by 16%. If there are fewer than 2 opponents nearby, ATK is increased by 24%.",
    "tags": [
      "crit",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Gladiator.png"
  },
  {
    "key": "DebateClub",
    "name": "Debate Club",
    "weaponType": "Claymore",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "atk_",
    "subStatValue": "35.2%",
    "passiveName": "Blunt Conclusion",
    "passiveDesc": "After using an Elemental Skill, on hit, Normal and Charged Attacks deal additional DMG equal to 60% of ATK in a small AoE. Effect lasts 15s. DMG can only occur once every 3s.",
    "tags": [
      "em",
      "skill-buff",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Reasoning.png"
  },
  {
    "key": "DialoguesOfTheDesertSages",
    "name": "Dialogues of the Desert Sages",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "hp_",
    "subStatValue": "41.3%",
    "passiveName": "Principle of Equilibrium",
    "passiveDesc": "When the wielder performs healing, restore 8 Energy. This effect can be triggered once every 10s and can occur even when the character is not on the field.",
    "tags": [
      "energy",
      "hp"
    ]
  },
  {
    "key": "DisasterAndRemorse",
    "name": "Disaster and Remorse",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Dolorous Stroke",
    "passiveDesc": "After the equipping character uses an Elemental Skill, they gain \"Path of Conflict\" for 17s, as well as \"Unforgivable\" and \"Irreparable\" for 3s each. This effect can trigger once every 18s.\nUnforgivable: Increases the equipping character's Normal Attack and Charged Attack DMG by 40%.\nIrreparable: Increases the equipping character's Elemental Skill and Elemental Burst DMG by 40%.\nWhile Path of Conflict is in effect, when the equipping character hits an opponent with a Normal Attack or Charged Attack, Irreparable's duration will be increased by 1s. When the equipping character hits an opponent with their Elemental Skill or Elemental Burst, Unforgivable's duration will be increased by 1s. Each of the above effects can be triggered once every 0.1s. When Path of Conflict ends or the equipping character leaves the field, both Unforgivable and Irreparable will be removed.\nHexerei: Secret Rite: The above DMG boosts are increased by 75%.",
    "tags": [
      "crit",
      "em",
      "burst-buff",
      "skill-buff",
      "normal-buff"
    ]
  },
  {
    "key": "DodocoTales",
    "name": "Dodoco Tales",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "atk_",
    "subStatValue": "55.1%",
    "passiveName": "Dodoventure!",
    "passiveDesc": "Normal Attack hits on opponents increase Charged Attack DMG by 16% for 6s. Charged Attack hits on opponents increase ATK by 8% for 6s.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Ludiharpastum.png"
  },
  {
    "key": "DragonSBane",
    "name": "Dragon's Bane",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "eleMas",
    "subStatValue": "221",
    "passiveName": "Bane of Flame and Water",
    "passiveDesc": "Increases DMG against opponents affected by Hydro or Pyro by 20%.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Stardust.png"
  },
  {
    "key": "DragonspineSpear",
    "name": "Dragonspine Spear",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "physical_dmg_",
    "subStatValue": "69.0%",
    "passiveName": "Frost Burial",
    "passiveDesc": "Hitting an opponent with Normal and Charged Attacks has a 60% chance of forming and dropping an Everfrost Icicle above them, dealing AoE DMG equal to 80% of ATK. Opponents affected by Cryo are instead dealt DMG equal to 200% of ATK. Can only occur once every 10s.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Everfrost.png"
  },
  {
    "key": "EarthShaker",
    "name": "Earth Shaker",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Oath of Qhapaq Nan",
    "passiveDesc": "After a party member triggers a Pyro-related reaction, the equipping character's Elemental Skill DMG is increased by 16% for 8s. This effect can be triggered even when the triggering party member is not on the field.",
    "tags": [
      "em",
      "team-buff",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "EchoesOfTheHeart",
    "name": "Echoes of the Heart",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Echo of a Vow",
    "passiveDesc": "Triggering an Elemental Reaction increases the equipping character's Elemental Mastery by 60 for 12s, while triggering a Stellar Glimmer reaction increases their Stellar Glimmer reaction DMG dealt by 16% for 12s. The aforementioned effects can trigger even when the character is not on the field.",
    "tags": [
      "em",
      "atk"
    ]
  },
  {
    "key": "ElegyForTheEnd",
    "name": "Elegy for the End",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "enerRech_",
    "subStatValue": "55.1%",
    "passiveName": "The Parting Refrain",
    "passiveDesc": "A part of the \"Millennial Movement\" that wanders amidst the winds. Increases Elemental Mastery by 60. When the Elemental Skills or Elemental Bursts of the character wielding this weapon hit opponents, that character gains a Sigil of Remembrance. This effect can be triggered once every 0.2s and can be triggered even if said character is not on the field. When you possess 4 Sigils of Remembrance, all of them will be consumed and all nearby party members will obtain the \"Millennial Movement: Farewell Song\" effect for 12s. \"Millennial Movement: Farewell Song\" increases Elemental Mastery by 100 and increases ATK by 20%. Once this effect is triggered, you will not gain Sigils of Remembrance for 20s. Of the many effects of the \"Millennial Movement,\" buffs of the same type will not stack.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "burst-buff",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Widsith.png"
  },
  {
    "key": "Emberwell",
    "name": "Emberwell",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Starfire Upon the Snowplains",
    "passiveDesc": "Triggering an Elemental Reaction increases the equipping character's ATK by 16% for 12s. Triggering a Stellar Glimmer reaction increases their Stellar Glimmer reaction DMG dealt by 16% for 12s. The aforementioned effects can trigger even when the character is not on the field.",
    "tags": [
      "em",
      "atk"
    ]
  },
  {
    "key": "EmeraldOrb",
    "name": "Emerald Orb",
    "weaponType": "Catalyst",
    "rarity": 3,
    "baseAtk": 448,
    "subStatType": "eleMas",
    "subStatValue": "94",
    "passiveName": "Rapids",
    "passiveDesc": "Upon causing a Vaporize, Electro-Charged, Frozen, Bloom, Lunar-Charged, Lunar-Bloom, or a Hydro-infused Swirl reaction, ATK is increased by 20% for 12s.",
    "tags": [
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Jade.png"
  },
  {
    "key": "EndOfTheLine",
    "name": "End of the Line",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Net Snapper",
    "passiveDesc": "Triggers the Flowrider effect after using an Elemental Skill, dealing 80% ATK as AoE DMG upon hitting an opponent with an attack. Flowrider will be removed after 15s or after causing 3 instances of AoE DMG. Only 1 instance of AoE DMG can be caused every 2s in this way. Flowrider can be triggered once every 12s.",
    "tags": [
      "energy",
      "em",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Fin.png"
  },
  {
    "key": "EngulfingLightning",
    "name": "Engulfing Lightning",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "enerRech_",
    "subStatValue": "55.1%",
    "passiveName": "Timeless Dream: Eternal Stove",
    "passiveDesc": "ATK increased by 28% of Energy Recharge over the base 100%. You can gain a maximum bonus of 80% ATK. Gain 30% Energy Recharge for 12s after using an Elemental Burst.",
    "tags": [
      "energy",
      "em",
      "burst-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Narukami.png"
  },
  {
    "key": "EtherlightSpindlelute",
    "name": "Etherlight Spindlelute",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Last Singer",
    "passiveDesc": "For 20s after using an Elemental Skill, the equipping character's Elemental Mastery is increased by 100.",
    "tags": [
      "energy",
      "em",
      "skill-buff"
    ]
  },
  {
    "key": "EverlastingMoonglow",
    "name": "Everlasting Moonglow",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "hp_",
    "subStatValue": "49.6%",
    "passiveName": "Byakuya Kougetsu",
    "passiveDesc": "Healing Bonus increased by 10%, Normal Attack DMG is increased by 1% of the Max HP of the character equipping this weapon. For 12s after using an Elemental Burst, Normal Attacks that hit opponents will restore 0.6 Energy. Energy can be restored this way once every 0.1s.",
    "tags": [
      "energy",
      "em",
      "burst-buff",
      "normal-buff",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Kaleido.png"
  },
  {
    "key": "ExaiphanesBlade",
    "name": "Exaiphanes Blade",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Traveler's Path",
    "passiveDesc": "When the Traveler equips this, their ATK will increase by 16% for 8s after they hit an opponent. At the same time, they will also regenerate 3 Elemental Energy. This effect can trigger once every 5s. This can be triggered even when the character is not on the field.",
    "tags": [
      "crit",
      "energy",
      "em",
      "atk"
    ]
  },
  {
    "key": "EyeOfPerception",
    "name": "Eye of Perception",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "atk_",
    "subStatValue": "55.1%",
    "passiveName": "Echo",
    "passiveDesc": "Normal and Charged Attacks have a 50% chance to fire a Bolt of Perception, dealing 240% ATK as DMG. This bolt can bounce between opponents a maximum of 4 times. This effect can occur once every 12s.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Truelens.png"
  },
  {
    "key": "FadingTwilight",
    "name": "Fading Twilight",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Radiance of the Deeps",
    "passiveDesc": "Has three states, Evengleam, Afterglow, and Dawnblaze, which increase DMG dealt by 6%/10%/14% respectively. When attacks hit opponents, this weapon will switch to the next state. This weapon can change states once every 7s. The character equipping this weapon can still trigger the state switch while not on the field.",
    "tags": [
      "energy"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Fallensun.png"
  },
  {
    "key": "FangOfTheMountainKing",
    "name": "Fang of the Mountain King",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 741,
    "subStatType": "critRate_",
    "subStatValue": "11.0%",
    "passiveName": "Turquoise Hunt",
    "passiveDesc": "Gain 1 stack of Canopy's Favor after hitting an opponent with an Elemental Skill. This can be triggered once every 0.5s. After a nearby party member triggers a Burning or Burgeon reaction, the equipping character will gain 3 stacks. This effect can be triggered once every 2s and can be triggered even when the triggering party member is off-field. Canopy's Favor: Elemental Skill and Burst DMG is increased by 10% for 6s. Max 6 stacks. Each stack is counted independently.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "skill-buff"
    ]
  },
  {
    "key": "FavoniusCodex",
    "name": "Favonius Codex",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Windfall",
    "passiveDesc": "CRIT Hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.",
    "tags": [
      "crit",
      "energy",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Zephyrus.png"
  },
  {
    "key": "FavoniusGreatsword",
    "name": "Favonius Greatsword",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Windfall",
    "passiveDesc": "CRIT Hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.",
    "tags": [
      "crit",
      "energy",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Zephyrus.png"
  },
  {
    "key": "FavoniusLance",
    "name": "Favonius Lance",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Windfall",
    "passiveDesc": "CRIT Hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.",
    "tags": [
      "crit",
      "energy",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Zephyrus.png"
  },
  {
    "key": "FavoniusSword",
    "name": "Favonius Sword",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Windfall",
    "passiveDesc": "CRIT Hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.",
    "tags": [
      "crit",
      "energy",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Zephyrus.png"
  },
  {
    "key": "FavoniusWarbow",
    "name": "Favonius Warbow",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Windfall",
    "passiveDesc": "CRIT Hits have a 60% chance to generate a small amount of Elemental Particles, which will regenerate 6 Energy for the character. Can only occur once every 12s.",
    "tags": [
      "crit",
      "energy",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Zephyrus.png"
  },
  {
    "key": "FerrousShadow",
    "name": "Ferrous Shadow",
    "weaponType": "Claymore",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "hp_",
    "subStatValue": "35.2%",
    "passiveName": "Unbending",
    "passiveDesc": "When HP falls below 70%, increases Charged Attack DMG by 30% and Charged Attacks become harder to interrupt.",
    "tags": [
      "normal-buff",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Glaive.png"
  },
  {
    "key": "FesteringDesire",
    "name": "Festering Desire",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Undying Admiration",
    "passiveDesc": "Increases Elemental Skill DMG by 16% and Elemental Skill CRIT Rate by 6%.",
    "tags": [
      "crit",
      "energy",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Magnum.png"
  },
  {
    "key": "FilletBlade",
    "name": "Fillet Blade",
    "weaponType": "Sword",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "atk_",
    "subStatValue": "35.2%",
    "passiveName": "Gash",
    "passiveDesc": "On hit, has a 50% chance to deal 240% ATK DMG to a single opponent. Can only occur once every 15s.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Sashimi.png"
  },
  {
    "key": "FinaleOfTheDeep",
    "name": "Finale of the Deep",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "An End Sublime",
    "passiveDesc": "When using an Elemental Skill, ATK will be increased by 12% for 15s, and a Bond of Life worth 25% of Max HP will be granted. This effect can be triggered once every 10s. When the Bond of Life is cleared, a maximum of 150 ATK will be gained based on 2.4% of the total amount of the Life Bond cleared, lasting for 15s.",
    "tags": [
      "em",
      "skill-buff",
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Vorpal.png"
  },
  {
    "key": "FlameForgedInsight",
    "name": "Flame-Forged Insight",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Mind in Bloom",
    "passiveDesc": "When Electro-Charged, Lunar-Charged, Bloom, Lunar-Bloom, Crystallize or Lunar-Crystallize is triggered, restore 12 Elemental Energy and increase Elemental Mastery by 60 for 15 seconds. This effect can be triggered at most once every 15s and can be triggered even when the equipping character is off-field.",
    "tags": [
      "energy",
      "em"
    ]
  },
  {
    "key": "FleuveCendreFerryman",
    "name": "Fleuve Cendre Ferryman",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Ironbone",
    "passiveDesc": "Increases Elemental Skill CRIT Rate by 8%. Additionally, increases Energy Recharge by 16% for 5s after using an Elemental Skill.",
    "tags": [
      "crit",
      "energy",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Machination.png"
  },
  {
    "key": "FlowerWreathedFeathers",
    "name": "Flower-Wreathed Feathers",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Inflorescence Unattainable",
    "passiveDesc": "Decreases Gliding Stamina consumption by 15%. When using Aimed Shots, the DMG dealt by Charged Attacks increases by 6% every 0.5s. This effect can stack up to 6 times and will be removed 10s after leaving Aiming Mode.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "FlowingPurity",
    "name": "Flowing Purity",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Unfinished Masterpiece",
    "passiveDesc": "When using an Elemental Skill, All Elemental DMG Bonus will be increased by 8% for 15s, and a Bond of Life worth 24% of Max HP will be granted. This effect can be triggered once every 10s. When the Bond of Life is cleared, every 1,000 HP cleared in the process will provide 2% All Elemental DMG Bonus, up to a maximum of 12%. This effect lasts 15s.",
    "tags": [
      "em",
      "skill-buff",
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Vorpal.png"
  },
  {
    "key": "FluteOfEzpitzal",
    "name": "Flute of Ezpitzal",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "def_",
    "subStatValue": "69.0%",
    "passiveName": "Smoke-and-Mirror Mystery",
    "passiveDesc": "Using an Elemental Skill increases DEF by 16% for 15s.",
    "tags": [
      "em",
      "skill-buff",
      "def"
    ]
  },
  {
    "key": "FootprintOfTheRainbow",
    "name": "Footprint of the Rainbow",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "def_",
    "subStatValue": "51.7%",
    "passiveName": "Pact of Flowing Springs",
    "passiveDesc": "Using an Elemental Skill increases DEF by 16% for 15s.",
    "tags": [
      "em",
      "skill-buff",
      "def"
    ]
  },
  {
    "key": "ForestRegalia",
    "name": "Forest Regalia",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Forest Sanctuary",
    "passiveDesc": "After triggering Burning, Quicken, Aggravate, Spread, Bloom, Lunar-Bloom, Hyperbloom, or Burgeon, a Leaf of Consciousness will be created around the character for a maximum of 10s. When picked up, the Leaf will grant the character 60 Elemental Mastery for 12s. Only 1 Leaf can be generated this way every 20s. This effect can still be triggered if the character is not on the field. The Leaf of Consciousness' effect cannot stack.",
    "tags": [
      "energy",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Arakalari.png"
  },
  {
    "key": "ForgedByTheGoldenMelody",
    "name": "Forged by the Golden Melody",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Day and Night in Counterpoint",
    "passiveDesc": "Every 10s, the equipping character plays a \"Harmonic Movement\" of the corresponding type for a boost in the following order: +18% ATK > +120 Elemental Mastery > +28% Stellar Glimmer reaction DMG. Each instance of Harmonic Movement lasts 10s. This effect can trigger even when the equipping character is not on the field.\nTriggering a Stellar Glimmer reaction will also grant an additional 12-second instance of \"Harmonic Movement: Contrapuntal\" with the same effects as the Harmonic Movement active when Stellar Glimmer is triggered. This effect stacks with the original Harmonic Movement effect, and can trigger once every 12s.",
    "tags": [
      "crit",
      "em",
      "atk"
    ]
  },
  {
    "key": "FracturedHalo",
    "name": "Fractured Halo",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critDMG_",
    "subStatValue": "66.2%",
    "passiveName": "Purifying Crown",
    "passiveDesc": "After an Elemental Skill or Elemental Burst is used, ATK is increased by 24% for 20s. If the equipping character creates a Shield while this effect is active, they will gain the Electrifying Edict effect for 20s: All nearby party members deal 40% more Lunar-Charged DMG.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "burst-buff",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "FreedomSworn",
    "name": "Freedom-Sworn",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "eleMas",
    "subStatValue": "198",
    "passiveName": "Revolutionary Chorale",
    "passiveDesc": "A part of the \"Millennial Movement\" that wanders amidst the winds. Increases DMG by 10%. When the character wielding this weapon triggers Elemental Reactions, they gain a Sigil of Rebellion. This effect can be triggered once every 0.5s and can be triggered even if said character is not on the field. When you possess 2 Sigils of Rebellion, all of them will be consumed and all nearby party members will obtain \"Millennial Movement: Song of Resistance\" for 12s. \"Millennial Movement: Song of Resistance\" increases Normal, Charged and Plunging Attack DMG by 16% and increases ATK by 20%. Once this effect is triggered, you will not gain Sigils of Rebellion for 20s. Of the many effects of the \"Millennial Movement,\" buffs of the same type will not stack.",
    "tags": [
      "em",
      "team-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Widsith.png"
  },
  {
    "key": "Frostbearer",
    "name": "Frostbearer",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Frost Burial",
    "passiveDesc": "Hitting an opponent with Normal and Charged Attacks has a 60% chance of forming and dropping an Everfrost Icicle above them, dealing AoE DMG equal to 80% of ATK. Opponents affected by Cryo are instead dealt DMG equal to 200% of ATK. Can only occur once every 10s.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Everfrost.png"
  },
  {
    "key": "Frostbreath",
    "name": "Frostbreath",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "A Cast Real Far",
    "passiveDesc": "Triggering a Cryo or Hydro-related elemental reaction increases the equipping character's ATK by 20% for the next 15s, as well as regenerates 6 Elemental Energy for other members of their party. This effect can trigger once every 16s.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "atk"
    ]
  },
  {
    "key": "FruitfulHook",
    "name": "Fruitful Hook",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "The Weight of Falling Branches",
    "passiveDesc": "Increase Plunging Attack CRIT Rate by 16%; After a Plunging Attack hits an opponent, Normal, Charged, and Plunging Attack DMG increased by 16% for 10s.",
    "tags": [
      "crit",
      "atk"
    ]
  },
  {
    "key": "FruitOfFulfillment",
    "name": "Fruit of Fulfillment",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Full Circle",
    "passiveDesc": "Obtain the \"Wax and Wane\" effect after an Elemental Reaction is triggered, gaining 24 Elemental Mastery while losing 5% ATK. For every 0.3s, 1 stack of Wax and Wane can be gained. Max 5 stacks. For every 6s that go by without an Elemental Reaction being triggered, 1 stack will be lost. This effect can be triggered even when the character is off-field.",
    "tags": [
      "energy",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Arakalari.png"
  },
  {
    "key": "GestOfTheMightyWolf",
    "name": "Gest of the Mighty Wolf",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Indomitable Chivalry",
    "passiveDesc": "Increase ATK SPD by 10%. Every time the equipping character's Normal Attack(s) hit opponent(s), when they cast their Elemental Skill, or when they begin their Charged Attack(s), gain 1/2/2 stacks of Four Winds' Hymn respectively: DMG dealt is increased by 7.5% for 4s. Max 4 stacks. This effect can be triggered once every 0.01s.\nAdditionally, when the party has the \"Hexerei: Secret Rite\" effect, each stack of Four Winds' Hymn also increases the equipping character's CRIT DMG by 7.5%.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "skill-buff",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "GoldenFrostboundOath",
    "name": "Golden Frostbound Oath",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Dawn's Salutation Returned",
    "passiveDesc": "Increase DEF by 16%. When the equipping character's Elemental Skill or Lunar-Crystallize attacks hit opponents, gain the Frost Fae's Favor effect for 6s: Geo DMG inflicted by the equipping character increases by 40%, Lunar-Crystallize Reaction DMG increases by 40%. While this effect is active, if there are Moondrifts near the equipping character, all other nearby party members will gain the Frost Fae's Mischief effect: Geo DMG dealt increases by 20% and Lunar-Crystallize Reaction DMG increases by 20%. This effect can be triggered even when the equipping character is off-field.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "skill-buff",
      "def"
    ]
  },
  {
    "key": "HakushinRing",
    "name": "Hakushin Ring",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Sakura Saiguu",
    "passiveDesc": "After the character equipped with this weapon triggers an Electro elemental reaction, nearby party members of an Elemental Type involved in the elemental reaction receive a 10% Elemental DMG Bonus for their element, lasting 6s. Elemental Bonuses gained in this way cannot be stacked.",
    "tags": [
      "energy",
      "em",
      "team-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Bakufu.png"
  },
  {
    "key": "Halberd",
    "name": "Halberd",
    "weaponType": "Polearm",
    "rarity": 3,
    "baseAtk": 448,
    "subStatType": "atk_",
    "subStatValue": "23.5%",
    "passiveName": "Heavy",
    "passiveDesc": "Normal Attacks deal an additional 160% ATK as DMG. Can only occur once every 10s.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Halberd.png"
  },
  {
    "key": "Hamayumi",
    "name": "Hamayumi",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "atk_",
    "subStatValue": "55.1%",
    "passiveName": "Full Draw",
    "passiveDesc": "Increases Normal Attack DMG by 16% and Charged Attack DMG by 12%. When the equipping character's Energy reaches 100%, this effect is increased by 100%.",
    "tags": [
      "energy",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Bakufu.png"
  },
  {
    "key": "HaranGeppakuFutsu",
    "name": "Haran Geppaku Futsu",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Honed Flow",
    "passiveDesc": "Obtain 12% All Elemental DMG Bonus. When other nearby party members use Elemental Skills, the character equipping this weapon will gain 1 Wavespike stack. Max 2 stacks. This effect can be triggered once every 0.3s. When the character equipping this weapon uses an Elemental Skill, all stacks of Wavespike will be consumed to gain Rippling Upheaval: each stack of Wavespike consumed will increase Normal Attack DMG by 20% for 8s.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "skill-buff",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Amenoma.png"
  },
  {
    "key": "HarbingerOfDawn",
    "name": "Harbinger of Dawn",
    "weaponType": "Sword",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "critDMG_",
    "subStatValue": "46.9%",
    "passiveName": "Vigorous",
    "passiveDesc": "When HP is above 90%, increases CRIT Rate by 14%.",
    "tags": [
      "crit",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Dawn.png"
  },
  {
    "key": "HereticSMoltenBlade",
    "name": "Heretic's Molten Blade",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Lone Light's Blessing",
    "passiveDesc": "After the equipping character uses their Elemental Skill, they gain \"Gleam of First Light.\" While active, Gleam of First Light tracks their distance traveled. Each second, the equipping character gains an ATK Bonus ranging from 18% to 36% based on the distance traveled during the previous second. Gleam of First Light lasts 14s, can be triggered once every 14s, and is removed when the equipping character leaves the field.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "HunterSPath",
    "name": "Hunter's Path",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critRate_",
    "subStatValue": "44.1%",
    "passiveName": "At the End of the Beast-Paths",
    "passiveDesc": "Gain 12% All Elemental DMG Bonus. Obtain the Tireless Hunt effect after hitting an opponent with a Charged Attack. This effect increases Charged Attack DMG by 160% of Elemental Mastery. This effect will be removed after 12 Charged Attacks or 10s. Only 1 instance of Tireless Hunt can be gained every 12s.",
    "tags": [
      "crit",
      "em",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Ayus.png"
  },
  {
    "key": "HymnOfTheMaelstrom",
    "name": "Hymn of the Maelstrom",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "hp_",
    "subStatValue": "66.2%",
    "passiveName": "Rondo of Slumber",
    "passiveDesc": "Increases Healing Bonus by 4%.\nWhen performing healing, the equipping character gains the \"Vatsamonga's Vatic Vintage\" effect, which increases Max HP by 4% as well as increases the currently active party member's ATK by 0.4% for every 1,000 Max HP the equipping character has over 40,000. A maximum of 8% ATK can be gained in this way. This effect lasts 10s, max 3 stacks.\nWhen a nearby party member triggers a Frozen or Stellar Swirl reaction, the aforementioned Max HP and ATK boosts will be further increased by 75% for the next 5s.\nThe aforementioned effects can still trigger even when the equipping character is not on the field.",
    "tags": [
      "em",
      "team-buff",
      "hp",
      "atk"
    ]
  },
  {
    "key": "IbisPiercer",
    "name": "Ibis Piercer",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Secret Wisdom's Favor",
    "passiveDesc": "The character's Elemental Mastery will increase by 40 within 6s after Charged Attacks hit opponents. Max 2 stacks. This effect can be triggered once every 0.5s.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Ibis.png"
  },
  {
    "key": "IronSting",
    "name": "Iron Sting",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Infusion Stinger",
    "passiveDesc": "Dealing Elemental DMG increases all DMG by 6% for 6s. Max 2 stacks. Can occur once every 1s.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Exotic.png"
  },
  {
    "key": "JadefallSSplendor",
    "name": "Jadefall's Splendor",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "hp_",
    "subStatValue": "49.6%",
    "passiveName": "Primordial Jade Regalia",
    "passiveDesc": "For 3s after using an Elemental Burst or creating a shield, the equipping character can gain the Primordial Jade Regalia effect: Restore 4.5 Energy every 2.5s, and gain 0.3% Elemental DMG Bonus for their corresponding Elemental Type for every 1,000 Max HP they possess, up to 12%. Primordial Jade Regalia will still take effect even if the equipping character is not on the field.",
    "tags": [
      "energy",
      "em",
      "burst-buff",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Morax.png"
  },
  {
    "key": "JadeVista",
    "name": "Jade Vista",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "A Candle Woven From the Night",
    "passiveDesc": "For every party member other than the equipping character: · Who is of the same Elemental Type as the equipper: The equipping character's Elemental Mastery is increased by 64; · Who is not of the same Elemental Type as the equipper: The equipping character's ATK increases by 12%. The two effects described above can stack up to 3 times in total, with Elemental Mastery buffs applied first.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "atk"
    ]
  },
  {
    "key": "KagotsurubeIsshin",
    "name": "Kagotsurube Isshin",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Isshin Art Clarity",
    "passiveDesc": "When a Normal, Charged, or Plunging Attack hits an opponent, it will whip up a Hewing Gale, dealing AoE DMG equal to 180% of ATK and increasing ATK by 15% for 8s. This effect can be triggered once every 8s.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Youtou.png"
  },
  {
    "key": "KaguraSVerity",
    "name": "Kagura's Verity",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critDMG_",
    "subStatValue": "66.2%",
    "passiveName": "Kagura Dance of the Sacred Sakura",
    "passiveDesc": "Using an Elemental Skill grants the Kagura Dance effect, increasing the wielding character's Elemental Skill DMG by 12% as well as their Stellar-Conduct DMG by 12% for 24s. Max 3 stacks. This character will gain a 12% All Elemental DMG Bonus when they possess 3 stacks.",
    "tags": [
      "crit",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Narukami.png"
  },
  {
    "key": "KatsuragikiriNagamasa",
    "name": "Katsuragikiri Nagamasa",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Samurai Conduct",
    "passiveDesc": "Increases Elemental Skill DMG by 6%. After Elemental Skill hits an opponent, the character loses 3 Energy but regenerates 3 Energy every 2s for the next 6s. This effect can occur once every 10s. Can be triggered even when the character is not on the field.",
    "tags": [
      "energy",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Bakufu.png"
  },
  {
    "key": "KeyOfKhajNisut",
    "name": "Key of Khaj-Nisut",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "hp_",
    "subStatValue": "66.2%",
    "passiveName": "Sunken Song of the Sands",
    "passiveDesc": "HP increased by 20%. When an Elemental Skill hits opponents, you gain the Grand Hymn effect for 20s. This effect increases the equipping character's Elemental Mastery by 0.12% of their Max HP. This effect can trigger once every 0.3s. Max 3 stacks. When this effect gains 3 stacks, or when the third stack's duration is refreshed, the Elemental Mastery of all nearby party members will be increased by 0.2% of the equipping character's max HP for 20s.",
    "tags": [
      "em",
      "team-buff",
      "skill-buff",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Deshret.png"
  },
  {
    "key": "KingSSquire",
    "name": "King's Squire",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "atk_",
    "subStatValue": "55.1%",
    "passiveName": "Labyrinth Lord's Instruction",
    "passiveDesc": "Obtain the Teachings of the Forest effect when unleashing Elemental Skills and Bursts, increasing Elemental Mastery by 60 for 12s. This effect will be removed when switching characters. When the Teachings of the Forest effect ends or is removed, it will deal 100% of ATK as DMG to 1 nearby opponent. The Teachings of the Forest effect can be triggered once every 20s.",
    "tags": [
      "em",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Arakalari.png"
  },
  {
    "key": "KitainCrossSpear",
    "name": "Kitain Cross Spear",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "eleMas",
    "subStatValue": "110",
    "passiveName": "Samurai Conduct",
    "passiveDesc": "Increases Elemental Skill DMG by 6%. After Elemental Skill hits an opponent, the character loses 3 Energy but regenerates 3 Energy every 2s for the next 6s. This effect can occur once every 10s. Can be triggered even when the character is not on the field.",
    "tags": [
      "energy",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Bakufu.png"
  },
  {
    "key": "LightbearingMoonshard",
    "name": "Lightbearing Moonshard",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Legacy of Lang-Gan",
    "passiveDesc": "Increases DEF by 20%. DMG inflicted by Lunar-Crystallize reactions increases by 64% for 5s after the equipping character uses an Elemental Skill.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "def"
    ]
  },
  {
    "key": "LightOfFoliarIncision",
    "name": "Light of Foliar Incision",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Whitemoon Bristle",
    "passiveDesc": "CRIT Rate is increased by 4%. After Normal Attacks deal Elemental DMG, the Foliar Incision effect will be obtained, increasing DMG dealt by Normal Attacks and Elemental Skills by 120% of Elemental Mastery. This effect will disappear after 28 DMG instances or 12s. You can obtain Foliar Incision once every 12s.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Ayus.png"
  },
  {
    "key": "LionSRoar",
    "name": "Lion's Roar",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Bane of Fire and Thunder",
    "passiveDesc": "Increases DMG against opponents affected by Pyro or Electro by 20%.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Rockkiller.png"
  },
  {
    "key": "LithicBlade",
    "name": "Lithic Blade",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Lithic Axiom: Unity",
    "passiveDesc": "For every character in the party who hails from Liyue, the character who equips this weapon gains a 7% ATK increase and a 3% CRIT Rate increase. This effect stacks up to 4 times.",
    "tags": [
      "crit",
      "team-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Lapis.png"
  },
  {
    "key": "LithicSpear",
    "name": "Lithic Spear",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Lithic Axiom: Unity",
    "passiveDesc": "For every character in the party who hails from Liyue, the character who equips this weapon gains a 7% ATK increase and a 3% CRIT Rate increase. This effect stacks up to 4 times.",
    "tags": [
      "crit",
      "team-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Lapis.png"
  },
  {
    "key": "LostPrayerToTheSacredWinds",
    "name": "Lost Prayer to the Sacred Winds",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Boundless Blessing",
    "passiveDesc": "Increases Movement SPD by 10%. When in battle, gain an 8% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat.",
    "tags": [
      "crit",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Fourwinds.png"
  },
  {
    "key": "LumidouceElegy",
    "name": "Lumidouce Elegy",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Bright Dawn Overture",
    "passiveDesc": "ATK increased by 15%. After the equipping character triggers Burning on an opponent or deals Dendro DMG to Burning opponents, the DMG dealt is increased by 18%. This effect lasts for 8s, max 2 stacks. When 2 stacks are reached or when the duration is refreshed at 2 stacks, restore 12 Energy. Energy can be restored this way once every 12s. The 2 aforementioned effects can be triggered even when the character is off-field.",
    "tags": [
      "crit",
      "energy",
      "em",
      "atk"
    ]
  },
  {
    "key": "LuxuriousSeaLord",
    "name": "Luxurious Sea-Lord",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "atk_",
    "subStatValue": "55.1%",
    "passiveName": "Oceanic Victory",
    "passiveDesc": "Increases Elemental Burst DMG by 12%. When Elemental Burst hits opponents, there is a 100% chance of summoning a huge onrush of tuna that deals 100% ATK as AoE DMG. This effect can occur once every 15s.",
    "tags": [
      "em",
      "burst-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_MillenniaTuna.png"
  },
  {
    "key": "MagicGuide",
    "name": "Magic Guide",
    "weaponType": "Catalyst",
    "rarity": 3,
    "baseAtk": 354,
    "subStatType": "eleMas",
    "subStatValue": "187",
    "passiveName": "Bane of Storm and Tide",
    "passiveDesc": "Increases DMG against opponents affected by Hydro or Electro by 12%.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Intro.png"
  },
  {
    "key": "MailedFlower",
    "name": "Mailed Flower",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "eleMas",
    "subStatValue": "110",
    "passiveName": "Whispers of Wind and Flower",
    "passiveDesc": "Within 8s after the character's Elemental Skill hits an opponent or the character triggers an Elemental Reaction, their ATK and Elemental Mastery will be increased by 12% and 48 respectively.",
    "tags": [
      "em",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Fleurfair.png"
  },
  {
    "key": "MakhairaAquamarine",
    "name": "Makhaira Aquamarine",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Desert Pavilion",
    "passiveDesc": "The following effect will trigger every 10s: The equipping character will gain 24% of their Elemental Mastery as bonus ATK for 12s, with nearby party members gaining 30% of this buff for the same duration. Multiple instances of this weapon can allow this buff to stack. This effect will still trigger even if the character is not on the field.",
    "tags": [
      "em",
      "team-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Pleroma.png"
  },
  {
    "key": "MappaMare",
    "name": "Mappa Mare",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "eleMas",
    "subStatValue": "110",
    "passiveName": "Infusion Scroll",
    "passiveDesc": "Triggering an Elemental reaction grants a 8% Elemental DMG Bonus for 10s. Max 2 stacks.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Exotic.png"
  },
  {
    "key": "MasterKey",
    "name": "Master Key",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Fall Into Place",
    "passiveDesc": "Upon causing an Elemental Reaction, increases Elemental Mastery by 60 for 12s. Moonsign: Ascendant Gleam: Elemental Mastery from this effect is further increased by 60. This effect can be triggered even if the equipping character is off-field.",
    "tags": [
      "energy",
      "em"
    ]
  },
  {
    "key": "MemoryOfDust",
    "name": "Memory of Dust",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "atk_",
    "subStatValue": "49.6%",
    "passiveName": "Golden Majesty",
    "passiveDesc": "Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Kunwu.png"
  },
  {
    "key": "Messenger",
    "name": "Messenger",
    "weaponType": "Bow",
    "rarity": 3,
    "baseAtk": 448,
    "subStatType": "critDMG_",
    "subStatValue": "31.2%",
    "passiveName": "Archer's Message",
    "passiveDesc": "Charged Attack hits on weak points deal an additional 100% ATK DMG as CRIT DMG. Can only occur once every 10s.",
    "tags": [
      "crit",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Msg.png"
  },
  {
    "key": "MissiveWindspear",
    "name": "Missive Windspear",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "The Wind Unattained",
    "passiveDesc": "Within 10s after an Elemental Reaction is triggered, ATK is increased by 12% and Elemental Mastery is increased by 48.",
    "tags": [
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Windvane.png"
  },
  {
    "key": "MistsplitterReforged",
    "name": "Mistsplitter Reforged",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critDMG_",
    "subStatValue": "44.1%",
    "passiveName": "Mistsplitter's Edge",
    "passiveDesc": "Gain a 12% Elemental DMG Bonus for all elements and receive the might of the Mistsplitter's Emblem. At stack levels 1/2/3, the Mistsplitter's Emblem provides a 8/16/28% Elemental DMG Bonus for the character's Elemental Type. The character will obtain 1 stack of Mistsplitter's Emblem in each of the following scenarios: Normal Attack deals Elemental DMG (stack lasts 5s), casting Elemental Burst (stack lasts 10s); Energy is less than 100% (stack disappears when Energy is full). Each stack's duration is calculated independently.",
    "tags": [
      "crit",
      "energy",
      "em",
      "burst-buff",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Narukami.png"
  },
  {
    "key": "MitternachtsWaltz",
    "name": "Mitternachts Waltz",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "physical_dmg_",
    "subStatValue": "51.7%",
    "passiveName": "Evernight Duet",
    "passiveDesc": "Normal Attack hits on opponents increase Elemental Skill DMG by 20% for 5s. Elemental Skill hits on opponents increase Normal Attack DMG by 20% for 5s.",
    "tags": [
      "em",
      "skill-buff",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Nachtblind.png"
  },
  {
    "key": "Moonpiercer",
    "name": "Moonpiercer",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "eleMas",
    "subStatValue": "110",
    "passiveName": "Stillwood Moonshadow",
    "passiveDesc": "After triggering Burning, Quicken, Aggravate, Spread, Bloom, Lunar-Bloom, Hyperbloom, or Burgeon, a Leaf of Revival will be created around the character for a maximum of 10s. When picked up, the Leaf will grant the character 16% ATK for 12s. Only 1 Leaf can be generated this way every 20s. This effect can still be triggered if the character is not on the field.",
    "tags": [
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Arakalari.png"
  },
  {
    "key": "MoonweaverSDawn",
    "name": "Moonweaver's Dawn",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Secret Silver's Testament",
    "passiveDesc": "Increases Elemental Burst DMG by 20%. When the equipping character's Energy Capacity does not exceed 60/40, their Elemental Burst DMG is increased by an additional 16%/28%.",
    "tags": [
      "energy",
      "em",
      "burst-buff",
      "atk"
    ]
  },
  {
    "key": "MountainBracingBolt",
    "name": "Mountain-Bracing Bolt",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Hope Beyond the Peaks",
    "passiveDesc": "Decreases Climbing Stamina Consumption by 15% and increases Elemental Skill DMG by 12%. Also, after other nearby party members use Elemental Skills, the equipping character's Elemental Skill DMG will also increase by 12% for 8s.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "skill-buff"
    ]
  },
  {
    "key": "MouunSMoon",
    "name": "Mouun's Moon",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Watatsumi Wavewalker",
    "passiveDesc": "For every point of the entire party's combined maximum Energy capacity, the Elemental Burst DMG of the character equipping this weapon is increased by 0.12%. A maximum of 40% increased Elemental Burst DMG can be achieved this way.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "burst-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Maria.png"
  },
  {
    "key": "NewBough",
    "name": "New Bough",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critDMG_",
    "subStatValue": "55.1%",
    "passiveName": "Wildgrowth",
    "passiveDesc": "When the equipping character hits the opponent with an attack within 12s after using the Elemental Skill, they gain the \"Verdant\" effect, which increases their ATK by 4% and their Elemental Mastery by 20. This effect lasts 6s and can trigger once every second. Max 3 stacks. The aforementioned effects can still trigger even when the equipping character is not on the field.\nRadiance: Stellar Glimmer: The effect of \"Verdant\" is changed to: Increases ATK by 6% as well as Stellar Glimmer reaction DMG dealt by the equipping character by 8%.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "NightweaverSLookingGlass",
    "name": "Nightweaver's Looking Glass",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "eleMas",
    "subStatValue": "265",
    "passiveName": "Millennial Hymn",
    "passiveDesc": "When the equipping character's Elemental Skill deals Hydro or Dendro DMG, they will gain Prayer of the Far North: Elemental Mastery is increased by 60 for 4.5s. When nearby party members trigger Lunar-Bloom reactions, the equipping character gains New Moon Verse: Elemental Mastery is increased by 60 for 10s. When both Prayer of the Far North and New Moon Verse are in effect, all nearby party members' Bloom DMG is increased by 120%, their Hyperbloom and Burgeon DMG is increased by 80%, and their Lunar-Bloom DMG is increased by 40%. This effect cannot stack. The aforementioned effects can be triggered even if the equipping character is off-field.",
    "tags": [
      "em",
      "team-buff",
      "skill-buff"
    ]
  },
  {
    "key": "NocturneSCurtainCall",
    "name": "Nocturne's Curtain Call",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Ballad of the Crossroads",
    "passiveDesc": "Max HP increases by 10%. When triggering Lunar reactions or inflicting Lunar Reaction DMG on opponents, the equipping character will recover 14 Energy, and receive the Bountiful Sea's Sacred Wine effect for 12s: Max HP increases by an additional 14%, CRIT DMG from Lunar Reaction DMG increases by 60%. The Energy recovery effect can be triggered at most once every 18s, and can be triggered even when the equipping character is off-field.",
    "tags": [
      "crit",
      "energy",
      "hp"
    ]
  },
  {
    "key": "OathswornEye",
    "name": "Oathsworn Eye",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "People of the Faltering Light",
    "passiveDesc": "Increases Energy Recharge by 24% for 10s after using an Elemental Skill.",
    "tags": [
      "energy",
      "em",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Jyanome.png"
  },
  {
    "key": "OtherworldlyStory",
    "name": "Otherworldly Story",
    "weaponType": "Catalyst",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "enerRech_",
    "subStatValue": "39.0%",
    "passiveName": "Energy Shower",
    "passiveDesc": "Picking up an Elemental Energy Orb/Particle recovers 1% HP.",
    "tags": [
      "energy",
      "em",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Lightnov.png"
  },
  {
    "key": "PeakPatrolSong",
    "name": "Peak Patrol Song",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "def_",
    "subStatValue": "82.7%",
    "passiveName": "Halcyon Years Unending",
    "passiveDesc": "Gain \"Ode to Flowers\" after Normal or Plunging Attacks hit an opponent: DEF increases by 8% and gain a 10% All Elemental DMG Bonus for 6s. Max 2 stacks. Can trigger once per 0.1s. When this effect reaches 2 stacks or the 2nd stack's duration is refreshed, increase all nearby party members' All Elemental DMG Bonus by 8% for every 1,000 DEF the equipping character has, up to a maximum of 25.6%, for 15s.",
    "tags": [
      "em",
      "team-buff",
      "def"
    ]
  },
  {
    "key": "PolarStar",
    "name": "Polar Star",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critRate_",
    "subStatValue": "33.1%",
    "passiveName": "Daylight's Augury",
    "passiveDesc": "Elemental Skill and Elemental Burst DMG increased by 12%. After a Normal Attack, Charged Attack, Elemental Skill or Elemental Burst hits an opponent, 1 stack of Ashen Nightstar will be gained for 12s. When 1/2/3/4 stacks of Ashen Nightstar are present, ATK is increased by 10/20/30/48%. The stack of Ashen Nightstar created by the Normal Attack, Charged Attack, Elemental Skill or Elemental Burst will be counted independently of the others.",
    "tags": [
      "crit",
      "em",
      "burst-buff",
      "skill-buff",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Worldbane.png"
  },
  {
    "key": "PortablePowerSaw",
    "name": "Portable Power Saw",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "hp_",
    "subStatValue": "55.1%",
    "passiveName": "Sea Shanty",
    "passiveDesc": "When the wielder is healed or heals others, they will gain a Stoic's Symbol that lasts 30s, up to a maximum of 3 Symbols. When using their Elemental Skill or Burst, all Symbols will be consumed and the Roused effect will be granted for 10s. For each Symbol consumed, gain 40 Elemental Mastery, and 2s after the effect occurs, 2 Energy per Symbol consumed will be restored for said character. The Roused effect can be triggered once every 15s, and Symbols can be gained even when the character is not on the field.",
    "tags": [
      "energy",
      "em",
      "skill-buff",
      "hp"
    ]
  },
  {
    "key": "Predator",
    "name": "Predator",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Strong Strike",
    "passiveDesc": "Effective only on the following platform: \n\"PlayStation®\"\nDealing Cryo DMG to opponents increases this character's Normal and Charged Attack DMG by 10% for 6s. This effect can have a maximum of 2 stacks. Additionally, when Aloy equips Predator, ATK is increased by 66.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Predator.png"
  },
  {
    "key": "PrimordialJadeCutter",
    "name": "Primordial Jade Cutter",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critRate_",
    "subStatValue": "44.1%",
    "passiveName": "Protector's Virtue",
    "passiveDesc": "HP increased by 20%. Additionally, provides an ATK Bonus based on 1.2% of the wielder's Max HP.",
    "tags": [
      "crit",
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Morax.png"
  },
  {
    "key": "PrimordialJadeWingedSpear",
    "name": "Primordial Jade Winged-Spear",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Eagle Spear of Justice",
    "passiveDesc": "On hit, increases ATK by 3.2% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 12%.",
    "tags": [
      "crit",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Morax.png"
  },
  {
    "key": "PrizedIsshinBlade",
    "name": "Prized Isshin Blade",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Wandering Striker",
    "passiveDesc": "When a Normal, Charged, or Plunging Attack hits an opponent, it will release an Accursed Spirit, dealing AoE DMG equal to 180% of ATK and restoring 100% of ATK as HP. This effect can be triggered once every 8s. The DMG done by this weapon's wielder is decreased by 50%.",
    "tags": [
      "hp",
      "atk"
    ]
  },
  {
    "key": "PrizedIsshinBlade",
    "name": "Prized Isshin Blade",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Wandering Striker",
    "passiveDesc": "When a Normal, Charged, or Plunging Attack hits an opponent, it will release an Accursed Spirit, dealing AoE DMG equal to 180% of ATK and restoring 100% of ATK as HP. This effect can be triggered once every 8s. The DMG done by this weapon's wielder is decreased by 50%.",
    "tags": [
      "hp",
      "atk"
    ]
  },
  {
    "key": "PrizedIsshinBlade",
    "name": "Prized Isshin Blade",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Wandering Striker",
    "passiveDesc": "When a Normal, Charged, or Plunging Attack hits an opponent, it will release an Accursed Spirit, dealing AoE DMG equal to 180% of ATK and restoring 100% of ATK as HP. This effect can be triggered once every 8s. The DMG done by this weapon's wielder is decreased by 50%.",
    "tags": [
      "hp",
      "atk"
    ]
  },
  {
    "key": "ProspectorSDrill",
    "name": "Prospector's Drill",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Masons' Ditty",
    "passiveDesc": "When the wielder is healed or heals others, they will gain a Unity's Symbol that lasts 30s, up to a maximum of 3 Symbols. When using their Elemental Skill or Burst, all Symbols will be consumed and the Struggle effect will be granted for 10s. For each Symbol consumed, gain 3% ATK and 7% All Elemental DMG Bonus. The Struggle effect can be triggered once every 15s, and Symbols can be gained even when the character is not on the field.",
    "tags": [
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "ProspectorSShovel",
    "name": "Prospector's Shovel",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Swift and Sure",
    "passiveDesc": "Electro-Charged DMG is increased by 48%, and Lunar-Charged DMG is increased by 12%. Moonsign: Ascendant Gleam: Lunar-Charged DMG is increased by an additional 12%.",
    "tags": [
      "atk"
    ]
  },
  {
    "key": "PrototypeAmber",
    "name": "Prototype Amber",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "hp_",
    "subStatValue": "41.3%",
    "passiveName": "Gilding",
    "passiveDesc": "Using an Elemental Burst regenerates 4 Energy every 2s for 6s. All party members will regenerate 4% HP every 2s for this duration.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "burst-buff",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Proto.png"
  },
  {
    "key": "PrototypeArchaic",
    "name": "Prototype Archaic",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Crush",
    "passiveDesc": "On hit, Normal or Charged Attacks have a 50% chance to deal an additional 240% ATK DMG to opponents within a small AoE. Can only occur once every 15s.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Proto.png"
  },
  {
    "key": "PrototypeCrescent",
    "name": "Prototype Crescent",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Unreturning",
    "passiveDesc": "Charged Attack hits on weak points increase Movement SPD by 10% and ATK by 36% for 10s.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Proto.png"
  },
  {
    "key": "PrototypeRancour",
    "name": "Prototype Rancour",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "physical_dmg_",
    "subStatValue": "34.5%",
    "passiveName": "Smashed Stone",
    "passiveDesc": "On hit, Normal or Charged Attacks increase ATK and DEF by 4% for 6s. Max 4 stacks. This effect can only occur once every 0.3s.",
    "tags": [
      "normal-buff",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Proto.png"
  },
  {
    "key": "PrototypeStarglitter",
    "name": "Prototype Starglitter",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Magic Affinity",
    "passiveDesc": "After using an Elemental Skill, increases Normal and Charged Attack DMG by 8% for 12s. Max 2 stacks.",
    "tags": [
      "energy",
      "em",
      "skill-buff",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Proto.png"
  },
  {
    "key": "RainbowSerpentSRainBow",
    "name": "Rainbow Serpent's Rain Bow",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Astral Whispers Beyond the Sacred Throne",
    "passiveDesc": "ATK is increased by 28% for 8s after the equipping character's attacks hit an opponent while the equipping character is off-field.",
    "tags": [
      "energy",
      "atk"
    ]
  },
  {
    "key": "Rainslasher",
    "name": "Rainslasher",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Bane of Storm and Tide",
    "passiveDesc": "Increases DMG against opponents affected by Hydro or Electro by 20%.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Perdue.png"
  },
  {
    "key": "RangeGauge",
    "name": "Range Gauge",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Masons' Ditty",
    "passiveDesc": "When the wielder is healed or heals others, they will gain a Unity's Symbol that lasts 30s, up to a maximum of 3 Symbols. When using their Elemental Skill or Burst, all Symbols will be consumed and the Struggle effect will be granted for 10s. For each Symbol consumed, gain 3% ATK and 7% All Elemental DMG Bonus. The Struggle effect can be triggered once every 15s, and Symbols can be gained even when the character is not on the field.",
    "tags": [
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "RavenBow",
    "name": "Raven Bow",
    "weaponType": "Bow",
    "rarity": 3,
    "baseAtk": 448,
    "subStatType": "eleMas",
    "subStatValue": "94",
    "passiveName": "Bane of Flame and Water",
    "passiveDesc": "Increases DMG against opponents affected by Hydro or Pyro by 12%.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Crowfeather.png"
  },
  {
    "key": "RecurveBow",
    "name": "Recurve Bow",
    "weaponType": "Bow",
    "rarity": 3,
    "baseAtk": 354,
    "subStatType": "hp_",
    "subStatValue": "46.9%",
    "passiveName": "Cull the Weak",
    "passiveDesc": "Defeating an opponent restores 8% HP.",
    "tags": [
      "hp",
      "def"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Curve.png"
  },
  {
    "key": "RedhornStonethresher",
    "name": "Redhorn Stonethresher",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Gokadaiou Otogibanashi",
    "passiveDesc": "DEF is increased by 28%. Normal and Charged Attack DMG is increased by 40% of DEF.",
    "tags": [
      "crit",
      "normal-buff",
      "def"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Itadorimaru.png"
  },
  {
    "key": "ReliquaryOfTruth",
    "name": "Reliquary of Truth",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Essence of Falsity",
    "passiveDesc": "CRIT Rate is increased by 8%. When the equipping character unleashes an Elemental Skill, they gain the Secret of Lies effect: Elemental Mastery is increased by 80 for 12s. When the equipping character deals Lunar-Bloom DMG to an opponent, they gain the Moon of Truth effect: CRIT DMG is increased by 24% for 4s. When both the Secret of Lies and Moon of Truth effects are active at the same time, the results of both effects will be increased by 50%.",
    "tags": [
      "crit",
      "em",
      "skill-buff"
    ]
  },
  {
    "key": "RightfulReward",
    "name": "Rightful Reward",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "hp_",
    "subStatValue": "27.6%",
    "passiveName": "Tip of the Spear",
    "passiveDesc": "When the wielder is healed, restore 8 Energy. This effect can be triggered once every 10s, and can occur even when the character is not on the field.",
    "tags": [
      "energy",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Vorpal.png"
  },
  {
    "key": "RingOfYaxche",
    "name": "Ring of Yaxche",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "hp_",
    "subStatValue": "41.3%",
    "passiveName": "Echoes of the Plentiful Land",
    "passiveDesc": "Using an Elemental Skill grants the Jade-Forged Crown effect: Every 1,000 Max HP will increase the Normal Attack DMG dealt by the equipping character by 0.6% for 10s. Normal Attack DMG can be increased this way by a maximum of 16%.",
    "tags": [
      "em",
      "skill-buff",
      "normal-buff",
      "hp"
    ]
  },
  {
    "key": "RoyalBow",
    "name": "Royal Bow",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Focus",
    "passiveDesc": "Upon damaging an opponent, increases CRIT Rate by 8%. Max 5 stacks. A CRIT Hit removes all stacks.",
    "tags": [
      "crit",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Theocrat.png"
  },
  {
    "key": "RoyalGreatsword",
    "name": "Royal Greatsword",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Focus",
    "passiveDesc": "Upon damaging an opponent, increases CRIT Rate by 8%. Max 5 stacks. A CRIT Hit removes all stacks.",
    "tags": [
      "crit",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Theocrat.png"
  },
  {
    "key": "RoyalGrimoire",
    "name": "Royal Grimoire",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Focus",
    "passiveDesc": "Upon damaging an opponent, increases CRIT Rate by 8%. Max 5 stacks. A CRIT Hit removes all stacks.",
    "tags": [
      "crit",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Theocrat.png"
  },
  {
    "key": "RoyalLongsword",
    "name": "Royal Longsword",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Focus",
    "passiveDesc": "Upon damaging an opponent, increases CRIT Rate by 8%. Max 5 stacks. A CRIT Hit removes all stacks.",
    "tags": [
      "crit",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Theocrat.png"
  },
  {
    "key": "RoyalSpear",
    "name": "Royal Spear",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Focus",
    "passiveDesc": "Upon damaging an opponent, increases CRIT Rate by 8%. Max 5 stacks. A CRIT Hit removes all stacks.",
    "tags": [
      "crit",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Theocrat.png"
  },
  {
    "key": "Rust",
    "name": "Rust",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Rapid Firing",
    "passiveDesc": "Increases Normal Attack DMG by 40% but decreases Charged Attack DMG by 10%.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Recluse.png"
  },
  {
    "key": "SacrificerSStaff",
    "name": "Sacrificer's Staff",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 620,
    "subStatType": "critRate_",
    "subStatValue": "9.2%",
    "passiveName": "Untainted Desire",
    "passiveDesc": "For 6s after an Elemental Skill hits an opponent, ATK is increased by 8% and Energy Recharge is increased by 6%. Max 3 stacks. This effect can be triggered even when the equipping character is off-field.",
    "tags": [
      "crit",
      "energy",
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "SacrificialBow",
    "name": "Sacrificial Bow",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Composed",
    "passiveDesc": "After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.",
    "tags": [
      "energy",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Fossil.png"
  },
  {
    "key": "SacrificialFragments",
    "name": "Sacrificial Fragments",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "eleMas",
    "subStatValue": "221",
    "passiveName": "Composed",
    "passiveDesc": "After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.",
    "tags": [
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Fossil.png"
  },
  {
    "key": "SacrificialGreatsword",
    "name": "Sacrificial Greatsword",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Composed",
    "passiveDesc": "After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.",
    "tags": [
      "energy",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Fossil.png"
  },
  {
    "key": "SacrificialJade",
    "name": "Sacrificial Jade",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "critRate_",
    "subStatValue": "36.8%",
    "passiveName": "Jade Circulation",
    "passiveDesc": "When not on the field for more than 5s, Max HP will be increased by 32% and Elemental Mastery will be increased by 40. These effects will be canceled after the wielder has been on the field for 10s.",
    "tags": [
      "crit",
      "em",
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Yue.png"
  },
  {
    "key": "SacrificialSword",
    "name": "Sacrificial Sword",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Composed",
    "passiveDesc": "After damaging an opponent with an Elemental Skill, the skill has a 40% chance to end its own CD. Can only occur once every 30s.",
    "tags": [
      "energy",
      "em",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Fossil.png"
  },
  {
    "key": "SapwoodBlade",
    "name": "Sapwood Blade",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Forest Sanctuary",
    "passiveDesc": "After triggering Burning, Quicken, Aggravate, Spread, Bloom, Lunar-Bloom, Hyperbloom, or Burgeon, a Leaf of Consciousness will be created around the character for a maximum of 10s. When picked up, the Leaf will grant the character 60 Elemental Mastery for 12s. Only 1 Leaf can be generated this way every 20s. This effect can still be triggered if the character is not on the field. The Leaf of Consciousness' effect cannot stack.",
    "tags": [
      "energy",
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Arakalari.png"
  },
  {
    "key": "ScionOfTheBlazingSun",
    "name": "Scion of the Blazing Sun",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "critRate_",
    "subStatValue": "18.4%",
    "passiveName": "The Way of Sunfire",
    "passiveDesc": "After a Charged Attack hits an opponent, a Sunfire Arrow will descend upon the opponent hit, dealing 60% ATK as DMG, and applying the Heartsearer effect to the opponent damaged by said Arrow for 10s. Opponents affected by Heartsearer take 28% more Charged Attack DMG from the wielder. A Sunfire Arrow can be triggered once every 10s.",
    "tags": [
      "crit",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Gurabad.png"
  },
  {
    "key": "SequenceOfSolitude",
    "name": "Sequence of Solitude",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "hp_",
    "subStatValue": "41.3%",
    "passiveName": "Silent Trigger",
    "passiveDesc": "When an attack hits an opponent, deal AoE DMG equal to 40% of Max HP at the target location. This effect can be triggered once every 15s.",
    "tags": [
      "hp"
    ]
  },
  {
    "key": "SerenitySCall",
    "name": "Serenity's Call",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Solemn Silence",
    "passiveDesc": "Upon causing an Elemental Reaction, increases Max HP by 16% for 12s. Moonsign: Ascendant Gleam: Max HP from this effect is further increased by 16%. This effect can be triggered even if the equipping character is off-field.",
    "tags": [
      "energy",
      "em",
      "hp"
    ]
  },
  {
    "key": "SerpentSpine",
    "name": "Serpent Spine",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Wavesplitter",
    "passiveDesc": "Every 4s a character is on the field, they will deal 6% more DMG and take 3% more DMG. This effect has a maximum of 5 stacks and will not be reset if the character leaves the field, but will be reduced by 1 stack when the character takes DMG.",
    "tags": [
      "crit"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Kione.png"
  },
  {
    "key": "SharpshooterSOath",
    "name": "Sharpshooter's Oath",
    "weaponType": "Bow",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "critDMG_",
    "subStatValue": "46.9%",
    "passiveName": "Precise",
    "passiveDesc": "Increases DMG against weak spots by 24%.",
    "tags": [
      "crit"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Arjuna.png"
  },
  {
    "key": "SilverLight",
    "name": "Silver Light",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Radiance on the Water",
    "passiveDesc": "Increases Elemental Mastery by 52 for 12s after Elemental Skill use. Max 2 stacks, and each stack's duration is independent of the others.",
    "tags": [
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "SilvershowerHeartstrings",
    "name": "Silvershower Heartstrings",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "hp_",
    "subStatValue": "66.2%",
    "passiveName": "Dryas's Nocturne",
    "passiveDesc": "The equipping character can gain the Remedy effect. When they possess 1/2/3 Remedy stacks, Max HP will increase by 12%/24%/40%. 1 stack may be gained when the following conditions are met: 1 stack for 25s when using an Elemental Skill; 1 stack for 25s when the value of a Bond of Life value increases; 1 stack for 20s for performing healing. Stacks can still be triggered when the equipping character is not on the field. Each stack's duration is counted independently. In addition, when 3 stacks are active, Elemental Burst CRIT Rate will be increased by 28%. This effect will be canceled 4s after falling under 3 stacks.",
    "tags": [
      "crit",
      "em",
      "burst-buff",
      "skill-buff",
      "hp"
    ]
  },
  {
    "key": "SkyriderGreatsword",
    "name": "Skyrider Greatsword",
    "weaponType": "Claymore",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "physical_dmg_",
    "subStatValue": "43.9%",
    "passiveName": "Courage",
    "passiveDesc": "On hit, Normal or Charged Attacks increase ATK by 6% for 6s. Max 4 stacks. Can occur once every 0.5s.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Mitsurugi.png"
  },
  {
    "key": "SkyriderSword",
    "name": "Skyrider Sword",
    "weaponType": "Sword",
    "rarity": 3,
    "baseAtk": 354,
    "subStatType": "enerRech_",
    "subStatValue": "52.1%",
    "passiveName": "Determination",
    "passiveDesc": "Using an Elemental Burst grants a 12% increase in ATK and Movement SPD for 15s.",
    "tags": [
      "energy",
      "em",
      "burst-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Mitsurugi.png"
  },
  {
    "key": "SkywardAtlas",
    "name": "Skyward Atlas",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "atk_",
    "subStatValue": "33.1%",
    "passiveName": "Wandering Clouds",
    "passiveDesc": "Increases Elemental DMG Bonus by 12%. Normal Attack hits have a 50% chance to earn the favor of the clouds, which actively seek out nearby opponents to attack for 15s, dealing 160% ATK DMG. Can only occur once every 30s.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Dvalin.png"
  },
  {
    "key": "SkywardBlade",
    "name": "Skyward Blade",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "enerRech_",
    "subStatValue": "55.1%",
    "passiveName": "Sky-Piercing Fang",
    "passiveDesc": "CRIT Rate increased by 4%. Gains Skypiercing Might upon using an Elemental Burst: Increases Movement SPD by 10%, increases ATK SPD by 10%, and Normal and Charged hits deal additional DMG equal to 20% of ATK. Skypiercing Might lasts for 12s.",
    "tags": [
      "crit",
      "energy",
      "em",
      "burst-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Dvalin.png"
  },
  {
    "key": "SkywardHarp",
    "name": "Skyward Harp",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Echoing Ballad",
    "passiveDesc": "Increases CRIT DMG by 20%. Hits have a 60% chance to inflict a small AoE attack, dealing 125% Physical ATK DMG. Can only occur once every 4s.",
    "tags": [
      "crit",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Dvalin.png"
  },
  {
    "key": "SkywardPride",
    "name": "Skyward Pride",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "enerRech_",
    "subStatValue": "36.8%",
    "passiveName": "Sky-ripping Dragon Spine",
    "passiveDesc": "Increases all DMG by 8%. After using an Elemental Burst, a vacuum blade that does 80% of ATK as DMG to opponents along its path will be created when Normal or Charged Attacks hit. Lasts for 20s or 8 vacuum blades.",
    "tags": [
      "energy",
      "em",
      "burst-buff",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Dvalin.png"
  },
  {
    "key": "SkywardSpine",
    "name": "Skyward Spine",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "enerRech_",
    "subStatValue": "36.8%",
    "passiveName": "Black Wing",
    "passiveDesc": "Increases CRIT Rate by 8% and increases Normal ATK SPD by 12%. Additionally, Normal and Charged Attacks hits on opponents have a 50% chance to trigger a vacuum blade that deals 40% of ATK as DMG in a small AoE. This effect can occur no more than once every 2s.",
    "tags": [
      "crit",
      "energy",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Dvalin.png"
  },
  {
    "key": "Slingshot",
    "name": "Slingshot",
    "weaponType": "Bow",
    "rarity": 3,
    "baseAtk": 354,
    "subStatType": "critRate_",
    "subStatValue": "31.2%",
    "passiveName": "Slingshot",
    "passiveDesc": "If a Normal or Charged Attack hits a target within 0.3s of being fired, increases DMG by 36%. Otherwise, decreases DMG by 10%.",
    "tags": [
      "crit",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Sling.png"
  },
  {
    "key": "SnareHook",
    "name": "Snare Hook",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Phantom Flash",
    "passiveDesc": "Upon causing an Elemental Reaction, increases Elemental Mastery by 60 for 12s. Moonsign: Ascendant Gleam: Elemental Mastery from this effect is further increased by 60. This effect can be triggered even if the equipping character is off-field.",
    "tags": [
      "energy",
      "em"
    ]
  },
  {
    "key": "SnowTombedStarsilver",
    "name": "Snow-Tombed Starsilver",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "physical_dmg_",
    "subStatValue": "34.5%",
    "passiveName": "Frost Burial",
    "passiveDesc": "Hitting an opponent with Normal and Charged Attacks has a 60% chance of forming and dropping an Everfrost Icicle above them, dealing AoE DMG equal to 80% of ATK. Opponents affected by Cryo are instead dealt DMG equal to 200% of ATK. Can only occur once every 10s.",
    "tags": [
      "em",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Dragonfell.png"
  },
  {
    "key": "SolarPearl",
    "name": "Solar Pearl",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Solar Shine",
    "passiveDesc": "Normal Attack hits increase Elemental Skill and Elemental Burst DMG by 20% for 6s. Likewise, Elemental Skill or Elemental Burst hits increase Normal Attack DMG by 20% for 6s.",
    "tags": [
      "crit",
      "em",
      "burst-buff",
      "skill-buff",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Resurrection.png"
  },
  {
    "key": "SongOfBrokenPines",
    "name": "Song of Broken Pines",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 741,
    "subStatType": "physical_dmg_",
    "subStatValue": "20.7%",
    "passiveName": "Rebel's Banner-Hymn",
    "passiveDesc": "A part of the \"Millennial Movement\" that wanders amidst the winds. Increases ATK by 16%, and when Normal or Charged Attacks hit opponents, the character gains a Sigil of Whispers. This effect can be triggered once every 0.3s. When you possess 4 Sigils of Whispers, all of them will be consumed and all nearby party members will obtain the \"Millennial Movement: Banner-Hymn\" effect for 12s. \"Millennial Movement: Banner-Hymn\" increases Normal ATK SPD by 12% and increases ATK by 20%. Once this effect is triggered, you will not gain Sigils of Whispers for 20s. Of the many effects of the \"Millennial Movement,\" buffs of the same type will not stack.",
    "tags": [
      "em",
      "team-buff",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Widsith.png"
  },
  {
    "key": "SongOfStillness",
    "name": "Song of Stillness",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Benthic Pulse",
    "passiveDesc": "After the wielder is healed, they will deal 16% more DMG for 8s. This can be triggered even when the character is not on the field.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Vorpal.png"
  },
  {
    "key": "SongOfTheVigil",
    "name": "Song of the Vigil",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "eleMas",
    "subStatValue": "110",
    "passiveName": "Cadence of Days Gone By",
    "passiveDesc": "Triggering an Elemental Reaction regenerates 4 Elemental Energy for the equipping character. This effect can trigger once every 9s. On the other hand, triggering a Stellar Glimmer reaction increases their ATK by 20% for 12s. The aforementioned effects can trigger even when the character is not on the field.",
    "tags": [
      "energy",
      "em",
      "atk"
    ]
  },
  {
    "key": "SplendorOfTranquilWaters",
    "name": "Splendor of Tranquil Waters",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Dawn and Dusk by the Lake",
    "passiveDesc": "When the equipping character's current HP increases or decreases, Elemental Skill DMG dealt will be increased by 8% for 6s. Max 3 stacks. This effect can be triggered once every 0.2s. When other party members' current HP increases or decreases, the equipping character's Max HP will be increased by 14% for 6s. Max 2 stacks. This effect can be triggered once every 0.2s. The aforementioned effects can be triggered even if the wielder is off-field.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "skill-buff",
      "hp"
    ]
  },
  {
    "key": "StaffOfHoma",
    "name": "Staff of Homa",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critDMG_",
    "subStatValue": "66.2%",
    "passiveName": "Reckless Cinnabar",
    "passiveDesc": "HP increased by 20%. Additionally, provides an ATK Bonus based on 0.8% of the wielder's Max HP. When the wielder's HP is less than 50%, this ATK Bonus is increased by an additional 1% of Max HP.",
    "tags": [
      "crit",
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Homa.png"
  },
  {
    "key": "StaffOfTheScarletSands",
    "name": "Staff of the Scarlet Sands",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critRate_",
    "subStatValue": "44.1%",
    "passiveName": "Heat Haze at Horizon's End",
    "passiveDesc": "The equipping character gains 52% of their Elemental Mastery as bonus ATK. When an Elemental Skill hits opponents, the Dream of the Scarlet Sands effect will be gained for 10s: The equipping character will gain 28% of their Elemental Mastery as bonus ATK. Max 3 stacks.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Deshret.png"
  },
  {
    "key": "StarcallerSWatch",
    "name": "Starcaller's Watch",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "eleMas",
    "subStatValue": "265",
    "passiveName": "Offering Unto Wind and Sun",
    "passiveDesc": "Increases Elemental Mastery by 100. Gain the \"Mirror of Night\" effect within 15s after the equipping character creates a shield: The current active party member deals 28% increased DMG to nearby opponents. You can gain the \"Mirror of Night\" effect once every 14s.",
    "tags": [
      "em",
      "team-buff"
    ]
  },
  {
    "key": "StarsealedEdict",
    "name": "Starsealed Edict",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Dawnstar's Flowing Trail",
    "passiveDesc": "Increases CRIT DMG by 24%. The equipping character gains the Crystal Compounding effect when they use their Elemental Skill, increasing Elemental Mastery by 48 for 20s. During this time, the equipping character gains a Law of Combustion stack when a nearby party member triggers an Elemental Reaction. Each stack increases Elemental Mastery by an additional 24. Max 3 stacks. These stacks last until Crystal Compounding ends or the equipping character uses their Elemental Skill again.\nRadiance: Stellar-Conduct: Each Law of Combustion stack also increases the equipping character's Stellar-Conduct CRIT DMG by 12%.\nThese effects can be triggered even when the equipping character is off-field.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "skill-buff"
    ]
  },
  {
    "key": "SturdyBone",
    "name": "Sturdy Bone",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "atk_",
    "subStatValue": "27.6%",
    "passiveName": "Trapper's Pride",
    "passiveDesc": "Sprint or Alternate Sprint Stamina Consumption decreased by 15%. Additionally, after using Sprint or Alternate Sprint, Normal Attack DMG is increased by 16% of ATK. This effect expires after triggering 18 times or 7s.",
    "tags": [
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "SummitShaper",
    "name": "Summit Shaper",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "atk_",
    "subStatValue": "49.6%",
    "passiveName": "Golden Majesty",
    "passiveDesc": "Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Kunwu.png"
  },
  {
    "key": "SunnyMorningSleepIn",
    "name": "Sunny Morning Sleep-In",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "eleMas",
    "subStatValue": "265",
    "passiveName": "Bathhouses, Hawks, and Narukami",
    "passiveDesc": "Elemental Mastery increases by 120 for 6s after triggering Swirl or Stellar Swirl. Elemental Mastery increases by 96 for 9s after the wielder's Elemental Skill hits an opponent. Elemental Mastery increases by 32 for 30s after the wielder's Elemental Burst hits an opponent.",
    "tags": [
      "em",
      "burst-buff",
      "skill-buff"
    ]
  },
  {
    "key": "SurfSUp",
    "name": "Surf's Up",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Aqua Remembrance",
    "passiveDesc": "Max HP increased by 20%. Once every 15s, for the 14s after using an Elemental Skill: Gain 4 Scorching Summer stacks. Each stack increases Normal Attack DMG by 12%. For the duration of the effect, once every 1.5s, lose 1 stack after a Normal Attack hits an opponent; once every 1.5s, gain 1 stack after triggering a Vaporize reaction on an opponent. Max 4 Scorching Summer stacks.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "normal-buff",
      "hp"
    ]
  },
  {
    "key": "SwordOfDescension",
    "name": "Sword of Descension",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 440,
    "subStatType": "atk_",
    "subStatValue": "35.2%",
    "passiveName": "Descension",
    "passiveDesc": "Effective only on the following platform: \n\"PlayStation®\"\nHitting opponents with Normal and Charged Attacks grants a 50% chance to deal 200% ATK as DMG in a small AoE. This effect can only occur once every 10s. Additionally, if the Traveler equips the Sword of Descension, their ATK is increased by 66.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Psalmus.png"
  },
  {
    "key": "SwordOfNarzissenkreuz",
    "name": "Sword of Narzissenkreuz",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Hero's Blade",
    "passiveDesc": "When the equipping character does not have an Arkhe: When Normal Attacks, Charged Attacks, or Plunging Attacks strike, a Pneuma or Ousia energy blast will be unleashed, dealing 160% of ATK as DMG. This effect can be triggered once every 12s. The energy blast type is determined by the current type of the Sword of Narzissenkreuz.",
    "tags": [
      "energy",
      "normal-buff",
      "atk"
    ]
  },
  {
    "key": "SymphonistOfScents",
    "name": "Symphonist of Scents",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critDMG_",
    "subStatValue": "66.2%",
    "passiveName": "Seasoned Symphony",
    "passiveDesc": "ATK is increased by 12%. When the equipping character is off-field, ATK is increased by an additional 12%. After initiating healing, the equipping character and the character(s) they have healed will obtain the \"Sweet Echoes\" effect, increasing their ATK by 32% for 3s. This effect can be triggered even if the equipping character is off-field.",
    "tags": [
      "crit",
      "atk"
    ]
  },
  {
    "key": "TalkingStick",
    "name": "Talking Stick",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "critRate_",
    "subStatValue": "18.4%",
    "passiveName": "\"The Silver Tongue\"",
    "passiveDesc": "ATK will be increased by 16% for 15s after being affected by Pyro. This effect can be triggered once every 12s. All Elemental DMG Bonus will be increased by 12% for 15s after being affected by Hydro, Cryo, Electro, or Dendro. This effect can be triggered once every 12s.",
    "tags": [
      "crit",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_BeastTamer.png"
  },
  {
    "key": "TamayurateiNoOhanashi",
    "name": "Tamayuratei no Ohanashi",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Busybody's Running Light",
    "passiveDesc": "Increase ATK by 20% and Movement SPD by 10% for 10s when using an Elemental Skill.",
    "tags": [
      "energy",
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "TheAlleyFlash",
    "name": "The Alley Flash",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 620,
    "subStatType": "eleMas",
    "subStatValue": "55",
    "passiveName": "Itinerant Hero",
    "passiveDesc": "Increases DMG dealt by the character equipping this weapon by 12%. Taking DMG disables this effect for 5s.",
    "tags": [
      "em"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Outlaw.png"
  },
  {
    "key": "TheBell",
    "name": "The Bell",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "hp_",
    "subStatValue": "41.3%",
    "passiveName": "Rebellious Guardian",
    "passiveDesc": "Taking DMG generates a shield which absorbs DMG up to 20% of Max HP. This shield lasts for 10s or until broken, and can only be triggered once every 45s. While protected by a shield, the character gains 12% increased DMG.",
    "tags": [
      "hp"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Troupe.png"
  },
  {
    "key": "TheBlackSword",
    "name": "The Black Sword",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Justice",
    "passiveDesc": "Increases DMG dealt by Normal and Charged Attacks by 20%. Additionally, regenerates 60% of ATK as HP when Normal and Charged Attacks score a CRIT Hit. This effect can occur once every 5s.",
    "tags": [
      "crit",
      "normal-buff",
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Bloodstained.png"
  },
  {
    "key": "TheCatch",
    "name": "\"The Catch\"",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "enerRech_",
    "subStatValue": "45.9%",
    "passiveName": "Shanty",
    "passiveDesc": "Increases Elemental Burst DMG by 16% and Elemental Burst CRIT Rate by 6%.",
    "tags": [
      "crit",
      "energy",
      "em",
      "burst-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Mori.png"
  },
  {
    "key": "TheDaybreakChronicles",
    "name": "The Daybreak Chronicles",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critDMG_",
    "subStatValue": "44.1%",
    "passiveName": "Ode Beyond Time",
    "passiveDesc": "The equipping character gains Stirring Dawn Breeze: 3s after leaving combat, Normal Attack, Elemental Skill, and Elemental Burst DMG is increased by 60%. While in combat, this DMG Bonus will decrease by 10% per second until it reaches 0%. When the equipping character's Normal Attacks, Elemental Skills, or Elemental Bursts hit an opponent, the DMG Bonus for the corresponding DMG type is increased by 10% until it reaches 60%. This effect can be triggered once every 0.1s for each of the attack types mentioned above. This effect can be triggered even if the equipping character is off-field.\nAdditionally, when the party possesses Hexerei: Secret Rite effects, when the equipping character's Normal Attacks, Elemental Skills, or Elemental Bursts hit an opponent, the DMG Bonus for all these DMG types is increased by 20% instead.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "burst-buff",
      "skill-buff",
      "normal-buff"
    ]
  },
  {
    "key": "TheDockhandSAssistant",
    "name": "The Dockhand's Assistant",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "hp_",
    "subStatValue": "41.3%",
    "passiveName": "Sea Shanty",
    "passiveDesc": "When the wielder is healed or heals others, they will gain a Stoic's Symbol that lasts 30s, up to a maximum of 3 Symbols. When using their Elemental Skill or Burst, all Symbols will be consumed and the Roused effect will be granted for 10s. For each Symbol consumed, gain 40 Elemental Mastery, and 2s after the effect occurs, 2 Energy per Symbol consumed will be restored for said character. The Roused effect can be triggered once every 15s, and Symbols can be gained even when the character is not on the field.",
    "tags": [
      "energy",
      "em",
      "skill-buff",
      "hp"
    ]
  },
  {
    "key": "TheFirstGreatMagic",
    "name": "The First Great Magic",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critDMG_",
    "subStatValue": "66.2%",
    "passiveName": "Parsifal the Great",
    "passiveDesc": "DMG dealt by Charged Attacks increased by 16%. For every party member with the same Elemental Type as the wielder (including the wielder themselves), gain 1 Gimmick stack. For every party member with a different Elemental Type from the wielder, gain 1 Theatrics stack. When the wielder has 1/2/3 or more Gimmick stacks, ATK will be increased by 16%/32%/48%. When the wielder has 1/2/3 or more Theatrics stacks, Movement SPD will be increased by 4%/7%/10%.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Pledge.png"
  },
  {
    "key": "TheFlute",
    "name": "The Flute",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "Chord",
    "passiveDesc": "Normal or Charged Attacks grant a Harmonic on hits. Gaining 5 Harmonics triggers the power of music and deals 100% ATK DMG to surrounding opponents. Harmonics last up to 30s, and a maximum of 1 can be gained every 0.5s.",
    "tags": [
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Troupe.png"
  },
  {
    "key": "TheStringless",
    "name": "The Stringless",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Arrowless Song",
    "passiveDesc": "Increases Elemental Skill and Elemental Burst DMG by 24%.",
    "tags": [
      "em",
      "burst-buff",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Troupe.png"
  },
  {
    "key": "TheUnforged",
    "name": "The Unforged",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "atk_",
    "subStatValue": "49.6%",
    "passiveName": "Golden Majesty",
    "passiveDesc": "Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Kunwu.png"
  },
  {
    "key": "TheViridescentHunt",
    "name": "The Viridescent Hunt",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Verdant Wind",
    "passiveDesc": "Upon hit, Normal and Charged Attacks have a 50% chance to generate a Cyclone, which will continuously attract surrounding opponents, dealing 40% of ATK as DMG to these opponents every 0.5s for 4s. This effect can only occur once every 14s.",
    "tags": [
      "crit",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Viridescent.png"
  },
  {
    "key": "TheWidsith",
    "name": "The Widsith",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critDMG_",
    "subStatValue": "55.1%",
    "passiveName": "Debut",
    "passiveDesc": "When the character takes the field, they will gain a random theme song for 10s. This can only occur once every 30s. Recitative: ATK is increased by 60%. Aria: Increases all Elemental DMG by 48%. Interlude: Elemental Mastery is increased by 240.",
    "tags": [
      "crit",
      "em",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Troupe.png"
  },
  {
    "key": "ThrillingTalesOfDragonSlayers",
    "name": "Thrilling Tales of Dragon Slayers",
    "weaponType": "Catalyst",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "hp_",
    "subStatValue": "35.2%",
    "passiveName": "Heritage",
    "passiveDesc": "When switching characters, the new character taking the field has their ATK increased by 24% for 10s. This effect can only occur once every 20s.",
    "tags": [
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Pulpfic.png"
  },
  {
    "key": "ThunderingPulse",
    "name": "Thundering Pulse",
    "weaponType": "Bow",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "critDMG_",
    "subStatValue": "66.2%",
    "passiveName": "Rule by Thunder",
    "passiveDesc": "Increases ATK by 20% and grants the might of the Thunder Emblem. At stack levels 1/2/3, the Thunder Emblem increases Normal Attack DMG by 12/24/40%. The character will obtain 1 stack of Thunder Emblem in each of the following scenarios: Normal Attack deals DMG (stack lasts 5s), casting Elemental Skill (stack lasts 10s); Energy is less than 100% (stack disappears when Energy is full). Each stack's duration is calculated independently.",
    "tags": [
      "crit",
      "energy",
      "em",
      "skill-buff",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Narukami.png"
  },
  {
    "key": "TidalShadow",
    "name": "Tidal Shadow",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "atk_",
    "subStatValue": "41.3%",
    "passiveName": "White Cruising Wave",
    "passiveDesc": "After the wielder is healed, ATK will be increased by 24% for 8s. This can be triggered even when the character is not on the field.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Vorpal.png"
  },
  {
    "key": "TomeOfTheEternalFlow",
    "name": "Tome of the Eternal Flow",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Aeon Wave",
    "passiveDesc": "HP is increased by 16%. When current HP increases or decreases, Charged Attack DMG will be increased by 14% for 4s. Max 3 stacks. This effect can be triggered once every 0.3s. When the character has 3 stacks or a third stack's duration refreshes, 8 Energy will be restored. This Energy restoration effect can be triggered once every 12s.",
    "tags": [
      "crit",
      "energy",
      "normal-buff",
      "hp"
    ]
  },
  {
    "key": "ToukabouShigure",
    "name": "Toukabou Shigure",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Kaidan: Rainfall Earthbinder",
    "passiveDesc": "After an attack hits opponents, it will inflict an instance of Cursed Parasol upon one of them for 10s. This effect can be triggered once every 15s. If this opponent is defeated during Cursed Parasol's duration, Cursed Parasol's CD will be refreshed immediately. The character wielding this weapon will deal 16% more DMG to the opponent affected by Cursed Parasol.",
    "tags": [
      "em",
      "def"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Kasabouzu.png"
  },
  {
    "key": "TravelerSHandySword",
    "name": "Traveler's Handy Sword",
    "weaponType": "Sword",
    "rarity": 3,
    "baseAtk": 448,
    "subStatType": "def_",
    "subStatValue": "29.3%",
    "passiveName": "Journey",
    "passiveDesc": "Each Elemental Orb or Particle collected restores 1% HP.",
    "tags": [
      "em",
      "hp",
      "def"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Traveler.png"
  },
  {
    "key": "TulaytullahSRemembrance",
    "name": "Tulaytullah's Remembrance",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critDMG_",
    "subStatValue": "44.1%",
    "passiveName": "Bygone Azure Teardrop",
    "passiveDesc": "Normal Attack SPD is increased by 10%. After the wielder unleashes an Elemental Skill, Normal Attack DMG will increase by 4.8% every second for 14s. After hitting an opponent with a Normal Attack during this duration, Normal Attack DMG will be increased by 9.6%. This increase can be triggered once every 0.3s. The maximum Normal Attack DMG increase per single duration of the overall effect is 48%. The effect will be removed when the wielder leaves the field, and using the Elemental Skill again will reset all DMG buffs.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Alaya.png"
  },
  {
    "key": "TwinNephrite",
    "name": "Twin Nephrite",
    "weaponType": "Catalyst",
    "rarity": 3,
    "baseAtk": 448,
    "subStatType": "critRate_",
    "subStatValue": "15.6%",
    "passiveName": "Guerilla Tactics",
    "passiveDesc": "Defeating an opponent increases Movement SPD and ATK by 12% for 15s.",
    "tags": [
      "crit",
      "em",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Phoney.png"
  },
  {
    "key": "UltimateOverlordSMegaMagicSword",
    "name": "\"Ultimate Overlord's Mega Magic Sword\"",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Melussistance!",
    "passiveDesc": "ATK increased by 12%. That's not all! The support from all Melusines you've helped in Merusea Village fills you with strength! Based on the number of them you've helped, your ATK is increased by up to an additional 12%.",
    "tags": [
      "energy",
      "em",
      "atk"
    ]
  },
  {
    "key": "UrakuMisugiri",
    "name": "Uraku Misugiri",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 542,
    "subStatType": "critDMG_",
    "subStatValue": "88.2%",
    "passiveName": "Brocade Bloom, Shrine Sword",
    "passiveDesc": "Normal Attack DMG is increased by 16% and Elemental Skill DMG is increased by 24%. After a nearby active character deals Geo DMG, the aforementioned effects increase by 100% for 15s. Additionally, the wielder's DEF is increased by 20%.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "normal-buff",
      "def"
    ]
  },
  {
    "key": "Verdict",
    "name": "Verdict",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Many Oaths of Dawn and Dusk",
    "passiveDesc": "Increases ATK by 20%. When party members obtain Elemental Shards from Crystallize or trigger Lunar-Crystallize reactions, the equipping character will gain 1 Seal, increasing Elemental Skill DMG by 18%. The Seal lasts for 15s, and the equipper may have up to 2 Seals at once. All of the equipper's Seals will disappear 0.2s after their Elemental Skill deals DMG. Up to 1 Seal may be obtained every second through the Lunar-Crystallize reaction.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "VividNotions",
    "name": "Vivid Notions",
    "weaponType": "Catalyst",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critDMG_",
    "subStatValue": "44.1%",
    "passiveName": "Falling Rainbow's Wish",
    "passiveDesc": "ATK is increased by 28%. When you use a Plunging Attack, you will gain the \"Dawn's First Hue\" effect: Plunging Attack CRIT DMG is increased by 28%. When you use an Elemental Skill or Burst, you will gain the \"Twilight's Splendor\" effect: Plunging Attack CRIT DMG is increased by 40%. The two effects above each last for 15s, and will be canceled 0.1s after the ground impact hits a target.",
    "tags": [
      "crit",
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "VortexVanquisher",
    "name": "Vortex Vanquisher",
    "weaponType": "Polearm",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "atk_",
    "subStatValue": "49.6%",
    "passiveName": "Golden Majesty",
    "passiveDesc": "Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%.",
    "tags": [
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Kunwu.png"
  },
  {
    "key": "WanderingEvenstar",
    "name": "Wandering Evenstar",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Wildling Nightstar",
    "passiveDesc": "The following effect will trigger every 10s: The equipping character will gain 24% of their Elemental Mastery as bonus ATK for 12s, with nearby party members gaining 30% of this buff for the same duration. Multiple instances of this weapon can allow this buff to stack. This effect will still trigger even if the character is not on the field.",
    "tags": [
      "em",
      "team-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Pleroma.png"
  },
  {
    "key": "WavebreakerSFin",
    "name": "Wavebreaker's Fin",
    "weaponType": "Polearm",
    "rarity": 4,
    "baseAtk": 620,
    "subStatType": "atk_",
    "subStatValue": "13.8%",
    "passiveName": "Watatsumi Wavewalker",
    "passiveDesc": "For every point of the entire party's combined maximum Energy capacity, the Elemental Burst DMG of the character equipping this weapon is increased by 0.12%. A maximum of 40% increased Elemental Burst DMG can be achieved this way.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "burst-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Maria.png"
  },
  {
    "key": "WaveridingWhirl",
    "name": "Waveriding Whirl",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 454,
    "subStatType": "enerRech_",
    "subStatValue": "61.3%",
    "passiveName": "Fangs Flying To and Fro",
    "passiveDesc": "Decreases Swimming Stamina consumption by 15%. In addition, for 10s after using an Elemental Skill, Max HP is increased by 20%. For every Hydro Elemental Type character in the party, Max HP is increased by another 12%, and the maximum increase that can be achieved in this way is 24%. Can be triggered once every 15s.",
    "tags": [
      "energy",
      "em",
      "team-buff",
      "skill-buff",
      "hp"
    ]
  },
  {
    "key": "Whiteblind",
    "name": "Whiteblind",
    "weaponType": "Claymore",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "def_",
    "subStatValue": "51.7%",
    "passiveName": "Infusion Blade",
    "passiveDesc": "On hit, Normal or Charged Attacks increase ATK and DEF by 6% for 6s. Max 4 stacks. This effect can only occur once every 0.5s.",
    "tags": [
      "normal-buff",
      "def",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Exotic.png"
  },
  {
    "key": "WhiteIronGreatsword",
    "name": "White Iron Greatsword",
    "weaponType": "Claymore",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "def_",
    "subStatValue": "43.9%",
    "passiveName": "Cull the Weak",
    "passiveDesc": "Defeating an opponent restores 8% HP.",
    "tags": [
      "hp",
      "def"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Tin.png"
  },
  {
    "key": "WhitelakeFrostfeather",
    "name": "Whitelake Frostfeather",
    "weaponType": "Sword",
    "rarity": 5,
    "baseAtk": 674,
    "subStatType": "critRate_",
    "subStatValue": "22.1%",
    "passiveName": "Snow Swan's Finale",
    "passiveDesc": "When the equipping character hits an opponent with their Elemental Skill, they gain \"Lake-Hued Lament\": ATK increases by 8% for 8s. This effect can trigger once every 0.1s. Max 3 stacks, and each stack's duration is independent. At 3 stacks, the CRIT DMG of any Stellar Glimmer reaction DMG caused by the equipping character is increased by 50%, and triggering Stellar Glimmer reactions or Stellar Glimmer reaction DMG will also restore 4 Elemental Energy to the character. This Energy recovery effect can trigger once every 3.5s. Can be triggered even when the equipping character is off-field.",
    "tags": [
      "crit",
      "energy",
      "em",
      "skill-buff",
      "atk"
    ]
  },
  {
    "key": "WhiteTassel",
    "name": "White Tassel",
    "weaponType": "Polearm",
    "rarity": 3,
    "baseAtk": 401,
    "subStatType": "critRate_",
    "subStatValue": "23.4%",
    "passiveName": "Sharp",
    "passiveDesc": "Increases Normal Attack DMG by 24%.",
    "tags": [
      "crit",
      "normal-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Pole_Ruby.png"
  },
  {
    "key": "WindblumeOde",
    "name": "Windblume Ode",
    "weaponType": "Bow",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Windblume Wish",
    "passiveDesc": "After using an Elemental Skill, receive a boon from the ancient wish of the Windblume, increasing ATK by 16% for 6s.",
    "tags": [
      "em",
      "skill-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Bow_Fleurfair.png"
  },
  {
    "key": "WineAndSong",
    "name": "Wine and Song",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 565,
    "subStatType": "enerRech_",
    "subStatValue": "30.6%",
    "passiveName": "Ever-Changing",
    "passiveDesc": "Hitting an opponent with a Normal Attack decreases the Stamina consumption of Sprint or Alternate Sprint by 14% for 5s. Additionally, using a Sprint or Alternate Sprint ability increases ATK by 20% for 5s.",
    "tags": [
      "energy",
      "normal-buff",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Outlaw.png"
  },
  {
    "key": "WinterSHeavyHeart",
    "name": "Winter's Heavy Heart",
    "weaponType": "Catalyst",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critDMG_",
    "subStatValue": "55.1%",
    "passiveName": "Secrets of Frost",
    "passiveDesc": "The equipping character gains \"Silver-Tinged Blood Pact\": The equipping character's Elemental Mastery is increased by 24 for every Cryo character present in the party. For every Electro character present in the party, the equipping character's ATK is increased by 4.8%. Up to 4 Cryo or Electro characters can provide the above buffs.\nRadiance: Stellar Glimmer: The effect of Silver-Tinged Blood Pact is changed to: For every Cryo or Electro character present in the party, the equipping character gains a 20-point Elemental Mastery boost and deals 6% increased Stellar Glimmer reaction DMG.",
    "tags": [
      "crit",
      "em",
      "team-buff",
      "atk"
    ]
  },
  {
    "key": "WolfFang",
    "name": "Wolf-Fang",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "critRate_",
    "subStatValue": "27.6%",
    "passiveName": "Northwind Wolf",
    "passiveDesc": "DMG dealt by Elemental Skill and Elemental Burst is increased by 16%. When an Elemental Skill hits an opponent, its CRIT Rate will be increased by 2%. When an Elemental Burst hits an opponent, its CRIT Rate will be increased by 2%. Both of these effects last 10s separately, have 4 max stacks, and can be triggered once every 0.1s.",
    "tags": [
      "crit",
      "em",
      "burst-buff",
      "skill-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Boreas.png"
  },
  {
    "key": "WolfSGravestone",
    "name": "Wolf's Gravestone",
    "weaponType": "Claymore",
    "rarity": 5,
    "baseAtk": 608,
    "subStatType": "atk_",
    "subStatValue": "49.6%",
    "passiveName": "Wolfish Tracker",
    "passiveDesc": "Increases ATK by 20%. On hit, attacks against opponents with less than 30% HP increase all party members' ATK by 40% for 12s. Can only occur once every 30s.",
    "tags": [
      "em",
      "team-buff",
      "hp",
      "atk"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Claymore_Wolfmound.png"
  },
  {
    "key": "XiphosMoonlight",
    "name": "Xiphos' Moonlight",
    "weaponType": "Sword",
    "rarity": 4,
    "baseAtk": 510,
    "subStatType": "eleMas",
    "subStatValue": "165",
    "passiveName": "Jinni's Whisper",
    "passiveDesc": "The following effect will trigger every 10s: The equipping character will gain 0.036% Energy Recharge for each point of Elemental Mastery they possess for 12s, with nearby party members gaining 30% of this buff for the same duration. Multiple instances of this weapon can allow this buff to stack. This effect will still trigger even if the character is not on the field.",
    "tags": [
      "energy",
      "em",
      "team-buff"
    ],
    "icon": "https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Pleroma.png"
  }
];

export const WEAPONS_BY_KEY: Record<string, WeaponData> = {};
export const CANONICAL_WEAPON_MAP: Map<string, WeaponData> = new Map();
export const WEAPONS_BY_TYPE: Record<WeaponType, WeaponData[]> = {
  Sword: [],
  Claymore: [],
  Polearm: [],
  Bow: [],
  Catalyst: [],
};

for (const weapon of WEAPONS_DATA) {
  WEAPONS_BY_KEY[weapon.key] = weapon;
  CANONICAL_WEAPON_MAP.set(normalizeWeaponKey(weapon.key), weapon);
  CANONICAL_WEAPON_MAP.set(normalizeWeaponKey(weapon.name), weapon);
  if (WEAPONS_BY_TYPE[weapon.weaponType]) {
    WEAPONS_BY_TYPE[weapon.weaponType].push(weapon);
  }
}

export function getWeaponByKey(keyOrName: string): WeaponData | undefined {
  if (!keyOrName) return undefined;
  if (WEAPONS_BY_KEY[keyOrName]) {
    return WEAPONS_BY_KEY[keyOrName];
  }
  const normalized = normalizeWeaponKey(keyOrName);
  return CANONICAL_WEAPON_MAP.get(normalized);
}
