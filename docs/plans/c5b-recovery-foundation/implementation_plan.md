# C5b recovery implementation plan

Prepared before code, 2026-10-11 (execution began from the October 10 prompt).
Owner authorization overrides the usual model/day split. One agent, existing D:
checkout only. No staging, branch change, dependency change, Turbo, remote service,
ordinary database, deployment, invitation or C6/C7 work.

## Starting state and preservation

HEAD is `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, master, empty index.
[Starting manifest](starting-state.json) captures inherited status and file hashes,
including schema, guard, contracts, thirteen migrations, eight protected files,
five formatting exceptions and historical evidence. C5a evidence is immutable;
only new dated handoff/roadmap notes intentionally change those current documents.

Read repository instructions, architecture, companion specification/implementation
handoff, C5a review/results/walkthrough/runbook/readiness and preservation policy;
inspected schema, migrations, source guard, Prisma configuration, verification
runner, package scripts and integration fixtures. Import V1, routine V2, focus V1,
goal writes V3 and plan V1 are preserved.

## Tool and ownership contract

Use installed PostgreSQL 18.4 clients/server, Node 22.14.0 and pnpm 11.18.0.
Portable Node orchestration uses argument arrays and installed package entrypoints.
The root `recovery:rehearse` command requires test mode, platform null dotenv,
explicit owned-fixture descriptor and exclusive-use declaration. No arbitrary
archive, target URL, output path or restore endpoint is offered.

Reuse the documented C4 synthetic local fixture only after checking OS owner,
absolute non-link data path, control-system identity, port and process command line.
It was stopped at inspection. Start/stop only that verified process when needed.
Guard its named `celestia_test_c4` administrative connection; never connect to
postgres/template1. Before mutation, derive and validate all per-run targets with
the unchanged source disposable guard. Require distinct names on one endpoint,
matching environment URLs and synthetic credentials. Reject inherited redirecting
PG/service settings and ordinary application database configuration.

A fresh private OS-temp directory holds archives, password files, and per-run
tablespaces for new source/restore/test databases. The reused cluster's own WAL
and catalogs remain in its already-owned data directory. Each run records resource
names, OIDs, owner roles, directory and fixture identity. Create new databases only;
never clear, reset or reuse an existing name. Confirm empty user catalogs before
restore. Restrict directory permissions (Windows ACL/POSIX mode), keep archive
provenance in memory, lock exclusive use, check for unexpected sessions, and freeze
source after seeding. Cleanup addresses only this run's recorded resources.

## Recovery stages

1. Validate all configuration before database-capable imports/subprocesses;
   inspect installed versions and fixture identity before mutation.
2. Create new owner roles/tablespaces/databases, apply all thirteen unchanged
   migrations only to source, seed stable synthetic IDs/timestamps and valid edges.
3. Inventory tables against the schema; canonicalize complete PostgreSQL textual
   field values without numeric/date/JSON rounding. Include migration rows and
   sequence state. Keep raw values private; persist only counts/digests.
4. Dump the complete database with pg_dump custom format, no schema/table filter.
   Restore only this run's archive with pg_restore --single-transaction,
   --exit-on-error, --no-owner, --no-acl and --no-tablespaces into the empty target.
   Capture measured durations, archive size/hash and versions. Fail on tool errors
   or dump/restore diagnostics, rather than hiding warnings about omitted data.
5. Compare every source/restored value and source-before/after. Verify migration
   checksums and schema compatibility without running restore-side migrations.
   Exercise actual application routes/services using synthetic authentication;
   compare before/after rows and record read-query evidence.
6. Success is written once at the end, in a unique run directory. Failures exit
   nonzero with sanitized stage/code and cleanup/resource status, never raw errors,
   secrets, URLs, table contents or a stale success file.

## Representative coverage matrix

| Tables                                                 | Synthetic coverage                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| users                                                  | Two populated owners with overlapping keys; third owner with no account/data; synthetic password authentication                            |
| genshin_accounts                                       | Owned accounts, nullable profile fields, distinct IDs                                                                                      |
| genshin_characters, genshin_weapons, genshin_artifacts | Same keys across owners, assigned/unassigned pieces, five slots, opaque keys/raw talents, JSON substats, zero levels                       |
| genshin_import_sections                                | Independent section dates/counts/source/null source; missing receipt distinct from explicit zero receipt                                   |
| genshin_materials                                      | Positive stock, explicit stored zero, absent key/unknown receipt                                                                           |
| genshin_character_focus                                | True/false membership with nonzero revisions; absent membership                                                                            |
| upgrade_goals                                          | Active/paused/completed/archived, retained predecessor/successor, priorities/revisions, malformed legacy intent preserved                  |
| genshin_routine_state                                  | Manual resin zero versus null, weekly zero versus null, selected/unselected server, stale retained periods/flags and Transformer timestamp |
| genshin_plan_preferences, genshin_plan_dismissals      | Zero versus null budget, enabled kinds, nondefault revisions, goal/routine and day/week dismissals                                         |
| daily_companion, weekly_boss_state, event_progress     | Frozen legacy observations/flags, JSON defeat keys, retained event claims                                                                  |
| spiral_abyss_runs, imaginarium_theater_runs            | Owned historical cycles/seasons, zero stars, JSON teams/cast                                                                               |
| NikkeAccount, NikkeCharacter, NikkeEquipment           | Small owned retained account/character/equipment sample; no product expansion                                                              |
| _prisma_migrations; sequences                          | All thirteen actual migration receipts/checksums; discover/compare exact sequence state (none expected in current UUID schema)             |

## Verification and failure cases

Pure tooling tests join existing discovery; no floors/exclusions change. Test
missing/mismatched/remote/ordinary targets, dotenv/mode, alias same-database,
unowned/nonempty destinations, inherited connection redirection, unsafe output,
missing/incompatible tools, dump/restore failure, data mismatch and redaction.
Rejected configuration must launch no database-capable operation.

Run real success twice with fresh resources; separately run nonempty-destination
and truncated run-owned archive failures and verify transactional rollback.
Run `pnpm run verify` on a separate new disposable test database, retaining all
106 PostgreSQL cases and the 799/46 inherited suite. The real rehearsal remains a
separate command; verify alone does not prove backup/restore. Complete package,
schema, lint, build, focused formatting, diff and preservation checks. Record
actual Windows evidence and any failed attempts/corrections honestly.

Deliver walkthrough, runbook, completed task, validation, safe run evidence,
cleanup/preservation/changed-file manifests and updated readiness. Production
operator, retention/access/provider/cadence, RPO/RTO and authorized representative
production restore remain unresolved. Stop after local C5b.
