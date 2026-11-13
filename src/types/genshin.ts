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

