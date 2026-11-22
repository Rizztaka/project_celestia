import type {
  Character,
  Element,
  OwnedCharacterProfile,
  TeamWeaponAssignment,
} from '../types/genshin';

export interface ArchetypeExclusivityRule {
  archetype: string;
  triggerCharacterId?: string;
  allowedElements: Element[];
  description: string;
}

export const ARCHETYPE_EXCLUSIVITY_RULES: ArchetypeExclusivityRule[] = [
  {
    archetype: 'Overload',
    triggerCharacterId: 'Chevreuse',
    allowedElements: ['Pyro', 'Electro'],
    description: "Chevreuse's Vanguard's Coordinated Tactics strictly requires all party members to be Pyro or Electro.",
  },
  {
    archetype: 'Bountiful-Bloom',
    triggerCharacterId: 'Nilou',
    allowedElements: ['Hydro', 'Dendro'],
    description: "Nilou's Court of Dancing Petals strictly requires all party members to be Hydro or Dendro.",
  },
  {
    archetype: 'Skirk-Freeze',
    triggerCharacterId: 'Skirk',
    allowedElements: ['Hydro', 'Cryo'],
    description: "Skirk's Void Domain passives strictly require all party members to be Hydro or Cryo.",
  },
  {
    archetype: 'Escoffier-Freeze',
    triggerCharacterId: 'Escoffier',
    allowedElements: ['Hydro', 'Cryo'],
    description: "Escoffier's Haute Cuisine passives strictly require all party members to be Hydro or Cryo.",
  },
];

/**
 * High-fidelity canonical character synergy traits mapping mechanical capabilities
 * across all 128 canonical playable characters.
 */
