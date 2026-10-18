# Next-phase implementation prompt — C3b focus and goals

Prepared 2026-10-03 after [verifying the D: checkout and C3a evidence](../c3a-character-equipment/readiness-check.md). **Executed with explicit owner authorization; bounded C3b completed locally 2026-10-04.** See [walkthrough](walkthrough.md) for validation and limits. The prompt below is the historical execution contract, not authorization for additional work.

**Recommended model: GPT-6 Astra. Reasoning effort: Extra high (`xhigh`).** C3b combines a populated-database migration, legacy duplicate preservation, lifecycle transitions, concurrent writes and changes across several planning consumers. This is a task-based recommendation for a careful implementation, not a measured benchmark on this repository. OpenAI's [model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection) positions Astra with Extra high for demanding work with exacting requirements, and the [Astra model page](https://developers.openai.com/api/docs/models/gpt-6-astra) confirms `xhigh` support.

**Alternative when usage/cost matters: GPT-6.1 Sol with Extra high (`xhigh`).** OpenAI describes [Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol) as supporting complex coding at a lower cost. Select the model/effort in the next chat before execution; this recommendation does not change the current chat or authorize automatic model switching.

This phase adds durable user intent to the completed C3a equipment read view. It deliberately bounds the broader C3 specification: existing numeric upgrade types/ranges, focus membership, user priority and lifecycle. Artifact targets, higher talent ranges, role presets and broader Today redesign stay deferred. At completion, assess the roadmap exit criteria explicitly; do not mark every broader C3 aspiration complete by association.

## Execution prompt

