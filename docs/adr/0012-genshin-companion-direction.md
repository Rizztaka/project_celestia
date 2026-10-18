# ADR 0012: Genshin companion scope and trustworthy planning

**C4 checkpoint (2026-10-06):** The bounded Today/weekly composition now implements user opt-ins, stable active-goal order, period dismissals and qualified material/budget advice. [C4 evidence](../plans/c4-today-weekly-plan/walkthrough.md) distinguishes production manual/verified-cost behavior from synthetic source-allocation tests. The broader navigation transition remains C5; no release approval is implied. Original decision history follows.

**Date:** 2026-09-25

**Status:** Accepted product direction under the owner's delegated planning request. Local checkpoint (2026-10-04): C1/C2, C3a equipment reads and bounded C3b focus/priority/goal lifecycle are implemented and validated. The roadmap exit criterion is met; artifact targets, higher talents, presets, snapshots and broader transitions remain planned. See [CURRENT_HANDOFF](../plans/CURRENT_HANDOFF.md).

## Context

The owner chose to focus Celestia on a Genshin companion and to retain equipped artifact records while excluding a homegrown artifact optimizer. Existing documents promise broad intelligence, multiple games, and score-driven advice. Much of the supporting application already exists, so a rewrite or deletion would waste working foundations.

## Decision

Adopt [Project Vision](../PROJECT_VISION.md), [Roadmap](../ROADMAP.md), and [Genshin Companion](../features/FEATURE_GENSHIN_COMPANION.md) as current product scope.

- Core journey: selected focus, daily/weekly actions, equipment records, material goals, and recorded progress.
- Keep inventory and equipment; replace the product role of AES with Equipment & Build Progress.
- Freeze new simulator and multi-game work; preserve current data and runtime contracts until a reviewed transition.
- Defer snapshots until import preservation and identity semantics are explicit.
- Require verified, scoped data for advice; show unavailable states for unsupported inputs.
- Retain modularity and calculator/explainer separation. The existence of an intelligence module does not require a primary navigation tab.

## Scoped amendments to earlier decisions

- **ADR 0006:** retain transactional bulk import and character natural keys. C1a now preserves absent sections and distinguishes explicit replacement; C1b records section provenance. The old blanket replacement rule is superseded. Equipment UUIDs are not durable history identities; C3a navigation uses the character natural key.
- **ADR 0009:** its write-on-GET reset design is historical. C2 replaces it with read-only period projection and explicit atomic writes; no cron service is required.
- **ADR 0010:** retain safe GET requirements. Its daily-reset exception is not extended to new features; C2 retires that legacy exception for companion resets. An idempotent UPDATE is still a write and is not made safe merely by avoiding DELETE.
- **ADR 0008:** retain local tabs for simple browsing. Use URL state for specific goals/character details that Today must link to; this is its existing deep-link exception.
- **ADR 0011 / DEC-005:** retain deterministic calculations and explanation separation. Remove the implication that every intelligence engine is a product commitment.
- **DEC-006:** this request explicitly delegates feature planning to the assistant. It does not transfer authority for external publication, deployment, or irreversible operations.

Historical implementation notes and tests remain evidence of earlier behavior, not instructions to recreate obsolete features.

## Alternatives and trade-offs

A broad optimization suite has a much larger modeling and data-maintenance burden. A tracker with no goals would be simpler but would not connect equipment records to a useful next action. The chosen companion focus reuses current foundations while reducing automatic claims.

Costs: new goals need durable intent separate from imported state; safer imports and reset semantics require bounded migrations; fewer “intelligence” showcases may initially feel less feature-rich. Benefits: clearer purpose, less data entry, and a maintainable daily loop.

## Review

Validate through the C5 beta. Revisit deferred features only with observed demand and a maintenance plan. Implementation remains Wednesday/Sunday, with no fixed delivery promise for each milestone.
