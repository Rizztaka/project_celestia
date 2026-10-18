# C2a: clock and task reliability — Sonnet implementation plan

Date: 2026-09-27. **Planned, not implemented.** Codex is architect/reviewer; Antigravity Sonnet 4.6 implements. Read [checkpoint review](checkpoint_review.md), [sources and verification gates](sources.md), [CURRENT_HANDOFF](../CURRENT_HANDOFF.md), ADRs [0009](../../adr/0009-lazy-daily-reset-pattern.md), [0010](../../adr/0010-get-must-not-mutate-state.md), and [0012](../../adr/0012-genshin-companion-direction.md).

## Outcome and boundary

Make routine reads safe and routine writes independent of a prior GET. A stale tab must receive a conflict instead of recording an action in a different period or overwriting another save. Show resin only from a user-confirmed checkpoint and separate weekly reward claims from defeats.

One migration, one small authoritative routine snapshot, one supported-server policy, and the existing Planner surface. No reset worker, generic task engine, history store, server expansion, new goal lifecycle, equipment UI, AI, optimizer, or data-catalog repair. Preserve the security baseline, C1 imports/provenance, existing user-owned data, and auth-session QueryClient isolation.

## Decisions fixed for this implementation

1. **Initially Asia only, explicitly selected.** Missing selection means setup required, never an inferred Asia account. Do not infer from browser timezone, GOOD data, UID, or IP. Unknown server values are rejected. Users on other servers can retain their records, but clock-based guidance is unavailable.
2. **One injected clock.** Read `now` once per read snapshot. For writes, acquire the owner lock first, then sample `now` once and validate against it. That validation point defines the accepted period, even if commit finishes just after a boundary. Browser time never decides the write's period.
3. **Preserve legacy records, do not backfill ambiguous facts.** Add a new user-owned Genshin routine row; keep `DailyCompanion` and `WeeklyBossState` intact and freeze their writes after cutover. Existing timestamps do not reliably prove resin was explicitly entered, when a task was completed, or that a reward was claimed.
4. **Use one aggregate revision.** Daily, resin, settings, and weekly saves share a monotonically increasing integer revision. A second simultaneous save conflicts, even for a different field. This intentionally favors a simple, reviewable correctness model; the UI serializes its own saves. No silent merge or automatic mutation retry.
5. **Weekly C2a input is a user-confirmed aggregate reward-claim total.** This avoids making the placeholder boss catalog authoritative. Keep old per-boss defeats visible as labeled legacy records, but do not translate them to claims. Per-boss reward tracking and verified drops remain C2b follow-up work. No automatic resin deduction or material credit.
6. **Transformer is manual in C2a.** Replace the daily checkbox with “Record use now” / “Clear record” and a last-recorded-use timestamp. No ready countdown until exact cooldown evidence is verified in a separate change. Teapot becomes “Check Teapot today,” a Celestia reminder, not a game currency claim/cap assertion.

These are the bounded migration choices for Sonnet, not an invitation to select another storage or task architecture during coding.

## Storage and migration

Add `GenshinRoutineState` (table `genshin_routine_state`) and a nullable User back-relation. Keep ownership on `userId`, unique and FK to User with cascade deletion: the companion is useful before an import/account exists. Imports must not create, update, or remove this row. No Genshin account or equipment foreign keys.

| Field                              | Meaning/default                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `userId`                           | Primary key and owner; no separate synthetic ID needed                                     |
| `revision`                         | Integer, initially 0; every accepted mutation increments once, including an explicit no-op |
| `serverId`                         | Nullable string constrained to `asia` when present; null means unselected                  |
| `dailyPeriodStart`                 | Nullable UTC DateTime; exact boundary for the stored daily flags                           |
| `commissionsDone`, `teapotChecked` | Booleans, false by default; only meaningful for matching daily period                      |
| `transformerLastUsedAt`            | Nullable UTC timestamp, only from an explicit manual record action                         |
| `resinAmount`, `resinRecordedAt`   | Nullable pair, both null or both set; amount integer 0–200                                 |
| `weeklyPeriodStart`                | Nullable UTC DateTime; exact boundary for the reported claim total                         |
| `weeklyRewardClaims`               | Nullable nonnegative integer; null means no user-confirmed total for that week             |
| `createdAt`, `updatedAt`           | Ordinary persistence metadata, never used as period IDs or observations                    |

