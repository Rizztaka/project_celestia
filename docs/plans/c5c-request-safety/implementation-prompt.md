# C5c execution prompt — Bounded API request and abuse controls

Prepared 2026-10-11 following the [C5b review](../c5b-recovery-foundation/implementation_review.md).
**Proposed for owner execution; implementation has not started.** This is a bounded
C5 operational foundation milestone. It does not authorize release or C6/C7.

Recommended: **GPT-6 Astra, Extra high (`xhigh`)**, local implementation mode,
one agent, in `D:\Genshin Personal\project-celestia`. The screenshot already shows
that model/effort. Turn **New worktree off** to retain this verified checkout,
installed dependencies and owned fixture context. Keep **This computer**. A fresh
chat in that same directory is suitable; do not create it automatically.
No custom environment setup script is needed for the installed local workflow.
No model, permission or app setting has been changed by this recommendation.

This is a task-specific quality-first choice, consistent with
[OpenAI's model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection)
checked 2026-10-11. Extra high is a recommendation, not a claim that maximum effort
always improves results. Current [worktree documentation](https://learn.chatgpt.com/docs/environments/git-worktrees)
allows selected-branch uncommitted changes to be applied to a managed worktree;
the local recommendation avoids a transfer and environment reconstruction rather
than asserting that all worktrees necessarily omit uncommitted changes.

Copy the entire prompt below into the implementation chat.

```text
Implement Project Celestia C5c: bounded API request and abuse controls for the existing companion. Preserve the working C1–C5b product and recovery tooling, implement and exercise the local controls below, document the exact deployment limits, then stop. Do not start C6/C7 or release/invite users.

OUTCOME

The API rejects excessive request bodies and repeated expensive auth/import requests predictably, before the expensive work or any database mutation. Legitimate login, registration, GOOD preview/commit and companion workflows keep working. Rejections use the existing JSON error envelope and appropriate 400/413/415/429 statuses, with retry guidance for throttling. Client-supplied identity/proxy headers cannot trivially bypass controls. Counter storage and concurrent work are bounded. Tests prove the real middleware ordering and preservation of data, not just a standalone counter function.

This is a local single-process application safeguard. It is not distributed rate limiting, provider/WAF configuration, a DDoS defense, production abuse certification, account recovery/export/deletion, or beta approval.

WORKSPACE AND AUTHORIZATION

- Use only the existing D:\Genshin Personal\project-celestia checkout for repository work. Inspect its intentionally dirty master state. Expected HEAD is 2d8820a48db83d7c62feebd849f2f1c2d3488bb6 and index is empty. Reconcile any mismatch; never discard inherited work.
- When the owner supplies this prompt for execution, it authorizes local code, tests, documentation, synthetic browser acceptance and owned disposable fixtures. It overrides the usual model/day role split for this bounded implementation. Do not stop after planning when local execution is possible.
- Do not stage, commit, push, change branch/worktree, reset, clean, stash, deploy, dispatch remote CI, contact participants or connect/migrate ordinary or production databases. Do not inspect normal .env contents or expose credentials, URLs, JWTs or password hashes.
- One agent; no new chats or delegated agents. Use installed dependencies and PostgreSQL tools. No dependency or lockfile changes, Redis, queues, CAPTCHA provider, paid infrastructure, account lockout scheme, email flow or analytics platform.
- Never invoke Turbo. Preserve the eight protected files, thirteen migrations and five exact formatter exceptions from docs/plans/c5a-beta-foundation/preservation-check.json, and seven immutable raw evidence files in apps/api/tooling/raw-evidence.json. In particular env.ts, apps/api/package.json, .env.example, OpenRouter code, lockfile, original Sonnet submission and .turbo/turbo-test.log remain byte-identical.
- Preserve schema/migrations, disposable database guard, domain contract versions, auth token/ownership semantics, exact-origin allowlist behavior and all historical C5a/C5b execution evidence. New middleware may change app composition and intended rejection behavior; it must not relax those contracts. Narrowly exposing Retry-After to allowed browser origins is permissible if needed, with tests. Do not rewrite old hashes to hide changes.

READ AND PLAN FIRST

Read .agents/AGENTS.md and applicable nested instructions, architecture rules, CURRENT_HANDOFF.md, ROADMAP.md, companion scope, C5b implementation_review.md/runbook.md/beta-readiness.md/review-validation.json and C5a verification/origin-policy documentation. Inspect installed Express/body-parser behavior, app.ts middleware/error ordering, auth and importer routes/controllers/services, requireAuth, CORS, API error envelopes, frontend login/import handling, integration tests and the recovery probe.

Observed starting gaps to verify: app.ts applies express.json({ limit: '50mb' }) globally before routing/authentication; malformed/oversized parser errors fall through the generic 500 branch. Auth register/login and GOOD import/preview have no application request throttling. The import arrays are not currently constrained by an overall item-count policy. CORS is not authentication or abuse control. Do not assume any provider protection or reverse-proxy topology has been observed.

Before code, persist docs/plans/c5c-request-safety/implementation_plan.md and task.md, a starting hash/status manifest, intended file scope and an endpoint/policy matrix. Record middleware order, body and item ceilings, rate windows/bursts, concurrency limits, identity rules, memory bound/eviction behavior and error mapping. Choose and explain reasonable local defaults from existing payloads and measured synthetic examples; do not invent game inventory maxima or present your values as production policy approved by an operator. Routine engineering choices do not need another permission round.

IMPLEMENTATION

1. Keep policy and generic middleware small and in the existing core security/configuration structure. Route-specific wiring belongs with each domain. Controllers remain validation/delegation/response code. Preserve the exported application contract; a narrow application/policy factory or injected clock/store is appropriate for reliable tests. Avoid unrelated architecture or frontend refactoring.

2. Replace the universal 50 MB parser with deliberate route-appropriate JSON parsing. Small ordinary/auth bodies have a small ceiling. GOOD preview and commit may use a larger measured ceiling only on their intended routes, with authentication and cheap admission control before reading their large body. Ensure there is no earlier parser that consumes the body first, no path-prefix/query/trailing-slash bypass into the larger allowance, and no accidental rejection of retained NIKKE/endgame routes. Both content-length and streamed/chunked requests must be bounded. Either reject compressed request bodies deliberately with 415 or prove a bounded inflation policy; document the choice. Preserve allowed CORS preflight and the health endpoint.

3. Handle known body-parser failures explicitly and safely: malformed JSON 400, too large 413, unsupported encoding/media behavior 415 where applicable. Use the established { success: false, error: { code, message } } envelope. Do not return raw parser diagnostics/body contents or log errors containing submitted passwords/import rows. Unknown server errors still follow existing internal-error handling. Do not classify arbitrary errors by an attacker-controlled body field.

4. Add separate bounded admission policies for POST /api/v1/auth/login and /auth/register before bcrypt or database work, and for authenticated POST /api/v1/games/genshin/import and /import/preview before large parsing/validation/transaction work. Account ownership for authenticated buckets comes only from the verified token. Failed and malformed attempts must not bypass admission accounting. Preview and commit must not provide an alternate route that doubles an intended shared import budget. Keep GET import/status and normal companion reads usable. If you add a coarse API guard, document its independent health/preflight behavior and avoid hidden interference with the core journey.

5. Implement a clear client identity/proxy trust contract. Direct local operation must ignore untrusted Forwarded/X-Forwarded-For variants. Never enable trust proxy=true or guess a production hop count. Normalize equivalent address representations where relevant and define unknown-address behavior. If explicit proxy support is included, validate a bounded allowlist/trust configuration and prove spoof resistance; otherwise leave proxy-aware per-client behavior as an explicit deployment gate. Preserve the existing protected env module; any new configuration parsing is isolated, typed/validated and tested. A shared proxy/NAT can group clients, so record that tradeoff honestly.

6. Rate state must have a strict memory bound, expiry and deterministic behavior at capacity; churn cannot evict active penalties into unlimited access, and saturation must not grow memory without bound. Do not use raw email, password, JWT, import payload or arbitrary unbounded strings as retained keys or logs. Avoid global account/email lockouts that let strangers lock out another user. Document process restart and multi-instance limitations. Use injected time for tests; no production timers that keep tests/processes alive unnecessarily and no test-only production bypass.

7. Rate budgets alone do not bound simultaneous heavy work. Add appropriately scoped admission/concurrency bounds for expensive auth/import operations without an unbounded queue. Release permits exactly once on success, validation/auth failure, thrown error and request abort/response close; do not release while a still-running transaction or password operation continues. Keep this narrowly scoped and test the lifecycle. Return consistent temporary rejection rather than partially performing an operation.

8. Establish bounded GOOD item/string/resource validation sufficient to prevent a within-byte-limit payload from causing excessive work. Share the guard between preview and commit before transactions and preserve omitted versus explicitly empty sections, opaque-but-valid keys, relationship validation, scope confirmations and independent receipts. Reject oversized state rather than truncating it, silently discarding fields or partially importing. Preserve legitimate current fixtures and include a substantial synthetic valid export near the documented supported envelope. Limits are application support limits, not asserted game rules.

9. Throttled requests return 429 and a valid positive integer Retry-After in seconds; define stable safe error codes/messages. Existing UI should show a useful failure and retain user input/import review state. Verify login, registration and import behavior, including owner changes while a request is pending. Make only narrow UI/API-client changes if necessary to handle the new errors; do not automatically replay writes, log out users on 429 or show false success. Do not treat a rejected commit as a successful import or advance receipts/revisions.

TESTS AND ACCEPTANCE

- Add deterministic unit tests for windows/refill/boundaries, normalization, expiry, capacity, failed attempts, concurrent admission and permit release; avoid wall-clock sleeps. Inject policy/clock/store rather than disabling controls in NODE_ENV=test or depending on test order. Fresh apps must not inherit another test's counters.
- Exercise the actual composed Express application with HTTP tests: ordinary success; just-below/at/above body limits; malformed JSON; oversized auth; unauthenticated large import rejected before payload parsing; chunked/streamed and encoding behavior; path/method variations; 429 before service/DB/bcrypt work; Retry-After; expiry recovery; independent owner buckets; shared import preview/commit accounting; spoofed forwarded headers; saturation and aborted/error work. Assert no unexpected sensitive logs and no unavailable endpoint becomes public.
- Preserve unauthenticated/foreign-owner denials, credential error semantics, exact-origin rejection, absent-Origin authentication, allowed preflight and health behavior. Existing protected source guard and all test discovery/floors remain unchanged.
- Use actual owned disposable PostgreSQL for rejected-import preservation and accepted preview/commit. Compare goals/history/focus/routines/preferences/dismissals/equipment/receipts before and after rejection; prove no partial transaction/account creation. Verify a substantial valid synthetic import plus the ordinary no-import core journey. Never use real account data or load-test a remote host.
- Run the complete preserved pnpm run verify through guarded matching disposable URLs, NODE_ENV=test and platform null dotenv device. Current baseline is 875 tests / 47 files including all 106 PostgreSQL cases (plan28, lifecycle28, routine12, equipment13, importer16, catalog9). Counts may increase; no ceiling, skips, weaker floors or blanket exclusions.
- Run the real C5b recovery command with --verify against its explicitly owned stopped synthetic fixture; it creates separate source/restore/test databases and runs the full entry point. This is preferred to hand-built credentials or existing databases. Preserve all C5b tooling and historical results; if a genuine compatibility defect requires a narrow tooling change, document why and retain the original evidence. Do not neutralize admission controls just to make recovery green.
- Complete package lint/types/builds, guarded schema validation/diff, focused formatting, diff and preservation checks. Reconcile old manifests against the captured new baseline and explain intentional app/route/handoff changes. Do not touch old raw evidence. Restore normal web build configuration, stop only owned temporary services and record exact cleanup.
- Perform synthetic local browser acceptance if available for login, 429 retry guidance, GOOD preview/rejected commit/retry and account switch. Clearly label HTTP-only coverage or unavailable browser checks; do not claim accessibility or remote deployment evidence.

DELIVERABLES AND STOP

Persist implementation_plan.md, completed task.md, walkthrough.md, endpoint/policy matrix, runbook with exact local commands/configuration and reset/proxy/multi-instance limits, safe actual validation/failure evidence, starting/changed-files/preservation manifests and cleanup under docs/plans/c5c-request-safety/. Update CURRENT_HANDOFF.md and ROADMAP.md with a dated checkpoint and a new readiness assessment. Preserve historical checkpoints.

Report what controls were implemented, actual thresholds/identity behavior, observed rejected and valid requests, preservation checks, limitations and remaining gates. Do not call local single-process throttling distributed/provider protection or production readiness. Keep account-data procedures, production backup/operator/retention/cadence/RPO/RTO/representative restore, actual deployed proxy/origin/CI evidence, accessibility, source upkeep and voluntary beta feedback separately open. Leave everything uncommitted/unpushed and stop at C5c. C6/C7 remain gated on real-use evidence and a separate product decision.
```