export const CHARACTER_SYNERGY_TRAITS: Record<string, string[]> = {
  // --- Pyro ---
  Mavuika: ['Nightsoul', 'Pyro-App', 'DMG-Buffer', 'Off-Field', 'ATK-Buffer', 'Cinder-City', 'Fighting-Spirit'],
  Bennett: ['Healer', 'ATK-Buffer', 'Huge-ATK-Buff', 'Pyro-Battery', 'Pyro-App'],
  Xiangling: ['Off-Field', 'Pyro-App', 'Vaporize', 'Melt', 'Snap-Shot'],
  HuTao: ['On-Field DPS', 'Vaporize', 'Charged-Attacker'],
  Arlecchino: ['On-Field DPS', 'Bond-of-Life', 'Normal-Attacker', 'Vaporize', 'Overload'],
  Yoimiya: ['On-Field DPS', 'Normal-Attacker', 'Vaporize', 'Overload'],
  Gaming: ['On-Field DPS', 'Plunge-Attacker', 'Vaporize', 'Melt'],
  Lyney: ['On-Field DPS', 'Charged-Attacker', 'Mono-Pyro'],
  Chevreuse: ['Healer', 'ATK-Buffer', 'RES-Shred', 'Overload-Only', 'Overload'],
  Thoma: ['Shielder', 'Burgeon', 'Pyro-App', 'Normal-Attacker'],
  Dehya: ['Interruption-Resist', 'Damage-Mitigation', 'Pyro-App', 'Burgeon'],
  Yanfei: ['On-Field DPS', 'Charged-Attacker', 'Shielder'],
  Diluc: ['On-Field DPS', 'Plunge-Attacker', 'Vaporize'],
  Klee: ['On-Field DPS', 'Pyro-App', 'Mono-Pyro'],
  Xinyan: ['Shielder', 'Physical-Buff'],
  Amber: ['Pyro-App', 'Taunt'],

  // --- Hydro ---
  Furina: ['DMG-Buffer', 'Universal-Buffer', 'Hydro-App', 'Off-Field', 'HP-Fluctuation', 'Team-Drain'],
  Neuvillette: ['On-Field DPS', 'Charged-Attacker', 'Self-Sustain', 'Hydro Hypercarry'],
  Xingqiu: ['Off-Field', 'Hydro-App', 'Interruption-Resist', 'Damage-Mitigation'],
  Yelan: ['Off-Field', 'Hydro-App', 'DMG-Buffer', 'Universal-Buffer'],
  SangonomiyaKokomi: ['Healer', 'Team-Healer', 'Hydro-App', 'Dendro-Core'],
  Nilou: ['Bountiful-Bloom', 'EM-Buffer', 'Hydro-App'],
  Sigewinne: ['Healer', 'Team-Healer', 'Skill-Buffer', 'Hydro-App'],
  Mona: ['DMG-Buffer', 'Universal-Buffer', 'Hydro-App', 'Taunt'],
  KamisatoAyato: ['On-Field DPS', 'Off-Field', 'Hydro-App', 'Normal-Attacker'],
  Tartaglia: ['On-Field DPS', 'Hydro-App', 'Riptide', 'Forward-Vaporize'],
  Barbara: ['Healer', 'Team-Healer', 'Hydro-App', 'Revive'],
  Candace: ['Hydro-Infusion', 'Normal-Buff', 'Shielder'],
  Aino: ['Hydro-App', 'Off-Field', 'Healer'],

  // --- Anemo ---
  KaedeharaKazuha: ['Anemo-VV', 'VV', 'DMG-Buffer', 'Universal-Buffer', 'Crowd-Control', 'EM-Buffer'],
  Xianyun: ['Plunge-Enabler', 'Team-Healer', 'Healer', 'Anemo-VV', 'VV'],
  Sucrose: ['Anemo-VV', 'VV', 'EM-Buffer', 'Crowd-Control'],
  Faruzan: ['Anemo-Buff', 'Anemo-Shred', 'Crit-Buffer', 'Anemo-Battery'],
  Venti: ['Anemo-VV', 'VV', 'Crowd-Control', 'Energy-Refund'],
  Jean: ['Team-Healer', 'Healer', 'Anemo-VV', 'VV', 'Cleanse'],
  Chasca: ['Nightsoul', 'On-Field DPS', 'Cinder-City', 'Multi-Elemental'],
  Wanderer: ['On-Field DPS', 'Normal-Attacker', 'Charged-Attacker', 'Anemo Hypercarry'],
  Xiao: ['On-Field DPS', 'Plunge-Attacker', 'Anemo Hypercarry'],
  Lynette: ['Anemo-VV', 'VV', 'Taunt', 'Ousia'],
  ShikanoinHeizou: ['On-Field DPS', 'Anemo-VV', 'VV', 'Driver'],
  Sayu: ['Healer', 'Team-Healer', 'Anemo-VV', 'VV'],
  Ifa: ['Healer', 'Anemo-VV', 'VV', 'Nightsoul'],

  // --- Electro ---
  RaidenShogun: ['Electro-Battery', 'Battery', 'Burst-Buffer', 'Off-Field', 'On-Field DPS'],
  Fischl: ['Off-Field', 'Electro-App', 'Electro-Battery', 'Aggravate'],
  Clorinde: ['On-Field DPS', 'Nightsoul', 'Bond-of-Life', 'Normal-Attacker', 'Overload', 'Aggravate'],
  YaeMiko: ['Off-Field', 'Electro-App', 'Aggravate'],
  KukiShinobu: ['Healer', 'Hyperbloom-Trigger', 'Full-EM', 'Electro-App'],
  Beidou: ['Off-Field', 'Interruption-Resist', 'Damage-Mitigation', 'Shielder', 'Electro-App'],
  Cyno: ['On-Field DPS', 'Normal-Attacker', 'Hyperbloom-Driver', 'Aggravate'],
  Keqing: ['On-Field DPS', 'Aggravate', 'Quick-Swap'],
  Sara: ['ATK-Buffer', 'Crit-Buffer', 'Electro-Battery'],
  KujouSara: ['ATK-Buffer', 'Crit-Buffer', 'Electro-Battery'],
  Dori: ['Healer', 'Battery', 'Electro-App'],
  Sethos: ['On-Field DPS', 'Charged-Attacker', 'Aggravate'],
  Ororon: ['Nightsoul', 'Electro-App', 'Cinder-City', 'Off-Field'],
  Iansan: ['Nightsoul', 'ATK-Buffer', 'Cinder-City', 'Electro-Battery'],
  Razor: ['On-Field DPS', 'Physical', 'Normal-Attacker'],
  Lisa: ['DEF-Shred', 'Off-Field', 'Electro-App'],

  // --- Dendro ---
  Nahida: ['Dendro-App', 'EM-Buffer', 'Tri-Karma', 'Dendro-Core', 'Quicken'],
  Baizhu: ['Healer', 'Team-Healer', 'Shielder', 'Dendro-Buff', 'Interruption-Resist'],
  Alhaitham: ['On-Field DPS', 'Dendro-App', 'Spread', 'Hyperbloom-Driver'],
  Emilie: ['Off-Field', 'Burning-SubDPS', 'Dendro-App'],
  Kinich: ['Nightsoul', 'On-Field DPS', 'Burning', 'Burgeon'],
  Nefer: ['Lunar-Bloom', 'On-Field DPS', 'Nod-Krai', 'Charged-Attacker', 'Dendro-App'],
  Lauma: ['Nod-Krai', 'Moonsign', 'Dendro-Core', 'EM-Buffer', 'Off-Field'],
  Yaoyao: ['Healer', 'Team-Healer', 'Dendro-App'],
  Kirara: ['Shielder', 'Dendro-App', 'Interruption-Resist'],
  Tighnari: ['On-Field DPS', 'Charged-Attacker', 'Spread'],
  Collei: ['Dendro-App', 'Off-Field', 'Dendro-Core'],
  Kaveh: ['On-Field DPS', 'Bloom-Detonator', 'Dendro-Core'],

  // --- Cryo ---
  Citlali: ['Nightsoul', 'Shielder', 'Cryo-App', 'Cinder-City', 'Melt', 'Freeze'],
  Skirk: ['On-Field DPS', 'Skirk-Freeze', 'Cryo-App', 'Void-Blade'],
  Escoffier: ['Healer', 'Team-Healer', 'Escoffier-Freeze', 'Cryo-Buff', 'Cryo-App'],
  KamisatoAyaka: ['On-Field DPS', 'Cryo-Nuke', 'Freeze', 'Blizzard-Strayer'],
  Wriothesley: ['On-Field DPS', 'Normal-Attacker', 'Freeze', 'Melt', 'HP-Fluctuation'],
  Shenhe: ['Cryo-Buff', 'Cryo-Shred', 'Quills', 'Off-Field'],
  Ganyu: ['On-Field DPS', 'Charged-Attacker', 'Cryo-App', 'Melt', 'Freeze'],
  Rosaria: ['Crit-Buffer', 'Cryo-App', 'Cryo-Battery', 'Reverse-Melt'],
  Charlotte: ['Healer', 'Team-Healer', 'Cryo-App', 'Freeze'],
  Layla: ['Shielder', 'Cryo-App', 'Interruption-Resist'],
  Diona: ['Healer', 'Shielder', 'Cryo-Battery', 'EM-Buffer'],
  Eula: ['On-Field DPS', 'Physical', 'Lightfall-Nuke'],
  Mika: ['Healer', 'Team-Healer', 'Physical-Buff', 'ATK-SPD-Buff'],
  Kaeya: ['Off-Field', 'Cryo-App', 'Cryo-Battery'],
  Chongyun: ['Cryo-Infusion', 'Burst-Nuke', 'CD-Reduction'],
  Qiqi: ['Healer', 'Team-Healer', 'Cryo-App'],
  Aloi: ['Cryo-App', 'Normal-Attacker'],

  // --- Geo ---
  Zhongli: ['Shielder', 'Universal-Shred', 'RES-Shred', 'Interruption-Resist', 'Petrification'],
  Xilonen: ['Nightsoul', 'Universal-Buffer', 'RES-Shred', 'Cinder-City', 'Healer'],
  Navia: ['On-Field DPS', 'Gunbrella', 'Crystallize', 'Cinder-City'],
  Chiori: ['Off-Field', 'Geo-SubDPS', 'DEF-Buffer'],
  Albedo: ['Off-Field', 'Geo-SubDPS', 'EM-Buffer'],
  AratakiItto: ['On-Field DPS', 'Charged-Attacker', 'Mono-Geo'],
  Gorou: ['DEF-Buffer', 'Geo-Buff', 'Crit-Buffer', 'Geo-Battery'],
  Kachina: ['Nightsoul', 'Cinder-City', 'Geo-SubDPS', 'Off-Field'],
  Ningguang: ['On-Field DPS', 'Geo-Buff', 'Burst-Nuke'],
  YunJin: ['Normal-Buff', 'DEF-Buffer'],
  Noelle: ['Shielder', 'Healer', 'Team-Healer', 'On-Field DPS'],

  // --- Nod-Krai / Snezhnaya / 7.x Units ---
  Columbina: ['Moonsign', 'Nod-Krai', 'Universal-Buffer', 'Off-Field', 'Cryo-App'],
  Flins: ['Nod-Krai', 'On-Field DPS', 'Electro-App'],
  Ineffa: ['Nod-Krai', 'Off-Field', 'SubDPS'],
  Jahoda: ['Nod-Krai', 'Anemo-VV', 'VV', 'Buffer'],
  Sandrone: ['Off-Field', 'SubDPS', 'Geo-SubDPS'],
  Varka: ['On-Field DPS', 'Anemo-Buff', 'Heavy-Hitter'],
  Varesa: ['On-Field DPS', 'Pyro-App', 'Vaporize'],
  Vesna: ['Hydro-App', 'Team-Healer', 'Healer'],
  Zibai: ['Geo-Buff', 'DEF-Buffer', 'Shielder'],
  Dahlia: ['Hydro-App', 'Healer', 'Buffer'],
  Durin: ['Pyro-App', 'SubDPS', 'Dragon-Might'],
};

