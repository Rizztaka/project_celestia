# Today and weekly plan V1

2026-10-17 follow-up: Today links to [farming intelligence](farming-intelligence.md)
for optional approximate reward-set/resin/calendar estimates and coordinate-stop
routes. The session-allocation contract below remains independent; it does not
automatically spend resin, advance goals or import hypothetical rewards.

Implemented locally in C4, 2026-10-06. This is user-owned visibility and session planning, independent of an imported account. All routes require the normal bearer token and derive ownership from its verified subject. Existing [routine V2](companion-routine.md), [goal V3/focus V1](focus-goals.md), and import V1 contracts remain separate.

## Routes and shared types

Base: `/api/v1/companion`. The exact strict schemas and response interfaces are in [genshin/plan.ts](../../packages/api-contracts/src/genshin/plan.ts).

| Method | Path                             | Result                          |
| ------ | -------------------------------- | ------------------------------- |
| GET    | `/plan?contractVersion=1`        | `PlanSnapshot`                  |
| GET    | `/plan/advice?contractVersion=1` | `PlanAdvice`                    |
| PATCH  | `/plan`                          | Atomic confirmed `PlanSnapshot` |

GET query accepts only the string version `1`. Every write has numeric `contractVersion: 1`, `expectedRevision` (integer 0–2147483646) and one action. Extra properties, identity fields and client timestamps are rejected.

```json
{
  "contractVersion": 1,
  "expectedRevision": 0,
  "action": "preferences",
  "preferences": {
    "enabledRoutineKinds": ["commissions", "weeklyClaims"],
    "dailyResinBudget": 70
  }
}
```

Preferences replace both fields together. Routine kinds are unique members of `commissions`, `teapot`, `transformer`, `weeklyClaims`, at most four. The budget is `null` or a finite integer 0–200; zero is valid. It is a **recurring daily ceiling**, retained across reset, not a checkpoint, remaining balance or record of spending. Missing preferences project revision 0, no enabled routines and a null budget without inserting a row. Disabling a kind preserves all existing routine observations.

```json
{
  "contractVersion": 1,
  "expectedRevision": 1,
  "action": "dismissal",
  "expectedRoutineRevision": 2,
  "serverId": "asia",
  "dailyPeriodId": "<copy the current snapshot value>",
  "weeklyPeriodId": "<copy the current snapshot value>",
  "source": {
    "kind": "goal",
    "goalId": "<owned goal UUID>",
    "expectedGoalRevision": 0
  },
  "scope": "day",
  "dismissed": true
}
```

This second example is a shape illustration; placeholders must be replaced with exact confirmed values. A routine source is `{ "kind": "routine", "routineKind": "commissions" }`. Goals support `day` and `week`. Commissions/Teapot use `day`; Transformer/weekly claims use `week`. Setting `dismissed: false` restores the addressed source/scope. Both period IDs and the routine revision are required even for week dismissals. This catches day changes and concurrent manual/server edits before applying stale visibility choices.

## Snapshot and advice

`PlanSnapshot` contains `contractVersion`, plan `revision`, `serverNow` (UTC ISO), `routineRevision`, nullable supported `serverId`/`period`, `preferences`, all-history `goalRevisions: {id, revision}[]`, active `goals: {goal: GoalRecord, dismissed: PlanScope[]}[]`, enabled `routines: {kind, task: RoutineTask|null, scope, dismissed}[]`, and `weekly: {available, rewardClaims: number|null}`. Null claims mean unknown, including a new week. Zero means explicitly recorded zero. No count is invented when the clock is unavailable.

Goals sort by priority ascending, creation time, then ID. The home shows three with expand/view-all links; the API and aggregate demand retain the complete active set. Routines have fixed independent order: commissions, Teapot, Transformer, weekly claims. Focus neither creates nor excludes intent. Paused/closed goals are excluded; duplicate and malformed active goals remain visible with reasons and are excluded from ambiguous demand.

`PlanAdvice` contains the plan/routine/all-goal revisions, `serverNow`, nullable `dailyPeriodId`, complete `materials: MaterialAdviceResponse`, `goalDemand`, nullable `budget`/`availableResin`/`ceiling`, total `allocatedResin`, grouped `sources`, and a plain `reason`. Each goal demand has `goalId`, material `deficits: Record<string, number|null>`, state `unavailable|unknown|covered|deficit`, and nullable reason. Each source includes its verified `AdviceDomain`, goal IDs, material keys, integer claims, resin and reason.

The existing [material boundary](catalog-advice.md) is reused: total eligible active costs including Mora, positive recorded stock and its coherent receipt, unknown missing stock, partial cost coverage. Stock is subtracted once across the full demand, then attributed in stable goal order. Collapsed and dismissed goals still reserve their position in that attribution. Dismissal changes today's selection, not total demand or completion. Known coverage never completes a goal. Import does not advance declared ranges.