Use database CHECK constraints for revision >= 0, server values, paired resin nullability/range, and nonnegative weekly totals. Validate the same constraints at the service boundary. An implementation safety limit of 1000 weekly claims is sufficient for input validation; describe it as a storage/input limit, never a game allowance. No row is created by a default or a GET.

Migration is additive only: create the new table/index/FK/checks, no UPDATE or DELETE against existing companion/import tables. Do not copy booleans or timestamps automatically, including apparently positive resin values. New projection reports unknown resin and unrecorded weekly totals until the user reconfirms. Present the old amount/time and flags under a clearly labeled legacy section so the user can correct them; never offer a bulk “convert defeats to rewards” action. Legacy Transformer flags provide no use timestamp. No synthetic migration-time checkpoint.

Apply only to an explicit disposable loopback `celestia_test_*` database during implementation. Test both a fresh full migration chain and upgrading from the existing C1b schema populated with representative legacy rows. Verify legacy row values and unrelated inventory/provenance/goals remain unchanged. Regenerate Prisma client. Keep all earlier migrations untouched.

## Clock and projection

Implement small pure Genshin policy helpers under `apps/api/src/games/genshin/companion/`, supplied through `ICompanionProvider` in `core/contracts/companion.interfaces.ts` and the existing registry. Platform may orchestrate and persist through that contract; it must not import a Genshin implementation or gain new game constants. Do not relax the boundary lint rule. Inject repository and clock into touched services for tests; avoid scattered `new Date()` calls.

Before enabling Asia, close the source gate in `sources.md`. Candidate policy: fixed UTC+8, daily 04:00 local, Monday weekly 04:00 local. Use UTC arithmetic, not the host's timezone or daylight-saving settings. At `2026-09-27T20:00:00.000Z`, both the new Monday day and week begin; one millisecond before remains the previous period. Next boundaries are strictly after the sampled time. Period IDs include policy version, server, cadence, and UTC start, e.g. `genshin:asia:v1:daily:2026-09-27T20:00:00.000Z`.

Read projection:

- Absent row: revision 0, server unselected, resin unknown, tasks unavailable until setup; no insert.
- Selected supported server: return `serverNow`, policy ID, day/week IDs and start/end instants, server weekday (Monday=0), and persisted revision. Day mismatch projects daily flags as false; week mismatch projects claim total as null. These are effective views, with no reset writes.
- Resin pair missing/invalid or timestamp in the future: return an explicit unknown/invalid checkpoint state, no numeric zero, cap time, or “FULL.” Valid checkpoint: `min(200, max(0, amount + floor(max(0, now - recordedAt) / 480000)))`. Use the same sampled instant for amount, tick, and cap time. A manually recorded zero is known zero. Cap time derives from the checkpoint, including partial tick progress.
- Task descriptors explicitly distinguish commissions `daily`, Teapot `daily_reminder`, Transformer `manual`, weekly claims `weekly`. The Transformer never participates in a daily progress denominator and never changes on a day/week boundary.
- Unknown/unselected server: no day/week IDs or deadlines; do not silently apply Asia. Resin arithmetic can remain available because it does not depend on reset timezone. Clock-dependent writes remain disabled.

Do not add a generic recurrence language, date library, scheduler, or system timezone dependency.

## HTTP contract and compatibility

Create shared Zod request schemas and response types under `packages/api-contracts/src/genshin/companion.ts`, exported from the package. Retain authenticated `/api/v1/companion` mounting and the standard success/error envelope. Never accept `userId` or an account ID in a mutation body.

Use an explicit **contractVersion 2** to avoid presenting incompatible nullable/unknown fields as the old full Prisma record. This is a companion payload version, independent of import `requestVersion: 1`.

