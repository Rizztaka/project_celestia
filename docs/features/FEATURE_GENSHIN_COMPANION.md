# Genshin Companion — target product specification

> **2026-10-17 functional coverage expansion:** The owner replaced bounded C5h with useful core functionality and selected Seelie's Today/planner/calculator/pacing patterns. All four server clocks, broad ascension/base-talent/weapon costs, weekday domain guidance and calmer Today/Planner organization are implemented locally. Full guarded recovery/verification passes **1,038 tests / 58 files / 140 actual PostgreSQL cases**, no failures/skips. [Walkthrough](../plans/production-readiness/walkthrough.md), [sources and exceptions](../plans/production-readiness/sources.md) and [actual browser observations](../plans/production-readiness/browser-observations.md) supersede the old scope statements below. Deployment and human accessibility acceptance are not implied. Earlier dated banners are historical.

> **Local C5 checkpoint — 2026-10-09:** Shared Today/Characters/Planner navigation, supporting import/settings/inventory, retained secondary routes and no-import guidance are implemented. Actual synthetic import, lifecycle, failed-save, reset and owner-switch journeys passed; 708 tests / 44 files include 106 PostgreSQL cases. [Acceptance](../plans/c5-companion-beta/acceptance.md) records the unverified real zoom/reduced-motion/assistive checks. [Readiness](../plans/c5-companion-beta/beta-readiness.md) keeps recovery, operations, deployment and human beta evidence open. C6/C7 remain gated; older banners and broader targets below are historical/planned scope.

> **Local C4 checkpoint — 2026-10-06:** Today now composes manual routines, active goals, weekly summary, editable priorities through GoalManager, opt-in visibility, reversible dismissals and a recurring daily ceiling. Full active demand uses recorded stock once; all production routes remain unavailable. The remaining broader journey and C5 navigation work stay planned. See [C4 walkthrough](../plans/c4-today-weekly-plan/walkthrough.md) and [Today contract](../api/today-plan.md). Earlier banners describe historical scope.

> **Local implementation checkpoint — 2026-10-04:** C1/C2 and the enabled Asia clock are preserved. C3a equipment reads and bounded C3b focus/priority/goal lifecycle are implemented and validated. The roadmap exit criterion is met through preserved focus/intent and a truthful stored-ascension comparison after re-import. Artifact targets, higher talents, labels/presets, snapshots and the broader journey below remain targets. Start with [CURRENT_HANDOFF](../plans/CURRENT_HANDOFF.md).

**Updated:** 2026-09-25

**Status:** Planned; product direction selected under the owner's delegated feature-planning request. No implementation in this documentation change.  
**Delivery:** C1–C5 in [Roadmap](../ROADMAP.md). C6–C7 are later options.

## Objective and users

Help regular and returning Genshin players organize a few chosen goals, understand their current equipment, and pick manageable daily actions. A player should gain value from basic tracking before importing a complete account.

## Primary journey

1. Choose the supported game server and which routine tasks matter. Keep unsupported server guidance explicitly unavailable.
2. Optionally import an account snapshot; review sections and replacement scope before saving.
3. Choose a focus character and a target, or begin with the basic daily checklist.
4. Open Today: see up to three suggested actions by default, with reasons and editable priorities.
5. Play, mark routine tasks, update a resin checkpoint, or re-import progress.
6. Resume later with goals intact and a clear distinction between new data and old observations.

Three suggestions is a display default, not a hard limit on goals or a requirement to complete three tasks.

## Navigation and page responsibilities

| Surface               | Responsibility                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| **Today**             | Short plan, resin estimate, selected routine tasks, weekly summary, and verified deadlines when available |
| **Characters**        | Search roster, filter focus characters, open a character's equipment and goal details                     |
| **Planner**           | Manage goal priorities/status, remaining materials, weekly commitments, available farming                 |
| **Inventory**         | Secondary view for full weapon/artifact records; retain existing browsing                                 |
| **Import & Settings** | Refresh data, explain sources, choose supported server, routine preferences                               |
| **Progress** (later)  | Optional saved teams, snapshots, endgame records                                                          |

Use existing routes where possible. Add URL-addressable character details and planner goals when Today needs to link directly to them. Preserve old URLs through route compatibility or redirects during migration. Do not add a new top-level page for every calculator. Existing Intelligence, Simulator, and NIKKE pages require an explicit C5 navigation/caller review before demotion; documentation does not remove their runtime routes.

## C1 — trustworthy account snapshots

### Current implementation constraints

The importer defaults omitted weapons/artifacts to empty arrays and materials to an empty object; it then replaces these inventories. It regenerates equipment UUIDs and resolves equipment locations from characters in the current payload. Account creation occurs before the inventory transaction. These behaviors must be addressed before promising lossless partial imports or equipment history.

### Required semantics

