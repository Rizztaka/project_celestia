// ADR-0011 compliant: pure string generation, no arithmetic.
import type { InsightKey, KnowledgeInsightData } from './knowledge-intelligence.calculator.js';

/** Human-readable title and body for one insight card. */
export interface InsightExplanation {
  title: string;
  body: string;
  /** Icon identifier for the frontend to render */
  iconKey: InsightKey;
}

/**
 * Converts a KnowledgeInsightData result from the calculator into a
 * fully-formed, player-facing InsightExplanation.
 *
 * ADR-0011 compliant: no math whatsoever, only string construction.
 */
export function explainInsight(insight: KnowledgeInsightData): InsightExplanation {
  const name = formatName(insight.subject);

  switch (insight.key) {
    case 'ELEMENTAL_SPECIALIST':
      return {
        title: `${insight.subject} Specialist`,
        body: `${insight.value}% of your fully-built characters are ${insight.subject} users. You clearly have a favourite element — and good taste!`,
        iconKey: 'ELEMENTAL_SPECIALIST',
      };

    case 'TALENT_NEGLECTOR':
      return {
        title: 'The Forgotten One',
        body: insight.valueAlt && insight.valueAlt > 1
          ? `You have ${insight.valueAlt} maxed-out characters whose talents have barely been touched. ${name} is the most glaring example — fully ascended, but with an average talent level of only ${insight.value}. The Akasha System disapproves.`
          : `${name} is fully ascended but their talents average only level ${insight.value}. A true powerhouse left untapped — the Akasha System disapproves!`,
        iconKey: 'TALENT_NEGLECTOR',
      };

    case 'ARTIFACT_HOARDER':
      return {
        title: 'The Collector',
        body: `You have ${insight.value} artifacts sitting unequipped in your inventory out of a total of ${insight.valueAlt}. At this rate, even the Wangsheng Funeral Parlor would struggle to catalogue your collection.`,
        iconKey: 'ARTIFACT_HOARDER',
      };

    case 'MAX_CONSTELLATION':
      return {
        title: 'Dedicated Summoner',
        body: insight.value > 1
          ? `You've reached C6 on ${insight.value} characters, including ${name}. The Primogems spent... we do not speak of it.`
          : `${name} has reached their full potential at C6. The Primogems spent to get here could fund a small nation.`,
        iconKey: 'MAX_CONSTELLATION',
      };

    case 'DIVERSE_ROSTER':
      return {
        title: 'The Generalist',
        body: `Your built roster spans ${insight.value} different elements (${insight.subject}). You are prepared for every Spiral Abyss challenge the game can throw at you.`,
        iconKey: 'DIVERSE_ROSTER',
      };

    default: {
      const _exhaustive: never = insight.key;
      return {
        title: 'Account Insight',
        body: 'An insight about your account.',
        iconKey: _exhaustive,
      };
    }
  }
}

// -------------------------------------------------------
// Internal helpers
// -------------------------------------------------------

function formatName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}
