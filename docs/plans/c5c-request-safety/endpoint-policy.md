# C5c endpoint and policy matrix

Initial policy, 2026-10-11. Binary byte units; thresholds are inclusive.

| Endpoint                                                      | Order after helmet and exact-origin CORS                             | JSON bytes | Rate                                    | Concurrent work                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------- | ---------- | --------------------------------------- | --------------------------------- |
| GET /api/v1/health                                            | Respond without parsing/admission                                    | None       | None                                    | None                              |
| Allowed OPTIONS preflight                                     | CORS responds 204                                                    | None       | None                                    | None                              |
| POST /api/v1/auth/login                                       | socket bucket → permit → JSON → controller                           | 8,192      | burst 10, one token / 6 s               | shared auth 4 globally, 2/socket  |
| POST /api/v1/auth/register                                    | separate socket bucket → shared auth permit → JSON → controller      | 8,192      | burst 3, one token / 300 s              | same shared auth pool             |
| POST /api/v1/games/genshin/import/preview                     | verify JWT → owner bucket → permit → JSON → resource guard → service | 4,194,304  | shared import burst 6, one token / 10 s | shared import 2 globally, 1/owner |
| POST /api/v1/games/genshin/import                             | same as preview; same counters                                       | 4,194,304  | same shared import budget               | same pool                         |
| GET import/status and retained companion/Genshin/NIKKE routes | ordinary JSON where applicable → existing route auth/validation      | 65,536     | no new rate bucket                      | no new heavy-work pool            |
| Unmatched paths/methods                                       | ordinary JSON, existing route/404 behavior                           | 65,536     | no access to expensive handlers         | none                              |

Counters per app: login 2,048 keys; registration 2,048; import 1,024.
Only fully refilled entries expire. Full capacity denies a new identity, never
evicts an active penalty. Capacity retry is the earliest full refill; depleted
bucket retry is the next whole token. Concurrency retry is 1 second, an estimate,
not a reservation. All 429 responses have positive integer Retry-After and a safe
message including wait seconds. No automatic retries of writes. Process restart
resets counters; multiple workers have independent limits. NAT/proxy users share
socket buckets; proxy-aware identity and distributed enforcement are deployment gates.

GOOD ceilings: 512 incoming/resulting characters, 3,000 weapons, 5,000 artifacts,
5,000 material keys, 10,000 combined entries. Known keys/location/stat/source strings
are at most 128 UTF-16 code units; generic unknown strings at most 2,048, property
names 128, depth 16 and visited values 200,000. Numeric data remains subject to
existing domain validation. Unknown valid exporter fields retain existing semantics
but cannot evade resource counting. Byte and resource failures reject the whole
request; absent and explicitly empty sections stay distinct.

Stored snapshots fetch at most each section ceiling plus one sentinel and reject
overflow before returning any state. Resulting character unions and combined
inventory are checked too; no truncated snapshot can be accepted.

Malformed JSON / incomplete body: 400 INVALID_JSON / INVALID_BODY. Too many bytes:
413 BODY_TOO_LARGE. Unsupported media/charset/compression: 415 UNSUPPORTED_MEDIA_TYPE.
GOOD resource ceiling: 400 IMPORT_RESOURCE_LIMIT (known text schema overflow uses
400 VALIDATION_ERROR). Rate exhaustion/capacity:
429 RATE_LIMITED. Busy pool: 429 REQUEST_BUSY. Existing auth, validation, ownership
and unexpected server error contracts remain. Parser messages/bodies are never logged.
