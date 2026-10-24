import { sources } from './coverage';
import type { BuildRoleId, Finding } from './types';

export const roleLabels: Record<BuildRoleId, string> = {
  unspecified: 'Choose a role',
  on_field_damage: 'On-field damage',
  off_field_damage: 'Off-field damage',
  reaction_trigger: 'Reaction trigger',
  party_buff: 'Party support',
  resistance_shred: 'Resistance support',
  healing_support: 'Healing support',
  shield_support: 'Shield support',
};
export const statusLabels = {
  fits: 'Fits this role',
  needs_attention: 'Needs attention',
  depends_on_conditions: 'Depends on conditions',
  not_enough_data: 'Not enough data',
};
const statLabels: Record<string, string> = {
  maxHp: 'HP',
  hpPercent: 'HP%',
  atk: 'ATK',
  atkPercent: 'ATK%',
  def: 'DEF',
  defPercent: 'DEF%',
  energyRecharge: 'Energy Recharge',
  elementalMastery: 'Elemental Mastery',
  critRate: 'CRIT Rate',
  critDmg: 'CRIT DMG',
  healingBonus: 'Healing Bonus',
  hydroDmg: 'Hydro DMG',
  cryoDmg: 'Cryo DMG',
  anemoDmg: 'Anemo DMG',
  electroDmg: 'Electro DMG',
  dendroDmg: 'Dendro DMG',
  pyroDmg: 'Pyro DMG',
  geoDmg: 'Geo DMG',
  physicalDmg: 'Physical DMG',
  unknown: 'not reported',
};
export function statLabel(id: string) {
  return statLabels[id] ?? id;
}
function value(f: Finding, key: string) {
  const v = f.values[key];
  return v?.kind === 'text' ? v.code : '';
}
function list(code: string) {
  return code.split(',').map(statLabel).join(' / ');
}
export function explainFinding(f: Finding) {
  const truth = f.condition;
  let title = 'Build check',
    explanation = '';
  if (f.ruleId.startsWith('main-stat-')) {
    title = `${value(f, 'slot')} main stat`;
    explanation = `${f.hypothesisDependent ? 'Assumed choice' : 'Recorded choice'}: ${statLabel(value(f, 'actual'))}. This role's reviewed choices: ${list(value(f, 'accepted'))}. ${truth === 'false' ? 'Consider one of these alternatives for the selected role; this is not a damage comparison.' : truth === 'unknown' ? 'Refresh or check this slot before drawing a conclusion.' : 'This is an accepted choice; the alternatives can also be valid.'}`;
  } else
    switch (f.ruleId) {
      case 'coverage':
        title = 'Analysis coverage';
        explanation =
          {
            choose_role:
              'Choose a role to apply the reviewed build guidance. Generic equipment checks remain available.',
            source_changed:
              'The source fingerprint changed. Tailored rules are disabled until reviewed.',
            constellation_scope:
              'This constellation changes the modeled support pattern. Only generic checks are available.',
            unsupported:
              'Tailored guidance is not reviewed for this character/form and role yet. Observed equipment remains available.',
          }[value(f, 'reason')] ?? 'No tailored rule is available.';
        break;
      case 'weapon-type':
        title = 'Weapon compatibility';
        explanation =
          truth === 'true'
            ? 'The recorded weapon type matches. Type compatibility alone does not establish suitability.'
            : truth === 'false'
              ? 'This recorded weapon type does not match the character. Refresh the public observation before planning changes.'
              : 'Weapon identity or character type is unavailable; compatibility cannot be established.';
        break;
      case 'equipment-gaps':
        title = 'Equipment observation gaps';
        explanation =
          'Some slots or set identities are unresolved. Missing observations do not prove an empty slot or an inactive set.';
        break;
      case 'talent-priority': {
        title = 'Talent investment';
        const levels = Object.entries(f.values).flatMap(([key, v]) =>
          v.kind === 'level'
            ? [
                `${key}: base ${v.base}${v.bonus === null ? ', bonus unknown' : `, bonus +${v.bonus}`}`,
              ]
            : [],
        );
        explanation = `Reviewed priority: ${value(f, 'priority').split(',').join(' → ')}. ${levels.join('; ')}. ${value(f, 'character') === 'Sucrose' ? 'For reaction damage, character level and EM matter more than talent levels.' : value(f, 'character') === 'Skirk' ? 'Skill-state attacks scale with Skill; Normal Attack talent investment is unnecessary for this pattern.' : 'Choose your own stopping point; no exact level deficit or farming cost is inferred.'}`;
        break;
      }
      case 'character-level':
        title = 'Character level';
        explanation =
          value(f, 'character') === 'Sucrose'
            ? 'For a reaction-focused Sucrose, consider progressing toward Level 90 before investing heavily in talents. Reaction damage depends on level and EM.'
            : 'Consider Level 90 for Furina’s HP-scaling damage. Balance this optional progression step against your other goals.';
        break;
      case 'stat-priority':
        title = 'Stats to consider';
        explanation = `${list(value(f, 'priority'))}. ${value(f, 'character') === 'Sucrose' ? 'EM supports her reaction damage and sharing; Burst usage determines whether ER investment helps.' : 'These are contextual priorities, not universal numerical targets or a fixed CRIT ratio.'}`;
        break;
      case 'energy-context':
        title = 'Energy depends on the team';
        explanation =
          'Burst frequency, particle collection, teammates and weapon triggers affect ER needs. No exact requirement or deficit is inferred from these stats alone.';
        break;
      case 'sucrose-energy':
        title = 'Burst is optional in this pattern';
        explanation =
          'Do not chase a fixed ER target at the expense of EM. Burst usage and rotation determine its value.';
        break;
      case 'no-energy-burst':
        title = 'A different Burst resource';
        explanation =
          'Skirk uses Serpent’s Subtlety rather than Energy. ER is not an investment priority for her Burst.';
        break;
      case 'set-profile':
        title = 'Artifact set direction';
        explanation = `${value(f, 'set').replace(/([a-z])([A-Z])/g, '$1 $2')} is the reviewed starting point for this role. ${truth === 'true' ? 'The required pieces are represented; combat activation is still conditional.' : truth === 'false' ? 'Consider its complete set when planning equipment. Other sets may have team-specific uses outside this rule.' : 'Unresolved pieces prevent an exact conclusion.'}`;
        break;
      case 'skirk-team':
        title = 'Skirk’s party Skill-level bonus';
        explanation =
          truth === 'false'
            ? 'This lineup does not meet the Hydro/Cryo-only party prerequisite with both elements present. Review teammates to enable the Skill-level bonus; other kit benefits are separate.'
            : truth === 'true'
              ? 'The Hydro/Cryo-only party includes both elements, meeting her teamwide Skill-level bonus prerequisite. No bonus has been added to the observed talent levels.'
              : 'A complete known lineup is needed to evaluate this party bonus. Missing members do not count as matching elements.';
        break;
      case 'xilonen-samples':
        title = 'Xilonen’s support conditions';
        explanation =
          truth === 'true'
            ? 'At least two Pyro/Hydro/Electro/Cryo teammates are present. Her active-character healing and extended support pattern still require Burst/Skill execution.'
            : truth === 'false'
              ? 'Fewer than two Pyro/Hydro/Electro/Cryo teammates are present. This lineup does not meet the reviewed healing/support prerequisite.'
              : 'Missing members or elements leave the two-sample prerequisite unresolved.';
        break;
      case 'vv-target':
        title = 'Viridescent Venerer in this lineup';
        explanation =
          truth === 'true'
            ? 'A swirlable teammate element is present. Sucrose must actually trigger the relevant Swirl while on-field; application and resistance reduction uptime are unverified.'
            : truth === 'false'
              ? 'No Pyro/Hydro/Electro/Cryo teammate is represented. Teammate-element resistance reduction is not established; an enemy aura is outside this input.'
              : 'The potential teammate element is unresolved. The set effect still requires a relevant Swirl.';
        break;
      case 'skirk-hunter':
        title = 'Skirk with Marechaussee Hunter';
        explanation =
          truth === 'true'
            ? 'Furina is represented, enabling a reviewed HP-change option. Full stacks and an on-field rotation without the regular Burst remain assumptions.'
            : 'Furina is absent or unresolved in this lineup. The reviewed Hunter pattern needs sustained HP changes; another mechanism or rotation is not modeled here.';
        break;
    }
  return {
    title,
    explanation,
    status: statusLabels[f.status],
    sources: sources.filter((s) => f.evidenceIds.includes(s.id)),
  };
}
