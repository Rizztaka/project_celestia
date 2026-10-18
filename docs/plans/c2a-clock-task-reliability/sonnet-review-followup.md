# Sonnet follow-up: finish C2a before starting another milestone

Continue the existing local C2a implementation. Codex reviewed the walkthrough and actual working tree and returned **changes required**. Read `implementation_review.md`, then the original `implementation_plan.md`, `task.md`, and `sources.md`. Frontend compatibility and database verification are part of C2a; they are not a separate milestone.

Repair in this order:

1. Fix API bootstrap: PlannerIntelligenceService currently resolves the provider before app registration. The security and importer HTTP suites cannot load. Fix real composition/initialization, not only test setup.
2. Normalize expired daily/weekly state inside the owner-locked transaction before applying an action. A partial daily save currently carries yesterday's sibling flag into today. Add reset-without-GET and concurrent write coverage.
3. Restore the provider boundary: platform routine and goal services must use public core/provider interfaces rather than importing Genshin implementation files. Do not weaken ESLint.
4. Reject daily actions without a selected/available clock; enforce strict action schemas at the service boundary. Unknown resin must remain unavailable in Planner Intelligence, with an actionable 422. Goal/Planner weekday calculations must honor selected-server availability and one supplied snapshot time.
5. Close the Asia source gate or enforce runtime unavailability for clock-dependent projections/writes. Candidate comments are insufficient. Keep weekly discount estimates null while their rule is unverified.
6. Complete the V2 frontend migration and agreed UX/cache/conflict behavior. Either retain the originally planned V2 route aliases or explicitly document the new `/routine/*` namespace and migrate every caller. Existing daily/weekly calls currently return 409 even after reload. Preserve auth-session cache isolation.
7. Fix the ten failing routine tests (CommonJS require of a TS module), add actual HTTP and guarded PostgreSQL integration coverage, and wire integration into the existing CI test step. Test source gates, startup, period normalization, ownership, malformed inputs, lost responses, rollback, concurrency, read-only indirect GETs, legacy migration preservation, and import/routine isolation.
8. Run direct full Vitest with safe integration, uncached lint/builds, changed-file formatting, and the planned browser scenarios. Report actual results, not intended edge cases. Codex's current result is 353 passed / 10 failed / 16 skipped, plus two HTTP collection failures; API typechecking passes; focused production lint has 8 errors.

Clarify the already-applied migration before further database work: record the exact command and sanitized host/port/database, whether the target was disposable, and migration status. The original plan allowed only explicit disposable loopback test database migration. Do not reveal credentials or undo an existing migration without a reviewed recovery plan.

Keep the original walkthrough as submitted evidence. Write a new accurate `walkthrough.md`, update the checklist, ADR/API compatibility note, source evidence, and CURRENT_HANDOFF. Preserve all unrelated local changes, including AI/environment files, OpenAI dependency/lockfile work, and Turbo log hash `790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED`. Use direct Vitest rather than Turbo tests. No reset/clean, broad staging/commit, push, deployment, or production migration. Do not start C2b/C3 until C2a passes review.
