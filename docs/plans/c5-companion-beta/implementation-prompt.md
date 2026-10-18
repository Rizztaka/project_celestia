# C5 execution prompt — Companion journey and beta readiness

Prepared 2026-10-07 after the [C4 review](../c4-today-weekly-plan/implementation_review.md). **Prepared for owner execution; C5 has not started.** This prompt authorizes bounded local implementation only when the owner gives it to the implementing model.

Recommended model: **GPT-6 Astra**, reasoning effort **Extra high (`xhigh`)**. This is a quality-first judgment for a cross-page change with strict preservation, asynchronous state, accessibility and evidence requirements. OpenAI describes Astra as its most capable model for demanding work, and lists Extra high for complex, exacting deliverables. See [model selection](https://developers.openai.com/api/docs/guides/model-selection) and [Astra's model page](https://developers.openai.com/api/docs/models/gpt-6-astra), checked 2026-10-07. This recommendation does not change the owner's configured model or standing implementation schedule; the owner's explicit choice governs.

Copy the entire prompt below into the implementation conversation.

```text
Implement Project Celestia C5: a coherent companion journey and a documented local beta-readiness assessment. Finish this bounded milestone, validate it, and stop. Do not begin C6/C7 or release the application.

OUTCOME

A new player can find and use manual routines without importing. A returning player can move naturally between Today, Characters, character equipment, Planner, import and settings; refresh observations without losing declared intent; and understand confirmed, unknown, stale and unavailable states. Primary navigation and interaction patterns are consistent on mobile and desktop. Existing account isolation, reset safety, goals and import contracts remain intact.

The output has two separate conclusions: (1) whether local implementation and acceptance pass; (2) which prerequisites remain before inviting beta users or deploying. Passing local tests cannot establish real-user usability, production recovery readiness or deployed state.

WORKSPACE AND AUTHORIZATION

- Use D:\Genshin Personal\project-celestia for every repository operation. The C:\Users\inuzu\.codex\worktrees\4340\project-celestia checkout is not the working source. Verify the D: path first; if unavailable, stop and report rather than editing another copy.
- This is an intentionally dirty, uncommitted master checkout with inherited C1–C4 work. Expected HEAD at handoff is 2d8820a48db83d7c62feebd849f2f1c2d3488bb6. Inspect actual state and preserve it. A changed HEAD is a reason to reconcile context, never to reset it.
- Local code, meaningful tests, documentation, and isolated synthetic acceptance fixtures are authorized. Do not stage, commit, push, change branches/worktrees, reset, clean, stash, deploy, run ordinary/production migrations, or contact other people.
- No dependency or lockfile changes, new infrastructure or paid services. Use installed tooling and the existing pnpm store. Run checks directly, never through Turbo. Do not expose .env contents or secrets.
- Preserve the eight protected files and twelve historical migration hashes in docs/plans/c4-today-weekly-plan/preservation-check.json. Preserve C4's additive migration too. In particular, apps/api/.turbo/turbo-test.log must remain byte-for-byte unchanged.
- Preserve all five recorded formatter exceptions; do not format unrelated files. For C5 styles, prefer scoped components or a new focused stylesheet over rewriting baseline App.css/index.css/index.html. Do not use a whole-tree formatter.
- Do not spawn agents or create/message other chats unless the owner explicitly requests it. Follow applicable repository/skill instructions; the owner's explicit instructions take precedence over the usual model/day roles.

READ AND RECONCILE BEFORE CODING

1. .agents/AGENTS.md, applicable nested instructions, docs/plans/CURRENT_HANDOFF.md, and the repository architecture document.
2. docs/plans/c4-today-weekly-plan/implementation_review.md, walkthrough.md, implementation_plan.md, validation-results.json and preservation-check.json. Read the C3b/C3a review and walkthrough sections referenced there for goal/equipment/import guarantees.
3. docs/features/FEATURE_GENSHIN_COMPANION.md, docs/ROADMAP.md, docs/plans/genshin-companion/implementation_plan.md and docs/adr/0012-genshin-companion-direction.md. Older ambitious examples do not expand the implemented boundary.
4. docs/api/today-plan.md, companion-routine.md, focus-goals.md, character-equipment.md and catalog-advice.md; import/provenance documentation and source as needed.
5. Inspect the actual working diff and routes/callers: App.tsx; DashboardPage, RosterPage, CharacterDetailPage, PlannerPage, ImportPage, ProfilePage, InventoryPage; secondary Intelligence, Simulators, Endgame and NIKKE pages; repeated navigation; TodayPlan, RoutinePanel, GoalManager, import controls; account-cache/account-session/auth and plan-state. Read actual client regression tests, not just test names.

Before modifying application code, persist docs/plans/c5-companion-beta/implementation_plan.md and task.md. Include a current route/caller matrix, primary/secondary navigation decisions, state/interaction map, proposed files, preservation baseline, and acceptance matrix. Make routine implementation decisions yourself and continue; ask only for information necessary to resolve a material ambiguity. Do not stop after planning.

CURRENT TRUST BOUNDARY — PRESERVE IT

- C4 currently passes 691 tests / 43 files, including 106 real PostgreSQL cases with none skipped, as reviewed 2026-10-07. Re-establish the baseline before editing; investigate failures rather than rewriting evidence or skipping tests.
- The enabled server is explicitly selected Asia. Daily reset is 04:00 UTC+8, weekly reset Monday 04:00 UTC+8. Other servers remain unavailable. Use the existing server clock/provider and period identifiers; no browser-local reset calculation or new game-rule assumptions.
- Only HuTao's base normal/skill/burst talent ranges 1–6 have verified costs. All production farming routes remain unavailable. Synthetic allocation tests do not verify game data. Do not enable additional costs, events, bosses, routes, discounts, cooldowns or current-patch claims.
- Unknown stock is not zero; unknown equipment assignment is not a confirmed empty slot; a receipt is not a live game observation. Section provenance and corrected UTC timestamps remain accurate on partial imports.
- Imports update observations while preserving focus, goal identity/declared ranges/priority/lifecycle/history, plan preferences and applicable dismissals; omitted sections are not silently cleared. Keep preview/replacement-scope controls and invalid-import behavior.
- Focus membership does not pause a character. Active/paused/completed/archived states belong to goals. Paused goals are excluded from suggested work and demand; focus changes do not silently change goal states. Observing a target met does not complete it. Reopening retains history through the existing successor contract.
- Routine V2, goal writes V3, focus V1 and plan V1 remain compatible. Preserve ownership, owner locks, expected revisions, post-lock period checks and atomic write responses; GETs remain SELECT-only. C5 should not require a schema migration or contract revision.
- Preserve account-scoped cache/session guards, cancellation, monotonic response merging and cross-feature invalidation. An old account's delayed result must not update another account's data, drafts or success messages. No offline mutation replay or blind retry. Failed/conflicting saves retain input and labeled last-confirmed data; refresh is deliberate and does not silently discard drafts.
- Today keeps a default shortlist of three, expansion and exact deep links; deterministic user priority/creation/ID ordering; nullable daily ceiling (zero is distinct from unset); explicit routine opt-ins; reversible day/week dismissal. Dismissal hides work but does not remove its active demand. Aggregate full eligible demand once and subtract known stock once. Recording a session, importing and completing a goal stay distinct actions.

IMPLEMENTATION SCOPE

A. Consistent navigation and page structure

Audit routes and callers before changing navigation. Establish a restrained shared navigation pattern for Today (/), Characters (/roster and /roster/:characterKey) and Planner (/planner). Make import, settings/profile and Inventory easy to find as supporting destinations. Reuse existing controls/routes; “Import & Settings” is a responsibility grouping, not a requirement for a new page or settings database.

Keep explicit secondary access to Intelligence, Simulators, Endgame and NIKKE after the caller audit. Preserve their data and runtime routes; do not delete code because it is deferred. Preserve planner tab/query parameters, goal links, character keys, import links, browser back/forward and direct reloads. Use active-location cues and consistent heading/landmark structure without introducing duplicate headers or nested main regions. Avoid a broad router/state rewrite just to share navigation.

B. First-use and returning-user experience

Make supported-server selection, optional routine choices, no-import tracking, optional import and focus/goal entry discoverable with concise inline guidance. Do not add a mandatory tour, import gate, artificial completion score or persisted onboarding state. Existing forms remain the source of truth. Explain missing prerequisites near the affected action and keep independent manual workflows usable when advice fails.

Show intentional loading, empty, no-results, missing/not-found, unavailable, failed-refresh and retained-data states across touched primary surfaces. Distinguish unknown from zero and stale from current. Preserve retry/refresh and typed drafts. A player with no enabled or remaining work should see a calm state, with a clear voluntary next action and no fabricated task obligation.

Audit legacy score/meta language in primary flows. Transition actual callers if required; do not relabel a computed score as factual progress. Retain compatible legacy APIs and qualify secondary legacy surfaces without rebuilding their algorithms. Do not claim all roster progress or cost coverage is verified.

C. Mobile, keyboard and visual quality

Use the existing visual language with consistent spacing, readable hierarchy and concise labels. No unrelated redesign or new component framework. Ensure forms, menus and dialogs work at narrow widths and with long content. No horizontal page overflow, hidden primary actions or hover-only information. Keep comfortable touch targets, visible keyboard focus, semantic buttons/links/checkboxes, associated labels, useful status announcements and sensible heading order. Respect reduced motion; remove indefinite attention-seeking animation in touched flows. Check contrast, keyboard traversal, menu dismissal/focus return, and browser zoom/reflow. Verify actual rendered screens, not only source classes.

D. Bounded beta-readiness assessment

Create a readiness table grounded in repository evidence: backup/restore procedure and verification status; abuse controls; account-data/export/deletion controls as actually implemented; supported-data ownership/upkeep; migration/API/frontend cutover; current release/deployment evidence. Record known, unverified and missing items, each with consequence and next action. Do not mark readiness from documentation alone.

This is a read-only assessment of operational controls, not authorization for auth rewrites, new data export/deletion projects, infrastructure changes, deployment access or normal database operations. Fix small issues directly necessary to the companion journey; document larger operational gaps as separate prerequisites. The Render deployed SHA is currently unverified; do not redeploy to discover it.

Prepare a short voluntary usability script and blank evidence template for small-group testing: actual task time, observed confusion, outcome and feedback. Do not contact users, fabricate participants/results or treat scripted browser timings as human usability evidence. C6/C7 remain gated on real beta feedback. An optional demo is unnecessary by default; never introduce a shared writable guest account.

VALIDATION — REQUIRED EVIDENCE, NOT CHECKBOX CLAIMS

Use the existing direct test tooling and meaningful regressions for changed navigation/state behavior. Do not replace integration coverage with component snapshots or tests that only mirror implementation. Do not add tests solely for reversible copy/style changes.

Run the complete direct suite against an explicitly guarded, owned disposable PostgreSQL database. Both DATABASE_URL and CELESTIA_TEST_DATABASE_URL must match a loopback URL with explicit port and database name celestia_test_*. Set NODE_ENV=test, DOTENV_CONFIG_PATH=NUL (Windows), and dummy application secrets. Validate using the existing disposable-test-database guard before importing the app, opening a connection or invoking migration tools. If no safe fixture is available, establish one locally using installed tooling or report the exact block; never fall back to normal .env or call skipped database tests a pass. The existing C4 fixture may be reused only after verifying ownership/path/port; fixture-path.txt is evidence to inspect, not permission to kill arbitrary processes.

From apps/api: node node_modules/vitest/vitest.mjs run --no-file-parallelism; pnpm lint; pnpm build. From packages/api-contracts: pnpm exec tsc --noEmit. From apps/web: pnpm lint; pnpm build. Validate Prisma and compare schema only against the guarded fixture when applicable. Use focused Prettier and git diff --check. Preserve protected hashes, historical migrations, HEAD/index and unrelated changes. Do not use Turbo or broad formatting. Record exact commands, counts, skips, warnings and limitations; the inherited pg overlapping-query deprecation is not a reason to upgrade dependencies or suppress warnings.

Run fresh browser acceptance through the actual changed application on an owned local fixture. Use synthetic owners, production-default rule availability, and controlled failure/time injection only where needed. Test at approximately 1440x1000 desktop and 390x844 mobile, plus narrow reflow/zoom and keyboard-only operation. Capture representative before/after evidence and failures where useful. Earlier C4 captures are historical, not proof for changed C5 pages.

Acceptance matrix must cover:
1. New account: select supported server, enable and record a routine without importing; explicitly unavailable unsupported-server guidance.
2. Returning account: import preview and save, focus one character, inspect equipment, create/manage a goal, return to Today, follow its exact character/goal links.
3. Partial re-import: updated observation/receipt, omitted equipment retained, focus and declared goal intent/history/plan choices preserved.
4. Unknown stock/materials/equipment and unavailable routes remain honest; no unknown goal becomes complete and no placeholder event creates live reward totals.
5. Saves spanning daily and weekly reset fail safely or apply to the correct period; retain exact server-boundary integration evidence and exercise the affected UI path.
6. Pause/resume a goal and verify suggestions/demand change; focus removal alone does not pause goals; dismiss/restore remains reversible and retains full active demand.
7. Failed save, stale conflict and failed advice refresh: input and last-confirmed state retained, no misleading success/current data, manual recording usable, recovery deliberate.
8. Delayed read/write across logout/login with two owners: no prior-owner data, draft or success message leaks; inspect actual originating-session behavior.
9. Quiet account, zero versus unset ceiling and zero versus unknown weekly records; no compulsory tasks or urgency language.
10. Navigation across primary/supporting/secondary routes, direct reload, back/forward and encoded goal/character URLs; keyboard, focus, reduced motion, touch and no overflow.

You may reuse unchanged backend boundary tests as evidence with their current run results, but label browser checks, controlled-time tests and real human feedback accurately. Restore browser viewport and ordinary web build after temporary fixture overrides. Stop only owned temporary services and verify their ports close. Do not leave synthetic configuration in production defaults.

DELIVERABLES AND STOP POINT

Persist under docs/plans/c5-companion-beta/: implementation_plan.md, task.md, route/caller audit, acceptance evidence, beta-readiness assessment, usability script/template, preservation record and walkthrough.md. Consolidate related evidence to avoid duplicate stale documents. Update CURRENT_HANDOFF and relevant roadmap/spec checkpoint banners with exactly what is done and what remains; do not rewrite historical results or mark all of C5/beta release complete while human or operational gates remain.

Final response: concrete user-visible changes, validation results, unresolved findings and release/beta prerequisites, with links to the walkthrough and readiness assessment. Report any blocker candidly with its evidence. Leave the tree uncommitted. Do not deploy, invite testers, expand game-data coverage or begin C6/C7.
```
