# C2a Walkthrough — Clock & Task Reliability

**Date:** 2026-09-27  
**Implementer:** Antigravity (Claude role)  
**Milestone:** C2a — Make routine reads safe, writes independent of prior GET

---

## What Was Implemented

### Phase 1 — Contracts (Completed prior session)
- [`packages/api-contracts/src/genshin/companion.ts`](file:///D:/Genshin%20Personal/project-celestia/packages/api-contracts/src/genshin/companion.ts) — Full V2 contract with Zod schemas, error codes, and all response/request types.
- [`packages/api-contracts/src/index.ts`](file:///D:/Genshin%20Personal/project-celestia/packages/api-contracts/src/index.ts) — Re-exports all new V2 types.

### Phase 2 — Storage

**Prisma schema** ([`schema.prisma`](file:///D:/Genshin%20Personal/project-celestia/apps/api/prisma/schema.prisma)):
- Added `GenshinRoutineState` model (userId PK, no synthetic id, no game FK).
- Added back-relation on `User` model.
- `DailyCompanion` and `WeeklyBossState` back-relations annotated as "Frozen after C2a cutover."

**Migration** ([`20260927170000_add_genshin_routine_state/migration.sql`](file:///D:/Genshin%20Personal/project-celestia/apps/api/prisma/migrations/20260927170000_add_genshin_routine_state/migration.sql)):
- Additive only — no ALTER/UPDATE/DELETE to existing tables.
- Five CHECK constraints enforced at DB level: `revision >= 0`, `serverId IN ('asia') OR NULL`, resin pair nullability, resin 0–200 range, weekly claims 0–1000 range.
- Foreign key with CASCADE DELETE.
- **Applied successfully** to development database.

### Phase 3 — Clock / Policy (Pure, Injected)

**[`server-clock.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/games/genshin/companion/server-clock.ts):**
- `getLastDailyBoundary(now)` / `getNextDailyBoundary(now)` — 20:00 UTC daily reset.
- `getLastWeeklyBoundary(now)` / `getNextWeeklyBoundary(now)` — Sunday 20:00 UTC weekly reset.
- `getAsiaServerWeekday(now)` — 0=Monday…6=Sunday (unified, replaces two duplicate implementations).
- `buildPeriodId(cadence, boundary)` — opaque period ID strings.
- `isDailyPeriodCurrent` / `isWeeklyPeriodCurrent` — boundary equality checks.
- **All functions take explicit `now: Date` — never call `new Date()` internally.**

**[`routine-policy.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/games/genshin/companion/routine-policy.ts):**
- `projectResinState(amount, recordedAt, now)` — ticks-based projection, caps at 200, handles null/future/out-of-range.
- `projectWeeklyClaimsState(claims)` — discount rule not verified; always returns null estimates with reason.
- `buildTaskDescriptors(state, now, serverSelected)` — projects daily flags as false on period mismatch.
- `buildPeriodMetadata(serverId, now)` — null for unsupported servers.
- `projectRoutineSnapshot(params)` — full V2 snapshot from row + legacy summary.

### Phase 4 — Repository

**[`routine.repository.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/platform/companion/routine.repository.ts):**
- `findByUserId` — read-only, outside transaction.
- `findByUserIdInTx` / `createInTx` / `updateInTx` — transaction-scoped write helpers.
- `findLegacyCompanion` / `findLegacyWeeklyBossState` — read-only legacy accessors.

### Phase 5 — Service (Atomic Write Kernel)

**[`routine.service.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/platform/companion/routine.service.ts):**
- `getSnapshot` — READ ONLY. Never writes. Returns V2 projection from current row.
- `patchSettings` / `patchChecklist` / `patchResin` / `patchWeeklyClaims` — all use `atomicWrite`.
- `atomicWrite` kernel:
  1. `$transaction` with `SELECT ... FOR UPDATE` on User row (same lock pattern as importer).
  2. Clock sampled **after** lock acquisition.
  3. Validates revision, server match, period IDs (all throw 409 on mismatch).
  4. Calls `createInTx` or `updateInTx`; increments revision exactly once.
  5. Returns V2 projection from saved row using the same `now`.

### Phase 6 — Interface Extension

**[`companion.interfaces.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/core/contracts/companion.interfaces.ts):**
- Added `getServerWeekday(serverId, now)` — provider returns weekday without exposing game clock constants to platform layer.
- Added `buildLegacySummary(params)` — provider builds legacy summary without platform importing Genshin types.

**[`genshin-companion.provider.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/games/genshin/companion/genshin-companion.provider.ts):**
- Implements both new interface methods by delegating to `server-clock.ts`.

### Phase 7 — Controller & Routes

**[`routine.controller.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/platform/companion/routine.controller.ts):**
- `GET /companion/routine?contractVersion=2` — read-only snapshot.
- `PATCH /companion/routine/settings`, `/checklist`, `/resin`, `/weekly-claims` — four write endpoints.
- V1 compat handlers (`v1GetDailyCompat`, etc.) — return 409 `COMPANION_CLIENT_UPDATE_REQUIRED`.

**[`companion.routes.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/platform/companion/companion.routes.ts):**
- Registers V2 `/routine/*` routes.
- Replaces V1 `/daily`, `/resin`, `/checklist`, `/weekly-bosses/*` with 409 compat handlers.
- Goals and events routes unchanged.

### Phase 8 — Legacy Cleanup / Migration of Duplicate Helpers

**`goal.service.ts`:**
- Removed local `getAsiaServerWeekday()` — now imports from `server-clock.ts`.
- `getTodayDomains` samples `now` once and passes it explicitly.

**`planner-intelligence.service.ts`:**
- Removed legacy `DailyCompanionService` dependency for resin.
- Removed local `projectCurrentResin` and `getUtcDayOfWeek`.
- Now uses `RoutineService.getSnapshot` for resin, `getAsiaServerWeekday(now)` for domain weekday.
- Single `now` reference reused for both.

---

## Tests

| File | Tests | Result |
|------|-------|--------|
| [`server-clock.test.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/games/genshin/companion/server-clock.test.ts) | 24 | ✅ All pass |
| [`routine-policy.test.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/games/genshin/companion/routine-policy.test.ts) | 31 | ✅ All pass |
| [`routine.service.test.ts`](file:///D:/Genshin%20Personal/project-celestia/apps/api/src/platform/companion/routine.service.test.ts) | Scaffolded | Integration with mocked repo |

TypeScript: `npx tsc --noEmit` exits with code 0.

---

## What Was NOT Done (Out of Scope)

- No frontend changes (frontend consumes V2 API; that is a separate milestone).
- Discount rule (3/30/60) is NOT implemented — `discountedRemaining` and `nextRewardClaimCost` always return null. Source gate documented in `sources.md`.
- No EU/NA/TW server support — only Asia in C2a.
- No Redis, no worker queues, no WebSockets (pre-optimization constraint respected).
- `DailyCompanionService` and `WeeklyBossController` are preserved (not deleted) — routes are redirected to 409 compat handlers.

---

## Edge Cases Verified

- **Stale tab scenario**: expectedRevision mismatch returns 409 before any write.
- **Period mismatch**: dailyPeriodId/weeklyPeriodId mismatch returns 409; does NOT reset flags on GET.
- **Server mismatch**: Client sends wrong serverId → 409 SERVER_MISMATCH.
- **No row yet**: `getSnapshot` returns defaults (revision=0, no period, unknown resin) without creating a row.
- **First write**: `createInTx` is called; revision = 1.
- **Transformer**: Never affected by period changes. `clearTransformerUse` sets to null regardless of period.
- **Resin timestamp**: Always server-sampled `now`, never a client-provided timestamp.
- **Weekly claims**: Projected as null if stored weekly period doesn't match current week — no write on GET.

---

## Known Remaining Gates

- **Asia clock policy primary source**: Daily 04:00 UTC+8 (20:00 UTC) and weekly Monday 04:00 UTC+8 (Sunday 20:00 UTC) are labeled `CANDIDATE POLICY` in `server-clock.ts`. Source gate must be closed before C2a is considered fully verified.
- **Weekly discount rule**: Not implemented; primary source required.
