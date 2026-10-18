# Genshin companion implementation handoff

**Current C5 checkpoint (2026-10-09):** Bounded [journey implementation](../c5-companion-beta/walkthrough.md) and [readiness assessment](../c5-companion-beta/beta-readiness.md) are complete for local review: 708/44/106 with no failures/skips and functional synthetic acceptance. Actual browser zoom/OS reduced-motion/accessibility checks, operational prerequisites and real beta feedback remain open. No release, C6/C7 or wider data coverage was performed. The older checkpoints below remain historical.

**Current checkpoint (2026-10-06):** Bounded [C4 Today/weekly](../c4-today-weekly-plan/walkthrough.md) is complete locally. C1–C3 are preserved; 691 tests / 43 files include 106 real PostgreSQL cases. Manual routines, stable active goals and reversible choices work without import. Production farming routes remain unavailable. C5, broader source coverage and release require separate work. Status descriptions below are historical planning context.

**Date:** 2026-09-25

**Status (2026-10-04):** 3A and C1/C2 are preserved. [C3a equipment reads](../c3a-character-equipment/walkthrough.md) and [bounded C3b focus/priority/goal lifecycle](../c3b-focus-goals/walkthrough.md) are implemented and validated locally. The roadmap's re-import/known-progress exit criterion is met. Broader C3 aspirations and later phases remain planned. Read [current handoff](../CURRENT_HANDOFF.md) for evidence and release limitations.
**Baseline:** reviewed commit `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`.

## Read first

1. [Vision](../../PROJECT_VISION.md)
2. [Roadmap](../../ROADMAP.md)
3. [Target companion behavior](../../features/FEATURE_GENSHIN_COMPANION.md)
4. [ADR 0012](../../adr/0012-genshin-companion-direction.md)
5. [Document review](document_review.md)
6. [Existing backend lint handoff](../3a-backend-lint/implementation_plan.md)

The owner now authorizes local implementation: Codex on other days, Antigravity Sonnet 4.6 on Wednesday/Sunday with Codex planning/review. New Wednesday/Sunday conversations begin from [the current handoff](../CURRENT_HANDOFF.md). No push, deployment, or production database migration is authorized.

## 3A checkpoint — completed locally

The lint milestone is complete; see its walkthrough and the current handoff. Keep its review separate from later import, reset, artifact UI, and goal changes. Preserve `apps/api/.turbo/turbo-test.log`, whose starting SHA256 is `790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED`.

The Render deployed SHA remains open evidence due to unavailable authenticated access. Record it from the existing live deployment when access exists; no redeployment to obtain evidence.

## C1a — next bounded product correctness change

**Problem:** `GoodPayloadSchema` defaults absent equipment/material sections to empty collections, while `GenshinImportService` replaces those inventories. An equipment-only payload may also fail to preserve known character assignments because its location map is built from incoming characters.

**Touch points:** importer schema/service/tests; shared import contract if added; ImportPage/API client; account creation/transaction boundary. Keep unrelated intelligence/scoring untouched.

**Implementation outline:**

1. Define a versioned import request with explicit selected replacement sections, distinguishing absent data before applying defaults.
2. Validate/preview the same payload that commit will use. Present counts and affected sections; require explicit confirmation for clearing a section. Reject mismatched/stale preview scope rather than applying a changed payload.
3. Preserve absent sections and related weapon FKs. Replace only declared sections. Keep characters not present in the payload.
4. Resolve equipment locations against owned existing and incoming characters; detect collisions and report unresolved references. Never resolve across accounts.
5. Make first-account initialization and inventory writes atomic where the supported database flow allows it. Document any deliberately separate metadata writes instead of claiming universal rollback.
6. Preserve atomicity on invalid assignments, duplicate slots, failures, retries, and simultaneous imports. Define concurrency/revision behavior before implementing the preview.
7. Document current GOOD version/talent/key limitations; do not broaden game-mechanics support silently.

**Verification:** service/HTTP tests for omitted, explicit empty, full replacement, existing-character locations, duplicates, and ownership; transaction integration test on a disposable database for actual rollback; failed/stale preview integration; manual preview/error/retry flow. Do not use production data or production migrations.

**Stop boundary:** no fuzzy artifact identity, full history, UID auto-sync, manual inventory editor, or new optimizer.

## C1b — metadata and continuity