/**
 * Returns effective tags for a character by merging base tags with mechanical synergy traits.
 */
export function getEffectiveCharacterTags(char: Character): string[] {
  const specific = CHARACTER_SYNERGY_TRAITS[char.id] || [];
  const merged = new Set<string>([...(char.tags || []), ...specific]);
  return Array.from(merged);
}

/**
 * Predicate checking if a character provides active healing.
 */
export function isHealerCharacter(char: Character | string): boolean {
  const id = typeof char === 'string' ? char : char.id;
  const HEALERS = new Set([
    'Bennett', 'Barbara', 'SangonomiyaKokomi', 'Jean', 'Xianyun', 'Baizhu',
    'Charlotte', 'Sigewinne', 'KukiShinobu', 'Diona', 'Yaoyao', 'Mika',
    'Sayu', 'Qiqi', 'Dori', 'Chevreuse', 'Furina', 'Noelle', 'Xilonen',
    'Ifa', 'Escoffier', 'Vesna', 'Dahlia', 'Aino',
  ]);
  if (HEALERS.has(id)) return true;
  if (typeof char !== 'string') {
    const tags = getEffectiveCharacterTags(char);
    return tags.includes('Healer') || tags.includes('Team-Healer');
  }
  return false;
}

/**
 * Predicate checking if a character provides burst party-wide / team-wide healing
 * capable of rapidly stacking Furina Fanfare.
 */
