# C5d account-data contract — 2026-10-14

These controls operate on the authenticated Celestia identity only. They do not
contact a game provider or provide a restore/import format. The twenty-table
[matrix](owner-data-matrix.md) describes ownership and deletion; actual static
catalogs and migration metadata are outside account exports and remain unchanged.

## HTTP and encoding

| Operation                         | Request                                                      | Confirmed response                                                  |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- |
| POST `/api/v1/users/me/export`    | Exactly `{requestVersion:1,password:string}`                 | Success envelope containing `AccountExportV1`                       |
| DELETE `/api/v1/users/me/account` | Same fields plus `confirmation:"DELETE MY CELESTIA ACCOUNT"` | `{success:true,data:{responseVersion:1,deleted:true}}` after commit |

Empty query required; unknown properties reject. Owner comes exclusively from the
verified JWT, never the URL, query or body. Current password is required each time;
bcrypt runs outside database locks. Stored hash must be exactly a supported 60-byte
bcrypt value, cost 4–12; malformed or more expensive legacy hashes fail before
comparison. The unchanged registration cost is 12. The exact credential is checked
again inside the export/delete transaction, so a changed credential cannot reuse
earlier password verification.

Every response on these routes uses `Cache-Control: no-store`. The export response
has a fixed attachment name `celestia-account-v1.json`. The browser downloads the
`data` object as JSON, not the API envelope. Its fields are `exportVersion:1`,
`exportedAt`, `encoding:"postgresql-text-v1"`, scope, omissions and `tables`.
Every allowlisted stored scalar is a JSON string or SQL-null represented by JSON
null. JSON/JSONB columns are their PostgreSQL text representation inside a string;
parse separately when inspecting them. Numeric values are not coerced through JS
numbers. Timestamps retain database microseconds with UTC/ISO session settings;
timestamp-without-time-zone remains its stored wall-clock value. JSONB reflects
the value PostgreSQL retained, not the original import's whitespace/key ordering.
IDs, relationships, revisions, opaque keys, zero, null and legacy values are not
normalized. Each table is present, with an empty array for absent rows. Row order
is not a stable contract. Passwords, hashes, tokens and secrets are excluded.

Failures use the existing safe envelope: 400 invalid request, 401 missing/invalid/
deleted identity or failed credential verification, 409 inconsistent cross-owner
relationship, 413 body size, 415 media/encoding, 422 unsupported account size/storage,
429 rate/busy with integer `Retry-After`, and sanitized 503 operation failure.
No failure claims deletion or export success. If a delete response is lost, the
client cannot infer whether commit occurred; it requests explicit sign-in checking
and never automatically replays deletion.

## Exact local limits

| Resource                          | Limit                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| JSON body                         | 8,192 bytes; same strict media/encoding parser as auth                                                            |
| Password                          | Nonempty, at most 128 characters and 72 UTF-8 bytes; never URL/query/log/filename                                 |
| Shared export/delete owner budget | Burst 3, one token per 60,000 ms                                                                                  |
| Owner counter capacity            | 1,024 active-debt entries; no active eviction; fail closed                                                        |
| Account-data concurrency          | 2 globally, 1 per verified owner, no queue                                                                        |
| Shared auth pool                  | Existing 4 globally / 2 per direct socket; account-data also acquires it                                          |
| Per-table rows                    | 10,000 except singletons 1 and import receipts 4                                                                  |
| Total rows                        | 30,000, checked using cap-plus-one reads                                                                          |
| Stored row preflight              | Conservative 256 KiB physical sum (minimum 64 bytes per column); reject compressed columns before text conversion |
| Scalar text per row               | 262,144 actual UTF-8 bytes                                                                                        |
| Aggregate scalar text             | 8,388,608 bytes                                                                                                   |
| Serialized API response           | 16,777,216 actual UTF-8 bytes, including envelope, field names and escaping                                       |
| Account-data SQL statement / lock | 5,000 ms / 2,000 ms                                                                                               |
| Transaction / acquisition maxWait | 15,000 ms / 2,000 ms                                                                                              |
| Response deadline                 | 30,000 ms; destroy stalled response, retain permit until work also settles                                        |