| Route                                  | V2 behavior                                                                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /daily?contractVersion=2`         | Canonical full routine snapshot: common revision, server/period metadata, tasks, resin, weekly claims, optional legacy summary                                    |
| `GET /weekly-bosses?contractVersion=2` | Read-only compatibility alias to that same snapshot; no catalog-derived costs or writes                                                                           |
| `PATCH /settings`                      | `{contractVersion:2, expectedRevision, serverId:'asia' or null}`; explicit selection/disable, no guessed setup                                                    |
| `PATCH /checklist`                     | Common concurrency fields plus discriminated action: `setDaily` with nonempty partial commissions/Teapot values, `recordTransformerUse`, or `clearTransformerUse` |
| `PATCH /resin`                         | Common concurrency fields plus explicit integer `amount`; checkpoint time comes from the backend                                                                  |
| `PATCH /weekly-claims`                 | Common concurrency fields plus `weeklyPeriodId` and `rewardClaims` (integer or null to clear); replaces the user's reported total                                 |
| Old `PATCH /weekly-bosses/:bossKey`    | Authenticated fail-closed compatibility handler with a client-update error; never map `defeated` to a claim                                                       |

Common concurrency fields: `contractVersion:2`, integer `expectedRevision >= 0`, `serverId` matching stored selection, and `dailyPeriodId` for actions when a server is selected. Resin/Transformer actions when unselected require `serverId:null`, `dailyPeriodId:null` and a valid revision; they have no game-period semantics. Settings needs revision only. A selected-server weekly write requires **both** daily and weekly IDs. Missing/unknown fields, including legacy booleans or a client timestamp, are rejected with strict validation.

All successful PATCHes return the complete V2 projection so clients immediately receive the new revision. Distinguish conflict codes for stale revision, stale period, and changed server in the existing error envelope; 409 for conflicts, 400 for invalid input/unsupported server/missing V2 mutation contract. Use an actionable refresh message for unversioned/unsupported-version GETs (409 `COMPANION_CLIENT_UPDATE_REQUIRED`). No content negotiation by guessing fields. Apply auth before version checks.

This is **route continuity plus explicit fail-closed client migration**, not wire-compatible V1 behavior. Old cached clients receive a visible error and must reload; keeping unsafe old writes running is not an acceptable compatibility layer. Migrate every repository caller and document this break in the API note. No old route may retain initialization/reset side effects. Read-only old data is available through the V2 legacy summary.

## Atomic write algorithm

1. Validate structural input before entering the transaction. Use the authenticated user exclusively.
2. Start a short transaction. Lock the stable User row with parameterized `SELECT ... FOR UPDATE`, as the import repository already does; this covers concurrent first writes when no routine row exists. Use a consistent owner-first lock order. Read Committed is sufficient when all routine writers use this lock; do not read state before the lock and reuse it.
3. Read the routine row, using an in-memory default with revision 0 if absent. Sample injected server time **after lock acquisition**. Check expected revision, selected-server match, and applicable period IDs. On mismatch, roll back with no row creation or timestamp changes. Never substitute the new period into an old submission.
4. Normalize expired daily flags and weekly total in memory for a supported selected server; leave resin and manual Transformer state alone. Apply the requested action only. A settings change preserves stored observations/legacy rows and increments revision; disabling the server merely makes period views unavailable. Reselecting Asia projects against its current periods.
5. Create/update the single snapshot and increment revision exactly once. Return a projection using the same validation instant. No writes to legacy tables. Roll back all fields on failure. Translate transaction/unique conflicts to a recoverable 409; no automatic replay of the action.

A replay with the old revision is a conflict, including a retry after a lost response. The frontend refetches to discover whether the save succeeded, then asks the player to retry only if needed. No idempotency-key infrastructure is necessary. A valid direct PATCH can create the first row without GET (settings expectedRevision 0); subsequent actions use the revision/periods returned by that PATCH.

## Weekly reward semantics

`weeklyRewardClaims` is a player-confirmed total for the displayed game week, not a count of recorded defeats or a complete boss catalog. Initial/new-week null means unknown; an explicitly entered 0 means known zero. Label the field “Weekly boss rewards claimed this week” with a short reminder to count claims, not fights. Editing it corrects the record; it does not refund/spend resin or alter inventory.

Only after the discount rule is sourced may the provider derive `discountedRemaining = max(0, 3 - n)` and `nextRewardClaimCost = n < 3 ? 30 : 60` for known n. Without verified policy or a reported total, both values are null with an unavailable reason. These are conditional estimates from the user's total, never historical per-boss costs or entitlement guarantees. Keep all drop/domain/location claims from the placeholder catalog out of this C2a weekly panel. Legacy defeated keys are labeled raw recorded identifiers; no currency, costs, or claimed status is inferred.

This deliberately replaces the weekly panel's misleading discount summary with a small manual total editor and retained legacy notes. It does not delete the static file or any defeated records. Per-boss claim UX is deferred rather than expanding C2a into a catalog project.

## Frontend and indirect callers

- `PlannerPage.tsx` uses one routine query/cache key for the authoritative full snapshot. Daily and Weekly tabs share its revision. Update `lib/api.ts` to use the shared contract and version parameter. Keep the C1b QueryClient/session boundary intact.
- Serialize local routine mutations across all controls; do not allow the existing per-boss pending-set pattern to launch competing aggregate saves. Prefer confirmed responses for this milestone over broad optimistic snapshot rollback. Cancel/invalidate the routine query appropriately; after errors, refetch and show the error visibly. Never replay a 409 automatically.
- Guard against older GET/mutation responses replacing newer revisions in the same session. For equal revisions, prefer the later `serverNow`/period projection. Ensure in-flight previous-period data cannot reenable controls after boundary expiry. Carry revision/period from the displayed snapshot at submission, not a separately read stale closure.
- Anchor display time to `serverNow` plus monotonic elapsed browser time. Device clock changes must not reset tasks or produce negative resin. On focus/reconnect and day/week boundary, refetch; temporarily disable period-dependent controls until refreshed. No one-second API polling. Local animation ticks are fine. Show offline/stale state rather than claiming a reset was saved.
- `lib/resin.ts` accepts explicit time and policy values, and handles unknown separately. Remove duplicate resin arithmetic in PlannerPage. A null cap time must not automatically mean “FULL.” Show “Estimate from your last update” and an empty input when unknown.
- `GoalService.getTodayDomains` and `PlannerIntelligenceService.getRecommendations` use the same public clock projection/server weekday. Planner Intelligence uses the new known resin projection instead of `DailyCompanionService`'s legacy record. Do not alter allocation/scoring algorithms. For unselected/unsupported clock or unknown resin, return the existing 422 envelope with a specific actionable reason; update affected Planner/Intelligence panels to display it rather than showing a zero-based route. No automatic writes through these GETs.
- Invalidate Planner Intelligence after a resin save and clock-derived Today/Planner queries after server changes or reset. Retain session isolation and ensure errors in these secondary panels do not block basic routine tracking. Limit `IntelligencePage.tsx` edits to compatibility/error presentation.

## File-level work order

1. Close the required Asia source gate; record whether optional discount evidence is available. Add a narrow ADR documenting the chosen C2a contract/storage transition and link the existing ADR amendments. Do not claim it implemented yet.
2. Shared contracts; schema/additive migration; pure Genshin clock/resin policy; extend the core provider interface. Suggested new modules: `server-clock.ts`, `routine-policy.ts`, `routine.repository.ts`, `routine.service.ts`, with persistence/orchestration in the existing platform companion directory. Avoid new feature scaffolding or directory moves.
3. Implement read projection and owner-locked command transaction. Replace daily/weekly controllers with V2 adapters and fail-closed V1 handling. Add settings and aggregate-claim routes. Remove runtime access to legacy upsert methods from all GETs/writes; retain data/schema.
4. Migrate Planner UI/API client and the two clock consumers. Adapt tests that currently assert write-on-GET or defeat-derived discounts; those expectations are intentionally superseded, not kept as acceptance criteria.
5. Add the tests below, run validation, update companion API documentation and only the affected feature/ADR status notes. Add a walkthrough with exact evidence and remaining gates. Update CURRENT_HANDOFF, leaving C2b/C3 pending.

Expected touched areas: Prisma schema/new migration; core companion contract; Genshin provider plus small clock/policy modules; platform companion daily/weekly services/controllers/routes/repository and goal clock adapter; Planner Intelligence service adapter; shared API contract/index; web API/resin/PlannerPage, weekly component only as needed for legacy display, and Intelligence error handling. Existing importer implementation, account-cache isolation, AI/environment files, dependencies, and optimizer calculators are not part of the patch.

## Acceptance tests

| Layer              | Required evidence                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pure clock/policy  | One millisecond before, exactly at, and after daily/weekly reset; Sunday/Monday, month/year rollover, leap day, multiple missed periods; host timezone independence; unsupported server; injected time called once per snapshot. Use candidate Asia fixtures only until primary evidence closes.                                                    |
| Projection/service | Absent row produces no writes; repeated/stale-period GETs leave storage unchanged; explicit zero vs unknown resin; future/invalid timestamps; cap/tick boundaries; partial daily updates preserve same-period siblings; Transformer unaffected by resets; weekly null vs explicit zero; legacy defeat flags never become claims.                    |
| HTTP               | Auth required on all old/new routes; body/query owner spoofing rejected/ignored safely; malformed/unknown fields; V1 refresh failures with no writes; stale day/week/revision/server 409s; unsupported server 400; direct first PATCH and no-prior-GET save after reset.                                                                            |
| PostgreSQL         | Concurrent first writes and same-revision existing writes: exactly one succeeds, one conflicts, no lost update; lock wait spanning reset is rejected as stale; forced failure rolls back all fields; GETs on absent/existing/expired state perform SELECTs only (query instrumentation plus row snapshots); direct and indirect GET routes covered. |
| Migration          | Fresh chain and upgrade from C1b; legacy boolean/defeat/resin data byte/value preservation; paired-null/range constraints; no fabricated timestamps; first import and subsequent replacement preserve routine row/revision and vice versa.                                                                                                          |
| Web                | New user/setup; known zero and unknown resin; aggregate reward editor and legacy notes; two tabs produce a visible conflict; overnight open tab refresh; device clock jumps; failed save visible; out-of-order responses; logout during pending work; narrow mobile layout.                                                                         |

Use existing Vitest/Supertest conventions and a guarded disposable database. Add companion integration tests to the existing dedicated CI integration command so they cannot silently remain skipped there; preserve import integration coverage. Pure and HTTP tests stay in the ordinary suite. Do not add a framework dependency just for the UI helpers; use existing tooling/browser capabilities.

Validation commands: direct `node node_modules/vitest/vitest.mjs run` from `apps/api` with an explicit safe `CELESTIA_TEST_DATABASE_URL` for the combined integration run; uncached root lint and all builds; format only changed milestone files, then report the known whole-tree OpenRouter exception separately. Use `D:/.pnpm-store` if installation is actually necessary. Do not run root/Turbo tests, which overwrite the protected log.

## Future release/rollback compatibility (planning only)

For a separately authorized release: back up first, apply the additive migration before the new API, then cut over compatible API/frontend together or in a maintenance window. Do not run old and new APIs as concurrent writers: old code keeps mutating legacy tables while new code treats them as frozen. Cached V1 clients must reload after explicit rejection. No production action is authorized now.

Rollback is not a down-migration: retain the additive table and user input. Reverting to old API code would resurrect write-on-GET and hide new routine records, so prefer a forward fix or temporarily disable affected routes. Never copy reward totals back into defeat flags or delete the new table to make rollback easy. Record this limitation in the walkthrough.

Done means the required clock evidence is recorded, runtime paths meet the read/write invariants, migration/concurrency tests pass against PostgreSQL, all callers are migrated, and the walkthrough reports exact limits. If evidence or integration validation remains unavailable, hand off partial status with a precise gate; do not mark C2a complete because unit tests pass.