export function isTeamHealerCharacter(char: Character | string): boolean {
  const id = typeof char === 'string' ? char : char.id;
  const TEAM_HEALERS = new Set([
    'Baizhu', 'Jean', 'Xianyun', 'Charlotte', 'Sigewinne', 'Barbara',
    'SangonomiyaKokomi', 'Mika', 'Sayu', 'Qiqi', 'Escoffier', 'Vesna',
  ]);
  if (TEAM_HEALERS.has(id)) return true;
  if (typeof char !== 'string') {
    const tags = getEffectiveCharacterTags(char);
    return tags.includes('Team-Healer');
  }
  return false;
}

/**
 * Predicate checking if a character provides active shields.
 */
export function isShielderCharacter(char: Character | string): boolean {
  const id = typeof char === 'string' ? char : char.id;
  const SHIELDERS = new Set([
    'Zhongli', 'Layla', 'Diona', 'Thoma', 'Kirara', 'Baizhu',
    'Noelle', 'Xinyan', 'Citlali', 'Zibai', 'Candace',
  ]);
  if (SHIELDERS.has(id)) return true;
  if (typeof char !== 'string') {
    const tags = getEffectiveCharacterTags(char);
    return tags.includes('Shielder') || tags.includes('Shield');
  }
  return false;
}

/**
 * Checks if two character entities represent the same individual,
 * enforcing that multiple elemental configurations of the Traveler cannot co-exist in one party.
 */
