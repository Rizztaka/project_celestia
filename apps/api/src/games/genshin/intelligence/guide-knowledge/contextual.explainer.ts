import type { calculateContextualAdvice } from './contextual.calculator.js';

const names = {
  normal_charged: 'Normal/Charged Attack damage',
  skill: 'Elemental Skill damage',
  anemo: 'Anemo damage',
  ordinary_swirl: 'ordinary Swirl reaction damage',
};
const talents = {
  role_unknown: [
    'Choose an ability-use role',
    'A low unused talent is not automatically neglected. Choose a role to see which abilities participate.',
  ],
  on_field_attacks: [
    'On-field attacks',
    'Normal/Charged attacks and Skill participate in this selected playstyle; Burst use follows your separate plan.',
  ],
  oz_skill: [
    'Off-field Oz',
    'Skill levels affect Oz. Off-field Normal Attacks are not part of this scenario, so a low Normal Attack talent is not automatically neglect. Burst can refresh Oz.',
  ],
  plunge_support: [
    'Quickswap support and plunge',
    'The Skill follow-up is Plunging Attack damage: Normal Attack talent remains relevant to that plunge even in a support role.',
  ],
  burst_swap: [
    'Skill/Burst swap',
    'Skill and Burst are relevant to this swapping role; your separate Burst plan can exclude Burst here. Unused Normal Attacks need not be treated as neglected.',
  ],
};
export function explainContextualAdvice(result: ReturnType<typeof calculateContextualAdvice>) {
  return result.cards.map((card) => {
    const effect = card.effect;
    let title: string, summary: string, explanation: string;
    if (effect.kind === 'talent_relevance') {
      [title, summary] = talents[effect.code];
      explanation =
        'Imported talent values have stored_convention_unknown basis. This is ability relevance, not a base-level deficit, ranking or automatic upgrade goal.';
    } else if (effect.kind === 'energy_context') {
      title = 'Energy and Burst plan';
      const purpose = {
        oz_refresh: 'refreshing Oz',
        application: 'Elemental application and Swirl opportunities',
        personal_damage: 'its own damage and kit effects',
      }[effect.purpose];
      summary =
        effect.plan === 'use'
          ? `You plan to use Burst for ${purpose}; energy preparation matters for that chosen cadence.`
          : effect.plan === 'skip'
            ? `You plan to skip Burst here, giving up ${purpose}; no every-rotation requirement is imposed.`
            : `Burst cadence is unknown. Decide whether this playstyle needs ${purpose} before planning energy.`;
      explanation =
        'Particle generation, catches, enemy drops, weapons, rotation duration and actual Burst cadence are unmodeled. No personalized numeric ER target or energy deficit can be inferred.';
    } else if (effect.kind === 'team_context') {
      title = 'Selected team: Fischl and Oz';
      summary =
        card.applicability === 'true'
          ? 'In this assumed context, unlocked Fischl A4 can respond to the selected active character’s Electro-related reaction while Oz is present.'
          : card.applicability === 'false'
            ? 'The selected context does not meet all reviewed Fischl A4 conditions.'
            : 'Fischl A4 needs unlocked Ascension 4, Oz present and an active character triggering an Electro-related reaction; membership alone establishes none of these triggers.';
      explanation =
        'Owned members and recorded ascension come from one coherent owned snapshot. Hypothetical members/unlock/trigger choices are assumptions. No proc count, damage, passive enhancement or sustained uptime is modeled.';
    } else {
      const potential = card.potential!;
      title =
        effect.kind === 'crit_rate'
          ? 'Four-piece HP-change stacks'
          : effect.kind === 'resistance_reduction'
            ? 'Four-piece matching resistance reduction'
            : card.id === 'gt-four-piece-base'
              ? 'Four-piece base Skill bonus'
              : card.id === 'gt-four-piece-field'
                ? 'Four-piece conditional off-field Skill bonus'
                : `${card.id.includes('two-piece') ? 'Two-piece' : 'Four-piece'} ${names[effect.target]}`;
      const unit =
        effect.kind === 'crit_rate'
          ? 'CRIT Rate percentage points'
          : effect.kind === 'resistance_reduction'
            ? `${potential.target === 'matching_element_unknown' ? 'matching elemental' : potential.target} resistance percentage points of reduction`
            : `% ${names[effect.target]} bonus`;
      summary =
        card.applicability === 'true'
          ? `${potential.amount} ${unit} in the modeled scenario.`
          : card.applicability === 'false'
            ? 'This component is inactive under the recorded/selected conditions.'
            : potential.amount === null
              ? 'Activation or stack count remains unknown; no exact active contribution is established.'
              : `Conditional ${potential.amount} ${unit}; missing conditions prevent an active contribution claim.`;
      explanation =
        effect.kind === 'crit_rate'
          ? `${effect.perStack} percentage points per HP-change stack, at most ${effect.maxStacks}, with a nominal ${effect.durationSeconds}s window. On-field at trigger differs from current field position: leaving the field does not itself clear existing stacks. A teammate does not establish HP changes or full stacks.`
          : effect.kind === 'resistance_reduction'
            ? 'Ordinary Swirl by the wearer while on field must match a Pyro/Hydro/Electro/Cryo target element within the nominal ten-second window. Membership and Elemental absorption are not proof of that Swirl. Hitlag and target-hit timing are unmodeled.'
            : card.id === 'gt-four-piece-field'
              ? 'This is the separate additional off-field Skill bonus. A carried bonus persists for less than two seconds after taking the field and is cleared at two seconds. Oz snapshot behavior is not assumed.'
              : `This component targets only ${names[effect.target]}. Piece eligibility and activity are separate; no total stats, set ranking or DPS gain follows.`;
    }
    return { ...card, title, summary, explanation };
  });
}
