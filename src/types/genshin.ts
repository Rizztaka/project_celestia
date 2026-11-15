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

export interface EquippedWeapon {
  name: string;
  key: string;
  level: number;
  refinement: number;
  rarity?: number;
  ascension?: number;
}

export interface WeaponData {
  key: string;
  name: string;
  weaponType: WeaponType;
  rarity: 3 | 4 | 5;
  baseAtk: number; // At Lv. 90
  subStatType?: StatKey | string;
  subStatValue?: string; // e.g. '66.2%' or '165'
  passiveName?: string;
  passiveDesc?: string;
  tags?: string[]; // e.g. ['crit', 'energy', 'em', 'normal-buff', 'team-buff']
  icon?: string;
}

export interface OwnedWeapon extends EquippedWeapon {
  id: string; // Unique instance ID
  location?: string; // Character ID if equipped, or empty/undefined if in bag
  lock?: boolean;
}

export interface WeaponScoreResult {
  weapon: OwnedWeapon | WeaponData;
  score: number; // 0 - 100+
  relativePercentage: number; // 100% = BiS
  tier: 'BiS' | 'Optimal' | 'Great' | 'Usable' | 'Suboptimal';
  reason: string;
  isOwned: boolean;
  isEquipped: boolean;
  equippedOn?: string;
}

export interface TeamWeaponAssignment {
  characterId: string;
  characterName: string;
  assignedWeapon: OwnedWeapon;
  scoreResult: WeaponScoreResult;
  isBorrowed: boolean;
  borrowedFrom?: string; // Character name/ID if borrowed
}

export interface OwnedCharacterProfile {
  id: string;
  level: number;
  constellation: number;
  ascension?: number;
  talents?: {
    auto: number;
    skill: number;
    burst: number;
  };
  weapon?: EquippedWeapon;
}

export interface GOODCharacter {
  key: string;
  level: number;
  constellation: number;
  ascension?: number;
  talent?: {
    auto?: number;
    skill?: number;
    burst?: number;
  };
}

export interface GOODWeapon {
  key: string;
  level: number;
  ascension?: number;
  refinement?: number;
  location?: string;
  lock?: boolean;
}

export interface GOODData {
  format: 'GOOD' | string;
  version: number;
  source: string;
  characters?: GOODCharacter[];
  weapons?: GOODWeapon[];
  artifacts?: any[];
}

export interface OwnedCharacter {
  id: string;
  level: number;
  constellation: number;
  talents?: { normal: number; skill: number; burst: number };
  weapon?: EquippedWeapon;
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
  weaponAssignments?: TeamWeaponAssignment[];
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

// ---------------------------------------------------------
// Artifact Roll Value & Diminishing Returns Engine Types
// ---------------------------------------------------------

export type ArtifactSlot = 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';

export type StatKey =
  | 'hp'
  | 'hp_'
  | 'atk'
  | 'atk_'
  | 'def'
  | 'def_'
  | 'eleMas'
  | 'enerRech_'
  | 'critRate_'
  | 'critDMG_'
  | 'heal_'
  | 'physical_dmg_'
  | 'pyro_dmg_'
  | 'hydro_dmg_'
  | 'dendro_dmg_'
  | 'electro_dmg_'
  | 'anemo_dmg_'
  | 'cryo_dmg_'
  | 'geo_dmg_';

export interface ArtifactSubstat {
  key: StatKey;
  value: number;
  rollValue?: number; // e.g. 100% = 1 max roll
}

export interface ArtifactPiece {
  id?: string;
  slotKey: ArtifactSlot;
  setKey?: string;
  rarity: number; // typically 5
  level: number; // 0 - 20
  mainStatKey: StatKey;
  substats: ArtifactSubstat[];
  location?: string; // Character key
}

export interface CharacterStatWeightConfig {
  characterId: string;
  characterName: string;
  preferredMainStats: {
    sands: StatKey[];
    goblet: StatKey[];
    circlet: StatKey[];
  };
  statWeights: Partial<Record<StatKey, number>>; // 0.0 to 1.0
  erRequirement?: number; // Target ER percentage (e.g. 160)
  targetSets?: string[];
}

export interface SlotUpgradeProbability {
  slotKey: ArtifactSlot;
  slotName: string;
  currentPiece: ArtifactPiece | null;
  currentRollValue: number; // Total RV% on piece (e.g. 540%)
  currentUsefulRolls: number; // Equivalent max rolls (e.g. 5.4)
  upgradeProbabilityPerRun: number; // Probability that 1 domain run beats this piece
  expectedRunsForUpgrade: number; // Runs to reach 50% upgrade chance
  expectedDaysForUpgrade: number; // Days of resin (180/day = 9 runs/day)
  status: 'Near Ceiling' | 'Diminishing Returns' | 'High ROI';
  recommendation: string;
}

export interface DiminishingReturnsPoint {
  days: number;
  resin: number;
  probability: number; // 0.0 to 1.0 (e.g. 0.85 = 85%)
}

export interface GuaranteedAlternative {
  title: string;
  costResin: number;
  daysResin: number;
  guaranteedGain: string;
  description: string;
}

export interface ArtifactStopAnalysisResult {
  characterId: string;
  characterName: string;
  totalRollValue: number;
  totalUsefulRolls: number;
  averageSlotRollValue: number;
  overallStatus: 'Ready / Stop Farming' | 'High ROI' | 'Diminishing Returns';
  daysToNextUpgrade: number; // 50% confidence days for weakest link
  weakestSlot: SlotUpgradeProbability | null;
  slotBreakdown: Record<ArtifactSlot, SlotUpgradeProbability>;
  curve: DiminishingReturnsPoint[];
  guaranteedAlternative: GuaranteedAlternative;
  advice: string;
}

// ---------------------------------------------------------
// Imaginarium Theater & Abyss Dual-Team Types
// ---------------------------------------------------------

export type TheaterDifficulty = 'Normal' | 'Hard' | 'Visionary';
export type TheaterActType = 'Normal' | 'Defense' | 'Boss';

export interface TheaterBossRequirement {
  actNumber: number;
  bossName: string;
  hazardDescription?: string;
  recommendedArchetypes: string[];
}

export interface TheaterCharacterVigor {
  characterId: string;
  remainingVigor: number;
  usedInActs: number[];
}

export interface TheaterActPlan {
  actNumber: number;
  type: TheaterActType;
  bossName?: string;
  recommendedArchetypes: string[];
  team: Character[];
  isLocked?: boolean;
}

export interface TheaterSeasonConfig {
  id: string;
  name: string;
  elements: Element[];
  openingCastIds: string[];
  specialGuestIds: string[];
  bosses: Record<number, string>;
}

export interface AbyssChamberCoverage {
  chamber: number;
  firstHalfStatus: string;
  secondHalfStatus: string;
  firstHalfSatisfied: boolean;
  secondHalfSatisfied: boolean;
}

export interface AbyssDualTeamPlan {
  firstHalfTeam: TeamRecommendation;
  secondHalfTeam: TeamRecommendation;
  chamberCoverage: AbyssChamberCoverage[];
  overallScore: number;
  warnings?: string[];
}