export function isSameCharacterOrTraveler(
  a: Character | string | null | undefined,
  b: Character | string | null | undefined,
): boolean {
  if (!a || !b) return false;
  const getId = (x: Character | string) => (typeof x === 'string' ? x : x.id);
  const getName = (x: Character | string) => (typeof x === 'string' ? x : x.name);
  const idA = getId(a);
  const idB = getId(b);
  if (!idA || !idB) return false;
  if (idA === idB) return true;

  const isTraveler = (x: Character | string) => {
    const id = getId(x);
    const name = getName(x);
    return (
      id.startsWith('Traveler') ||
      id === 'Aether' ||
      id === 'Lumine' ||
      id === 'PlayerBoy' ||
      id === 'PlayerGirl' ||
      (typeof name === 'string' && name.startsWith('Traveler'))
    );
  };

  if (isTraveler(a) && isTraveler(b)) return true;
  return false;
}

/**
 * Checks whether a candidate character is permitted to join a team composition
 * under strict archetype exclusivity rules, Traveler identity uniqueness, and no duplicates.
 */
export function isAllowedTeammate(
  archetype: string,
  candidate: Character,
  currentMembers: Character[],
  exclusiveElements?: (Element | string)[],
): boolean {
  // 1. Cannot duplicate character or pair multiple Traveler elements
  if (currentMembers.some((m) => isSameCharacterOrTraveler(m, candidate))) {
    return false;
  }

  // 2. Consult declarative archetype exclusivity rules by archetype name
  const archetypeRule = ARCHETYPE_EXCLUSIVITY_RULES.find((r) => r.archetype === archetype);
  if (archetypeRule) {
    if (!archetypeRule.allowedElements.includes(candidate.element)) {
      return false;
    }
  }

  // 3. Consult trigger character exclusivity (e.g. Chevreuse Overload, Nilou Bountiful Bloom)
  for (const rule of ARCHETYPE_EXCLUSIVITY_RULES) {
    if (!rule.triggerCharacterId) continue;
    const triggerInTeam = currentMembers.some((m) => m.id === rule.triggerCharacterId);
    const candidateIsTrigger = candidate.id === rule.triggerCharacterId;

    if (triggerInTeam || candidateIsTrigger) {
      if (!rule.allowedElements.includes(candidate.element)) {
        return false;
      }
      if (candidateIsTrigger) {
        const hasOffElement = currentMembers.some(
          (m) => !rule.allowedElements.includes(m.element),
        );
        if (hasOffElement) return false;
      }
    }
  }

  // 4. Archetype template exclusive elements (if provided)
  if (exclusiveElements && exclusiveElements.length > 0) {
    if (!exclusiveElements.includes(candidate.element)) {
      return false;
    }
  }

  return true;
}

export interface BennettC6ConflictResult {
  hasConflict: boolean;
  penalty: number;
  conflictedCharacters: Character[];
  warning?: string;
}

/**
 * Evaluates Bennett C6 Pyro Infusion override conflict.
 * Infuses melee (Sword, Claymore, Polearm) Normal/Charged/Plunging attacks with Pyro,
 * breaking Physical carries (Eula, Razor) and overridable elemental carries (Ayaka, Keqing).
 */
export function detectBennettC6Conflict(
  team: Character[],
  profiles?: Record<string, OwnedCharacterProfile>,
): BennettC6ConflictResult {
  const bennett = team.find((m) => m.id === 'Bennett');
  if (!bennett) {
    return { hasConflict: false, penalty: 0, conflictedCharacters: [] };
  }

  const prof = profiles?.[bennett.id];
  if (!prof || prof.constellation < 6) {
    return { hasConflict: false, penalty: 0, conflictedCharacters: [] };
  }

  const CONFLICTED_IDS = new Set(['Eula', 'Razor', 'Keqing', 'KamisatoAyaka', 'Ayaka']);
  const conflicted = team.filter((m) => CONFLICTED_IDS.has(m.id));

  if (conflicted.length > 0) {
    return {
      hasConflict: true,
      penalty: 15,
      conflictedCharacters: conflicted,
      warning: 'Caution: Bennett C6 Pyro Infusion overrides Physical/Normal attack damage.',
    };
  }

  return { hasConflict: false, penalty: 0, conflictedCharacters: [] };
}

export interface DualCarryContentionResult {
  hasContention: boolean;
  penalty: number;
  carries: Character[];
  warning?: string;
}

/**
 * Evaluates dual on-field carry contention for rotation field time.
 * Deducts penalty if multiple greedy carries without off-field utility are paired together.
 */
