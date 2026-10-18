# Project Celestia — Genshin Companion

**Version:** 2.0

**Updated:** 2026-09-25

**Status:** Current product direction; implementation follows the roadmap.

## Purpose

Help a Genshin Impact player decide what to do next, remember their chosen goals, and see progress without maintaining a second job's worth of records.

Celestia is a personal companion for daily play and character building. Its core loop is:

**Choose a focus → see the next useful actions → play → record or import progress → adjust the plan.**

## Who we serve first

- Regular players building a few favorite characters or a team.
- Returning players who need to recover their place and choose a manageable next step.
- Players who want a reliable daily/weekly overview and a record of their equipment.

Advanced players can use the same tracking alongside specialist tools. Theorycrafting and exhaustive optimization are outside the product's focus.

## The questions we answer

- What did I choose to work on?
- What can I advance today with the resources I have?
- Which of my selected tasks or verified events are due soon?
- What does this character currently have equipped?
- What changed since my last reliable update?
- What is still unknown or needs refreshing?

The player sets the destination. Celestia helps organize the work.

## Product pillars

1. **A calm Today view.** A short, editable plan, estimated resin, selected daily/weekly tasks, and verified deadlines.
2. **My characters and equipment.** Imported roster, weapons, and all five equipped artifact slots, with source and freshness information.
3. **Goals and farming.** Explicit targets, remaining known materials, availability by supported server, and a budget the player controls.
4. **Progress and continuity.** Goals survive imports; recent progress can be understood without inventing historical data.
5. **Trustworthy assistance.** Facts, estimates, user targets, and suggestions have visibly different meanings.

## Artifact scope

Keep artifact inventory, equipped-character relationships, set/slot/level/main-stat/substat records, and browsing. Make a character's current equipment easy to inspect.

Do not build a combinatorial artifact optimizer, damage simulator, automatic gear redistribution, artifact keep/discard engine, or universal build-quality score. Specialist tools can handle optimization. A simple external link is sufficient initially; interoperability work must have its own verified contract.

The existing Artifact Intelligence score is a legacy heuristic. Its 0–100 result is not damage efficiency, team suitability, or proof a build is complete. Replace its product role with **Equipment & Build Progress** through a separately reviewed migration. Do not delete existing records or silently break its API.

## Feature selection rules

Include a feature when it makes the daily loop easier, reuses reliable data, has a manageable upkeep cost, and can be delivered in a bounded milestone.

Prefer:

- Player-selected focus over ranking the whole account.
- Concrete progress over opaque scores.
- A few useful next actions over an exhaustive checklist.
- Imported or optional input over mandatory manual bookkeeping.
- Honest missing-data states over fabricated precision.
- User-controlled reminders over guilt, streak pressure, or spending prompts.

An empty plan can be a successful outcome. Players may pause goals, mark them good enough, or ignore a suggestion.

## Boundaries

**In scope:** a Genshin companion with one Genshin account per Celestia user initially; selected supported server rules made explicit; equipment records; daily/weekly tracking; build goals; material planning; curated links.

**Later, after the core loop works:** saved teams, limited progress snapshots, lightweight endgame journals, optional event tracking with maintained data, and a personal wish savings plan.

**On hold:** additional games, multi-account expansion, advanced endgame drafting, interactive maps, exhaustive databases, social features/leaderboards, AI chat, push/email infrastructure, and new pull-simulator features. Existing NIKKE and simulator code is retained pending a deliberate product transition.

**Excluded from the roadmap:** Celestia-owned artifact optimization, exact damage optimization, automatic artifact disposal advice, and “must pull” verdicts.

## Data honesty and maintenance

Account imports are snapshots, not live game synchronization. Estimated resin is based on the player's last checkpoint and cannot observe unrecorded spending. Missing inventory is not zero inventory; missing equipment data is not a confirmed empty slot.

Every game-data feature must define its supported scope, verification source, last review/version, expiry behavior, and maintenance owner. Placeholder or expired event/banner data must not generate current recommendations. Unsupported characters remain visible even when tailored guidance is unavailable.

No HoYoverse password, session cookie, or automatic game-account access is required for the core experience.

## Success measures

Treat these as beta evaluation targets, not claims already achieved:

- A player can identify their chosen next action from Today in about 30 seconds.
- A returning player can update a routine session in under a minute, excluding an optional import.
- Re-import preserves goals and preferences and clearly states what changed.
- Users can distinguish current observations, stale snapshots, estimates, and unknown values.
- A small beta group finds the plan useful across a week without feeling required to maintain every field.
- The developer can keep the supported data current within the Wednesday/Sunday cadence.

Measure task completion and clarity through voluntary feedback and usability sessions first. Do not add account-content telemetry to satisfy metrics.

## Delivery

The modular monolith, ownership checks, deterministic calculations, and calculator/explainer separation remain. Genshin focus does not require rewriting the platform.

Implementation sessions are Wednesday and Sunday. Planning and review can happen on other days. Backend lint coverage remains the next engineering milestone; the completed Platform Account Security work is preserved.

See [Roadmap](ROADMAP.md), [Companion specification](features/FEATURE_GENSHIN_COMPANION.md), and [review findings](plans/genshin-companion/document_review.md).
