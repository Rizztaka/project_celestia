export type Element = 'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo';
export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
export type CharacterRole = 'On-Field DPS' | 'Off-Field DPS' | 'Buffer/Shred' | 'Sustain';

export interface CharacterTalent {
  name: string;
  type: 'normal' | 'skill' | 'burst' | 'sprint' | 'passive';
  description: string;
  icon?: string;
}

export interface CharacterConstellation {
  level: number;
  name: string;
  description: string;
  icon?: string;
}

export interface CharacterStats {
  hp: number;
  attack: number;
  defense: number;
  specializedStat: string;
  specializedValue: string;
}

export interface RecommendedWeapon {
  name: string;
  rarity: number;
  reason?: string;
}

export interface RecommendedArtifact {
  name: string;
  pieces: number;
  reason?: string;
}

export interface RecommendedBuild {
  weapons: RecommendedWeapon[];
  artifacts: RecommendedArtifact[];
  mainStats?: {
    sands: string[];
    goblet: string[];
    circlet: string[];
  };
  subStats?: string[];
}

export type RotationActionType =
  | 'skill'
  | 'hold-skill'
  | 'burst'
  | 'normal'
  | 'charged'
  | 'plunge'
  | 'dash'
  | 'jump'
  | 'swap';

export interface RotationAction {
  type: RotationActionType;
  label: string; // e.g. 'E', 'hE', 'Q', '3CA', 'N2CD'
  description?: string;
  timingSeconds?: number;
}

export type RotationStage =
  | 'sustain-setup'
  | 'sub-dps'
  | 'buffer-shred'
  | 'on-field-carry';

export interface CharacterRotationProfile {
  primarySequence: RotationAction[];
  alternateSequence?: RotationAction[];
  stage: RotationStage;
  estimatedFieldTime: number; // in seconds
  notes: string;
  tags?: string[];
}

export interface TeamRotationStep {
  stepNumber: number;
  characterId: string;
  characterName: string;
  icon?: string;
  element: Element;
  stage: RotationStage;
  stageLabel: string;
  actions: RotationAction[];
  fieldTime: number;
  tip?: string;
}

export interface SynthesizedTeamRotation {
  steps: TeamRotationStep[];
  totalCycleTime: number;
  summaryString: string;
  warnings?: string[];
}

export interface Character {
  id: string;
  name: string;
  element: Element;
  weapon: WeaponType;
  rarity: 4 | 5;
  roles: CharacterRole[];
  // Synergy tags for team archetypes & reaction chains
  tags: string[];
  icon?: string;
  sideIcon?: string;
  description?: string;
  title?: string;
  constellationName?: string;
  stats?: CharacterStats;
  talents?: CharacterTalent[];
  constellations?: CharacterConstellation[];
  build?: RecommendedBuild;
  rotationProfile?: CharacterRotationProfile;
}

export interface OwnedCharacter {
  id: string;
  level: number;
  constellation: number;
  talents?: { normal: number; skill: number; burst: number };
}

export interface TeamRecommendation {
  id: string;
  name: string;
  archetype: string;
  members: Character[];
  synergyScore: number;
  comfortScore: number;
  reasons: string[];
  rotation: string;
  steppedRotation?: SynthesizedTeamRotation;
  resonance: string[];
}

export interface PullAdvice {
  character: Character;
  score: number; // 0 - 100
  tier: 'Must Pull' | 'High Value' | 'Situational' | 'Skip / Redundant';
  unlockedArchetypes: string[];
  accountBenefits: string[];
  caution?: string;
}

export interface ArtifactStopRecommendation {
  characterName: string;
  currentCv: number;
  currentRolls: number;
  status: 'Ready / Stop Farming' | 'High ROI' | 'Diminishing Returns';
  estimatedDaysForUpgrade: number;
  resinEfficiency: number; // 0 - 100%
  advice: string;
}

