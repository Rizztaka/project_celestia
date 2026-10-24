# Public UID character/team analyzer checklist

Status: implemented and verified locally, 2026-10-24. See walkthrough.md for actual four-character coverage, evidence and limits. Continued the existing production-based Claude worktree; the original messy checkout remains preserved.

## A0 — Production baseline

- [x] Read live-baseline.md and implementation_plan.md completely.
- [x] Recheck Vercel production SHA and GitHub master; review changes since the pinned commit.
- [x] Select a clean production-based checkout; preserve all messy local branches/edits.
- [x] Copy only this handoff directory; record source SHA, branch, directory and one preview URL.
- [x] Verify the existing public Today/roster/character journey before feature work.

## A1 — Shared core and public character analysis

- [x] Audit ShowcaseCharacter fields, units, main-stat and talent semantics.
- [x] Normalize immutable observations with UID, composite identity and timestamps.
- [x] Add stable reviewed character/item/set identity mappings with safe old-record fallback.
- [x] Create typed pure calculator/explainer and explicit rule/coverage versions.
- [x] Audit sources for the live showcase cohort; encode three supported role patterns.
- [x] Add role-aware main-stat/weapon/set checks and talent/stat priorities.
- [x] Add useful next actions and honest unsupported/unknown conditions.
- [x] Add bounded isolated comparison; preserve observed totals.
- [x] Integrate into the public character page without sign-in or private APIs.
- [x] Preserve existing detail presentation and retained-observation behavior.

## A2 — Teams

- [x] Add /u/:uid/teams and UID desktop/mobile navigation.
- [x] Add observed-character picker, role selections, partial drafts and form uniqueness.
- [x] Implement UID-scoped versioned IndexedDB team persistence.
- [x] Add save/load/rename/duplicate/delete with clear browser-local scope.
- [x] Add validated UID-aware export/import without touching legacy account storage.
- [x] Analyze frozen member observations; label mixed observation times.
- [x] Reuse shared character findings and add reviewed contextual interactions.
- [x] Aggregate stable priorities without a total build score.
- [x] Add single-change comparison and member/return deep links.
- [x] Handle missing team references, missing members and blocked/corrupt storage.

## A3 — Verification and delivery

- [x] Verify ratios/percentage points, explicit main stats and base/bonus talents.
- [x] Verify deterministic identity/order and standalone/team agreement.
- [x] Verify positive/negative/boundary/unknown interaction and source-drift paths.
- [x] Demonstrate three role patterns, valid alternatives, contextual advice and comparison.
- [x] Verify observation age, stale refresh and frozen comparison semantics.
- [x] Verify UID isolation, delayed responses, save/reload and safe import failure.
- [x] Verify no writes or refreshes caused by analysis.
- [x] Exercise real React/public-data/IndexedDB/core/UI integration with synthetic fixtures.
- [x] Verify desktop/390px/320px, keyboard navigation and focus restoration.
- [x] Run appropriate builds/types, focused regressions and scoped lint/format.
- [x] Record actual delivered character/rule coverage and source gaps.
- [x] Write walkthrough.md with exact baseline, one URL, modified files and evidence.
- [x] Verify existing live-product journeys and dirty-checkout preservation.
- [x] Confirm no commit/push/deploy/production mutation occurred.
