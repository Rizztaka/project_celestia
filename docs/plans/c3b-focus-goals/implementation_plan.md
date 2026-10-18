# C3b contract and implementation plan

Prepared before application edits, 2026-10-03. Extend existing companion goals and Genshin characters/provider; no parallel goal system or new engine. Preserve starting-state.json, every existing goal field and all eight protected hashes.

## Persistence and ownership

Goals remain user-owned. Add status (active/paused/completed/archived), priority 1–5 (1 first, default 3), revision (default 0), nullable completedAt/completionReason, nullable predecessorId and createRequestId. Backfill only neutral defaults; old IDs, owners, types, keys, ranges, slots and timestamps are untouched. No accounts or focus history are backfilled. Drop the historical nullable-slot unique index to permit closed history. Unique predecessorId limits each closed goal to one successor; unique owner/createRequestId rejects replayed creation. SQL checks protect new lifecycle metadata, priority and revisions without rejecting malformed old target ranges.

Current-intent identity is owner/type/key/nullable slot; compare slots with null equality, never a sentinel string. All surviving application writes lock the stable user row in a ReadCommitted transaction before reading/checking/writing. This serializes first creates, edits, successors and import/focus interleavings without a check/insert race. There is no unique index that discards or rewrites legacy duplicates. Group active AND paused rows by identity at read time. If more than one exists, every member needs review and all active members are excluded from advice. Users explicitly archive/complete extras (or retain paused duplicates with demand excluded). No read normalizes data.

Focus uses account ID plus character natural key, with a composite owned-character foreign key. A durable false membership row retains its revision after unfocus, preventing ABA stale writes. GET returns only existing rows (including tombstones); missing membership has revision 0. PATCH checks owned account/character and expected revision under the same owner lock. Never create an account on read/write; unknown imported keys are allowed. No maximum; focus has no effect on lifecycle, priority or calculations.

## Routes and shared contracts

- GET /companion/goals: existing array shape extended with lifecycle, priority, revision, predecessor, derived needsReview/limitations. Ordered priority ASC, createdAt ASC, id ASC. Preserved legacy rows are always readable.
- POST /companion/goals: strict contractVersion 3, UUID requestId, goalType/key/from/to/nullable slot, priority. Old unversioned create fails closed with 409. Request identity survives UI retries; replay returns visible conflict and requires refresh.
- PATCH /companion/goals/:id: strict contractVersion 3, expectedRevision, discriminated action. edit accepts from/to/priority; priority accepts priority; pause/resume/archive have no extra fields; complete requires achieved or good_enough; successor accepts explicit from/to/priority. IDs and ownership are never body fields.
- DELETE /companion/goals/:id: owned compatibility fails closed 409 (foreign/missing 404). Never reinterpret deletion as archive. Planner was the only web caller; remove its delete-to-edit workflow.
- GET /games/genshin/focus and PATCH /games/genshin/characters/:characterKey/focus: strict version 1, expectedRevision, focused boolean; authoritative response.

Goal type/range validation lives in shared Genshin schemas invoked by the provider from platform orchestration. Ascension 0–6 and base talents 1–6, integer from < to; strict fields, safe opaque keys and exact slots. New targets must be known catalog identities OR owned character/weapon type keys, checked inside the write transaction through the provider. Edits preserve target identity and keep legacy/pre-import goals manageable; invalid legacy ranges/slots are labeled, never silently repaired. Provider projection also supplies advice limitations independently from valid intent. Only character ascension gets a read-only stored comparison in the detail context; raw talents and type-level weapons explicitly have unknown comparison. Section receipts never date an individual observation.

## Lifecycle and retry table

| Current                     | Action          | Result                                                                                |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| active                      | edit / priority | same ID, explicit new range/priority                                                  |
| paused                      | edit / priority | same ID, remains paused                                                               |
| active                      | pause           | paused                                                                                |
| paused                      | resume          | active (duplicate group remains excluded if unresolved)                               |
| active / paused             | complete        | completed, server completion time and explicit reason                                 |
| active / paused / completed | archive         | archived, completion metadata retained                                                |
| completed / archived        | successor       | old row/target/completion retained; new active child with explicit range and priority |

All other transitions fail with 409. Every accepted existing-row command increments its revision once, including successor consumption; no status is regressed by retries. Terminal edits/priority changes are rejected. Closed rows have at most one child; further changes use that child's lifecycle. Reopen/restore labels explain new active successor. Same identity cannot gain a new current row while any active/paused record exists. Imports, GETs and calculations never change intent. No blind server/client retries. Stale requests receive 409; refresh shows confirmed state while entered form values remain for deliberate resubmission.

## Consumers and UI/cache

Inventory: GoalService materials and Today; PlannerIntelligenceService direct Prisma read; calculator allocation and explainer; PlannerPage; GoalForm; roster/detail; ImportPage/API client/account-cache. Use one pure duplicate/current-goal projection for all consumers, active only, priority with stable ties; remove weighted-score precedence from allocation. Preserve C2b exact cost/route gates, stock snapshot/null deficits and independent C2a routines.

Roster focus controls/filter and detail shortcuts use natural keys. Goal management stays on Planner with URL tab/status/target/goal filters; goal cards link to character detail. Detail weapon shortcut captures the weapon type key in a link/form and states it tracks a type, not a physical copy. Forms support explicit edit, priority, pause/resume, completion/good-enough, archive and reopen as successor; no optimistic writes. All costs labeled declared-range basis, unchanged by re-import. Failed saves retain draft and confirmed state, conflicts offer refresh/review. No goals/no active goals/empty focus/no import/unavailable advice/loading/retry are distinct.

Capture an originating auth-session identity at command creation, check before dispatch and callbacks, pin the token and prohibit retries. Token changes invalidate the identity even if a token later returns. Queries retain cancellation and per-session clients. Successful focus/goal/import writes invalidate companion and genshin (plus legacy inventory/intelligence prefixes where needed); import receipts and routine fields remain untouched by intent writes.

## Validation matrix and database guard

Only fresh explicitly named loopback celestia_test_* PostgreSQL. Every process sets NODE_ENV=test, both database variables, DOTENV_CONFIG_PATH=NUL and dummy JWT/OpenRouter. Start own cluster, migrate full chain, and test populated-C3a upgrade in transaction-local schema. Exercise null duplicates, malformed ranges, unsupported keys, multiple owners/no account, new checks/defaults and exact legacy preservation. Actual DB tests cover concurrent create/update/successor/focus, stale requests, ownership/rollback/import lock interleavings, every transition, active filtering and SELECT-only direct/indirect reads. Retain old meaningful regressions and add strict contract/priority/client/session tests.

Run direct Vitest from apps/api with --no-file-parallelism; explicit per-test concurrency remains. Report executed database cases and fresh totals. Run package-local lint/types/builds, migration validation/diff, focused format and git diff --check. Actual browser desktop/mobile: two owners, focus/filter and lifecycle, failed save/retained draft, stale tabs, re-import, unknown raw talents/type weapons, unavailable advice, empty states and sign-out during save. Save concise evidence, stop fixtures, finish docs and assess C3 exit criteria without starting C4.
