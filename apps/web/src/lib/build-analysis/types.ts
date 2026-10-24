/**
 * Typed vocabulary for the public-UID build analysis.
 *
 * The public showcase only exposes observed builds. Nothing here models live combat
 * state, rotations, ownership or a complete roster, and no type carries a build score.
 */

export const RULE_PACK_VERSION = 'public-build-analysis-1';

export type TriState = 'true' | 'false' | 'unknown';

export type Element = 'Anemo' | 'Geo' | 'Electro' | 'Dendro' | 'Hydro' | 'Pyro' | 'Cryo';
export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
export type ArtifactSlot = 'Flower' | 'Plume' | 'Sands' | 'Goblet' | 'Circlet';

export const artifactSlots: readonly ArtifactSlot[] = [
  'Flower',
  'Plume',
  'Sands',
  'Goblet',
  'Circlet',
];

/**
 * Supported build roles. A role is an explicit assumption chosen by the reader, never
 * inferred from element or weapon type.
 */
export type BuildRoleId =
  | 'on_field_damage'
  | 'off_field_damage'
  | 'reaction_trigger'
  | 'party_buff'
  | 'resistance_shred'
  | 'healing_support'
  | 'shield_support'
  | 'unspecified';

export type FindingCategory =
  | 'verified_incompatibility'
  | 'source_mismatch'
  | 'progression'
  | 'conditional_alternative'
  | 'missing_data';

/** Stable presentation order; also the default action priority. */
export const findingCategoryOrder: readonly FindingCategory[] = [
  'verified_incompatibility',
  'source_mismatch',
  'progression',
  'conditional_alternative',
  'missing_data',
];

export type FindingStatus =
  'fits' | 'needs_attention' | 'depends_on_conditions' | 'not_enough_data';

/** Unit of a normalised number. Combat ratios and equipment percentage points are distinct. */
export type StatUnit = 'ratio' | 'percentage_points' | 'flat' | 'unknown';

export interface NormalizedStat {
  id: string;
  name: string;
  /** The value exactly as the public contract reported it. */
  raw: number;
  /** Declared unit of `raw`, established by reviewed stat-id classification. */
  unit: StatUnit;
  /** Percentage points when the stat is percent-like, otherwise null. */
  percentPoints: number | null;
  /** Flat value when the stat is not percent-like, otherwise null. */
  flat: number | null;
}

export interface NormalizedTalent {
  id: string;
  label: string;
  /** Null when the depot could not be classified; never guessed from array position. */
  kind: 'normal' | 'skill' | 'burst' | null;
  baseLevel: number;
  /** Null means "not verified"; it is not a verified zero bonus. */
  bonusLevel: number | null;
}

export interface SetIdentity {
  /** Reviewed relic set game ID. */
  setId: number;
  /** Reviewed display name, or null when only an unreviewed label exists. */
  name: string | null;
  /** Reviewed stable reference key usable by rules, or null. */
  referenceKey: string | null;
}

export interface NormalizedArtifact {
  itemId: number;
  slot: ArtifactSlot | null;
  /** The contract's `setName`, which may be an unresolved fallback label. */
  setNameLabel: string | null;
  /** Stable identity resolved from the item ID; null when unreviewed. */
  set: SetIdentity | null;
  rarity: number | null;
  level: number | null;
  /** Only ever the contract's explicit `mainStat`; a substat is never promoted. */
  mainStat: NormalizedStat | null;
  substats: NormalizedStat[];
}

export interface NormalizedWeapon {
  itemId: number;
  name: string;
  rarity: number | null;
  level: number | null;
  ascension: number | null;
  /** Null when the public contract did not report a single refinement rank. */
  refinement: number | null;
  /** Reviewed stable weapon reference key, or null. */
  referenceKey: string | null;
  stats: NormalizedStat[];
}

export interface NormalizedCharacter {
  uid: string;
  /** `avatarId:skillDepotId`, the public route identity. */
  key: string;
  avatarId: number;
  skillDepotId: number | null;
  name: string;
  element: Element | null;
  weaponType: WeaponType | null;
  rarity: 4 | 5 | null;
  level: number | null;
  ascension: number | null;
  constellation: number;
  metadataAvailable: boolean;
  /** False means the contract omitted equipment entirely; not proof of empty slots. */
  equipmentAvailable: boolean;
  observedAt: string;
  talents: NormalizedTalent[];
  weapon: NormalizedWeapon | null;
  artifacts: NormalizedArtifact[];
  stats: NormalizedStat[];
}

export type FindingValue =
  | { kind: 'stat'; statId: string; value: number; unit: StatUnit }
  | { kind: 'count'; value: number; of: number }
  | { kind: 'level'; base: number; bonus: number | null }
  | { kind: 'refinement'; rank: number | null }
  | { kind: 'text'; code: string }
  | { kind: 'pieces'; count: number }
  | { kind: 'element'; element: Element | null };

export interface Finding {
  ruleId: string;
  category: FindingCategory;
  condition: TriState;
  status: FindingStatus;
  /** Character findings carry their own key; team findings carry the member slot. */
  characterKey: string | null;
  slot: number | null;
  roleId: BuildRoleId | null;
  /** Typed values the explainer may interpolate; never prose. */
  values: Record<string, FindingValue>;
  evidenceIds: string[];
  /** Whether this finding only exists because a team context was supplied. */
  teamDependent: boolean;
  /** Whether this finding only exists because a hypothesis was supplied. */
  hypothesisDependent: boolean;
  order: number;
}

export interface TeamMemberContext {
  slot: number;
  characterKey: string;
  roleId: BuildRoleId;
  element: Element | null;
  character: NormalizedCharacter | null;
}

export interface TeamContext {
  /** Stable identity of the frozen team configuration. */
  id: string;
  members: TeamMemberContext[];
}

export type Hypothesis =
  | { kind: 'weapon_refinement'; rank: number }
  | { kind: 'set_pieces'; setId: number; pieces: 2 | 4 }
  | { kind: 'main_stat'; slot: ArtifactSlot; statId: string };

export interface AnalysisInput {
  rulePackVersion: string;
  uid: string;
  character: NormalizedCharacter;
  roleId: BuildRoleId;
  team: TeamContext | null;
  hypothesis: Hypothesis | null;
}

export interface CharacterAnalysis {
  rulePackVersion: string;
  uid: string;
  characterKey: string;
  roleId: BuildRoleId;
  teamId: string | null;
  hypothesis: Hypothesis | null;
  /** Deterministic identity of everything that influenced the result. */
  digest: string;
  findings: Finding[];
  /** Findings that warrant a next action, in stable action order. */
  actions: Finding[];
  status: FindingStatus;
  coverage: {
    characterProfile: boolean;
    roleSupported: boolean;
    equipmentAvailable: boolean;
    identityGaps: string[];
  };
  observedAt: string;
}

export interface TeamMemberAnalysis {
  slot: number;
  characterKey: string;
  roleId: BuildRoleId;
  observedAt: string;
  analysis: CharacterAnalysis;
}

export interface TeamAnalysis {
  rulePackVersion: string;
  uid: string;
  teamId: string;
  digest: string;
  members: TeamMemberAnalysis[];
  teamFindings: Finding[];
  actions: Finding[];
  /** Distinct observation times among the frozen records. */
  observationTimes: string[];
  mixedObservationTimes: boolean;
  missingMembers: string[];
  status: FindingStatus;
}