- Distinguish **section absent**, **section present and complete**, **explicitly empty replacement**, and **invalid/unknown section** before defaulting values.
- Omitted sections preserve stored records and their previous freshness. An omitted section never confirms an empty inventory.
- The initial safe supported mode is explicit full replacement of selected sections. Explain that a present partial equipment list would replace that section; do not silently market it as a merge.
- Clearing a section requires an explicit review/confirmation of the intended scope. The API must enforce declared import scope, not rely only on frontend wording.
- Preflight and commit must use the same validated payload and scope. If the stored state changed after preview, require a fresh preview or reject the stale revision.
- Validate duplicate equipment slots and duplicate weapon assignments. Resolve locations against the authenticated account's existing and incoming characters; unresolved assignments must be reported, not silently called unequipped.
- Keep ownership filtering and transactional writes. Define rollback to include newly created account metadata as well as inventory updates; do not claim a mocked transaction proves real database rollback.
- Persist import source, import time, version/supported format, and per-section coverage in a minimal metadata model. Never infer an import timestamp from an unrelated account update.
- A failed import must not advance freshness or destroy the last usable snapshot.
- Goals, focus selection, notes, task completion, and preferences survive imports.
- Invalidate roster, inventory, material deltas, equipment views, and affected suggestions after success. Clear account-scoped caches on logout/account changes.
- Explain supported importer limits and unknown content; do not silently coerce unsupported mechanics or base/effective talent values into a recommendation.

### Data honesty

“Last imported” describes when Celestia received data, not when it was observed in the game. Show source observation time only when known. Staleness labels should be defined per data class: resin checkpoints age differently from equipment snapshots.

Do not add a full equipment identity-matching engine in C1. Retain stable character keys plus account ownership for user intent. Do not attach durable notes or goals to replaceable artifact UUIDs.

## C2 — reliable time and maintained game data

### Clock and task policy

- Centralize the supported server's day/week calculation, with UTC persistence and an injected clock for tests.
- Distinguish game-server reset from the viewer's timezone. Initially support the existing Asia policy after verification; expose its limitation instead of guessing a different server.
- Give each task a verified cadence: daily, weekly, cooldown, or manual. Do not place every activity on a daily reset by default.
- Represent period completion explicitly. Read requests project effective current-period state without initializing or resetting database rows.
- Explicit writes create/update current-period records atomically. Stale submissions include a period/revision so crossing reset cannot mark the wrong period.
- Return sufficient period/next-boundary information for countdowns and cache refresh without polling every second.
- Test first use, exact boundaries, writes without a preceding GET, backward/forward client clocks, simultaneous clients, and retries.
- No scheduler is required for projections. Notifications remain deferred.

This is a planned replacement of the legacy read-time reset behavior, not a claim that the current services already comply.

### Resin and weekly tracking

- Clearly label resin as an **estimate from your last update**. Do not imply a live game connection.
- No checkpoint means unknown, not a measured zero.
- Let the player correct the checkpoint quickly. Clamp projections to verified limits and handle invalid/future times.
- Planning a domain run does not consume resin or add materials.
- Marking a weekly boss as defeated must not be treated as proof of claiming rewards. Define reward-claim tracking separately before using it to count discounts. Existing defeat flags need an explicit migration/clarification, not silent reinterpretation.
- Never fabricate per-boss historical resin costs from display order.
- A user may skip all weekly bosses; unused discounts are not an obligation.

### Data catalog and upkeep

For each supported dataset, record maintainer, source URL/reference, verification date, supported version/server, and state: verified, stale, placeholder, or unsupported. Time-limited entries also require start/end validity.

The current events and weekly-boss files are explicitly labeled placeholders; other material/profile files contain old or placeholder content. Before displaying live advice, validate supported entries against independent sources. Do not infer currency from a comment saying “exact.”

- Placeholder/expired entries may appear in an isolated demo, never as live rewards or deadlines.
- Unknown requirements produce “calculation unavailable,” not zero remaining.
- Keep curated JSON and validate its shape and cross-references. A complete scraping platform is out of scope.
- A maintainer reviews affected data during Wednesday/Sunday sessions and records what changed. If upkeep cannot be sustained, disable time-sensitive guidance while retaining user records.
- Current patch facts are not asserted by this specification; research is a C2b implementation prerequisite.

## C3 — My Focus and Equipment & Build Progress

**Implemented boundary:** natural-key focus, priority 1–5, explicit active/paused/completed/archived goals and retained successor history; ascension 0–6 and declared base talents 1–6. Only stored character ascension is compared with a target. Raw talents and weapon-copy progress remain unknown. The wider examples below do not expand that validated boundary. See [C3b acceptance](../plans/c3b-focus-goals/walkthrough.md).

### Character view

Show level, ascension, talent values with known semantics, equipped weapon, and the five artifact slots. Each known artifact shows set, rarity, level, main-stat key/value where supported, and substats. Display set-piece counts as observed equipment facts; do not infer damage or set-effect activation without supported rules.

Use distinct states:

- Known equipped piece.
- Confirmed empty slot.
- Equipment not included or assignment unresolved.
- Older snapshot awaiting refresh.

Unknown main-stat values remain unavailable rather than being estimated from unverified tables.

### User intent

Allow a player to select focus characters, order priorities, set an optional role/build label, and create targets. First targets reuse character ascension, individual talent, and weapon ascension planning where supported. Artifact targets begin as explicit user choices (for example, a desired main stat or selected set), without automatic inventory search.