Add minimal import/source/section completeness metadata with an explicit migration/backfill plan. Existing records with no provenance are “unknown,” not assigned a fabricated import time. Goal identity remains stable across equipment replacement. Success invalidates all derived views; failed imports preserve last-known data. Define import scope separately from observations made at the game source.

**Verification:** metadata only advances on success; partial imports preserve previous timestamps on untouched sections; caches refresh across roster/equipment/material/planner views; logout clears account data.

## C2a — clock and task reliability

Prepare a focused ADR-backed migration from current daily/weekly booleans and write-on-GET resets. Reuse current route contracts through a compatibility layer where needed; do not silently map defeat flags to reward claims.

Use injected time, a verified supported-server configuration, explicit task cadence, and period/revision-aware atomic writes. GET projects effective current state without database writes. No automatic reset worker.

**Verification:** before/at/after reset; no prior GET; new user; concurrent saves; stale browser; weekly reward-claim semantics; unsupported server; unknown resin checkpoint. Keep Genshin constants in the game provider/domain as touched, without a whole-platform move.

## C2b — data trust, not a database expansion

Inventory material costs, key mappings, task cadences, domain availability, events, weekly drops, character/profile assumptions, and endgame limits. Verify only the supported initial slice and record sources/version/owner. Typed catalog validation checks joins across those keys. Keep unsupported content browseable where safe but exclude it from advice.

Current `events.json` and `weekly-bosses.json` are marked placeholders. Do not fix this by removing their labels. Ship unavailable states until entries are verified. No “current patch” claims from old sample dates.

**Verification:** independent known examples, invalid catalog shape, missing relationships, placeholder/expired content, unknown versus zero material inventory. The plan can launch with verified core goals and no active-event module.

## C3 — focus and equipment

C3a now delivers a coherent owned character detail slice using existing character/weapon/artifact relations, with five explicit recorded/unrecorded/unknown slot states and section provenance. Its API uses a complete read, preserving top-five artifact intelligence compatibility elsewhere. See the C3a walkthrough for acceptance evidence and limits.

C3b adds focus selection and lifecycle to existing user-owned goals: active, paused, completed, archived, bounded numeric targets and user priority. Focus uses account/character natural keys; weapon intent uses type keys. Reopening retains the closed record and creates a successor. Supported material planning uses active, unambiguous goals; imports preserve every intent field. The additive migration leaves original goal ownership and identity intact.

Remove AES quality claims from migrated UI consumers; retain compatibility until all callers are identified. This includes cached contracts and existing Intelligence page panels. Do not simply relabel the score as “progress.”

**Verification:** missing/unobserved slot distinction, ownership, re-import preservation, paused goals, changing targets, unknown characters, talent ranges, and a usable mobile character page.

## C4 — Today and weekly plan

Compose existing routine and goal flows into the home page. Reuse services through public interfaces. Start with a small deterministic ordered list, editable priorities, no spending assumptions, and truthful unknown-data states.

Avoid fetching every intelligence engine just to render Today. A supporting panel failure must not take down basic routine tracking. Reuse existing React/TanStack Query conventions and add URL state where users need links to exact goals.

**Verification:** priority ordering, stable ties, empty/paused goals, shared materials counted once, known versus unknown stock, budget limits, retry/rollback, stale events excluded, and no simulated drops credited.

## C5 — beta and product transition

Test the complete first-use and returning-user journey. Reduce primary navigation while keeping legacy access/redirects explicit. Freeze additional simulator and NIKKE scope; audit callers and data before any eventual removal. No code deletion solely because a feature was deferred.

Retain endgame records, but qualify unverified scoring/rotation assumptions. Review abuse controls, backup/recovery readiness, and user-data controls before broadening beta; these are separate checks, not a rerun of completed account-security implementation.

Use voluntary usability feedback to assess whether the plan reduces effort. Optional isolated demo data can help explain the product; do not create a shared writable guest identity.

## Later work gate

C6 snapshots/saved teams and C7 events/wish savings require beta evidence. No active plan for push notifications, AI chat, maps, multi-account, or additional games.

Snapshot design must copy values, bound retention, and offer deletion/export. No inference of artifact age from IDs. Wish planning uses player targets and verified assumptions, never MUST_PULL verdicts.

## Review discipline

Each implementation milestone receives a focused checklist and post-implementation walkthrough with exact tests and limitations. Do not mark a feature done because files exist or an old spec has checked boxes. Preserve stable API contracts until a migration is reviewed. Keep unrelated changes out of the patch.