export function detectDualCarryContention(team: Character[]): DualCarryContentionResult {
  const pureOnFieldCarries = team.filter((m) => {
    const isPrimaryCarry = m.roles[0] === 'On-Field DPS';
    const effectiveTags = getEffectiveCharacterTags(m);
    const hasUtility =
      m.roles.includes('Off-Field DPS') ||
      m.roles.includes('Buffer/Shred') ||
      m.roles.includes('Sustain') ||
      effectiveTags.includes('Electro-Battery') ||
      effectiveTags.includes('Universal-Buffer') ||
      effectiveTags.includes('Off-Field');
    return isPrimaryCarry && !hasUtility;
  });

  if (pureOnFieldCarries.length >= 2) {
    const carryNames = pureOnFieldCarries.map((c) => c.name).join(' and ');
    return {
      hasContention: true,
      penalty: 12,
      carries: pureOnFieldCarries,
      warning: `Dual on-field carry contention: ${carryNames} compete for rotation field time.`,
    };
  }

  return { hasContention: false, penalty: 0, carries: [] };
}

export interface FurinaHealerDeficitResult {
  hasDeficit: boolean;
  severity: 'none' | 'moderate' | 'severe';
  penalty: number;
  warning?: string;
}

/**
 * Evaluates whether a Furina team lacks the necessary team-wide healing to stack Fanfare
 * and offset continuous party HP drain.
 */
export function detectFurinaHealerDeficit(team: Character[]): FurinaHealerDeficitResult {
  const hasFurina = team.some((m) => m.id === 'Furina');
  if (!hasFurina) {
    return { hasDeficit: false, severity: 'none', penalty: 0 };
  }

  // Neuvillette can self-stack Fanfare effortlessly via severe HP fluctuations
  const hasNeuvillette = team.some((m) => m.id === 'Neuvillette');

  const hasTeamHealer = team.some((m) => m.id !== 'Furina' && isTeamHealerCharacter(m));
  const hasHealer = team.some((m) => m.id !== 'Furina' && isHealerCharacter(m));

  if (hasTeamHealer || (hasNeuvillette && hasHealer)) {
    return { hasDeficit: false, severity: 'none', penalty: 0 };
  }

  if (!hasHealer && !hasNeuvillette) {
    return {
      hasDeficit: true,
      severity: 'severe',
      penalty: 14,
      warning: "Furina requires team healing to stack Fanfare and prevent party HP drain; no healer detected.",
    };
  }

  if (!hasTeamHealer && !hasNeuvillette) {
    return {
      hasDeficit: true,
      severity: 'moderate',
      penalty: 6,
      warning: "Furina operates sub-optimally with single-target healing; party-wide burst healers (Jean, Xianyun, Baizhu, Charlotte) generate significantly more Fanfare stacks.",
    };
  }

  return { hasDeficit: false, severity: 'none', penalty: 0 };
}

export interface ArlecchinoHealingConflictResult {
  hasConflict: boolean;
  penalty: number;
  warning?: string;
}

/**
 * Evaluates whether Arlecchino is paired with pure healers without protective shielding
 * or damage reduction, since her Bond of Life passive prevents incoming heals in combat.
 */
export function detectArlecchinoHealingConflict(team: Character[]): ArlecchinoHealingConflictResult {
  const hasArlecchino = team.some((m) => m.id === 'Arlecchino');
  if (!hasArlecchino) {
    return { hasConflict: false, penalty: 0 };
  }

  const hasShielder = team.some((m) => isShielderCharacter(m));
  const hasDamageReduction = team.some((m) =>
    ['Xingqiu', 'Beidou', 'Dehya'].includes(m.id) ||
    getEffectiveCharacterTags(m).includes('Damage-Mitigation'),
  );

  // If she has a shielder or damage reduction, comfort is preserved
  if (hasShielder || hasDamageReduction) {
    return { hasConflict: false, penalty: 0 };
  }

  // Pure healers provide 0 combat survivability to Arlecchino
  const hasPureHealersOnly = team.some((m) => isHealerCharacter(m));
  if (hasPureHealersOnly) {
    return {
      hasConflict: true,
      penalty: 8,
      warning: "Arlecchino cannot receive incoming combat heals; relying purely on healers leaves her vulnerable. Consider a shielder (Zhongli, Layla, Thoma) or damage reduction (Xingqiu).",
    };
  }

  return { hasConflict: false, penalty: 0 };
}