Only undismissed goals with independently verified routes, relevant drop keys, an open supported weekday and positive integer Original Resin cost qualify for source groups. Incompatible metadata for one source key excludes that source. Each material is assigned to the first eligible group, preventing duplicate paid allocations. A group needs a known positive deficit for at least one of its assigned materials before claims can be allocated; unknown-only need gives route information with zero claims. Other unknown materials remain explicitly unknown.

The funded ceiling is `min(budget, current estimated resin)` only when both are known. Allocate whole claims in goal/source order from the remaining ceiling; the first eligible group may use every fitting claim. There is no per-goal cap, hidden score, random yield, exact required-run calculation or automatic completion. No future regeneration, fragile resin, purchases or rewards are assumed. Recording a session does not automatically debit inventory, resin or the budget.

**Production coverage, 2026-10-17:** the pinned community snapshot supplies 122 character ascensions, 120 base talent tables through level 10, 252 weapon ascensions and 48 weekday talent/weapon sources. Open sources with known positive deficits can receive whole 20-resin reward-set allocations. Unknown stock does not become a numeric deficit. The UI separates manual daily/weekly tasks from long-term goals and exposes optional source details. [Provenance and exclusions](../plans/production-readiness/sources.md) include Traveler talent exceptions and absent statistical yields/optimized walking routes. Tests and browser checks establish implementation behavior; community data is not relabeled as primary verification.

## Persistence, concurrency and errors

The additive `20261005150000_add_today_plan_choices` migration adds one preferences row per owner and bounded dismissal storage keyed by `(userId, sourceKey, scope)`. Goal keys are `goal:<id>`; routine keys are `routine:<kind>`. Database checks enforce budget, revision, scope, server and source shape. A compound goal foreign key enforces ownership. Existing IDs, rows, timestamps and historical migrations are untouched; no goal/routine/import backfill runs.

A dismissal matches its server/period and, for goals, exact goal revision. Any goal edit, priority or lifecycle change restores changed intent on projection. Import preserves it. Explicit server selection changes retire owned dismissals and increment an existing plan revision within the same C2a owner transaction, including server round trips. Expired rows are ignored on reads and overwritten by later explicit dismissal of that source/scope. Restore deletes that row but increments the durable plan revision. Storage does not grow with elapsed periods.

Writes share the existing owner-row lock with goals, routines and imports, including first writes. They read intent, then sample time after the lock, validate applicable versions/ownership/period, write and project the response in one transaction. Projection failure rolls everything back. Every accepted preferences/dismissal command increments the plan revision, including an explicit restore whose row is absent. There is no blind retry or idempotent queued command replay.

The snapshot is one parameterized SELECT with JSON subqueries. Advice brackets a single coherent stock/receipt SELECT with before/after plan-context SELECTs. A changed context causes one retry; continued churn returns 409. This establishes a common observation at the stock read without GET-side transaction-control SQL, writes, locks, initialization, reset or cleanup. Naive database timestamps stored as UTC receive an explicit UTC marker before Date parsing, including routine/goal JSON and reused stock/equipment receipts.

| Status | Meaning                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| 400    | Invalid strict schema, wrong routine scope or unavailable supported period                     |
| 401    | Missing/invalid authentication                                                                 |
| 404    | Goal absent from the owner's context, including foreign IDs                                    |
| 409    | Plan, goal, routine, server or period changed; or advice remained inconsistent after one retry |

Plan revision is checked first; a stale plan command may return 409 before source validation. No foreign source data is returned.

## Client behavior and cutover

Home has independent plan, supporting advice and routine queries. Queries carry AbortSignal and the originating token/session generation. Mutations cancel companion reads, use `retry: false` and `networkMode: always`, check the session before/after transport and guard callbacks. Account-scoped QueryClients isolate login changes. Confirmed snapshots reject decreasing plan/routine/goal revisions or observation time; advice is compared only with matching intent/routine/period revisions.

Failed/conflicting saves retain draft and last-confirmed state. Explicit Refresh updates confirmed state without resetting typed choices. Only a successful own preferences save or explicit Restore confirmed choices resets the form. Period boundaries use server time plus monotonic elapsed time; dispatch checks expiry again. Relevant saves/imports invalidate companion, Genshin, roster and intelligence consumers. A failed advice panel retains labeled prior advice and leaves manual recording usable.

Release remains separately authorized. Apply the additive migration before a coordinated API/web cutover; preserve routine V2, goal V3, focus V1 and import V1. There must be no mixed old/new writers: older server-setting writers do not retire dismissals. No destructive down migration or normal/production migration was performed during local acceptance.
