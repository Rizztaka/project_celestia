import type { DamageIssue } from './calculator';

const messages: Record<DamageIssue['code'], string> = {
  missing_build: 'The saved member has no observed build in this browser.',
  unsupported_character:
    'This character/form is not implemented in the pinned damage engine. A complete team total is unavailable.',
  missing_progression:
    'Character level, ascension, constellation or equipment metadata is missing or inconsistent.',
  missing_talents:
    'All three base talent levels are required. Constellation bonuses are applied by the simulator.',
  unsupported_weapon:
    'Weapon identity, level, ascension or refinement is missing or unsupported by the engine.',
  incompatible_weapon: 'The recorded weapon type does not match this character.',
  incomplete_artifacts: 'Five distinct artifact slots with explicit main stats are required.',
  unsupported_set:
    'An artifact set is not identified or supported. It cannot safely be omitted from a team total.',
  unsupported_stat: 'An artifact stat could not be converted safely.',
  invalid_settings:
    'Use 10–180 seconds, enemy level 1–200, resistance −100–300%, and 1–50 samples.',
  invalid_rotation:
    'Choose supported actions, repeats 1–20, and waits 0–1800 frames. Use at most 64 steps / 200 actions. Parameters must be numeric, such as hold=1.',
};
export function explainDamageIssue(issue: DamageIssue, names: Record<string, string>) {
  return `${issue.characterKey ? `${names[issue.characterKey] ?? issue.characterKey}: ` : ''}${messages[issue.code]}${issue.detail ? ` (${issue.detail})` : ''}`;
}
export const actionLabels: Record<string, string> = {
  skill: 'Skill',
  burst: 'Burst',
  attack: 'Normal attack',
  charge: 'Charged attack',
  dash: 'Dash',
  jump: 'Jump',
  swap: 'Swap',
  walk: 'Walk',
  aim: 'Aimed shot',
  low_plunge: 'Low plunge',
  high_plunge: 'High plunge',
};
