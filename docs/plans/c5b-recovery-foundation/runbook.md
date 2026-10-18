# Local synthetic PostgreSQL recovery rehearsal

This command exercises an actual database dump and restore. It is separate from
`pnpm run verify`; the ordinary verification entry point includes pure recovery
tooling tests but does not run pg_dump/pg_restore. No production database, hosted
backup, export API, release, invitation or C6/C7 action is authorized here.

## Prerequisites and exact Windows commands

Use the existing D: checkout and installed dependencies. Do not use root Turbo
scripts, reinstall packages, load a normal `.env`, or copy credentials into shell
commands. Installed execution versions are PostgreSQL 18.4, Node 22.14.0 and pnpm
11.18.0. The helper discovers/checks versions before mutation, requires matching
PostgreSQL majors (18 or newer), and checks the server again after connection.

The checked-in [local fixture descriptor](local-fixture.json) identifies the
previously owned synthetic C4 instance. Its provenance is the immutable C5a
walkthrough, OS owner is checked against the current user, and its control-system
identifier must match. The instance must be stopped with a closed port, its last
postmaster options must match, and exclusive use is required. No unknown listener
is reused. Other PostgreSQL services are left alone. The named administrative
database is `celestia_test_c4`; the command never connects to postgres/template1.
`TEMPLATE template0` copies an empty database template without connecting to it.

```powershell
Set-Location 'D:\Genshin Personal\project-celestia'
$env:NODE_ENV = 'test'
$env:DOTENV_CONFIG_PATH = 'NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5b-recovery-foundation\local-fixture.json'
```

Run from a shell without `DATABASE_URL`, `CELESTIA_TEST_DATABASE_URL`, `PG*`,
`NODE_OPTIONS`, Prisma config overrides or other dotenv overrides. Their presence
is rejected before database-capable operations; do not print their values.
pnpm's injected `NODE_PATH` is discarded. Children receive only required OS
variables, the isolated test environment and newly generated synthetic secrets.
The helper derives matching guarded database URLs internally; none appears in
arguments or evidence. Ordinary app secrets, CORS and Vite overrides are not
inherited. The existing source disposable guard is byte-identical.

To include the full existing verification entry point on a **third, separate
new disposable database** during the owned fixture lifetime:

```powershell
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5b-recovery-foundation\local-fixture.json' --verify
```

This invokes the installed pnpm CLI with `pnpm run verify`, which runs
`apps/api/tooling/verify.mjs`, with
all checks/floors/discovery preserved. It builds ordinary production web output
without a local API override. Tests cannot reset the recovery source/destination.
No remote workflow is dispatched or claimed to have run.

Exercise the two real negative cases in separate runs (both must exit **1**):

```powershell
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5b-recovery-foundation\local-fixture.json' --fault nonempty
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5b-recovery-foundation\local-fixture.json' --fault truncated
```

Nonempty creates one sentinel in that run's new restore database, rejects it
before pg_restore and verifies the sentinel remains unchanged. Truncated removes
128 bytes from a private copy of that run's actual dump, invokes pg_restore on
that newly owned destination, and checks that no user objects remain after the
failed transactional restore. Neither option imports an arbitrary archive.
Repeat the ordinary command to obtain independently named resources and evidence.

## Portable environment contract

The implementation is Node with argument arrays, not a PowerShell-only script.
On a non-Windows host use `NODE_ENV=test`, `DOTENV_CONFIG_PATH=/dev/null` and the
same command with an explicitly prepared synthetic fixture descriptor. Supply
absolute installed `pgBin`/`dataDir`, loopback `127.0.0.1`, explicit unoccupied
port, existing named disposable admin database/role, current numeric OS uid as
`osOwner`, exact `pg_controldata` system identifier and a repository provenance
document recording that owned synthetic path. The same safety checks apply.
The runner deliberately has no ordinary-database bootstrap fallback. It uses
0700 directories/0600 files on POSIX; this branch was **not executed on Linux**.
Windows ACL/startup/process behavior and Windows recovery are the observed evidence.

The reused fixture has local trust authentication inherited from its synthetic
setup; this is not a production authentication configuration. Fresh roles have
random passwords and CONNECT is revoked from PUBLIC for their databases. Exclusive
use is an operator obligation plus file/advisory leases and unexpected-session
checks, not isolation from a malicious local administrator. Current-user ACLs
protect files, not an adversarial process running as that same user.

## What the command does

Before mutation it validates every target, including administration, and rejects
same database aliases/different credentials. Each target record must match its
guarded URL exactly. The descriptor is not accepted as proof merely because it
says localhost or uses a test name: the tool checks the OS owner, real data path,
control identity, postmaster PID/command line, address/port, then actual database
name/role/OID and server data directory/version. A file lease prevents cooperating
concurrent runs; an administrative advisory lock and session checks enforce the
exclusive fixture contract. Unknown clients prevent cleanup shutdown.

