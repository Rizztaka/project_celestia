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
];

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
  // Bennett C6 is active when constellation is 6 (or higher)
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
  // Identify carries who only have 'On-Field DPS' role or whose primary role is On-Field DPS
  // and lack any Off-Field DPS, Buffer/Shred, or Sustain capability.
  const pureOnFieldCarries = team.filter((m) => {
    const isPrimaryCarry = m.roles[0] === 'On-Field DPS';
    const hasUtility =
      m.roles.includes('Off-Field DPS') ||
      m.roles.includes('Buffer/Shred') ||
      m.roles.includes('Sustain') ||
      m.tags.includes('Electro-Battery') ||
      m.tags.includes('Universal-Buffer');
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
      m.tags.includes('Electro-Battery'),
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
