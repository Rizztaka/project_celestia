# C5a follow-up review and next-step decision

Reviewed 2026-10-10 in the existing dirty D: checkout, at HEAD
`2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, with an empty index.

**No new blocking finding was identified in the reviewed C5a changes. The local
checkpoint is suitable for the next bounded engineering milestone. It is not a
beta or production release sign-off.**

## Scope and evidence

This follow-up reviewed the actual verification runner, suite discovery and result
validation, CI wiring, byte-preservation policy, exact-origin parsing/middleware,
application wiring and their regression tests. It reconciled the C1–C5 milestone
handoff, current product boundaries and remaining readiness gates, then reran the
entire accumulated suite. This is a focused code review plus whole-suite regression
verification, not a new line-by-line audit of every inherited feature, an external
security assessment or independent human accessibility acceptance.

Before execution, all **43 C5a implementation-manifest entries** matched their
recorded hashes. All **26 preservation entries** matched: eight protected files,
thirteen migrations and five formatter exceptions (some paths belong to multiple
groups). See [starting state](review-starting-state.json).

Fresh `pnpm run verify` exited **0** on Windows:

- **799 tests, 46 files, 106 PostgreSQL cases; zero failed, skipped or todo.**
- PostgreSQL cases: plan 28, goal lifecycle 28, routine 12, equipment 13, importer
  16 and catalog advice 9.
- Shared/API/web types and builds, API/web lint, guarded migration deploy, schema
  validation/diff, repository formatting/integrity and `git diff --check` passed.
- Vitest elapsed time: **54.31 seconds**. This is suite time, not a recovery metric.
- The existing owned loopback PostgreSQL 18.4 fixture was checked before startup.
  Only `celestia_test_c5a` at `127.0.0.1:55448` was used, with matching disposable
  URLs, `NODE_ENV=test`, the null dotenv device and synthetic secrets.

The authoritative new results are [entrypoint results](review-entrypoint-results.json),
[actual test report](review-test-results.json) and [command log](review-verification.log).
The helper's own unit test also prints a synthetic 708-test report inside that log;
the outer runner and actual Vitest report establish the 799-test result.

## Conclusions

The origin policy rejects attacker substrings, other preview tenants, malformed or
opaque origins and production configuration omissions. Trusted origins retain
preflight support; absent Origin does not bypass protected-route authentication.
The preserved bearer and foreign-owner contracts remain exercised. CORS does not
replace abuse controls, account recovery or authorization.

The verification entry point validates the disposable target before database-capable
work, discovers the complete suite and rejects missing, skipped, duplicate or failing
result evidence. CI uses that entry point and a frozen install. The workflow has
**not run remotely**; Windows execution does not prove Linux CI or deployment success.

C5a's saved browser login/Today/import-preview/profile evidence was reconciled with
the unchanged implementation hashes; it was **not repeated** during this review.
No new actual zoom, reduced-motion, screen-reader or real-player evidence is claimed.
No application source, dependency, schema, migration or CI change was needed here.

The owned review PostgreSQL process was stopped after verification. Ports 55448,
45448 and 45449 were confirmed closed. No normal database, remote workflow, commit,
push, deployment, invitation or other person's account was used. Final preservation
and documentation checks are recorded in [review validation](review-validation.json).

## Recommended next milestone

Prepare **C5b: reproducible recovery rehearsal and restore verification**. The
[execution prompt](../c5b-recovery-foundation/implementation-prompt.md) is proposed
for owner execution; implementation has not started.

This directly addresses the documented recovery gap: GOOD import cannot reconstruct
the companion's saved goals, lifecycle history, routines, preferences and dismissals.
A guarded synthetic backup/restore drill can establish tooling and measurable local
evidence without accessing ordinary data or choosing a hosting provider. It cannot
establish production backup retention, an accountable operator, production recovery
targets or a successful production-backup restoration.

C6 snapshots/teams and C7 events/wish savings remain optional product directions
gated on actual beta feedback. Do not start them automatically. After this bounded
recovery work, the owner still needs to resolve abuse/request controls, account-data
procedures, accessibility, data upkeep, actual remote CI and deployment evidence,
then authorize voluntary beta validation. The [readiness table](beta-readiness.md)
remains the source of those open gates.

For implementation, recommend **GPT-6 Astra with Extra high (`xhigh`)**. This is a
quality-first judgment for precise database safety and failure-path requirements,
consistent with [OpenAI's model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection)
checked 2026-10-10. Keep execution in the same local D: checkout, in implementation
mode with one agent; the uncommitted work is not contained in a new clean worktree.
No model or application setting was changed by this review.
