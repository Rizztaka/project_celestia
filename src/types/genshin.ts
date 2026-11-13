export type Element = 'Pyro' | 'Hydro' | 'Anemo' | 'Electro' | 'Dendro' | 'Cryo' | 'Geo';
export type WeaponType = 'Sword' | 'Claymore' | 'Polearm' | 'Bow' | 'Catalyst';
export type CharacterRole = 'On-Field DPS' | 'Off-Field DPS' | 'Buffer/Shred' | 'Sustain';

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
  description?: string;
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