Singletons are users, Genshin account, routine state, plan preferences, daily
companion, weekly boss state and NIKKE account. The remaining row caps are explicit
in the domain mappings. Row caps apply to deletion as well; export-only scalar and
output limits do not prevent an otherwise bounded deletion.

Signature/algorithm/expiry/subject checks precede admission. Account/import subject
existence is checked after admission so 429 occurs before identity database work.
Other protected routes use the same uncached id-only existence lookup before domain
work. This lookup is a small indexed Prisma read; it does not receive the account
repository's transaction-local statement timeout. If it stalls on an account-data
request, the response deadline closes the connection, and the bounded permit remains
held until that work settles. No claim of universal database cancellation is made.

Malformed admitted attempts consume the budget. Arbitrary email/owner input cannot
consume another verified owner's budget. Auth and import C5c defaults, origins and
direct-socket identity rules remain unchanged. Limits are per process and restart
with it; they are not distributed ingress protection.

## Complete export or rejection

A read-only repeatable-read transaction checks all counts, then checks physical
storage before casting columns to text, checks exact text bytes before transfer,
and serializes bounded rows with a UTF-8 counter. No response is sent until the
entire export succeeds. A compressed PostgreSQL field is currently unsupported,
even when its logical value might fit: compressed size cannot safely bound
decompression work. This conservative limitation is intentional and can reject
ordinary larger legacy JSON. It is not silently omitted or truncated. Error 422
explains that a separately reviewed local procedure is needed; no such procedure
or support channel is implemented here. No automatic storage-setting workaround.

The measured substantial fixture (250 characters, 2,500 weapons, 4,750 artifacts,
2,000 materials) exported 9,523 total rows, 2,686,705 response bytes in 143 ms on
this computer. This is a local sample, not an SLO, memory profile or load test.
Tests also reject 10,001 extra goal rows, compressed large legacy JSON and output
overflow from JSON escaping, with exact unchanged data.

Serialization retains bounded chunks and a final response string, with temporary
encoding/HTTP buffers; the output cap is not an exact process-RSS ceiling. At most
two account operations retain responses. Permits release only after both service
settlement and response finish/close. A disconnect alone never releases running
work, and service completion alone never releases an unfinished response.

## Atomic deletion and revocation boundary

Deletion takes the user lock first, rechecks credentials, checks counts, locks
owned accounts/goals/characters/weapons, checks both directions of cross-owner
goal/equipment links, and checks counts again after locks. It clears only owned
goal predecessor links, removes owned goals, then deletes the user and cascades
the remaining owned data in the same transaction. Legacy cross-owner links reject
intact rather than causing another owner's SET NULL update. Schema constraints are
not weakened; no migration was added.

Owner-locked imports/routines/goals/focus/plan writes serialize against deletion.
Retained event/NIKKE/endgame writes must still satisfy existing ownership and foreign
keys. Work already authorized may finish before deletion or fail after it; tests
prove it cannot resurrect data after the parent disappears. Reads authorized before
commit may have read the old snapshot, and a delivered response cannot be recalled.

Every new protected request after commit fails subject existence with the old token
before domain work. This preserves existing JWT validation and adds no allowlist or
deleted-person record. Re-registering the same email/username gets a new UUID and
empty data; the old token stays invalid. A database outage fails identity checks
closed. Restoration of an old backup can recreate both identity and records and
may make an otherwise valid old token usable again: restore/revocation policy is
an explicit production gate.

Active application deletion is irreversible in this feature. It does not delete
provider game accounts, downloaded files, external logs or historical backups.
No undelete, grace period, password reset, lost-account recovery, universal erasure,
legal compliance or supported re-import/restore promise is made.
