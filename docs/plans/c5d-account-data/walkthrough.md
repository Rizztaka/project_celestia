# C5d export and deliberate deletion — 2026-10-14

Implemented locally in the existing master checkout. Current-password export and
explicit account deletion are available in Settings. Export represents exact stored
owner data across all twenty application tables; deletion removes owned active rows
atomically and new requests with the deleted identity's old token fail closed.
The completed work passed final verification and is ready for independent C5d review; it does not
authorize release, invitations or C6/C7.

## Implementation

New platform account-data controller/service/repository/schema/routes orchestrate
small interfaces from Genshin and NIKKE. Explicit game-domain table/field mappings
preserve the modular boundary; no unrelated companion move, schema migration,
dependency or generalized plugin system was needed. Additive shared V1 types do not
rename older contracts. [Ownership matrix](owner-data-matrix.md) and [contract](contract.md)
define exact fields/encoding, limits and unsupported-account behavior.

JWT signature/HS256/expiry/subject rules remain, with an uncached id-only user lookup
added before protected domain work. Imports perform that lookup after their existing
admission, preserving 429-before-database ordering. Account operations use a shared
burst-3/minute owner budget, bounded capacity 1,024, global 2/owner 1 concurrency,
existing shared auth pool and 8 KiB parser. Permits account for both unfinished work
and response finish/close. Read/write transactions and output work are explicitly
bounded; [contract](contract.md) lists every ceiling and the identity-read caveat.

Export uses a read-only repeatable-read snapshot and PostgreSQL text scalars to
preserve precise numerics/timestamps, JSON, null, absence and legacy values. It checks
row and storage sizes before transfer, counts actual UTF-8 JSON output and returns
all sections or a safe error. Unsupported compressed fields reject before text
conversion; no record is truncated or silently dropped. No server export file/cache.

Deletion verifies credentials outside locks, then locks user first, rechecks them,
locks/checks domain ownership, rechecks row counts, clears only owned predecessor
links and deletes goals/user with cascades. Cross-owner legacy equipment/predecessor
links reject intact. NoAction/SET NULL relationships and foreign-key concurrency are
verified on actual PostgreSQL, including full rollback after an injected failure.

UI forms clear passwords after every attempt, cancellation and session change;
mutations do not retain credentials or export data in query cache and never retry.
Originating-session guards and aborts prevent late downloads, success or logout from
affecting a new owner. Blob URLs revoke. Confirmed deletion clears auth/query state
and displays accurate signed-out wording. Browser evidence found and fixed focus
timing so disabled/unmounted controls no longer receive ineffective focus calls.

## Verification evidence

Final accumulated suite passed **1,004 tests / 55 files**, zero failed/skipped.
Read [validation-results.json](validation-results.json) for the completed final run,
and [verification-attempts.json](verification-attempts.json) for actual earlier failures
and cleanup. The preserved verifier still classifies 106 historical PostgreSQL cases;
seven C5c and twenty new C5d cases bring actual database coverage to **133**. Floors,
discovery and all inherited suites are unchanged. New cases total 54: 24 HTTP,
3 schema/limits, 5 client, 20 PostgreSQL and 2 subject-authentication cases.

The full entry point includes shared/API/web types/builds, package lint, all thirteen
disposable migrations, schema validation/zero diff, whole-repository format with
preserved exceptions, immutable raw integrity and git diff check. Recovery first
proves exact dump/restore of all twenty application tables, 13 migration receipts
and 214 constraints, followed by authenticated read-only production-route probes.
The extra id-only subject reads are explicit; SELECT-only/state assertions remain.

New actual PostgreSQL cases establish:

- Exact complete exports for two populated owners and one no-import owner, with
  precise/null/opaque/legacy values and unchanged database/schema state.
- Safe credential/confirmation/spoof/throttle failures; atomic deletion for all three
  owner shapes; every remaining row compared exactly against the retained owners,
  catching orphan survivors as well as changes to existing owners.
- Mid-operation rollback, both directions of cross-owner predecessor/weapon/artifact
  links, changed credentials, duplicate deletion and blocked-lock timeout.
- Deleted old tokens denied across protected domains; same-email/username registration
  creates a new empty identity without restoring old-token access.
- Substantial 9,500-item support; row/compressed-JSON/escaped-output rejection without
  partial success or mutation; one coherent snapshot during an actual import.
- Deletion races with an actual import and goal write; retained preauthenticated
  event/NIKKE/endgame writes fail foreign keys after deletion, preventing resurrection.

[Actual browser acceptance](browser-acceptance.md) covers private download inspection,
wrong password, cancellation, throttling/retry, owner switches during held export and
delete responses, deliberate/no-import deletion and signed-out result. A local large
export measured **9,523 rows / 2,686,705 response bytes / 143 ms**. This is not a load
test or performance guarantee. Human assistive/zoom/reduced-motion gates remain open.

## Preservation and boundary

[Starting state](starting-state.json), [changed files](changed-files.json) and
[preservation check](preservation-check.json) distinguish this work from the large
inherited dirty tree. All 26 protected/migration/formatter entries and seven immutable
raw artifacts are unchanged. Historical recovery tooling, database guard, verifier,
old browser helper/evidence, env configuration, package/dependency/lockfiles, OpenRouter
and original Sonnet submission remain intact. Auth/profile/shared-type changes and
their assertion updates are intentional, individually explained in the manifest.

The browser and all recovery attempts remove only owned fresh resources, generated
credentials and owned processes; raw synthetic evidence stays private outside Git.
Normal web configuration is restored, temporary browser viewport reset and tab closed.
See [commands/cleanup](commands-and-cleanup.md).

Deletion proves active application row removal and denial of new protected requests
for the absent identity. It cannot recall earlier responses or erase game accounts,
downloaded files, external logs or historical backups. Old backup restoration may
reintroduce identity/data and old-token validity. Operator accountability, retention/
erasure/recovery policy, broader revocation, production proxy/origins/CI, accessibility,
source upkeep and voluntary-beta evidence remain [open gates](beta-readiness.md).
All work remains local, uncommitted and unpushed. Stop at C5d for review.
