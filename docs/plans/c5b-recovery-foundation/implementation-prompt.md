# C5b execution prompt — Reproducible recovery rehearsal

Prepared 2026-10-10 after the [C5a follow-up review](../c5a-beta-foundation/implementation_review.md).
**Proposed for owner execution; implementation has not started.** This is a bounded
operational foundation milestone within C5, not C6/C7 or release approval.

Recommended model: **GPT-6 Astra**, effort **Extra high (`xhigh`)**. Use local
implementation mode in the existing D: checkout, with one agent. A fresh conversation
may use the prompt below and repository artifacts; a fresh clean worktree would omit
the accumulated uncommitted implementation. No setting has been changed for you.
[OpenAI's model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection),
checked 2026-10-10, supports Astra with Extra high for demanding work with exacting
requirements. This recommendation is not a claim that the maximum available effort
always improves results.

Copy the entire prompt below into the implementation conversation.

```text
Implement Project Celestia C5b: build and execute a reproducible, guarded PostgreSQL backup-and-restore rehearsal using only synthetic data in owned disposable local fixtures. Prove restored data fidelity and application compatibility, preserve the C1–C5a implementation, document the exact limits of the evidence, then stop. Do not start C6/C7 or release the application.

OUTCOME

A documented command creates or uses explicitly owned disposable fixtures, builds representative synthetic state through the existing migration chain, takes a real PostgreSQL backup, restores it into a distinct empty disposable database, and verifies complete relevant data and ownership relationships. It records actual success/failure, tool versions and elapsed durations. An unsafe target, failed dump/restore, omitted data or failed verification cannot produce a green result.

This is a local recovery rehearsal, not an account-export API, production backup configuration, production recovery certification or invitation authorization. Report these conclusions separately.

WORKSPACE, AUTHORIZATION AND PRESERVATION

- Perform repository work only in D:\Genshin Personal\project-celestia. Verify the path before editing. Do not substitute the Codex C: worktree.
- Reconcile the intentionally dirty master checkout. Expected HEAD is 2d8820a48db83d7c62feebd849f2f1c2d3488bb6 and the index is empty. Inspect a mismatch; never discard inherited work. Preserve all C1–C5a changes.
- When supplied by the owner for execution, this prompt authorizes local implementation, relevant tests, documentation and owned synthetic disposable fixtures. No staging, commit, push, branch/worktree changes, reset, clean, stash, deployment, remote CI dispatch, ordinary/production database connection or migration, participant contact or paid infrastructure is authorized.
- Use installed dependencies and PostgreSQL tools. Do not change dependencies or lockfiles. Never invoke Turbo; apps/api/.turbo/turbo-test.log is protected. Do not read normal .env contents into output, load ordinary database configuration or expose tokens/passwords/connection URLs in commands, logs or artifacts.
- Preserve the eight protected files, thirteen migrations and five formatter exceptions in docs/plans/c5a-beta-foundation/preservation-check.json. Preserve the existing schema, source disposable-test-database guard, CORS/auth behavior, contract versions and historical raw evidence byte-for-byte. In particular, do not edit protected env.ts, apps/api/package.json, .env.example, OpenRouter code, the lockfile or the original Sonnet submission.
- Keep existing C5a results and hashes as historical records. Later handoff/roadmap changes legitimately differ from their old hashes and must be explained by the review artifacts. Create a new starting-state and changed-files manifest for this milestone; do not rewrite old evidence to conceal changes.
- No agents or new chats unless the owner asks. Follow applicable repository/skill instructions; this explicit execution request overrides the usual model/day role split.

READ AND RECONCILE FIRST

Read .agents/AGENTS.md and any applicable nested instructions; docs/ARCHITECTURE.md; docs/plans/CURRENT_HANDOFF.md; docs/ROADMAP.md; the companion feature/implementation documents; and C5a implementation_review.md, review-validation.json, walkthrough.md, runbook.md, beta-readiness.md and preservation-check.json. Inspect the actual schema/migration chain, disposable guard, Prisma config, verification runner/tests, package scripts and representative integration fixtures.

Understand the current C1–C5 data semantics before choosing synthetic rows. Consult import/provenance, routine V2, focus V1, goal lifecycle/write V3 and plan V1 contracts. This is a whole-application database recovery drill: retained legacy/endgame and NIKKE tables cannot be silently omitted because they are not primary navigation.

Before code, persist docs/plans/c5b-recovery-foundation/implementation_plan.md and task.md. Record starting HEAD/index/status, protected/migration/schema/guard hashes, intended file scope, fixture ownership and target validation, the recovery command contract, the representative-data coverage matrix and failure cases. Resolve routine implementation choices from the repository. Ask only for an indispensable external decision; do not stop at a plan when the local work is possible.

SCOPE AND IMPLEMENTATION

1. Keep the implementation in small local tooling modules, focused tests and a recovery runbook. A new root package command such as recovery:rehearse is appropriate. Preserve pnpm run verify and all its checks. Avoid production runtime routes, UI changes, schema changes, hosted backup APIs, scheduling, account deletion/export features, rate limiting and unrelated refactors.

2. Discover installed pg_dump/pg_restore and server versions without downloading or upgrading. PostgreSQL 18.4 was available locally at the preceding checkpoint; verify current availability rather than assuming paths or a running process. Check compatibility before mutation, fail clearly if prerequisites are unavailable, and cite installed help or official PostgreSQL documentation for material tool semantics. Use portable Node orchestration and argument arrays; shell scripts may document platform-specific setup without becoming the sole implementation.

3. Validate every database target before connecting, importing database-capable application modules, loading dotenv or invoking a database-capable subprocess. Reuse the existing disposableTestDatabase contract without weakening or changing it. Derive validated matching DATABASE_URL and CELESTIA_TEST_DATABASE_URL for each target, require NODE_ENV=test and the platform null dotenv device, loopback host, explicit port, celestia_test_* name, no query/fragment, and synthetic secrets. Do not infer ownership merely from a database name or localhost. Require documented fixture provenance/ownership and check the actual process, data path, port and database identity as appropriate. Handle any administrative connection needed to create disposable databases under the same restrictions; do not fall back to postgres/template1 or ordinary .env credentials.

4. Use newly created, owned source and restore databases for the drill. Never seed or clear an existing unknown database. Reject source and destination that refer to the same database, including equivalent loopback host spellings and different credential spellings. Prefer a single verified fixture endpoint with distinct database names. Validate both targets before any mutation. Confirm the restore destination is empty of user objects before restoration. Do not use destructive --clean, implicit database creation, production override flags, or automatic drop/reset of a pre-existing database. Document and enforce exclusive use of the owned fixtures during the drill. Database creation and cleanup must be bounded to explicitly recorded task-owned resources.

5. Apply the unchanged thirteen-migration chain to the source only. Seed deterministic synthetic users and related records with stable IDs/timestamps. Inventory every persisted application table and document representative coverage. Include at least two owners with overlapping game keys, an owner with little/no data, focus, active/paused/completed/archived goals with predecessor/successor history, non-default priorities/revisions, plan preferences/dismissals, manual routine observations, known zero versus null/unknown/absent values, independent import-section receipts, materials, characters, weapons, artifact assignments and unrecorded assignments. Include small valid retained legacy/endgame and NIKKE samples. Use valid constraints and meaningful edge cases; no real account data, fabricated game-source claims or changes to supported game coverage.

6. Take an actual transactionally consistent PostgreSQL dump of the complete application database schema/data, including migration history and relevant sequence state. Restore with installed PostgreSQL tools into the distinct empty target, preserving application data while avoiding a dependency on source-machine role names or ACLs. Use failure-stopping/transactional restore behavior where supported. Never hide nonzero exit codes or continue to a success report after warnings that imply missing objects/data. State what this database-level drill does not include, such as provider settings, global roles, external assets or secrets. A copy of seed JSON or a Prisma reseed is not a backup/restore.

7. Keep dump archives, synthetic credentials and temporary database files outside the repository in a newly owned temporary directory. Do not overwrite arbitrary supplied output files or follow an unvalidated cleanup path. Restrict access using supported platform mechanisms and document the actual result. Do not emit full URLs, password hashes, tokens, raw table contents or archive contents into persisted evidence. Pass credentials through a narrowly scoped supported mechanism rather than command arguments, and prevent inherited PG* or service settings from silently redirecting a validated target. Sanitize subprocess errors and test redaction. Treat archives as sensitive even though this drill contains synthetic data. Do not turn this helper into an unrestricted restore endpoint: only an archive produced by this owned run may be restored.

8. Verify from the restored database, not the seed description. Compare stable canonical snapshots of source and restored rows for every inventoried application table, plus migration history and relevant sequence state. Preserve exact IDs, relationships, values, revisions and timestamps; do not normalize away null/zero/absence or compare only row counts. Keep raw comparison data in memory/private temporary storage and persist only counts, hashes and safe diagnostic summaries. Compare source state before/after to show the drill did not mutate source data after capture. Keep the source quiescent or use an appropriate shared snapshot for a coherent comparison.

9. Exercise representative restored application reads using existing production services/routes with synthetic authentication: own profile/account, roster/equipment, goals/history/focus, routine and Today plan. Confirm foreign-owner and unauthenticated access remain denied. Prove these verification reads do not write, synthesize progress, complete goals or normalize away stored history. Check schema/migration compatibility on the restored target without applying migrations there. Do not require a production deployment, new browser UI or real third-party API calls for this tooling milestone.

10. Record actual dump, restore and validation durations, archive size/hash, versions, data coverage and result stages. These are measured local timings, not promised production RPO/RTO. Define the failure result: nonzero exit, no success artifact, a sanitized stage/error report, and precisely recorded owned resources left for inspection or safely cleaned. Never publish a stale prior success file as the result of a new failed run. Keep cleanup bounded to the owned run and leave unrelated services/data alone.

TESTS AND ACCEPTANCE

- Add meaningful guard/orchestration tests for missing/mismatched/non-loopback/ordinary targets, wrong dotenv/mode, same source/destination including aliases, unowned or nonempty targets, redirected inherited connection settings, unsafe output paths, missing/incompatible tools, failed dump, failed restore, data mismatch and redaction. Verify rejected input cannot launch a database-capable operation. Use dependency injection where useful without mocking away the real acceptance drill.
- Execute a real successful dump/restore/fidelity/application-read drill on the owned disposable PostgreSQL fixture. Exercise real nonempty-target rejection and a corrupted/truncated run-owned archive against separately owned disposable destinations; confirm failure is reported and cannot become a partial green restore. Repeat the successful command with fresh resources to show it is reproducible and does not depend on stale artifacts.
- Run pnpm run verify under the existing disposable guard, using an appropriate separate test database so ordinary suite resets cannot destroy the drill source or restored evidence. Baseline is 799 tests / 46 files, including all 106 PostgreSQL cases (plan 28, lifecycle 28, routine 12, equipment 13, importer 16, catalog 9). New tests should add meaningful coverage; no skipped suites, exact-count ceiling, blanket exclusions or weakened floors. Never use Turbo.
- Include pure tooling tests in existing discovery. If the real rehearsal stays a separate command because it requires PostgreSQL client binaries, document that explicitly; pnpm run verify alone must not be described as having exercised a restore. Do not claim remote CI ran, or add a fake passing CI step. Avoid unrelated CI changes; explain any essential narrow adjustment before making it.
- Complete relevant lint/types/build/schema/format/diff checks. Preserve five exact formatting exceptions and seven exact raw-evidence files under the C5a policy; format only files you changed. Reconcile protected, migration, schema, guard and inherited-source hashes. Restore ordinary build configuration and stop only owned temporary processes. Inspect absolute cleanup paths before any recursive filesystem operation.

DELIVERABLES AND STOP CONDITION

Persist implementation_plan.md, completed task.md, walkthrough.md, runbook.md, actual validation results, safe execution/failure evidence, starting-state, preservation/changed-files and cleanup records under docs/plans/c5b-recovery-foundation/. Provide precise Windows/local commands and a portable environment contract, prerequisite/version checks, failure interpretation and resource cleanup instructions. Record honestly what was run on Windows versus any other platform.

Update CURRENT_HANDOFF.md and ROADMAP.md with a new dated checkpoint while preserving historical evidence. Update the readiness assessment with a clear distinction between local synthetic recovery tooling and unresolved production obligations: accountable operator, retention/access policy, backup location/provider, actual backup cadence, acceptable data loss/recovery time, authorized isolated restoration of a representative production backup and measured outcome. Do not invent an owner, contact address, retention duration, RPO/RTO, production domain or completed drill.

Final response: what works, what failed and was corrected, actual checks and evidence links, remaining gates and exact scope limits. Leave all work uncommitted/unpushed. Stop after local C5b. Abuse/data controls, accessibility, source upkeep, actual remote CI/deployed origins and voluntary beta feedback remain separately scoped; C6/C7 remain gated.
```
