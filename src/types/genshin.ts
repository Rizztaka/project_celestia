export type Element = 'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo';
export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
export type CharacterRole = 'On-Field DPS' | 'Off-Field DPS' | 'Buffer/Shred' | 'Sustain';

export interface CharacterTalent {
  name: string;
  type: 'normal' | 'skill' | 'burst' | 'sprint' | 'passive';
  description: string;
  icon?: string;
  scalingKey?: string;
  cooldown?: number | string;
  energyCost?: number;
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
  isCurated?: boolean;
  curationSource?: 'character' | 'database' | 'fallback';
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
  isCurated?: boolean;
  curationSource?: 'character' | 'database' | 'fallback';
}

export interface SynthesizedTeamRotation {
  steps: TeamRotationStep[];
  totalCycleTime: number;
  summaryString: string;
  warnings?: string[];
  isCurated?: boolean;
  curationSource?: 'character' | 'database' | 'fallback';
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
  isOwned?: boolean;
  isTrial?: boolean;
  level?: number;
  constellation?: number;
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
  rarity: 1 | 2 | 3 | 4 | 5;
  isCombatWeapon: boolean;
  baseAtk: number; // At Lv. 90 (or max level for 1★/2★)
  subStatType?: StatKey | string;
  subStatValue?: string; // e.g. '66.2%' or '165'
  passiveName?: string;
  passiveDesc?: string;
  refinements?: {
    r1?: string;
    r2?: string;
    r3?: string;
    r4?: string;
    r5?: string;
  };
  ascensionCosts?: Record<string, number>;
  tags?: string[]; // e.g. ['crit', 'energy', 'em', 'normal-buff', 'team-buff']
  icon?: string;
}

export interface ArtifactSetMaster {
  id: string;
  name: string;
  minRarity: number;
  maxRarity: number;
  effect1Pc?: string;
  effect2Pc?: string;
  effect4Pc?: string;
  pieces?: {
    flower?: { name: string; icon?: string; description?: string };
    plume?: { name: string; icon?: string; description?: string };
    sands?: { name: string; icon?: string; description?: string };
    goblet?: { name: string; icon?: string; description?: string };
    circlet?: { name: string; icon?: string; description?: string };
  };
  icon?: string;
  isCombatSet: boolean;
}

export interface OwnedWeapon extends EquippedWeapon {
  id: string; // Unique instance ID
  location?: string; // Character ID if equipped, or empty/undefined if in bag
  lock?: boolean;
  isCustom?: boolean;
}

