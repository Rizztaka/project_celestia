import type {
  CharacterInput,
  TeamScoreBreakdown,
  TeamTemplate,
  TemplateRoleResult,
} from './team-intelligence.calculator.js';

// -------------------------------------------------------
// Internal helpers — display formatting only
// -------------------------------------------------------

function toDisplayName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

function formatInvestment(role: TemplateRoleResult): string {
  const name = toDisplayName(role.filledBy!);
  const tier =
    role.investmentScore >= 70
      ? 'well-built'
      : role.investmentScore >= 40
        ? 'moderately built'
        : 'underlevelled';
  return `${name} (${tier})`;
}

// -------------------------------------------------------
// Public API
// -------------------------------------------------------

/**
 * Pure explanation function — the "Explainer" layer.
 *
 * Translates a TeamScoreBreakdown into an ordered array of human-readable
 * bullet strings. References concrete values from the user's roster.
 *
 * Rules:
 * - NEVER performs any arithmetic or comparisons on scores (that is the
 *   Calculator's responsibility). Compares only booleans / nulls / strings
 *   already present in the breakdown or template.
 * - Bullets are only generated when they add information.
 * - Order: description → reaction → missing roles → investment → resonance.
 */
export function explainTeamScore(
  breakdown: TeamScoreBreakdown,
  template: TeamTemplate,
  rosterMap: Map<string, CharacterInput>,
): string[] {
  const explanations: string[] = [];
  const { subScores, roles } = breakdown;

  // ── 1. Template description — always first ─────────────────────────────
  explanations.push(template.description);

  // ── 2. Reaction completeness ───────────────────────────────────────────
  if (subScores.reactionCompleteness === 8) {
    const elementList = template.reactionElements.join(' and ');
    explanations.push(
      `Both ${elementList} are covered in this team, enabling consistent ${template.reaction} reactions.`,
    );
  } else if (subScores.reactionCompleteness === 4) {
    const filledElements = new Set(
      roles
        .filter((r) => r.filledBy !== null && r.element !== null)
        .map((r) => r.element as string),
    );
    const missing = template.reactionElements.filter((el) => !filledElements.has(el));
    explanations.push(
      `Missing ${missing.join(' and ')} coverage — adding a ${missing[0]} character would unlock ${template.reaction} reactions.`,
    );
  } else if (template.reactionElements.length > 0) {
    explanations.push(
      `Neither required element (${template.reactionElements.join(', ')}) is represented — ${template.reaction} reactions are unavailable with this roster.`,
    );
  }

  // ── 3. Missing required roles — actionable gap advice ─────────────────
  const missingRequired = roles.filter((r) => r.isRequired && r.filledBy === null);
  for (const role of missingRequired) {
    const originalRole = template.roles.find((r) => r.roleId === role.roleId)!;
    const topCandidates = originalRole.candidates.slice(0, 3).map(toDisplayName).join(', ');
    explanations.push(
      `Missing a ${role.label} — ${topCandidates} would complete this slot. Import your account data if you own them.`,
    );
  }

  // ── 4. Investment quality ──────────────────────────────────────────────
  const filledRoles = roles.filter((r) => r.filledBy !== null);

  if (filledRoles.length > 0) {
    const wellBuilt = filledRoles.filter((r) => r.investmentScore >= 70);
    const underbuilt = filledRoles.filter((r) => r.investmentScore < 40);

    if (wellBuilt.length > 0) {
      const names = wellBuilt.map(formatInvestment).join(' and ');
      explanations.push(
        `${names} — ${wellBuilt.length === 1 ? 'this character is' : 'these characters are'} ready to carry this composition.`,
      );
    }

    if (underbuilt.length > 0) {
      const names = underbuilt.map((r) => toDisplayName(r.filledBy!)).join(', ');
      explanations.push(
        `${names} ${underbuilt.length === 1 ? 'is' : 'are'} underlevelled — investing in their ascension and talents will significantly improve this team's performance.`,
      );
    }
  }

  // ── 5. Resonance ──────────────────────────────────────────────────────
  if (subScores.resonanceBonus === 12) {
    // Determine which element triggered resonance
    const elementCounts = new Map<string, string[]>();
    for (const role of roles) {
      if (role.filledBy === null || role.element === null) continue;
      const existing = elementCounts.get(role.element) ?? [];
      existing.push(toDisplayName(role.filledBy));
      elementCounts.set(role.element, existing);
    }
    for (const [element, chars] of elementCounts.entries()) {
      if (chars.length >= 4) {
        explanations.push(
          `All four characters are ${element} — double ${element} Resonance activates its strongest passive bonus.`,
        );
        break;
      }
      if (chars.length >= 2) {
        const resonanceEffect =
          element === 'Pyro'
            ? 'granting a 25% ATK bonus to the whole party'
            : element === 'Hydro'
              ? 'boosting max HP by 25%'
              : element === 'Cryo'
                ? 'raising CRIT Rate against frozen or Cryo-affected enemies'
                : 'activating its passive bonus';
        explanations.push(
          `${chars.join(' and ')} trigger ${element} Resonance, ${resonanceEffect}.`,
        );
        break;
      }
    }
  } else if (subScores.resonanceBonus === 8) {
    const elementCounts = new Map<string, string[]>();
    for (const role of roles) {
      if (role.filledBy === null || role.element === null) continue;
      const existing = elementCounts.get(role.element) ?? [];
      existing.push(toDisplayName(role.filledBy));
      elementCounts.set(role.element, existing);
    }
    for (const [element, chars] of elementCounts.entries()) {
      if (chars.length >= 2) {
        explanations.push(
          `${chars.join(' and ')} trigger ${element} Resonance, activating its passive bonus.`,
        );
        break;
      }
    }
  }

  return explanations;
}