```text
Implement Project Celestia C3b: focus characters, explicit goal priority and
durable goal lifecycle, after a focused review of the C3a checkpoint.

WORKSPACE AND AUTHORIZATION
Work in D:\Genshin Personal\project-celestia, the existing dirty local checkout.
Use this exact working directory for every repository command. First verify
Get-Location, git rev-parse --show-toplevel, git worktree list and git status.
The chat may default to C:\Users\inuzu\.codex\worktrees\e5be\project-celestia;
that clean detached checkout does NOT contain the uncommitted implementation.
Do not create a worktree, switch branches, copy from the clean checkout, reset,
clean, stash or reconstruct earlier milestones. Preserve tracked AND untracked
work. Record starting status and protected hashes before editing.

When I ask you to execute this prompt, that authorizes local C3a corrective fixes
and bounded C3b implementation/validation in this conversation, including the
necessary additive migration files and their execution ONLY on guarded disposable
test databases. It overrides older weekday/architect-only role notes. Complete
the work, not just a plan. No staging, commits, pushes, deployment, production
migration, external messages or automatic C4 work. Preparing this prompt alone
does not authorize execution.

READ FIRST
Read docs/plans/CURRENT_HANDOFF.md, then:
- docs/plans/c3a-character-equipment/{walkthrough,implementation_plan,task,
  readiness-check}.md and preservation-check.json
- docs/api/character-equipment.md
- docs/plans/c2b-data-trust/implementation_review.md, sources.md,
  catalog-inventory.md and docs/api/catalog-advice.md
- docs/plans/c1b-import-provenance/walkthrough.md and docs/api/genshin-import.md
- docs/plans/c2a-clock-task-reliability/walkthrough.md,
  docs/api/companion-routine.md and ADR 0013
- docs/ROADMAP.md, docs/features/FEATURE_GENSHIN_COMPANION.md,
  docs/plans/genshin-companion/implementation_plan.md, ADR 0012,
  applicable repository instructions and architecture/UI guidance.
The braces above abbreviate separate files. Current handoff and execution
evidence supersede historical banners and broad target-spec examples.

CURRENT CODE REALITIES — VERIFY BEFORE DESIGN
- C3a uses /roster/:characterKey and an authenticated, owned, one-SELECT equipment
  endpoint. Its recorded/unknown states and independent section receipts are
  deliberate. Equipment UUIDs change on replacement imports.
- UpgradeGoal is in apps/api/prisma/schema.prisma. It belongs to User, not
  GenshinAccount, and has goalType, targetKey, fromPhase, toPhase, nullable
  talentType, timestamps and a composite unique declaration. It has no lifecycle,
  priority, revision or focus fields. Existing user IDs and goal IDs must survive.
- GoalService/GoalRepository/GoalController and companion.routes.ts own current
  create/list/delete/materials/today flows. The service still accepts talent
  fromPhase=0 through its shared phase schema, while the UI starts talents at 1.
- PostgreSQL's existing unique key includes nullable talentType. Do not assume
  it prevents duplicate non-talent rows. Existing malformed/duplicate rows are
  a migration input, not disposable fixtures to silently normalize away.
- PlannerIntelligenceService reads prisma.upgradeGoal directly. Inspect it and
  its calculator/explainer as well as GoalService; changing only listGoals or the
  web filter will leave inactive goals contributing to advice.
- Inspect PlannerPage, GoalForm, RosterPage, CharacterDetailPage,
  CharacterEquipmentView, lib/api.ts, account-cache.ts, App.tsx and ImportPage.
  Goal-related caches span both companion and genshin namespaces. Existing
  session isolation for queries does not by itself prove mutation isolation.
- C2b allows only sourced HuTao normal/skill/burst base-talent costs from 1–6.
  Other cost targets and every farming route remain unavailable. Stored raw
  talents do not prove base/effective convention or per-value default origin.

FIRST: REVIEW THE INHERITED CHECKPOINT
Independently inspect C3a code and meaningful tests, not just the passing count:
auth/ownership, safe natural keys, foreign legacy relations, SELECT-only reads,
coherent equipment/receipt snapshots, all five slots, provenance/empty wording,
raw talents/absent stat amounts, import refresh and session isolation. Confirm
the two C2b corrections remain intact. Record precise findings, severity and
resolutions in docs/plans/c3a-character-equipment/implementation_review.md.
Fix concrete blocking in-scope defects with regressions before C3b. Missing
catalog coverage is a supported unavailable state, not a request for research.
Do not reopen the entire legacy application or rebuild C2a.

PREPARE THE CONTRACT BEFORE APPLICATION EDITS
Create docs/plans/c3b-focus-goals/task.md and implementation_plan.md. Document:
the ownership model, schema/backfill strategy, exact routes/shared DTOs, lifecycle
transition table, duplicate policy, concurrency/retry rules, active-goal consumer
inventory, UI/cache behavior and test matrix. Choose the smallest design that
satisfies this prompt; routine implementation choices need no extra approval.
Extend the existing modules; no new game, intelligence engine or parallel goal
system. Game-specific validation/observation rules belong in Genshin/provider
code, not additional game SQL/rules inside generic platform orchestration.

1. FOCUS AND PRIORITY
Allow an authenticated user to add/remove owned roster characters from a durable
focus list, using account ownership plus character natural key, never equipment
UUIDs. Unknown imported character keys can be focused without catalog support.
Show focus on roster/detail and provide a useful focus-only roster filter.
No arbitrary maximum number of focus characters. GETs must not create accounts
or focus records. No-import accounts have an honest empty focus state.

Use one clear priority model: a bounded user-editable integer priority on goals,
with documented direction/default and deterministic createdAt/id tie-breaking.
Focus means membership; it is not a hidden goal status, prerequisite or score
multiplier. Removing focus must not delete, pause or complete existing goals.
Focused characters without goals remain valid. Existing non-focused and pre-
import goals stay manageable. Preserve optional user text only if required by
the minimal UI; role/build labels and preset recommendations are not required.

2. GOAL TYPES, OWNERSHIP AND DURABLE IDENTITY
Reuse CHARACTER_ASCENSION, CHARACTER_TALENT and WEAPON_ASCENSION. For this slice,
keep ascension phases 0–6 and user-declared base talent ranges 1–6, with integer
from < to. Talent slot is required only for CHARACTER_TALENT; reject unknown
request fields, invalid slots, NaN/fractional/out-of-range values and unsafe keys
in the service, not only the form. Do not widen numeric ranges or source coverage.

Separate storing valid user intent from eligibility for cost/route advice. Allow
goals for owned opaque character/weapon keys within these bounded types even
when advice is unavailable. Preserve the existing ability to create supported
catalog-key goals without importing an account; a focus record is not required.
Never fabricate an owned character or derive another user's ownership from a
request body. Preserve legacy unknown/invalid targets as visible records with
explicit limitations; do not clamp, silently retarget or erase them.

Character intent uses natural keys. Weapon targets use weapon type keys, not
replaceable copies. A detail-page weapon shortcut must make its type-level scope
clear, retain the selected key after equipment changes, and avoid claiming to
track one physical weapon. Multiple copies or changed assignment cannot justify
an automatic progress comparison. Keep existing user-owned goal storage unless
an explicitly documented, lossless additive mapping is necessary; do not require
or create accounts on reads just to attach old goals to a new schema.

3. EXPLICIT LIFECYCLE AND SAFE WRITES
Implement active, paused, completed and archived with explicit user actions.
New goals start active. Pause/resume is reversible. Completing a goal is a user
decision, with a distinguishable 'good enough' completion reason where offered;
it is not a claim that recorded values or all material deficits reached zero.
Archive retains the target and relevant completion metadata.

Define reopen/restore and raised-target behavior before coding. Closed target,
completion time/reason and identity must not be silently overwritten. Prefer a
deliberate successor/new active goal for a changed completed/archived target,
retaining the old record; a full audit/event-sourcing subsystem is out of scope.
Active/paused edits retain ID and require an explicit user submission. Imports,
GETs, focus toggles and cost calculations never auto-complete, reopen, delete or
advance a goal's declared starting value. Replace the primary delete-to-edit UX
with lifecycle actions. Inventory the old DELETE/create callers and either keep
owned compatibility or explicitly version/fail closed incompatible writes; never
silently reinterpret a destructive endpoint as archive.

All mutations validate ownership and write atomically, including priority edits,
status transitions, successor creation and any collection reordering. Use a
revision/conditional-update contract so stale tabs get a visible conflict rather
than overwriting a newer goal. Return authoritative post-write state/revision.
Repeated or delayed requests cannot regress status, duplicate successors or lose
priority changes. Define retry behavior explicitly; no blind mutation retries.
Do not trust a client-supplied owner/account ID. Foreign IDs must not leak fields
or permit mutation. Pure reads are SELECT-only, including missing-account paths.

4. MIGRATION AND LEGACY DUPLICATES
Use new additive migration files; never edit historical migrations. Preserve old
goal IDs, owners, types, keys, ranges and timestamps. Backfill lifecycle as active
and priority/revision with documented neutral defaults, without inventing prior
completion or focus history. Do not require an imported account for old rows.

Define one current-intent identity (owner/type/key/talent slot) and a deliberate
policy for active/paused duplicates and terminal successors. Handle nullable
talentType correctly under actual PostgreSQL. Serialize conflicting creates or
use a suitable database guarantee; 'check then insert' outside an atomic boundary
is insufficient. Apply the policy consistently to every surviving write API.

Do not delete/deduplicate/reassign old rows to make a new unique index succeed.
If legacy current-intent duplicates exist, retain them, expose a needs-review
state and prevent ambiguous duplicate demand from being silently counted; let
the user resolve them explicitly. The migration and read contract must work on
populated fixtures with null-slot duplicates, valid talent goals, unsupported
keys/ranges, multiple owners and users with no imported account. Document how
any existing unique constraint changes to permit retained closed history safely.
No production or normal development database may be used for this exercise.

5. ACTIVE PLANNING AND HONEST PROGRESS
Only active goals contribute to material totals, Today domain relevance and the
existing Planner recommendation path. Paused/completed/archived records remain
visible in management/history views with useful filters. Update every direct
consumer, including PlannerIntelligenceService, rather than hiding rows only in
React. An all-inactive account has a calm no-active-goals state. Preserve routine
tracking when goals or cost/route prerequisites are unavailable.

User priority determines order among eligible active goals, with stable ties;
do not convert it into AES/character quality or allow a legacy weighted score to
override it. Make only the integration needed for lifecycle/priority; a new Today
planner, budget algorithm and route/source verification are C4/later work.

Separate three facts: the user's declared upgrade range, stored imported values,
and explicit lifecycle state. Show observed/stored progression beside targets
only when the comparison is supported. Never infer base talent values from raw
stored talents or constellation, per-item observation time from a section merge,
or one weapon-copy's progress from a type key. Ambiguous comparison stays unknown.
Do not present unchanged fromPhase→toPhase cost totals as a freshly measured
remaining-upgrade cost after re-import. Label their declared-range basis, or
implement a separately justified read-only comparison without rewriting intent.

Preserve C2b exact field/range/fingerprint checks, all consumed costs including
Mora, mixed-goal exclusions, nullable unknown deficits and atomic stock/receipt
reads. Empty/zero-only imports do not certify zero stock. A covered material
deficit, a supported target or a raw stored value is not lifecycle completion.

6. UI, IMPORT CONTINUITY AND SESSION SAFETY
Use the existing roster/detail/Planner surfaces and TanStack Query. Provide focus
controls, create/edit bounded goals, priority, pause/resume, complete/good-enough,
archive and deliberate reopen/restore. Keep the five-slot C3a read view intact.
Preserve existing URLs. Give character goals durable links back to their detail;
make Planner goal/filter deep links usable where added without inventing a new
top-level page. Labels/forms/buttons must work with keyboard and on mobile.

Distinguish empty focus, no goals, no active goals, no imported character, missing
cost evidence, loading, retry and conflict states. Failed saves retain entered
values and the last confirmed server state; optimistic changes, if used, roll
back visibly. Do not block manual intent management on missing farming routes.

Partial/empty/replacement/failed imports preserve focus and every goal field,
status, priority, revision and closed history. Equipment UUID regeneration and
weapon swaps never retarget intent. Explicit goal/focus writes must not alter
import receipts or C2a routines. Invalidate every affected companion/genshin view
after successful writes and imports, without fabricating progress.

Verify both delayed queries AND delayed mutation callbacks across logout/login:
an old user's completion must not write into the new user's cache/form state or
replay under their credentials. Queries use the existing session client/cancel
patterns. Mutations need an explicit originating-session guard where necessary.

BOUNDARIES
No artifact targets, higher talent ranges, inferred effective talents, optimizer,
universal score, manual equip/unequip, snapshots, automatic completion, source
catalog expansion, AI work, new server rules, Today redesign, broad Intelligence
navigation transition, new game, queue/cache service or external integration.
Keep unsupported catalogs honest and preserve all C1/C2/C3a behavior. Do not
silently broaden C3b because a wider feature document lists later ambitions.

VALIDATION AND FINISH
Use only explicitly guarded loopback celestia_test_* databases. Set NODE_ENV,
CELESTIA_TEST_DATABASE_URL, DATABASE_URL, dummy JWT/OpenRouter values and
DOTENV_CONFIG_PATH=NUL explicitly so the real .env database cannot load. Never
print secrets. Existing C3a services are stopped; prepare and later stop your
own temporary fixtures. New migration execution is authorized only there.

Run actual PostgreSQL fresh-chain AND populated-C3a upgrade tests. Prove schema
defaults/constraints and preservation with old IDs/rows, no-account users,
nullable duplicates and invalid legacy ranges. Cover concurrent creates, stale
target/status/priority writes, duplicate/replayed successor requests, ownership,
transaction rollback, import interleavings and SELECT-only direct/indirect GETs.
Mocks are not evidence for these database guarantees.

Test each lifecycle transition and invalid transition, type-specific schemas,
opaque/unsupported keys, duplicate-demand policy, priority direction/stable ties,
inactive filtering in materials/Today/Planner, unknown talent/weapon comparison,
manual completion independent of stock, and preservation of C2b/C2a guarantees.
Use meaningful shared-contract/client/cache tests, including mutation failure,
delayed responses and account switching. Do not replace existing regressions
with mocks merely to keep the suite green.

Run the direct full Vitest suite from apps/api with --no-file-parallelism (shared
disposable fixture files otherwise contend under Serializable imports). This
does NOT disable explicit concurrency within tests. Never run through Turbo.
Historical C3a baseline: 535 tests / 37 files / zero skipped, with 50 actual
PostgreSQL cases (16 importer, 12 routine, 9 C2b, 13 equipment). Report fresh
counts, explain changed counts and ensure database cases actually execute.
Run API/web lint, shared/API/web types/builds, migration validation, focused
formatting, git diff --check and preservation checks. Do not claim a skipped
database suite or a cached earlier count as current full validation.

In the actual browser on desktop and mobile, exercise two synthetic owners,
focus/unfocus/filter, create/edit/prioritize, pause/resume, good-enough completion,
archive/reopen, visible stale-tab conflict, failed save and retained input,
re-import with goals/focus intact, raw talent ambiguity, unavailable advice,
empty/no-active states and logout/login during an in-flight save. Save concise
evidence; distinguish fixture observations from real game facts.

Preserve all eight hashes in C3a preservation-check.json, including API package,
env/OpenRouter changes, lockfile, original Sonnet submission and C2a migration.
Protected Turbo log SHA256:
790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED.
Retain the five documented formatter exceptions; no broad formatting, dependency
cleanup or unrelated refactor. Use D:/.pnpm-store if genuinely needed, without
silently changing protected dependency files.

Finish task.md and write walkthrough.md with exact behavior, schema/backfill and
compatibility decisions, test commands/counts, browser evidence, limitations and
cleanup. Update CURRENT_HANDOFF, API docs and relevant checkpoint banners.
Retain review findings/resolutions and a fresh preservation record. State which
C3 exit criteria are met and which broader ambitions remain deferred; do not
mark C4 or all product-spec aspirations complete. Stop temporary services and
report blockers honestly. No staging, commit, push, deployment or production
migration. Stop at this bounded phase.
```
