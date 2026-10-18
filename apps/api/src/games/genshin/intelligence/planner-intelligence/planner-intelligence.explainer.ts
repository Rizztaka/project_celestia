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
      ? ({ normal: 'Normal Attack', skill: 'Elemental Skill', burst: 'Elemental Burst' }[
          item.talentType
        ] ?? 'talent')
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

  if (item.isTimeGated) {
    explanations.push('This verified source is available on the selected server day.');
  }

  explanations.push('Goals follow your priority (1 first), then creation time and ID.');

  // 4. Runs summary
  explanations.push(
    `Resin budget: ${item.runs} run${item.runs !== 1 ? 's' : ''} (${item.resinCost} Resin). Drops and upgrade completion are not guaranteed.`,
  );

  return explanations;
}
