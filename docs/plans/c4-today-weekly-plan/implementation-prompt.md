# C4 execution prompt — Today and weekly plan

Prepared 2026-10-05 after the [C3b implementation review](../c3b-focus-goals/implementation_review.md). This is the next bounded phase, **not an instruction to start it while preparing or reviewing this document**. C4 has not been implemented. The execution contract below becomes authorized when the owner explicitly asks to execute it.

**Recommended model: GPT-6 Astra. Effort: Extra high (`xhigh`).** C4 combines deterministic resource allocation, trusted-data boundaries, reset-sensitive persistence and account-safe UI composition. This is a task-based recommendation, not a repository benchmark. OpenAI's [model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection) recommends Astra with Extra high for demanding work with exacting requirements; the [Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra) confirms support. GPT-6.1 Sol with Extra high is a reasonable alternative when usage/cost matters. Select the model and effort before execution; do not automatically switch the current chat.

## Copyable execution prompt

```text
Implement Project Celestia C4: a manageable Today and weekly plan, grounded in
existing manual routines, active goals, user priorities and verified data.
First perform a focused review of the inherited C3b checkpoint. Complete bounded
implementation, corrective fixes and validation; do not stop after planning.

WORKSPACE, AUTHORIZATION AND PRESERVATION
Work in the existing D:\Genshin Personal\project-celestia checkout. The chat's
default C:\Users\inuzu\.codex\worktrees\... checkout is not the working source.
Set the D: working directory explicitly for every repository command. Verify
Get-Location, git rev-parse --show-toplevel, git worktree list and git status.
Do not create a worktree, switch branches, copy from a clean checkout, reset,
clean, stash, reconstruct old work, or overwrite unrelated tracked/untracked
files. Record starting status, HEAD and protected hashes before changing files.

My request to execute this prompt authorizes focused C3b corrections and bounded
C4 implementation/validation, including necessary additive migration files and
execution ONLY on guarded disposable test databases. It overrides older weekday
or reviewer-only role notes for this task. Routine design choices need no extra
approval. No staging, commits, pushes, deployment, production/normal database
migration, external messages, automatic C5 work or broad catalog research.

Preserve the eight files/hashes and five formatter exceptions recorded in
docs/plans/c3b-focus-goals/review-preservation-check.json. In particular preserve
the unrelated OpenRouter work, package/lock files, original Sonnet submission,
historical migrations and apps/api/.turbo/turbo-test.log. Do not run Turbo.
Record the C3b lifecycle migration hash too; do not edit a historical migration
to implement C4. Avoid dependency changes unless demonstrably required.

READ FIRST, IN THIS ORDER
1. Applicable repository instructions and docs/plans/CURRENT_HANDOFF.md.
2. docs/plans/c3b-focus-goals/implementation_review.md, walkthrough.md,
   implementation_plan.md, task.md and review-preservation-check.json;
   docs/api/focus-goals.md and docs/api/character-equipment.md.
3. docs/plans/c2b-data-trust/implementation_review.md, sources.md,
   catalog-inventory.md and docs/api/catalog-advice.md.
4. docs/api/companion-routine.md, docs/adr/0013-versioned-routine-snapshots.md,
   docs/plans/c2a-clock-task-reliability/walkthrough.md and sources.md;
   docs/api/genshin-import.md and the C1b provenance walkthrough.
5. docs/ROADMAP.md, docs/features/FEATURE_GENSHIN_COMPANION.md,
   docs/plans/genshin-companion/implementation_plan.md, ADR 0012,
   docs/ARCHITECTURE.md and docs/UI_UX_GUIDELINES.md.
Current execution evidence supersedes old planning examples. Inspect actual
code and meaningful tests; passing counts alone are not a review.

INHERITED REALITIES — VERIFY BEFORE DESIGNING
- Bounded C3b is complete locally. Focus membership is independent of goals.
  Goals belong to User, so manual goals work before a Genshin account/import.
  Lifecycle is active/paused/completed/archived, priority 1–5 (1 first), with
  expected revisions, create request IDs and one successor per closed row.
  Existing goal ties use createdAt then ID. Completion is always explicit.
- Legacy active+paused duplicate intent groups remain visible; every active
  member is excluded from ambiguous demand. Malformed intent is preserved.
  Priority-only UI/API writes work without repairing its range or slot.
  Missing/invalid fixed talent slots are shown honestly, not as Normal attack.
- Goals describe declared ranges, not newly calculated progress since import.
  Imported ascension is a read-only comparison. Raw talents do not establish
  base/effective convention; weapon goals address types, not physical copies.
- Only HuTao normal/skill/burst base-talent costs 1–6 are verified. All farming
  routes remain unavailable. Other costs, placeholder events, live deadlines,
  weekly discount and Transformer cooldown advice must not become available
  merely because C4 needs a card. No conventional 20/40 resin fallback.
- C2a V2 routines work without import. Only selected Asia has an enabled clock.
  Period/revision/server checks, time sampled after the owner lock, read-only
  rollover projection and explicit resin checkpoints are deliberate contracts.
- Materials already aggregate eligible costs/Mora and subtract recorded stock
  once with coherent receipts. Unknown stock is nullable, not zero. Empty or
  zero-only imports do not certify zero stock. Reuse this boundary.
- PlannerIntelligenceService has imported-account/server/resin prerequisites
  and legacy compatibility fields. Do not make the whole home depend on it or
  use its historical score/MAX_RUNS_PER_GOAL as a new allocation policy.
- DashboardPage is currently the home hub, PlannerPage hosts daily/weekly/
  farming/events, and GoalManager/RoutinePanel own working manual flows.
  Preserve old routes, deep links and other modules; C5 owns navigation cleanup.
- Existing session token+generation guards, query cancellation, revision-aware
  confirmation and cross-namespace invalidation protect delayed reads/writes.
  Every GET must remain SELECT-only, including first use and rollover.

FOCUSED REVIEW AND DESIGN ARTIFACTS
Review C3b ownership, preserved legacy intent, replay/conflict behavior, active
goal consumers, re-import continuity and originating-session guards. Keep the
C3b review historical; append a dated follow-up if you fix a concrete defect.
Add a regression for each material correction. Do not reopen unrelated modules.

Before application changes, create docs/plans/c4-today-weekly-plan/task.md and
implementation_plan.md. Record the route/consumer inventory, public interfaces,
exact shared DTOs, preference/dismissal lifetime, default behavior, ordering,
budget/stock allocation rules, concurrency/clock policy, schema justification,
UI states and test matrix. Choose the smallest coherent implementation.
Extend existing domain services; keep game rules behind the Genshin/provider
boundary. No new intelligence engine, generalized scheduler or parallel goal
system. If a relevant skill is required by the chosen implementation, read it.

1. HOME COMPOSITION AND WEEKLY SUMMARY
Make Today the useful primary content at /. Compose manual routine status, a
small deterministic active-goal shortlist and a current-week summary. Provide
an explicit expand/view-all path and links to the exact goal and character.
Reuse public service interfaces and existing query conventions; do not fetch
every intelligence engine to render the home. Replace misleading unconditional
readiness/operational claims on the touched home with meaningful user content.

Keep routine, goal and supporting-advice loading/error states independent.
Without import, show usable manual tracking and goals. With no goals, show the
routine and a gentle choose-character/create-goal invitation. With no enabled
or remaining work, show a calm state. Unavailable data is distinct from no work
remaining. Retain labeled last-confirmed data on refresh errors.

The weekly summary uses the supported current period and existing manual weekly
claims/tasks. Do not forecast future resin regeneration, fabricate boss counts,
discounts, event deadlines or guaranteed upgrade completion. Keep unknown and
zero distinct. Existing Planner tabs/deep links continue to work.

2. USER CHOICE, PREFERENCES AND REVERSIBLE DISMISSAL
Candidates come only from active goals and user-enabled routine kinds. Never
rank unused roster characters. Focus can label or filter; it cannot silently
create, pause, reprioritize or exclude otherwise active goal intent.

Provide explicit persistent controls for which supported optional routine kinds
appear and for the user's resin budget. Define clear defaults: no fabricated
budget; optional routines are a visible opt-in choice. Disabling a routine must
not delete its C2a records. Distinguish visibility/preferences from completion.

Support reversible “dismiss for this day/week” with a visible restore path.
Keep it separate from pause/resume and completion. Pause/resume uses the existing
C3b command, retaining its history and expected-revision rules. Dismissal must
identify the underlying owner/source/goal or routine and supported server period,
not a card's array index or translated label. Specify what goal edits and server
changes do to it; do not allow an obsolete dismissal to hide changed intent.
If no supported period exists, keep manual goals usable and explain why a
period-scoped dismissal is unavailable rather than guessing a local reset.

Persist the minimum user-owned preferences/dismissal state required. Document
whether the budget is a daily recurring ceiling or a one-period choice; label
that behavior clearly and test rollover. Avoid an unbounded task/session log.
Missing preference rows use in-memory defaults on GET; no lazy write/reset/
cleanup in reads. Obsolete dismissal rows may be ignored on reads and pruned
only by a bounded, owner-scoped explicit write if the design requires it.

If schema changes are needed, use a new additive migration with neutral defaults
and no destructive backfill or goal/routine/import changes. Preserve old rows,
IDs, timestamps and all C3b migration semantics. Enforce ownership, uniqueness
and relevant bounds in the database as well as strict write schemas.

3. DETERMINISTIC ORDER AND RESOURCE ACCOUNTING
Use explicit goal priority first. Within equal priority, verified availability/
deadline can order actionable work; use createdAt then ID as stable final ties.
Unavailable facts supply no invented ordering value. Highlight real deadlines
separately without overriding user priority. Define a stable routine ordering
and placement; do not invent hidden weights or blend routines into a meta score.

Validate a documented, bounded, nonnegative integer resin budget, including 0;
reject fractional, negative, non-finite and oversized input. It is intent, not
a resin checkpoint or permission to assume spending. A current-resin-backed
allocation must not exceed either the user's budget or a known available resin
estimate. Unknown available resin must not be displayed as a confident funded
allocation; retain the manual plan and an explicit unavailable explanation.
No fragile resin, purchases, unclaimed rewards or future regeneration assumed.

For the complete eligible active-goal set, aggregate shared material demand once
and subtract known recorded inventory once before attribution/allocation. Do
not recompute inventory independently per goal, hide demand merely because the
shortlist is collapsed, or spend the same resin claim twice. Preserve Mora,
receipt coherence, partial cost coverage and unknown deficits. A dismissed goal
still exists: explicitly separate total active demand from today's selected
allocation rather than treating dismissal as completion.

Group compatible shared farming sources without duplicate paid claims. A claim
may be included only when its relevant route, period/weekday, cost and units are
verified and it fits the remaining budget. Use integer claims and stable ties;
the sum of allocated costs cannot exceed the budget. Known stock can fully cover
a demand, but this never auto-completes a goal. Unknown stock cannot prove a
deficit or an inventory-covered result. With unknown need, show qualifying route
information separately if verified, not an invented required-run count.

Do not infer random yields, exact runs-to-finish, a completion date or fabricated
progress. Budget allocation describes a feasible session, not guaranteed loot.
Do not revive the historical arbitrary per-goal run cap or score ranking.

Production route coverage is currently empty. Deliver the honest manual Today/
weekly composition and explain unavailable actionable routes. Exercise the
positive allocation branch with an injected, explicitly synthetic verified test
provider; never mark real catalog facts verified using fixture evidence. Broader
source verification is separate work, not a reason to weaken C2b or stall C4.

4. EXPLICIT ACTIONS AND ACCOUNT-SAFE UX
Keep “recorded my session,” “update inventory” and “goal completed” distinct.
The session action can open/reuse existing manual routine/checkpoint recording;
do not invent loot or create a generic session journal. Inventory changes only
through existing explicit import flows; goal completion only through C3b writes.
No task checkbox grants drops, subtracts inventory, advances goal ranges or
marks a character upgraded. Offer existing priority editing without silently
repairing malformed legacy records.

Use accessible labels, semantic buttons, visible keyboard focus, touch-friendly
controls and mobile layout without horizontal page overflow. Display plain
reasons for partial/unavailable advice near the affected task. Keep technical
catalog metadata in details where needed, not the primary home experience.

New writes require strict shared contracts, ownership and expected-version rules.
Use the existing owner-lock convention for writes interacting with goal/routine/
import state; sample/reset-check time after acquiring the lock. Define atomic
responses and conflict behavior before coding. Foreign IDs must not leak data.
No blind mutation retries or queued replay under another account.

Pin originating token and session generation before dispatch and after responses;
guard callbacks as well as queries. Reuse account-scoped caches and invalidate
home, routine, goal, material and legacy planner consumers after relevant writes
or imports. Define consistency for concurrent reads/imports; do not combine an
old receipt with new stock or claim a coherent allocation from mismatched
snapshots. Failed/conflicting saves retain drafts and last-confirmed state;
refresh must not silently overwrite typed intent. Preserve revision ordering.

5. VALIDATION — REQUIRE OBSERVED EVIDENCE
Add meaningful tests at the layer that owns each behavior:
- Pure deterministic composition/allocation: stable ties and repeat reads;
  priority before availability; 0/unknown/insufficient budget; exact boundary;
  invalid budgets; integer costs; multiple goals sharing material/source;
  inventory subtracted once; unknown/covered stock; Mora and partial coverage;
  paused/closed/duplicate/malformed exclusions; dismissed versus total demand;
  no cap/score/yield fallback and no automatic completion.
- Production provider keeps unsupported routes/events/deadlines unavailable;
  explicit synthetic provider exercises positive shared-source allocation.
- Preferences/dismissal: defaults, enable/disable, persist/reload, restore,
  identity after goal edit/import, server changes, unsupported clock, before/
  exactly-at/after daily and weekly reset, stale writes and rollback.
- Real guarded PostgreSQL for any new persistence: fresh and populated migration,
  ownership, concurrent first/existing writes, expected revisions, lock waits
  over reset, failed transaction, import isolation and preserved legacy records.
  Combined/indirect GET paths remain SELECT-only including first use/rollover.
- Actual client/cache paths: delayed old-owner queries and mutations, token
  generation changes, cancellation, out-of-order responses, failed saves,
  deliberate conflict refresh, and retained drafts/confirmed data.

Use only an explicitly supplied loopback celestia_test_* disposable database.
Validate host/name before application imports, connections or migration commands.
Disable normal dotenv loading (DOTENV_CONFIG_PATH=NUL on Windows), set NODE_ENV=
test and both database variables explicitly, and supply dummy test JWT/OpenRouter
values. Do not print secrets or fall back to .env. Tests must fail closed for an
unsafe target. The prior fixture used 127.0.0.1:55446/celestia_test_c3b; do not
assume it is running, disposable by port alone, or free of another process.

Run Vitest directly from apps/api with --no-file-parallelism because integration
files share a fixture; explicit concurrency tests still run. The reviewed C3b
baseline is 601 tests / 39 files / 78 actual PostgreSQL cases, zero skipped or
failed. Establish the current baseline; do not delete or weaken tests to match
counts. A green run with database suites skipped is insufficient.

Run API/web lint, relevant shared/API/web type checks and builds, Prisma schema
validation and schema diff ONLY against the guarded fixture when relevant,
focused formatting and git diff --check. Use existing dependencies/store. Do
not broadly reformat or run Turbo; preserve the eight hashes and exceptions.

Exercise the built UI through an actual browser on disposable fixtures: new
owner without import, returning owner, two owners with different data, desktop
and narrow mobile; enable routines, edit/restore budget, stable shortlist/expand,
dismiss/restore, pause/resume, priority edit, manual session versus inventory/
completion, unknown/all-unavailable/calmer empty states, failed save, two-tab
conflict, delayed save across logout/login, and re-import preserving intent.
Verify supporting-panel failure leaves routine use available. Recheck the C3b
legacy priority-only correction. Save and inspect concise acceptance evidence;
separate synthetic clock/provider tests from observed production coverage.
Stop only processes you started, restore viewport/build overrides and verify
temporary ports closed. Never stop an unrelated process to free a port.

DELIVERABLES AND STOP CONDITION
Complete implementation_plan.md, task.md and walkthrough.md in this C4 folder;
document exact API/state contracts in docs/api and update CURRENT_HANDOFF plus
relevant roadmap/spec checkpoint banners. Record review findings/resolutions,
commands and results, browser evidence, preserved hashes, actual coverage,
remaining limits, migration/cutover needs and cleanup. Keep historical counts
labeled as historical. No full repository rewrite or C5 implementation.

The exit criterion is a useful owned Today/weekly home for manual routines and
active goals, with stable user-controlled order, reversible choices, bounded
and honestly qualified resource accounting, trustworthy partial/unknown states,
and tested persistence/session/reset boundaries. Existing import, equipment,
focus and goal lifecycle flows remain intact. Explain specifically what works
with the production data today and what only the synthetic fixtures demonstrate.
Report remaining blockers honestly; local validation is not release approval.
Stop after this bounded C4 checkpoint without staging or release actions.
```