Goal lifecycle: active, paused, completed, archived. A player can mark a goal “good enough.” Raising a target reopens or creates a new goal deliberately. A newer observation may show that a target is met, but must not erase its history or overwrite user intent.

Validate talent levels separately from ascension phases. Existing shared phase ranges are not a sufficient specification for every goal type.

### Facts and suggestions

Show “Observed 6; your target 8; last imported …” instead of an account-wide quality score. Optional role presets must be sourced, versioned, editable, and identified as suggestions. No universal optimal energy-recharge target, meta tier, artifact efficiency, or “best build” assertion.

The old AES and character scores are not inputs to the primary Today ranking. Migrate consumers explicitly and keep legacy API contracts until callers are transitioned. A UI rename alone does not satisfy this change.

### Deferred equipment editing and history

C3 makes equipped records visible; manual equip/unequip management is a later opt-in extension if imports are insufficient. It requires same-account checks, one piece per slot, atomic moves, import conflict policy, and truthful “recorded in Celestia” wording.

C6 snapshots store copied values and observation metadata, not live references to replaceable equipment rows. They describe “equipped in this snapshot,” never the artifact's acquisition age. Default later retention proposal: user-triggered snapshots for focus characters, capped at 20 per account, with export/delete controls and an explicit retention review before implementation. No automatic full inventory history.

## C4 — goals into a manageable plan

- Build candidates only from active goals and user-enabled routines. Do not rank unused roster characters.
- Use a clear deterministic order: user priority, verified availability/deadline, then a stable goal identifier as a tie-breaker. Deadlines may be highlighted separately without silently overriding a pinned goal.
- Let the user set a resin budget. The plan must not exceed it or assume fragile resin, paid resources, unclaimed rewards, or unrecorded stock.
- Aggregate shared material demand once; subtract known inventory once. Unknown stock is unknown, not zero. Show per-goal attribution without double allocation.
- Use exact known material requirements where verified. Random drops cannot support an exact completion date; show assumptions/ranges or omit the estimate.
- Give separate actions for “recorded my session,” “update inventory,” and “goal completed.” Avoid automatically granting drops or subtracting inventory from a checkbox.
- Pause/dismiss must be reversible. Repeated refreshes should not shuffle suggestions.
- With no goals, show routine tracking and an invitation to choose a character. With no current game data, keep manual goals usable and explain unavailable calculations.

## C5 — beta experience and maintenance

Keep mobile interactions short, keyboard accessible, and usable without hover. Use semantic checkboxes/buttons, visible labels, adequate contrast, and reduced-motion preferences. Do not pulse warnings indefinitely or use streak loss to drive returns.

Beta acceptance scenarios:

1. A new user uses daily tracking without an import.
2. A returning user imports, selects one focus character, and sees equipped artifacts.
3. A second import preserves goals and does not clear omitted inventory.
4. A goal with unknown materials never appears complete.
5. A reset during a save cannot mark the wrong day/week.
6. A paused goal disappears from suggested work and demand; removing character focus alone does not pause goals.
7. A failed save retains input and labeled last-confirmed state, with deliberate recovery.
8. Logout/login cannot reveal another user's cached equipment or goals.
9. Placeholder events produce no live reward total.
10. A user with no remaining tasks sees a calm completion state.

Gather small-group feedback before adding C6/C7. Document actual task timing and confusion points. Review backup/recovery, account-data controls, and supported data upkeep before widening access.

## Later options and explicit exclusions

**Saved teams:** user-selected members and labels, linked character goals, optional equipment observations. No combinatorial team solver or live damage claims.

**Endgame journal:** cycle-labeled results and notes with verified scoring semantics. Existing half-chamber stars require review before aggregating a total; do not add modes from stale assumptions.

**Wish savings:** chosen character, manually recorded saved currency, optional verified pity/guarantee assumptions, and a user-set budget. No banner-value ranking, urgency to spend, or MUST_PULL label. Simulated pulls remain outside the core loop.

**External tools:** start with ordinary user-opened links. The maintained [Genshin Optimizer repository](https://github.com/frzyc/genshin-optimizer) describes its artifact optimization focus and GOOD interfaces; that supports a complementary product boundary. No optimization service integration is assumed. Any later UID/showcase integration must verify coverage, consent, caching, failure handling, and rate limits from [Enka's API documentation](https://github.com/EnkaNetwork/API-docs) before committing to it. No automatic full-account sync is promised.

## Engineering constraints and release evidence

Reuse the existing modular monolith and shared contracts. Platform owns authentication and generic orchestration; new Genshin rules belong in the Genshin domain or provider. Existing platform companion code is a migration constraint, not permission to add more game-specific rules there.

All calculations remain deterministic from explicit inputs; explanations describe their outputs. Inject time at the orchestration boundary. Keep user/account ownership enforced for reads and writes.

Before each implementation session, prepare its exact contract/schema/UI/test plan. A data migration needs a preservation/backfill strategy and compatibility review. This document chooses product behavior, not final migration DDL.

No code, schema, deployment, or external connection is changed by this specification.
