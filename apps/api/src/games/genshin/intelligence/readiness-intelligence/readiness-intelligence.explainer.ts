import type { ReadinessCalculatorResult } from './readiness-intelligence.calculator.js';

/**
 * Pure Explainer adhering strictly to ADR-0011:
 * Translates numeric calculator scores, dimensional statuses, and metadata into
 * concise, human-readable rationale without performing calculations or altering results.
 */
export function explainReadiness(result: ReadinessCalculatorResult): string[] {
  const explanations: string[] = [];
  const meta = result.metadata;
  const dims = result.dimensions;

  // 1. Overall Status Summary
  if (result.status === 'ready_for_target') {
    explanations.push(
      `Character build meets readiness criteria for ${meta.roleName} in ${meta.encounterName}. All evaluated dimensions fulfill target thresholds.`,
    );
  } else if (result.status === 'insufficient_data') {
    explanations.push(
      `Insufficient build data: one or more critical dimensions (talents, weapon, main stats, or energy) are unrecorded. Full readiness cannot be certified.`,
    );
  } else if (result.status === 'conditional') {
    explanations.push(
      `Character build is conditionally ready for ${meta.roleName}. Performance depends on specific rotation execution or party member synergies.`,
    );
  } else {
    explanations.push(
      `Character build requires targeted progression investment before reaching recommended benchmark standards for ${meta.roleName}.`,
    );
  }

  // 2. Rotation Energy Recharge (Invariant: Deficit Defeats High Offensive Stats)
  const energy = dims.rotation_energy;
  if (energy.status === 'insufficient_data') {
    explanations.push(
      `Energy Recharge stat is unrecorded in observed data. Rotation burst uptime cannot be verified.`,
    );
  } else if (meta.hasEnergyDeficit) {
    if (energy.status === 'needs_investment') {
      explanations.push(
        `Critical Rotation Energy deficit: observed ${meta.observedEr}% ER vs ${meta.effectiveErThreshold}% required threshold (${meta.energyDeficitPp}% deficit). Inconsistent burst uptime defeats high offensive stats and prevents ready status.`,
      );
    } else {
      explanations.push(
        `Marginal Energy Recharge deficit: observed ${meta.observedEr}% ER is slightly below the ${meta.effectiveErThreshold}% threshold. Consistent burst uptime requires active particle funneling.`,
      );
    }
  } else {
    explanations.push(
      `Energy Recharge (${meta.observedEr}%) meets the ${meta.effectiveErThreshold}% rotation threshold for consistent burst uptime.`,
    );
  }

  // 3. Priority Talents
  const talents = dims.talents;
  if (talents.status === 'insufficient_data') {
    explanations.push(
      `Talent levels are unrecorded in observed build data. Talent progression cannot be evaluated.`,
    );
  } else if (talents.status === 'ready_for_target') {
    const talentDetails = Object.entries(meta.observedTalents)
      .filter(([k]) => meta.priorityTalents.includes(k))
      .map(([k, v]) => `${k} Lv. ${v}`)
      .join(', ');
    explanations.push(
      `Priority talents (${talentDetails}) meet recommended target levels for ${meta.roleName}.`,
    );
  } else if (talents.status === 'conditional') {
    const talentDetails = Object.entries(meta.observedTalents)
      .filter(([k]) => meta.priorityTalents.includes(k))
      .map(([k, v]) => `${k} Lv. ${v}`)
      .join(', ');
    explanations.push(
      `Priority talents (${talentDetails}) meet baseline functional levels but have not reached optimal investment.`,
    );
  } else {
    const talentDetails = Object.entries(meta.observedTalents)
      .filter(([k]) => meta.priorityTalents.includes(k))
      .map(([k, v]) => `${k} Lv. ${v}`)
      .join(', ');
    explanations.push(
      `Priority talent levels (${talentDetails}) are below the target benchmark for ${meta.roleName}; prioritize leveling these talents.`,
    );
  }

  // 4. Weapon
  const weapon = dims.weapon;
  if (weapon.status === 'insufficient_data') {
    explanations.push(`No equipped weapon recorded on this character.`);
  } else if (weapon.status === 'ready_for_target') {
    explanations.push(
      `Equipped weapon '${meta.weaponKey}' (Lv. ${meta.weaponLevel}) matches recommended options and meets target level.`,
    );
  } else if (weapon.status === 'conditional') {
    explanations.push(
      `Equipped weapon '${meta.weaponKey}' (Lv. ${meta.weaponLevel}) is functional but not an optimal reviewed match for ${meta.roleName}.`,
    );
  } else {
    explanations.push(
      `Equipped weapon '${meta.weaponKey}' (Lv. ${meta.weaponLevel}) is below target level; ascend and level the weapon to improve base stats.`,
    );
  }

  // 5. Artifact Main Stats
  const mainStats = dims.main_stats;
  if (mainStats.status === 'insufficient_data') {
    explanations.push(
      `Artifact main stats for key slots (Sands, Goblet, Circlet) are incomplete or unrecorded.`,
    );
  } else if (mainStats.status === 'ready_for_target') {
    explanations.push(
      `Artifact main stats for Sands, Goblet, and Circlet match all recommended attributes for ${meta.roleName}.`,
    );
  } else if (mainStats.status === 'conditional') {
    explanations.push(
      `Artifact main stats include conditional or reaction-specific choices viable under tailored team contexts.`,
    );
  } else {
    explanations.push(
      `Artifact main stats deviate from recommended scaling attributes; swap mismatched slots for optimal performance.`,
    );
  }

  // 6. Set Activation
  const setAct = dims.set_activation;
  if (setAct.status === 'insufficient_data') {
    explanations.push(
      `Fewer than 4 artifact pieces recorded; set bonus activation cannot be verified.`,
    );
  } else if (setAct.status === 'ready_for_target') {
    explanations.push(
      `Recommended 4-piece artifact set bonus is active, maximizing character combat effectiveness.`,
    );
  } else if (setAct.status === 'conditional') {
    explanations.push(
      `A 2-piece set bonus is active; upgrading to a full 4-piece set is recommended for maximum team impact.`,
    );
  } else {
    explanations.push(
      `No recommended set bonus is active; equip a matching set to gain significant passive benefits.`,
    );
  }

  // 7. Support Output
  const support = dims.support_output;
  if (support.status === 'insufficient_data') {
    explanations.push(
      `Support scaling stat (${meta.scalingStat}) is unrecorded in observed stats.`,
    );
  } else if (support.status === 'ready_for_target' && meta.supportThreshold) {
    explanations.push(
      `Support scaling stat (${meta.scalingStat}: ${meta.observedScalingStat}) satisfies the ${meta.supportThreshold} benchmark threshold.`,
    );
  } else if (support.status === 'needs_investment' && meta.supportThreshold) {
    explanations.push(
      `Support scaling stat (${meta.scalingStat}: ${meta.observedScalingStat}) is below the ${meta.supportThreshold} target threshold.`,
    );
  }

  return explanations;
}
