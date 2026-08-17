import { GoalType } from '@prisma/client';

import type { RouteItem } from './planner-intelligence.calculator.js';

// -------------------------------------------------------
// Pure public API (ADR-0011 — no math, strings only)
// -------------------------------------------------------

/**
 * Generates plain-language explanations for a single route item.
 *
 * @param item - A fully calculated RouteItem from the calculator.
 * @returns string[] of explanation bullets shown on the frontend.
 */
export function explainRouteItem(item: RouteItem): string[] {
  const explanations: string[] = [];

  // 1. Primary action bullet
  if (item.goalType === GoalType.CHARACTER_TALENT) {
    const talentLabel = item.talentType
      ? { normal: 'Normal Attack', skill: 'Elemental Skill', burst: 'Elemental Burst' }[
          item.talentType
        ] ?? 'talent'
      : 'talent';
    explanations.push(
      `Farm ${item.domainName} today — ${item.targetKey}'s ${talentLabel} books (${item.resourceName}) are available.`,
    );
  } else if (item.goalType === GoalType.WEAPON_ASCENSION) {
    explanations.push(
      `Farm ${item.domainName} today — ${item.targetKey}'s ascension materials (${item.resourceName}) are available.`,
    );
  } else {
    // CHARACTER_ASCENSION — bosses are always open
    explanations.push(
      `Defeat the World Boss to collect ${item.targetKey}'s ascension materials. Bosses are available every day.`,
    );
  }

  // 2. Time-gating urgency
  if (item.isTimeGated) {
    explanations.push(
      `This domain is only open 3 days per week — do not miss today's window.`,
    );
  }

  // 3. Character priority weight
  if (item.characterScore < 40) {
    explanations.push(
      `${item.characterKey} needs major investment (Character Score: ${item.characterScore}/100) — this is a critical farming priority.`,
    );
  } else if (item.characterScore < 60) {
    explanations.push(
      `${item.characterKey} still has meaningful gaps (Character Score: ${item.characterScore}/100) — progressing this goal will yield high returns.`,
    );
  } else if (item.characterScore < 80) {
    explanations.push(
      `${item.characterKey} is well-built (Character Score: ${item.characterScore}/100) — this is a secondary farming target.`,
    );
  }

  // 4. Runs summary
  explanations.push(
    `Recommended: ${item.runs} run${item.runs !== 1 ? 's' : ''} (${item.resinCost} Resin).`,
  );

  return explanations;
}
