# Production readiness and useful game coverage

Completed locally, 2026-10-17. [Walkthrough](walkthrough.md) and
[validation](validation-results.json) record the final passing recovery/build/test
chain; [task checklist](task.md) and [remaining limits](remaining-readiness.md)
distinguish the delivered core from absent deployment and broader route/yield
features.

Authorized 2026-10-17 by the owner's explicit plan change. This supersedes the
C5h-only scope. The C5h harness had not started; reader evidence remains unavailable.
Work stays in the existing D: master checkout and preserves intentional changes.

## Product outcome

A useful companion for a player's actual roster: character ascension and base
talent targets, weapon ascension targets, current-server farming availability,
and a calm Today view with optional routines and simple resin pacing. Imported
equipment counts must never imply calculation coverage. No streaks or automatic
completion. Unknown inventory remains distinct from zero.

Reference: https://seelie.me. The owner selected its planner/Today organization,
current/target material calculator, lightweight resin pacing and calm layout.
Inspect public behavior and implement Celestia's version; do not claim recovery of
Seelie's backend or copy its proprietary implementation or artwork. The linked REA
tutorial describes a possible investigation tool, not a supplied target codebase.

## Implementation order

1. Support Asia, America, Europe and TW/HK/MO throughout clock helpers, contracts,
   routine writes, Today dismissals, database constraints and server selection.
   Preserve Asia period IDs; test exact daily/Monday boundaries, fixed offsets,
   server changes, stale writes and independent manual records.
2. Add a pinned, attributed game-data snapshot and reproducible normalization.
   Compute exact per-step character ascension, talents 1–10 and weapon ascension
   costs; preserve canonical GOOD keys and exceptional character rules. Validate
   source joins, duplicate/unknown keys and representative independent totals.
   Retain the historical C2b catalogs/evidence as historical evidence.
3. Activate sourced talent/weapon domain days and reward costs. Show today's open
   sources and next availability; allocate the user's resin budget without
   pretending random rewards are guaranteed. Establish the actual available
   enemy-location data before promising walking routes or yield efficiency.
4. Apply the reference's useful interaction patterns: clear current/target fields,
   concise remaining totals, separate Today tasks from long-term goals and reduce
   repeated explanatory clutter. Keep account/session/error/focus protection.
5. Run focused tests, disposable PostgreSQL integration and guarded full recovery/
   verification after final behavior changes. Exercise actual browser journeys.
   Record precise outcomes, remaining operational blockers and cleanup.

## Evidence and boundaries

Baseline: `C:/Users/inuzu/AppData/Local/Temp/celestia-production-300a96498202497babfec0d3d4887d7f/starting-state.json`
(969 files, SHA-256 `CE57E4ABB18998A1F055A380FD0749B605FB405A6C95667EBAA72EFB8248B3A0`).
HEAD is `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, master, empty index.
Earlier passing counts are inherited until actually rerun. Source coverage and
release readiness must be measured, not inferred from successful UI rendering.

The owner has authorized this implementation expansion. Deployment, real account
changes and participant contact have not been requested. Existing thirteen
migrations remain immutable; additional forward migrations may be tested only on
explicit disposable fixtures here. No reset/clean or broad staging/commit.
