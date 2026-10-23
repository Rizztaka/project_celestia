# Live deployment check — 2026-10-23

The owner requested committing the verified feature and checking the live
deployment. The checked production release remains `00cf0423987bcb2b2a75a8e35b517e330707af1e`.
Feature branch: `codex/hoyolab-companion`. Production promotion and database
changes were not performed during this inspection.

| Component              | Observed result                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub                 | `master` is `00cf042`; its Vercel status is successful.                                                                                                  |
| Vercel                 | Production deployment `dpl_GEdnwUFkjc4xE1yYG6Kcs3xyTcb3` is READY at `00cf042`. `/login` returns HTTP 200.                                               |
| Render                 | Service `celestia-api`, workspace `project_celestia`, deployment `dep-dbd5cbmq1p3s73dkrt00` is live at `00cf042`; automatic deployment follows `master`. |
| API readiness          | HTTP 200, status `ok`, database `up`, Redis `disabled`.                                                                                                  |
| Runtime errors         | Render returned no error-level logs from 2026-10-22 18:32 UTC through the inspection.                                                                    |
| Supabase               | `project_celestia` is ACTIVE_HEALTHY. HoYoLAB connection table is absent. Supabase migration history exists; Prisma migration history is absent.         |
| New connector download | The production path returns HTML, not a ZIP; the new feature has not been released.                                                                      |

The HoYoLAB schema migration is therefore pending. Encryption-key configuration
was not inspected or changed; no existing environment secrets were retrieved.
Before production release, apply the reviewed incremental migration through the
existing Supabase migration workflow, provision the independent API encryption
key, and coordinate API/frontend release. Do not merge to the automatically
deployed production branch before these prerequisites are addressed. Then follow
the [owner acceptance steps](operations.md).

Local evidence remains 1,634 passing tests / 100 files, including 138 required
PostgreSQL cases, with the complete guarded verification command successful.
Staged whitespace validation additionally covers newly added files; the SQL
migration's final CRLF was normalized to LF without changing its statements.

The first PR CI run passed guarded complete verification, then caught an unsorted
shared-contract barrel export in the separate monorepo lint step. The export was
sorted and the guarded verifier now includes shared-contract lint as well. Its
orchestration regression checks that step, so a local green gate covers this
package too. The production rollout prerequisites above remain unchanged.