export interface WeaponScoreResult {
  weapon: OwnedWeapon | WeaponData;
  score: number; // 0 - 100+
  suitabilityScore?: number;
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

export interface TeamDamageOutputInfo {
  status: 'heuristic_only' | 'unsimulated' | 'calibrated';
  archetypeTier?: string;
  relativeOutputPercentile?: number;
  disclaimer: string;
}

export interface TeamScoreBreakdown {
  compatibilityScore: number; // 0-100% mechanical synergy (reactions, resonance, roles, energy)
  investmentScore: number; // 0-100 account equipment (weapon tier, level, constellations)
  benchmarkTier: 'S+' | 'S' | 'A' | 'B'; // Theorycrafting power tier
  practicalPerformanceScore?: number; // 0-100% composite of compatibility, comfort, energy & mechanics
  damageOutput?: TeamDamageOutputInfo;
}

export interface CharacterSwapAlternative {
  originalCharacterId: string;
  alternativeCharacter: Character;
  tradeOffPros: string[];
  tradeOffCons: string[];
  compatibilityImpact: number;
  whyLowerScore?: string;
}

export interface IdealSupportGap {
  characterId: string;
  characterName: string;
  role: string;
  element: Element;
  replacementForRole: string;
  impactSummary: string;
}

export interface TeamExplanation {
  roleRationale: Record<string, string>;
  reactionWorkflow: string;
  energyAssessment: {
    status: 'optimal' | 'adequate' | 'deficit';
    warnings: string[];
  };
  alternatives: CharacterSwapAlternative[];
  antiSynergyWarnings?: string[];
  idealMissingSupports?: IdealSupportGap[];
}

export interface TeamRecommendation {
  id: string;
  name: string;
  archetype: string;
  members: Character[];
  synergyScore: number;
  compositionCompatibilityScore?: number;
  comfortScore: number;
  reasons: string[];
  rotation: string;
  steppedRotation?: SynthesizedTeamRotation;
  resonance: string[];
  weaponAssignments?: TeamWeaponAssignment[];
  isTheoretical?: boolean;
  scores?: TeamScoreBreakdown;
  explanation?: TeamExplanation;
}

export interface PullAdvice {
  character: Character;
  score: number; // 0 - 100
  tier: 'Must Pull' | 'High Value' | 'Situational' | 'Skip / Redundant';
  unlockedArchetypes: string[];
  accountBenefits: string[];
  caution?: string;
}

import type { GachaOddsResult } from '../engines/gacha-math';

export type PullTargetType = 'C0_Character' | 'Constellation' | 'Signature_Weapon';

export interface PullBudgetState {
  primogems: number;
  fates: number;
  characterPity: number;
  characterGuaranteed: boolean;
  consecutiveLossCount?: number;
  weaponPity: number;
  weaponGuaranteed?: boolean; // 75/25 off-banner carryover guarantee
  weaponFatePoints: number; // 0 or 1
  chronicledPity?: number;
  chronicledFatePoints?: number; // 0 or 1
  includeCashback?: boolean; // ~8% Starglitter cashback projection
}

export interface EnhancedPullAdvice {
  id: string;
  name: string;
  targetType: PullTargetType;
  characterId: string;
  weaponKey?: string;
  targetLevelText: string; // e.g. "C0 New Unlock", "C2 Peak Spike", "R1 Signature"
  score: number; // 0 to 100 composite ROI
  tier: 'Must Pull' | 'High Value' | 'Situational' | 'Skip / Redundant';
  teamDamageUpliftPct: number;
  unlockedArchetypes: string[];
  accountBenefits: string[];
  caution?: string;
  odds: GachaOddsResult;
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
  medianRunsForUpgrade?: number; // 50% milestone runs
  meanExpectedRuns?: number; // Mathematical expectation (1/p)
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

export type TeamPresetKey =
  | 'hypercarry_bennett_furina'
  | 'vape_melt'
  | 'quicken_spread'
  | 'hyperbloom'
  | 'unbuffed';

export interface TeamContext {
  preset?: TeamPresetKey;
  hasBennett?: boolean;
  hasFurina?: boolean;
  hasKazuhaOrVV?: boolean;
  hasAmplifyingReaction?: boolean;
  hasQuickenReaction?: boolean;
  hasLunarReaction?: boolean;
  hasStellarReaction?: boolean;
  customFlatAtkBuff?: number;
  customDmgBonus?: number;
  customCritRateBuff?: number; // e.g., Cryo Res, Rosaria, Moonsign, weapon passives
  customEmBuff?: number; // e.g., Nahida, Sucrose, Lauma, Ineffa, Instructor
  baseCritRate?: number; // Character + weapon + ascension CR% (default 5)
  baseCritDmg?: number; // Character + weapon + ascension CD% (default 50)
  statCaps?: Partial<Record<'hp' | 'atk' | 'def' | 'eleMas', number>>;
}

export interface WholeBuildErEvaluation {
  totalEr: number;
  targetEr: number;
  status: 'Deficit' | 'Target' | 'Overcap';
  penaltyFactor: number;
  erDifference: number;
  message: string;
}

export interface SetOptionComparison {
  name: string;
  type: '4pc' | '2pc+2pc' | 'Rainbow';
  esr: number;
  breakEvenRollDelta: number;
  description: string;
}

export interface SetComparisonResult {
  currentSetEsr: number;
  activeSets: string[];
  options: SetOptionComparison[];
  breakEvenRollDelta: number;
  verdict: string;
}

export interface RoiMilestoneComparison {
  name: string;
  costResin: number;
  expectedDpsGainPct: number;
  resinPerOnePctDps: number;
  isGuaranteed: boolean;
  efficiencyRatioVsArtifacts: number;
}

export interface RoiComparison {
  resinPerOnePctArtifactDps: number;
  artifactMarginalDpsGainPerRoll: number;
  decision: 'Stop Farming' | 'Continue Farming' | 'Switch to Guaranteed Upgrades';
  milestones: RoiMilestoneComparison[];
  summaryBanner: string;
}

export interface DomainRouteRecommendation {
  targetSet: string;
  isStrongboxEligible: boolean;
  domainName?: string;
  companionSet?: string;
  companionValue: 'High' | 'Low' | 'Moderate';
  recommendedAction: 'Farm Domain' | 'Use Strongbox / Farm Marechaussee or Deepwood' | 'Neutral';
  guidance: string;
}

export type InvestmentGoal = 'casual' | 'endgame' | 'hyper';

export type ReshapePityTier = 'standard' | 'advanced' | 'decreed';

export type UniversalStopAction =
  | 'FARM_DOMAIN'
  | 'STRONGBOX_ONLY'
  | 'USE_ELIXIR'
  | 'USE_DUST'
  | 'STOP';

export interface UniversalStopOptions {
  goal?: InvestmentGoal;
  setMode?: '4pc' | '2pc2pc';
  /** True during the 10-day Stygian Onslaught Disturbance Outbreak (+1 bonus 5★ per 120 Resin). */
  stygianOutbreakActive?: boolean;
  /** Include 3:1 recursive Strongbox recycling when target set is Strongbox-eligible. Default: true. */
  includeStrongboxRecycling?: boolean;
  /** Current Hallowed Exegesis pity tier for Dust of Enlightenment reshaping. */
  reshapePityTier?: ReshapePityTier;
  /** Override domain companion efficiency multiplier (1.0 = useless partner, 2.0 = both equally needed). */
  domainEfficiencyOverride?: number;
  /** Daily natural Resin spent (defaults to DOMAIN_CONSTANTS.DAILY_RESIN = 180). */
  dailyResin?: number;
}

export interface UniversalSlotMetrics {
  slotKey: ArtifactSlot;
  isOffPieceCandidate: boolean;
  hasValidMainStat: boolean;
  currentURV: number; // Equivalent max rolls (0..9)
  realisticCeilingURV: number; // Build-specific realistic endgame ceiling in rolls
  completionPct: number; // 0..100 normalized to THIS character's stat weights
  expectedURVGainPerDrop: number;
  expectedGainPctPer1kResin: number;
  reshapeExpectedURVGain: number;
  elixirExpectedURVGain: number;
  elixirCost: number;
  dustCost: number;
}

export interface UniversalStopSummary {
  action: UniversalStopAction;
  shouldStop: boolean;
  stopScore: number; // 0..100 normalized universal build completion
  roiPer1kResinPct: number; // Expected % build gain per 1,000 Resin
  thresholdPct: number; // Opportunity-cost threshold for chosen goal
  goal: InvestmentGoal;
  recommendedOffPieceSlot: ArtifactSlot;
  prioritySlot: ArtifactSlot;
  hardGatesFailed: string[];
  effectiveCritRatePct: number;
  conditionalCritRateFromSet: number;
  slotMetrics: Record<ArtifactSlot, UniversalSlotMetrics>;
  reasons: string[];
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
  erEvaluation?: WholeBuildErEvaluation;
  setComparison?: SetComparisonResult;
  roiComparison?: RoiComparison;
  domainRoute?: DomainRouteRecommendation;
  activeSetsSummary?: {
    active2pc: string[];
    active4pc: string[];
    totalEsr: number;
  };
  universalStop?: UniversalStopSummary;
}

// ---------------------------------------------------------
// Imaginarium Theater & Abyss Dual-Team Types
// ---------------------------------------------------------

export type EncounterTargetProfile = 'Single-Target' | 'AoE' | 'Mixed';

export type EnemyMovementTrait =
  | 'Stationary'
  | 'Aggressive'
  | 'Teleporting'
  | 'Airborne'
  | 'Burrowing'
  | 'Multi-Wave'
  | 'Shield-Punishing';

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

export interface BossMatchupRating {
  rating: 'S' | 'A' | 'B' | 'C';
  score: number;
  reason: string;
  counterHighlights: string[];
}

export interface TheaterActPlan {
  actNumber: number;
  type: TheaterActType;
  bossName?: string;
  recommendedArchetypes: string[];
  team: Character[];
  isLocked?: boolean;
  bossMatchup?: BossMatchupRating;
  strategyNote?: string;
  preservedCarriesUsed?: string[];
}

export interface TheaterPreservationEntry {
  characterId: string;
  characterName: string;
  element: Element;
  reservedForActs: number[];
  reason: string;
  priority: 'Critical' | 'High' | 'Flexible';
}

export interface TheaterDraftStep {
  phase:
    | 'Opening'
    | 'Early Acts (1–3)'
    | 'Mid Acts (4–6)'
    | 'Late Acts (7–8)'
    | 'Climax (9–10)';
  targetActs: number[];
  guidance: string;
  recommendedRecruits: string[];
  preserveCharacterIds: string[];
}

export interface TheaterSeasonAnalysis {
  seasonId: string;
  apexBossName?: string;
  apexBossAct?: number;
  apexBossReadiness: 'Ready' | 'Needs Preparation' | 'At Risk';
  apexBossSummary: string;
  recommendedArchetypes: string[];
  rosterWeaknesses: string[];
  preservationPlan: TheaterPreservationEntry[];
  draftPlan: TheaterDraftStep[];
}

export interface TheaterSeasonConfig {
  id: string;
  name: string;
  elements: Element[];
  openingCastIds: string[];
  specialGuestIds: string[];
  bosses: Record<number, string>;
  version?: string;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  seasonNumber?: number;
  blessingSummary?: string;
}

export interface ChamberHalfMetrics {
  shieldBreakTime?: number;
  shieldBreakRating?: 'Fast' | 'Medium' | 'Slow' | 'Ineffective';
  shieldBreakBreakdown?: string;
  effectiveResShred?: number;
  resShredSources?: string[];
  effectiveDmgMultiplier?: number;
  targetProfile?: EncounterTargetProfile;
  targetProfileFit?: 'Optimal' | 'Good' | 'Suboptimal';
  movementTraits?: EnemyMovementTrait[];
  waveCount?: number;
  buffAlignmentScore?: number;
  buffAlignmentNote?: string;
}

export interface AbyssChamberCoverage {
  chamber: number;
  firstHalfStatus: string;
  secondHalfStatus: string;
  firstHalfSatisfied: boolean;
  secondHalfSatisfied: boolean;
  firstHalfMetrics?: ChamberHalfMetrics;
  secondHalfMetrics?: ChamberHalfMetrics;
}

export interface AbyssHalfExplanation {
  half: 'First Half' | 'Second Half';
  summary: string;
  strengths: string[];
  risks: string[];
  buffSynergy?: string;
  targetProfileFit: 'Optimal' | 'Good' | 'Suboptimal';
  movementNotes: string[];
}

export interface AbyssMissingCounterFallback {
  half: 'First Half' | 'Second Half';
  chamber: number;
  missingRequirement: string;
  ownedSubstitutes: {
    characterId: string;
    characterName: string;
    element: Element;
    reason: string;
  }[];
  strategyTip: string;
}

export interface AbyssDualTeamPlan {
  firstHalfTeam: TeamRecommendation;
  secondHalfTeam: TeamRecommendation;
  chamberCoverage: AbyssChamberCoverage[];
  overallScore: number;
  mechanicCoverageScore?: number;
  warnings?: string[];
  cycleId?: string;
  variantType?: 'primary' | 'comfort' | 'alternative';
  label?: string;
  description?: string;
  allPairs?: AbyssDualTeamPlan[];
  primaryPair?: AbyssDualTeamPlan;
  comfortPair?: AbyssDualTeamPlan;
  alternativePair?: AbyssDualTeamPlan;
  firstHalfExplanation?: AbyssHalfExplanation;
  secondHalfExplanation?: AbyssHalfExplanation;
  missingCounterFallbacks?: AbyssMissingCounterFallback[];
}

export interface AbyssDualTeamMultiPlan {
  primaryPair: AbyssDualTeamPlan;
  comfortPair?: AbyssDualTeamPlan;
  alternativePair?: AbyssDualTeamPlan;
  allPairs: AbyssDualTeamPlan[];
}


export type ProvenanceStatus = 'verified' | 'provisional' | 'stale';

export type VerificationMethod =
  | 'official_notice'
  | 'in_game_verification'
  | 'theorycraft_consensus'
  | 'sandbox_simulation';

export interface DataProvenance {
  datasetId: string;
  version: string;
  verifiedAt: string; // ISO date YYYY-MM-DD
  sourceUrl: string;
  evidence: string; // Specific patch notice, mechanic, or in-game verification note
  status: ProvenanceStatus;
  verificationMethod?: VerificationMethod;
  verifiedFields?: string[]; // Exact fields verified (e.g. ['featuredCharacters', 'weaponBanner', 'dates'])
  effectiveEndDate?: string; // Optional ISO expiry date (YYYY-MM-DD) for time-boxed schedules
}



