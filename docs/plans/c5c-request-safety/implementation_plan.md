# C5c implementation plan

Prepared before implementation, 2026-10-11. One agent, existing dirty master at
`2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, empty index. The captured
[starting manifest](starting-state.json) has 809 inherited files, all 26 protected
entries and seven raw captures matching. No normal environment files were read.
The owner's execution prompt authorizes this bounded implementation despite the
usual model/day split. No staging, branch/worktree change, deployment or C6/C7.

## Inspected baseline and design

Express 5.2.1 and body-parser 2.3.0 are installed. The current global 50 MB parser
precedes authentication; parser errors reach the generic logging/500 branch.
body-parser bounds bytes for declared and chunked lengths but drains a failed
stream before its callback. Its errors may contain the submitted body. Translate
errors only at the parser callback, discard raw diagnostics, and reject declared
oversize/unsupported content before reading. Reject compression (415); no inflation.
Preserve CORS first, allowed preflight and health. No global request-rate guard.

Use per-app policy/store/clock construction with validated finite positive limits,
monotonic production time and injected test time. Core owns generic JSON/admission;
auth and importer route factories own exact POST bindings. Genshin mounts import
routes before its ordinary parser. Platform auth mounts before the ordinary parser.
Other routes retain ordinary parsing. Route matching itself selects the allowance,
so suffix/query/method variants cannot evade admission or access the larger parser.

Token buckets retain only SHA256 identities and numeric state. Separate auth
buckets use the direct socket address; imports use only verified token subjects.
Ignore all forwarded/client identity headers. Normalize IPv4-mapped IPv6 and IPv6
spellings; missing/invalid addresses share one unknown bucket. No email lockout.
Trust proxy stays false. No unobserved proxy topology is assumed.

Rate entries expire lazily when completely refilled. At capacity, evict only fully
refilled entries; reject new identities until the earliest expiry, retaining active
penalties. No timer or queue. Admission failures consume an available rate token;
denied depleted attempts do not extend the refill time. Shared auth concurrency
and shared import concurrency have bounded per-identity maps. Acquire before body
reading; release exactly once after parsing/validation/controller work settles.
Aborted body reads stop before service work. Closing a response cannot release a
permit while a password operation or transaction is still running.

GOOD guard runs before Zod, fingerprinting or repository work, including unknown
fields. Bound depth, nodes, keys, strings and section/overall counts; reject rather
than truncate. Preserve omitted/empty sections, opaque keys, ownership, confirmations
and receipts. Check resulting merged roster/overall inventory bounds before writes.

## Defaults and rationale

See [endpoint matrix](endpoint-policy.md). A measured synthetic login is 66 bytes;
8 KiB leaves ample form headroom. Ordinary 64 KiB accommodates retained manual
NIKKE/endgame forms. A generated 9,500-item GOOD request (250 characters, 2,500
weapons, 4,750 artifacts, 2,000 material keys) is 1,056,750 UTF-8 bytes. The 4 MiB
import allowance leaves headroom for longer opaque keys and exporter metadata;
10,000 total entries bounds database/fingerprinting work independently. These are
application support ceilings, not game maxima or approved production policy.

## Intended file scope

- New core request-safety policy, identity/bucket/concurrency and JSON middleware,
  with deterministic unit and real composed HTTP tests.
- `apps/api/src/app.ts`, auth routes, Genshin aggregator/import routes, importer
  validation/service and focused importer tests as necessary.
- Existing HTTP tests switch to fresh app instances where isolation requires it.
- Narrow web error/session handling only if acceptance reveals it is necessary.
- New C5c owned PostgreSQL/browser acceptance helper/tests where needed; preserve
  C5b recovery implementation and historical evidence.
- This C5c artifact directory, dated additions to CURRENT_HANDOFF and ROADMAP.

No dependency/lockfile, schema/migration, contract version, protected environment,
OpenRouter, formatter exception or raw evidence changes.

## Validation and finish

Implementation refinement recorded 2026-10-12: immediate declared-length rejection
reset a still-uploading local client in the first HTTP run. Use body-parser's own
length check (before buffering) and bounded drain before responding. Unsupported
media/compression still rejects before reading. Stored snapshot queries now fetch
at most each section ceiling plus one sentinel and reject overflow before returning
the snapshot; a truncated state is never fingerprinted or committed. Two legacy
auth tests also needed fresh app instances to avoid sharing admission debt.

Prove boundaries, malformed/media/encoding/chunked errors, auth before import parsing,
service-call exclusion, token refill/capacity, spoof resistance, shared budgets,
independent owners and concurrency lifecycle with deterministic tests. Exercise
real disposable PostgreSQL with full state comparisons after rejected imports,
accepted substantial import, unchanged receipts/history/intent and no-import journey.
Run unchanged real `recovery:rehearse --fixture ... --verify` with null dotenv and
isolated test environment; preserve 875/47 and 106 database floors, no skips.
Complete lint/types/build/schema/format/diff/integrity checks and synthetic local
browser acceptance where available. Record failures honestly, cleanup only owned
services, restore normal web output. Produce completed checklist, walkthrough,
runbook, readiness and final manifests; leave all work uncommitted/unpushed.
