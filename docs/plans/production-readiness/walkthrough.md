# Functional core expansion — 2026-10-17

The owner's plan change superseded C5h before its harness started. The expanded
core now works for actual character, talent and weapon targets rather than only
the historical Hu Tao slice. Work remains local in the existing dirty master
checkout; no deployment or human acceptance is implied.

## Result

- Asia, America, Europe and TW/HK/MO have fixed-offset daily/Monday clocks,
  countdowns, weekday farming selection and persisted routine/dismissal support.
  A server change starts fresh daily/weekly records while preserving resin and
  manual Transformer checkpoints. Asia period IDs remain compatible.
- A pinned MIT community snapshot supplies 122 character ascensions, 120 base
  talent tables through level 10, 252 weapon ascensions, 508 material references
  and 48 weekday material sources. Costs include Mora and higher material tiers.
  Unsupported exceptions and unknown stock remain explicit.
- Today separates daily/weekly routines from long-term goals. Human-readable
  target names, paired current/target controls, formatted material deficits,
  collapsed onboarding and optional source details reduce clutter. The owner
  selected these interaction patterns from Seelie's public planner.
- Open domains receive optional whole 20-resin reward-set allocations within the
  user's budget and recorded resin estimate. No streaks, automatic completion,
  guaranteed drops or inferred finish date were introduced.

The [source record](sources.md) explains the pinned revision, attribution,
normalization, reproducibility and exclusions. Seelie was inspected through the
browser; no proprietary code/artwork was copied and REA was not executed.

## Verification

The final full-run status and hashed private evidence are in
[validation-results.json](validation-results.json). Its complete suite passed
1,038 tests across 58 files, zero failed or skipped, including 140 actual
PostgreSQL cases in eight integration files. The preserved verifier's historical
six-file classifier reports 113; the full 140 count is independently enumerated
from the raw report rather than changing that classifier or its floors.

Focused tests cover exact before/at/after daily/Monday resets for all four
regions, summer/winter fixed offsets, timezone-safe client labels, persisted
server switching and stale writes, independently asserted Hu Tao/Raiden/Homa
costs, all supported ranges, low-rarity weapon caps, source joins, exceptions,
fingerprint drift and runtime immutability. Existing ownership, import,
account-data and request-safety cases remain in the full suite.

[Browser observations](browser-observations.md) record real synthetic server
selection, 1→10 talent creation, weapon/character ascension, duplicate rejection,
editing, materials-only import preservation, daily task saves and an 80-resin
allocation. The 320px layout had no document horizontal overflow and displayed
both numeric values. These are agent checks, not another owner walkthrough or
actual browser-menu zoom/reader evidence.

Earlier failed attempts are retained in
[verification-attempts.json](verification-attempts.json). The first exposed the
old exact thirteen-migration inventory; it was updated to the exact fourteen
names/checksums for the authorized forward migration. The next exposed stale
assertions for newly supported servers/targets/talent ranges; those expectations
were corrected without deleting tests. A subsequent full suite passed but the
formatter rejected the new generator, which was formatted before the final run.

## Review and handoff

The sole forward migration widens two server CHECK constraints. It must precede
use of the new server choices on an existing database. Existing thirteen
migrations were not rewritten. Recovery guards, test discovery/floors, ownership
and source fingerprint validation remain active.

[Cleanup](cleanup.json) records removal of owned disposable resources and restored
browser/build state. [Preservation](preservation-check.json) compares the complete
starting worktree with the final scoped delta, including the protected AI/env/
dependency/log files, original migrations and historical raw evidence. No
staging, commit, push, ordinary database write or external deployment occurred.

[Remaining scope and release evidence](remaining-readiness.md) identifies
optimized enemy routes, statistical yield/finish-time estimates, level EXP,
exceptional targets, accessibility observations and actual deployment/operator
evidence. This execution stops with the implemented local core and this explicit
handoff; it does not start another acceptance loop.