Each run creates a private OS-temp `celestia-recovery-*` directory. Windows uses
a protected current-user-only ACL, verified after applying it; children inherit
it. POSIX uses a private mode. Fresh source/restore roles, tablespaces and databases
are recorded with OIDs and ownership. Database names contain a random run ID.
No pre-existing name is cleared, adopted or dropped. The new database relation
files live in run-owned tablespaces; the reused server's global catalogs and WAL
remain in its original owned data directory. This storage distinction is explicit.

Source alone receives the unchanged thirteen migrations, then stable synthetic
IDs, timestamps and edge cases in **all 20 application tables**. Only generated
credentials/password hashes and real migration receipt IDs/times vary per run;
they are still compared exactly within that run. See the plan's coverage matrix
and each result's per-table counts/hash. Source is quiescent and configured
read-only after seeding. Raw rows remain in memory; no count-only or reseed-based
verification is used.

The full database custom-format dump includes schema/data, migration history and
relevant sequence state, without table/schema filters. This uses pg_dump's
consistent snapshot semantics; database-global roles/settings and external files
are outside it. See [PostgreSQL pg_dump documentation](https://www.postgresql.org/docs/18/app-pgdump.html).

The destination is separately created and checked for user relations, routines,
types, schemas, extensions and large objects. Restore uses `--single-transaction`,
`--exit-on-error`, `--no-owner`, `--no-acl` and `--no-tablespaces`; it never uses
`--clean`, `--create` or disabled triggers. The different destination role owns
restored objects, verified from its catalogs. Dump/restore nonzero exits **and
any stderr diagnostic** fail the stage. See [PostgreSQL pg_restore documentation](https://www.postgresql.org/docs/18/app-pgrestore.html).

Tool passwords use a private `PGPASSFILE`, with explicit host/port/database/user
arguments and no password/URL argument. Other PG settings cannot redirect the
connection. Passwords are not saved in repository evidence, and the password file
is removed during cleanup. See [PostgreSQL password-file semantics](https://www.postgresql.org/docs/18/libpq-pgpass.html).

Canonical snapshots cast every field to PostgreSQL text under UTC/ISO settings,
retain SQL null, preserve numeric precision, sort complete rows and compare the
full canonical data. Column metadata, constraints, migration rows and sequence
last-value/is-called state are included. The current UUID schema has no sequences;
the inventory records zero explicitly. New/uninventoried or empty required tables
fail closed. Migration names/checksums/completion match disk, and a read-only
Prisma schema diff checks the restored database without deploying migrations.

The private probe uses actual production services/routes, restored bcrypt login
and bearer auth. It checks self/foreign/unauthenticated profiles, roster/equipment,
receipts, goals/history, focus, routines and Today, plus account and retained
NIKKE reads. Real HTTP reads use the current clock; injected existing service-clock
seams also exercise saved-period zero claims and dismissals at a fixed date.
Queries must all be SELECTs. Restored rows are compared before/after reads, and
source rows before/after capture and validation, including absent-owner state and
malformed legacy intent. No third-party API or new browser UI is involved.

## Evidence, failure and cleanup

Each run prints its fresh evidence directory. `result.json` is the safe stage
record: versions, measured elapsed milliseconds, archive size/SHA256, coverage
counts/digests, application assertions and cleanup/resource outcomes. A separate
`success.json` exists only after **every stage and cleanup succeeds**. There is no
fixed output filename to overwrite, and no supplied output/archive path option.
Do not interpret another directory's success as the result of the current attempt.

Preflight failures before a private directory exists print a sanitized JSON error
and exit 1. Later failures write `result.json`, exit 1 and omit success. Arbitrary
child errors/output are withheld because they can contain SQL, URLs or secrets.
If setting directory permissions fails, the helper removes only its newly allocated
empty directory, nonrecursively. If that removal fails, the sanitized error reports
the owned retained path. A failed server launch is reconciled against its exact
process identity and start time before attempting cleanup; an unverified process
and lease remain for inspection.

Known stage codes and safe tool exit metadata identify the failure without exposing
rows. Private server logs and archives are sensitive and remain outside Git.

Cleanup checks recorded DB OIDs/roles and tablespace paths/owners, then drops only
the new databases/tablespaces/roles. It uses no FORCE, kills no unknown client,
and stops only the exact verified process started by the run. Failed cleanup
makes the entire run fail and records what remains. A lease is retained when an
owned server cannot be stopped safely. Do not remove a lease or stop a process
without reconciling that result and verifying its exact PID/command/data path.

Private archive/log/result directories are intentionally retained for inspection;
they are not a retention policy. To remove one after review, first inspect its
absolute resolved path, verify its result has no remaining database/tablespace/role
and no active owned process, verify it is the recorded direct OS-temp child with
no reparse points, then delete **that exact directory** using native PowerShell
`Remove-Item -LiteralPath` (or equivalent on POSIX). Never enumerate paths and pass
them to another shell for deletion. No recursive filesystem deletion was needed
for database cleanup in this milestone.

Local durations describe small synthetic fixtures on this machine. They are not
production RPO/RTO, a capacity test, PITR/WAL recovery, cross-version recovery,
provider configuration, global role/ACL backup, external assets/secrets recovery,
account export, or authorization to release. See [remaining readiness gates](beta-readiness.md).
