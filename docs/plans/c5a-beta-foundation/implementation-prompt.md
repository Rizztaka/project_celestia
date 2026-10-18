# C5a execution prompt — Reproducible verification and origin hardening

Prepared 2026-10-09, finalized 2026-10-10 after the [C5 review](../c5-companion-beta/implementation_review.md). **Proposed for owner execution; implementation has not started.** This is a bounded C5 closure slice, not a new feature phase or beta release approval.

Recommended implementation model: **GPT-6 Astra**, reasoning effort **Extra high (`xhigh`)**. This is a quality-first recommendation for exact CI, database safety, configuration and preservation requirements. [OpenAI's model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection), checked 2026-10-09, supports Astra with Extra high for demanding work with exacting requirements. This is a recommendation, not a change to the active model or proof that maximum effort would improve the result.

Copy the entire prompt below into the implementation conversation.

```text
Implement Project Celestia C5a: close the two reproduced C5 review findings and make the current verification baseline reproducible. Complete this bounded local milestone, document its evidence and remaining beta gates, then stop. Do not start C6/C7 or release the application.

OUTCOME

The repository has a repeatable, guarded verification path that runs the complete accumulated suite against disposable PostgreSQL with no hidden skips. CI uses that same contract. The API accepts browser requests only from explicitly trusted origins, while intentional local development, preflight and non-browser use remain supported. Existing companion behavior and data contracts remain unchanged.

Report three separate conclusions: local implementation passes; remote CI has or has not actually run; beta/release prerequisites remain open or have specific new evidence. Never infer one from another.

WORKSPACE AND AUTHORIZATION

- Use D:\Genshin Personal\project-celestia for every repository operation. Verify that path first. The Codex C: worktree is not the working source; if D: is unavailable, report the block without editing a different checkout.
- Reconcile the intentionally dirty master checkout. Expected HEAD is 2d8820a48db83d7c62feebd849f2f1c2d3488bb6 and index is empty. A mismatch requires inspection, never reset or discard. Preserve all inherited C1–C5 changes.
- This prompt, when supplied by the owner for execution, authorizes local implementation, relevant regression tests, documentation and owned disposable fixtures. Do not stage, commit, push, change branches/worktrees, reset, clean, stash, deploy, run ordinary/production migrations, trigger remote CI or contact others.
- No dependency/lockfile changes, paid services or infrastructure provisioning. Use installed tooling. Never run checks through Turbo, since apps/api/.turbo/turbo-test.log is protected evidence. Do not reveal secrets or read normal .env contents into output.
- Preserve the eight protected files, all thirteen migrations and five formatter exceptions in docs/plans/c5-companion-beta/preservation-check.json. This includes apps/api/src/core/config/env.ts, apps/api/.env.example and apps/api/package.json. Do not silently relax these constraints. A focused core/config module may validate new CORS-specific configuration without rewriting protected configuration or bypassing existing required-secret validation. Document new non-secret settings in the new runbook.
- No whole-tree formatting, lint-rule weakening, blanket test exclusions or fabricated success. No agents or new chats unless the owner explicitly asks. Follow applicable repository/skill instructions, with explicit owner instructions taking precedence over usual model/day roles.

READ AND RECONCILE FIRST

Read .agents/AGENTS.md and any nested applicable instructions; docs/ARCHITECTURE.md; CURRENT_HANDOFF, ROADMAP and the companion feature/implementation documents. Read C5 implementation_review.md, review-validation.json, review-boundary-probes.log, walkthrough.md, beta-readiness.md, acceptance.md, changed-files.json and preservation-check.json. Consult earlier C1–C4 contracts when a touched boundary depends on them.

Inspect actual CI/root/package scripts, Turbo environment behavior, all integration-suite discovery/guards, Prisma configuration, app middleware/error handling, existing auth transport, frontend API configuration and fixture startup. Do not rely on historical test counts as proof of current behavior.

Before code, persist docs/plans/c5a-beta-foundation/implementation_plan.md and task.md. Record starting HEAD/index/status, protected/migration/exception hashes, proposed file scope, exact origin semantics, verification command ordering, and acceptance cases. Reproduce the two review findings locally. Keep the plan short enough to guide execution.

WORKSTREAM A — COMPLETE, GUARDED VERIFICATION

1. Replace CI's placeholder/Turbo test path and two-suite integration selection with one direct full-suite path. Preserve meaningful types, lint, build and format coverage across the packages. Use the installed dependency versions and frozen lockfile installation in CI. Build shared prerequisites in the correct order.
2. Before importing application database modules, opening a database connection or invoking migration tooling, run the existing disposable-test-database guard under matching DATABASE_URL and CELESTIA_TEST_DATABASE_URL. Require loopback, explicit port, celestia_test_* database name, NODE_ENV=test and DOTENV_CONFIG_PATH=/dev/null on Linux or NUL on Windows. Use synthetic JWT/OpenRouter values. Missing or mismatched configuration must fail closed; never fall back to the normal .env. Do not weaken or remove the guard.
3. Ensure CI's own isolated PostgreSQL service is ready, then apply the existing migrations only to that disposable database, then run the full suite. Do not add a migration. If a shared helper is useful, make it portable and keep database-target validation ahead of subprocesses that could load dotenv/connect.
4. Make CI fail if required integration coverage is skipped or omitted. The current baseline is 708 tests / 44 files, including six PostgreSQL suites totaling 106 cases: plan 28, lifecycle 28, routine 12, equipment 13, importer 16 and catalog advice 9. New tests should increase coverage. Validate actual results, not just a shell echo or an assertion that configuration strings exist. Do not freeze an exact count that prevents legitimate additions; document any intentional restructuring.
5. Handle the five inherited formatting exceptions explicitly and narrowly, with preserved hashes and meaningful checks for all other relevant files. Do not make CI green by excluding whole source trees or historical documentation wholesale. Keep all unconnected exception bytes unchanged.
6. Add meaningful tests for any verification helper: safe valid configuration reaches intended commands; absent/mismatched/non-loopback targets and enabled dotenv fail before a database-capable subprocess; skipped/missing integration evidence cannot be called green. Avoid testing only the text of the workflow.
7. Document the exact local and CI commands and environment contract. A workflow edit or local equivalent run is not an observed remote CI success. No push or remote workflow dispatch is authorized.

WORKSTREAM B — EXPLICIT ORIGIN POLICY

1. Replace origin.includes(...) checks with a parsed, exact origin allowlist. Define and validate one documented CORS-specific configuration contract, including startup behavior when configuration is missing or malformed. Fail closed in production; never fall back to every vercel.app tenant or arbitrary loopback-looking strings. Do not guess the real production domain.
2. Origins comprise scheme, host and effective port. Reject wildcard entries, opaque null origins, malformed origins, credentials, non-HTTP(S) schemes and origin strings containing paths/query/fragments according to the documented policy. Normalize valid origins deliberately. A trusted domain appearing inside an attacker hostname or URL is never sufficient.
3. Allow only explicitly documented local origins/ports in development/test, including the local fixture if it is used. Keep production separate. Preview origins must be explicitly configured, not admitted by an unrestricted suffix. Configuration may be implemented in a focused core/config module while preserving the protected env.ts and .env.example bytes; do not duplicate unrelated secret configuration.
4. Deliberately specify absent Origin behavior for health checks/non-browser callers. CORS is not authentication, CSRF protection or rate limiting. Preserve bearer authentication and ownership checks on every protected route. Review whether Access-Control-Allow-Credentials is actually required by existing clients before retaining/removing it, and document the decision.
5. Keep valid preflights and required methods/headers working, including Authorization and Content-Type. Disallowed origins must not be reflected and should receive deliberate policy handling instead of an unexpected 500 with a noisy internal-error log. Preserve the API error envelope where an explicit error response is chosen, and correct Vary: Origin behavior.
6. Add regression tests against actual Express middleware for configured allowed origins, disallowed ordinary origins, localhost.attacker.example, 127.0.0.1 lookalikes, vercel.app.attacker.example, unrelated.vercel.app, wrong schemes/ports, null/malformed origins, absent Origin, and OPTIONS preflight. Include protected-route checks proving that an allowed origin without valid authentication still cannot read/write account data. Test production missing/malformed configuration and supported local development behavior without loading real secrets or using a real database.
7. Record deployment prerequisites for configuring exact origins and coordinating the frontend/API cutover. Do not change provider configuration or pretend local allowlist tests verify deployed behavior.

PRESERVATION AND NON-GOALS

Keep every C1–C5 behavioral boundary: selected Asia reset contract; read-only GETs; owner locks; post-lock time/revision checks; atomic mutation responses; originating-session isolation; no blind offline replay; retained drafts on failure/conflict; optional import; declared goal/focus/priority/lifecycle/history and plan choices surviving import; omitted section preservation; unknown stock distinct from zero; raw talents not assumed base levels; no observation-triggered goal completion; narrow verified costs; all production farming routes unavailable.

Do not redesign navigation or product flows, add catalog/game coverage, change contracts/schema/migrations, build teams/journals/savings, implement an auth rewrite, or add infrastructure. Rate limiting, recovery/export/deletion and real backup/restore readiness remain separate scoped gates; do not claim the CORS change solves them. Keep legacy secondary features compatible.

VALIDATION AND EVIDENCE

- Establish a safe fixture with existing installed tooling, or reuse the owned C4/C5 fixture only after verifying absolute path, owner, PostgreSQL version, port and process command line. Never kill an arbitrary port occupant or use normal data. Apply existing migrations only after guard validation when a fresh isolated database needs them.
- Run the complete direct suite with all required database cases and no skips, plus relevant helper/CORS regressions. Run API lint/build, shared-contract types, web lint/build, focused formatting and git diff --check. Use guarded Prisma validation/schema comparison when checking the new verification path. Record exact commands, actual counts, exits and warnings; do not suppress inherited pg warnings or update dependencies to remove them.
- Exercise the new verification entry point end to end, including at least one failure case proving unsafe configuration stops before a database-capable command. Validate workflow structure with available tools. Clearly distinguish local Windows evidence from an actually executed Linux/GitHub run.
- If browser/API startup configuration changes, smoke-test login, Today, import preview and an authenticated read using synthetic accounts and the configured local origin. If browser checks cannot run, report the specific limitation. Do not repeat the entire historical browser matrix unless the changes affect it.
- Actual 200%/400% zoom, OS reduced-motion rendering and assistive checks remain explicit open gates unless genuinely exercised with suitable tools. Do not relabel viewport emulation or CSS inspection as those checks. Do not contact usability participants.
- Recheck source/protected/migration hashes, HEAD/index and scoped formatting. Stop only processes created/restarted for this run, restore any ordinary web build override and browser state, and verify fixture ports are closed. Preserve logs and guard evidence without secrets.

DELIVERABLES AND STOP CONDITION

Persist implementation_plan.md, task.md, walkthrough.md, validation-results.json and preservation-check.json under docs/plans/c5a-beta-foundation, plus a concise verification/configuration runbook and useful sanitized logs. Map every review finding to its change and a meaningful regression result. Record any newly discovered blocking issue honestly.

Update the current handoff and relevant readiness checkpoint to link the latest evidence, while retaining historical C5 evidence rather than rewriting its hashes/results. State separately: local C5a completion; remote CI execution status; and unresolved beta prerequisites. For each remaining gate, provide the next concrete evidence needed and whether an actual person/provider action is required; never invent an owner or a completed drill.

Finish with findings resolved, tests/evidence, remaining risks and exact files for review. Leave all work uncommitted and unpushed. Do not invite testers, deploy, access normal databases, or begin C6/C7. The next decision remains operational/accessibility closure and authorized real-user validation before product expansion.
```