export interface MavuikaNightsoulDeficitResult {
  hasDeficit: boolean;
  penalty: number;
  warning?: string;
}

/**
 * Evaluates whether Mavuika is deployed without any other Natlan / Nightsoul teammates
 * to assist in fast Fighting Spirit generation.
 */
export function detectMavuikaNightsoulDeficit(team: Character[]): MavuikaNightsoulDeficitResult {
  const hasMavuika = team.some((m) => m.id === 'Mavuika');
  if (!hasMavuika) {
    return { hasDeficit: false, penalty: 0 };
  }

  const otherNightsoulTeammate = team.some(
    (m) => m.id !== 'Mavuika' && getEffectiveCharacterTags(m).includes('Nightsoul'),
  );

  if (!otherNightsoulTeammate) {
    return {
      hasDeficit: true,
      penalty: 5,
      warning: "Mavuika generates Fighting Spirit significantly faster with another Natlan teammate triggering Nightsoul Burst / points consumption.",
    };
  }

  return { hasDeficit: false, penalty: 0 };
}

export interface FreezeAuraDisruptionResult {
  hasDisruption: boolean;
  penalty: number;
  disruptors: Character[];
  warning?: string;
}

/**
 * Evaluates whether a Freeze-centric Blizzard Strayer composition has its aura disrupted
 * by unintended Electro (Superconduct / shatter) or heavy off-element triggers.
 */
export function detectFreezeAuraDisruption(
  team: Character[],
  archetype: string,
): FreezeAuraDisruptionResult {
  if (archetype !== 'Freeze' && archetype !== 'Glacial Freeze / Melt' && archetype !== 'Skirk-Freeze') {
    return { hasDisruption: false, penalty: 0, disruptors: [] };
  }

  // Only check if team intends pure Freeze (Cryo + Hydro present, and Blizzard Strayer carry)
  const hasCryo = team.some((m) => m.element === 'Cryo');
  const hasHydro = team.some((m) => m.element === 'Hydro');
  if (!hasCryo || !hasHydro) {
    return { hasDisruption: false, penalty: 0, disruptors: [] };
  }

  const electroDisruptors = team.filter((m) => m.element === 'Electro');
  if (electroDisruptors.length > 0 && archetype.includes('Freeze')) {
    const names = electroDisruptors.map((m) => m.name).join(', ');
    return {
      hasDisruption: true,
      penalty: 8,
      disruptors: electroDisruptors,
      warning: `Electro from ${names} triggers Superconduct, consuming Freeze aura and reducing Blizzard Strayer uptime.`,
    };
  }

  return { hasDisruption: false, penalty: 0, disruptors: [] };
}

/**
 * Calculates dynamic team comfort score (0-100) based on real defensive capabilities:
 * Shields, team-wide heals, single-target heals, interruption resistance, and anti-synergy penalties.
 */
export function calculateComfortScore(
  team: Character[],
  _profiles?: Record<string, OwnedCharacterProfile>,
): number {
  if (team.length === 0) return 50;

  let comfort = 50;
  const hasZhongli = team.some((m) => m.id === 'Zhongli');
  const hasShielder = team.some((m) => isShielderCharacter(m));
  const hasTeamHealer = team.some((m) => m.id !== 'Furina' && isTeamHealerCharacter(m));
  const hasHealer = team.some((m) => m.id !== 'Furina' && isHealerCharacter(m));
  const hasInterruptionResist = team.some((m) =>
    ['Xingqiu', 'Dehya', 'Beidou', 'RaidenShogun'].includes(m.id) ||
    getEffectiveCharacterTags(m).includes('Interruption-Resist'),
  );

  if (hasZhongli) {
    comfort += 35;
  } else if (hasShielder) {
    comfort += 24;
  }

  if (hasTeamHealer) {
    comfort += 24;
  } else if (hasHealer) {
    comfort += 16;
  }

  if (hasInterruptionResist && !hasZhongli) {
    comfort += 8;
  }

  // Furina drain penalty
  const furinaCheck = detectFurinaHealerDeficit(team);
  if (furinaCheck.hasDeficit) {
    comfort -= Math.round(furinaCheck.penalty * 1.2);
  }

  // Arlecchino conflict penalty
  const arlecchinoCheck = detectArlecchinoHealingConflict(team);
  if (arlecchinoCheck.hasConflict) {
    comfort -= arlecchinoCheck.penalty;
  }

  // No sustain at all
  if (!hasShielder && !hasHealer) {
    comfort -= 22;
  }

  return Math.min(100, Math.max(10, Math.round(comfort)));
}

