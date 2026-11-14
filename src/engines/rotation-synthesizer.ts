import {
  Character,
  CharacterRotationProfile,
  RotationAction,
  RotationActionType,
  RotationStage,
  SynthesizedTeamRotation,
  TeamRotationStep,
} from '../types/genshin';
import { getCharacterRotation } from '../data/character-rotations';

/**
 * Resolves the rotation profile for a character, checking:
 * 1. character.rotationProfile (if already set)
 * 2. Curated database from character-rotations.ts
 * 3. Intelligent default fallback based on role/element
 */
export function resolveCharacterRotationProfile(character: Character): CharacterRotationProfile {
  if (character.rotationProfile) return character.rotationProfile;
  const curated = getCharacterRotation(character.id) || getCharacterRotation(character.name);
  if (curated) return curated;
  return getDefaultRotationProfile(character);
}

/**
 * Parses shorthand combo strings like "E > Q", "E Q", "E > 3CA > E > 3CA", or "hE > Plunge > Q"
 * into structured RotationAction objects.
 */
export function parseActionShorthand(shorthand: string): RotationAction[] {
  if (!shorthand || typeof shorthand !== 'string') return [];

  const trimmed = shorthand.trim();
  const hasDelimiter = /[>→,]|->/.test(trimmed);
  const regex = hasDelimiter ? /\s*(?:>|→|->|,)\s*/ : /\s+/;

  const tokens = trimmed
    .split(regex)
    .map(t => t.trim())
    .filter(Boolean);

  return tokens.map(token => {
    let type: RotationActionType = 'normal';
    const lower = token.toLowerCase();

    if (lower === 'e' || lower.startsWith('tap e')) {
      type = 'skill';
    } else if (lower.startsWith('he') || lower.includes('hold e')) {
      type = 'hold-skill';
    } else if (lower === 'q' || lower.includes('burst')) {
      type = 'burst';
    } else if (lower.includes('ca') || lower.includes('charged')) {
      type = 'charged';
    } else if (lower.includes('plunge')) {
      type = 'plunge';
    } else if (lower.includes('na') || /^n\d+/i.test(lower) || lower.startsWith('n')) {
      type = 'normal';
    } else if (lower === 'd' || lower.includes('dash')) {
      type = 'dash';
    } else if (lower === 'j' || lower.includes('jump')) {
      type = 'jump';
    } else if (token.includes('E')) {
      type = 'skill';
    }

    return {
      type,
      label: token,
    };
  });
}

/**
 * Intelligent fallback generator for characters without an explicit custom rotation profile.
 */
export function getDefaultRotationProfile(character: Character): CharacterRotationProfile {
  const roles = character.roles || [];
  const isOnField = roles.includes('On-Field DPS');
  const isBuffer = roles.includes('Buffer/Shred');
  const isSustain = roles.includes('Sustain');
  const isOffField = roles.includes('Off-Field DPS');

  if (isOnField) {
    return {
      primarySequence: parseActionShorthand('E > Q > 3N3D'),
      stage: 'on-field-carry',
      estimatedFieldTime: 9.5,
      notes: `${character.name} on-field DPS combo window taking advantage of team buffs.`,
    };
  }

  if (isBuffer) {
    return {
      primarySequence: parseActionShorthand('E > Q'),
      stage: 'buffer-shred',
      estimatedFieldTime: 2.5,
      notes: `Cast Skill and Burst to trigger buffs and RES shred right before carry enters.`,
    };
  }

  if (isSustain) {
    return {
      primarySequence: parseActionShorthand(character.weapon === 'Catalyst' ? 'E > Q' : 'hE'),
      stage: 'sustain-setup',
      estimatedFieldTime: 2.0,
      notes: `Deploy shields and team healing early to ensure survivability throughout the rotation.`,
    };
  }

  // Default to Sub-DPS
  return {
    primarySequence: parseActionShorthand('E > Q'),
    stage: 'sub-dps',
    estimatedFieldTime: isOffField ? 2.5 : 3.0,
    notes: `Deploy off-field elemental application and background damage.`,
  };
}

const STAGE_ORDER: Record<RotationStage, number> = {
  'sustain-setup': 1,
  'sub-dps': 2,
  'buffer-shred': 3,
  'on-field-carry': 4,
};

const STAGE_LABELS: Record<RotationStage, string> = {
  'sustain-setup': 'Stage 1: Long Sustain & Aura Setup',
  'sub-dps': 'Stage 2: Sub-DPS Elemental Enablers',
  'buffer-shred': 'Stage 3: Short Buffs & RES Shred',
  'on-field-carry': 'Stage 4: Main Carry DPS Window',
};

/**
 * Assembles and sequences 4 team members into a strategic execution rotation
 * based on theorycrafting staging and synergistic interaction rules.
 */
export function synthesizeTeamRotation(members: Character[]): SynthesizedTeamRotation {
  if (!members || members.length === 0) {
    return {
      steps: [],
      totalCycleTime: 0,
      summaryString: '',
    };
  }

  // 1. Resolve profile for each member
  const memberEntries = members.map(m => {
    const profile = resolveCharacterRotationProfile(m);
    return {
      character: m,
      profile,
      stage: profile.stage,
    };
  });

  // 2. Initial Sort by stage hierarchy
  memberEntries.sort((a, b) => {
    const rankA = STAGE_ORDER[a.stage] || 2;
    const rankB = STAGE_ORDER[b.stage] || 2;
    return rankA - rankB;
  });

  // 3. Apply targeted Synergy Rules
  // Synergy Rule A: Bennett -> Xiangling particle funneling & snapshotting
  const bennettIdx = memberEntries.findIndex(e => e.character.id === 'bennett' || e.character.name.toLowerCase().includes('bennett'));
  const xianglingIdx = memberEntries.findIndex(e => e.character.id === 'xiangling' || e.character.name.toLowerCase().includes('xiangling'));

  if (bennettIdx !== -1 && xianglingIdx !== -1) {
    const [xianglingEntry] = memberEntries.splice(xianglingIdx, 1);
    const newBennettIdx = memberEntries.findIndex(e => e.character.id === 'bennett' || e.character.name.toLowerCase().includes('bennett'));
    memberEntries.splice(newBennettIdx + 1, 0, xianglingEntry);
  }

  // 4. Build concrete steps
  let totalFieldTime = 0;
  const swapTransitionDelay = 0.5; // average swap animation/delay in seconds

  const steps: TeamRotationStep[] = memberEntries.map((entry, index) => {
    const actions = entry.profile.primarySequence || [];
    const fieldTime = entry.profile.estimatedFieldTime || 2.5;
    totalFieldTime += fieldTime;

    return {
      stepNumber: index + 1,
      characterId: entry.character.id,
      characterName: entry.character.name,
      icon: entry.character.icon,
      element: entry.character.element,
      stage: entry.stage,
      stageLabel: STAGE_LABELS[entry.stage] || 'Rotation Step',
      actions,
      fieldTime,
      tip: entry.profile.notes,
    };
  });

  const totalCycleTime = totalFieldTime + steps.length * swapTransitionDelay;

  // 5. Generate formatted summary string
  const summaryParts = steps.map(step => {
    const actionLabels = step.actions.map(a => a.label).join(' ');
    return `${step.characterName} ${actionLabels}`;
  });

  const summaryString = summaryParts.join(' → ');

  return {
    steps,
    totalCycleTime: Math.round(totalCycleTime * 10) / 10,
    summaryString,
  };
}