export interface EnergyBatteryResult {
  status: 'optimal' | 'adequate' | 'deficit';
  warnings: string[];
  deficits: string[];
}

// Curated high energy burst cost table
const HIGH_BURST_COST: Record<string, number> = {
  Xiangling: 80,
  Beidou: 80,
  KamisatoAyaka: 80,
  Ayaka: 80,
  Eula: 80,
  Cyno: 80,
  Xingqiu: 80,
  Yelan: 70,
  Xiao: 70,
  RaidenShogun: 90,
  Faruzan: 80,
  Sara: 80,
  KujouSara: 80,
  Dori: 80,
  Thoma: 80,
};

// Known battery providers per element capable of particle funneling
const ELEMENT_BATTERIES: Record<string, string[]> = {
  Pyro: ['Bennett', 'Chevreuse', 'Mavuika'],
  Hydro: ['Xingqiu', 'Yelan', 'Furina', 'SangonomiyaKokomi', 'Mona', 'Neuvillette'],
  Electro: ['Fischl', 'RaidenShogun', 'Dori', 'KukiShinobu', 'YaeMiko', 'TravelerElectro', 'Iansan', 'Ororon'],
  Cryo: ['Diona', 'Rosaria', 'Shenhe', 'Kaeya', 'Layla', 'Charlotte'],
  Anemo: ['Sucrose', 'Faruzan', 'Venti', 'Xianyun', 'Lynette', 'KaedeharaKazuha', 'Jean', 'ShikanoinHeizou', 'Sayu'],
  Geo: ['Albedo', 'Chiori', 'Gorou', 'Ningguang', 'Zhongli', 'Xilonen', 'Kachina'],
  Dendro: ['Nahida', 'Baizhu', 'Collei', 'TravelerDendro', 'Yaoyao', 'Kirara'],
};

/**
 * Evaluates party energy generation and detects high-cost bursts lacking battery support.
 */
export function evaluateEnergyBattery(
  team: Character[],
  weaponAssignments?: TeamWeaponAssignment[],
): EnergyBatteryResult {
  const warnings: string[] = [];
  const deficits: string[] = [];

  // 1. Universal battery presence (Raiden Shogun, Dori, Electro Traveler)
  const hasUniversalBattery = team.some(
    (m) =>
      ['RaidenShogun', 'Dori', 'TravelerElectro'].includes(m.id) ||
      getEffectiveCharacterTags(m).includes('Electro-Battery'),
  );

  // 2. Favonius weapons in team
  const favoniusHolders = new Set<string>();
  if (weaponAssignments) {
    for (const wa of weaponAssignments) {
      const key = (wa.assignedWeapon?.key || wa.assignedWeapon?.name || '').toLowerCase();
      if (key.includes('favonius')) {
        favoniusHolders.add(wa.characterId);
      }
    }
  }

  for (const member of team) {
    // Raiden Shogun has 90 burst cost but actively batteries herself and the entire party
    if (member.id === 'RaidenShogun') continue;

    const burstCost =
      HIGH_BURST_COST[member.id] ||
      member.talents?.find((t) => t.type === 'burst')?.energyCost ||
      60;

    if (burstCost >= 70) {
      const allowedBatteries = ELEMENT_BATTERIES[member.element] || [];
      const hasSameElementBattery = team.some(
        (m) => m.id !== member.id && allowedBatteries.includes(m.id),
      );
      const hasFavoniusAssistance = favoniusHolders.size > 0;

      if (!hasUniversalBattery && !hasSameElementBattery && !hasFavoniusAssistance) {
        deficits.push(member.name);
        warnings.push(
          `${member.name} requires high Energy (${burstCost} Cost) but lacks a same-element battery or Favonius support.`,
        );
      }
    }
  }

  if (deficits.length >= 2) {
    return { status: 'deficit', warnings, deficits };
  } else if (deficits.length === 1) {
    return { status: 'adequate', warnings, deficits };
  }

  return { status: 'optimal', warnings: [], deficits: [] };
}
