# Contextual knowledge: K1/K2/K3

Local, reviewed applicability guidance for Keqing, Fischl and KaedeharaKazuha.
K1 retains the Harbinger of Dawn example; K2 adds bounded role, set, trigger and
team scenarios. K3 maintains the same 24 claims and 17 contextual source inputs.
This is agent source review, not human/in-game or official current-patch certification.
The ongoing maintenance owner is unassigned; the Wednesday/Sunday cadence is manual.

## Runtime and contracts

The calculator produces deterministic decisions and full traces; explanations do
not change those decisions. Equipment and owned teammates come from one coherent
owned SELECT. Missing slots remain bounds. Hypothetical setup and triggers never
write equipment, teams, goals or imports. Effects keep their distinct units and
are not rankings, DPS gains or personalized ER targets.

Authenticated routes under `/api/v1/games/genshin`:

- `GET /characters/:key/guide-advice` retains strict K1 v1.
- `GET /characters/:key/guide-advice/v2` retains strict K2 v2.
- `GET /guide-knowledge/release` reports the API's loaded release identity/scope.
- `GET /characters/:key/guide-advice/v3` returns strict release-aware V3 advice,
  using the existing `contractVersion=2` scenario query grammar.

V3 preserves actual agent/human attribution; V2 excludes human-reviewed claims
rather than relabeling them. The character equipment page mounts both the K1 card
and contextual panel. Optional disclosure shows coverage, source/review limits and
real release identity. Session/async-hash/release epoch guards reject delayed or
mismatched advice. Known-invalid records remain quarantined across failures,
release refresh and assumption changes; coherent records or explicitly aligned
advice recover them. Ordinary failures retain valid last data.

## Local release maintenance

From `apps/api`, use the existing dependencies and a new output workspace for each
operation. The default store is `src/games/genshin/static/knowledge-releases`.
Its approved baseline is `k3-approved-k2-baseline`, release digest
`158816aef44417ecfd4bf29c7bdc2e08b08cc439085083b9143b320bbddb634e`, pack hash
`319d168130ededae60172dc7b708c04d57e641b5bf43d8112f020272ede90450`.

```text
node --import tsx tooling/contextual-knowledge.mjs metadata STORE
node --import tsx tooling/contextual-knowledge.mjs identity STORE
node --import tsx tooling/contextual-knowledge.mjs check STORE NEW_CHECK_DIR [REFS_JSON]
node --import tsx tooling/contextual-knowledge.mjs import STORE NEW_IMPORT_DIR CAPTURE_DIR
node --import tsx tooling/contextual-knowledge.mjs candidate STORE CHECK_DIR NEW_CANDIDATE_JSON
node --import tsx tooling/contextual-knowledge.mjs impact STORE CANDIDATE_JSON
node --import tsx tooling/contextual-knowledge.mjs amend STORE CANDIDATE_JSON AMENDMENT_JSON NEW_JSON
node --import tsx tooling/contextual-knowledge.mjs review STORE CANDIDATE_JSON DECISIONS_JSON NEW_JSON
node --import tsx tooling/contextual-knowledge.mjs validate STORE REVIEWED_JSON
node --import tsx tooling/contextual-knowledge.mjs publish STORE REVIEWED_JSON UNIQUE_ID approved
node --import tsx tooling/contextual-knowledge.mjs activate STORE UNIQUE_ID EXPECTED_IDENTITY_JSON ACTOR
node --import tsx tooling/contextual-knowledge.mjs rollback STORE EARLIER_ID EXPECTED_IDENTITY_JSON ACTOR
```

Replace placeholders deliberately. Capture `identity` output before activation;
the writer checks it under an exclusive lock. `migrate NEW_STORE` is only for a
new unselected store, preserving original K2 provenance; the bundled store is
already migrated. Default checks retain pinned revisions; an explicit refs map
chooses newer repository refs, resolved once per repository. Only tracked paths
and fixed allowed hosts are fetched, with deadlines/size/redirect/work bounds.
Reports distinguish unchanged, changed, removed, unavailable and extraction failure.
A fetch or page change does not approve mechanics. Original reference-note hashes
remain distinct from inspected response/section hashes. No broad guide mirroring.

Impact identifies changed claim dependencies. Decisions bind exact candidate/base
and claim digests, actual reviewer/type/date, scope and changed-source hash evidence
(`source:<id>:<sha256>`). Keep/amend/exclude/conflict/unsupported are explicit;
unresolved affected claims block promotion. Amendment clears stale decisions.
Unaffected reviews retain provenance. Imported source is never executed.

Publication verifies staged pack/registry/review/notices/evidence together and
finalizes immutable bytes. Targeted Git `-text` and formatter exclusions protect
this data; do not regenerate descriptors or format pinned captures. Interrupted
publication retains complete earlier/next selection and failed stages for diagnosis.
Do not steal a live writer lock. After confirming a crashed owner is gone, retain
its stage/lock evidence and inspect the pointer/events before an explicit retry.

Activation/rollback uses an atomic same-volume pointer, followed by **API restart**.
Every process freezes one complete startup snapshot; a running process ignores
pointer changes. Both build paths copy the whole static release tree. For compiled
startup select the packaged store or explicit `CELESTIA_CONTEXTUAL_RELEASE_ROOT`.
Bad selected bytes fail startup; there is no silent fallback or runtime scraping.
Rollback verifies an intact earlier target and descriptor ancestry, including
recovery from damaged current payloads. Keep ancestors; history is bounded to 16.

## Verification and fixture data

Normal tests are discovered by `src/**/*.test.ts` and `tooling/**/*.test.js`.
Use the existing guarded `pnpm verify` with an explicitly disposable test database,
`NODE_ENV=test`, platform-null `DOTENV_CONFIG_PATH` (`NUL` on Windows,
`/dev/null` on Linux), and the existing database identity/ownership guards. CI
already provisions its synthetic PostgreSQL service. Never substitute ordinary
database configuration or weaken missing-fixture checks.

`tooling/contextual-verify.mjs --focused` is an additional local disposable-cluster
wrapper. Its `k1-fixture.json` and provenance document are **generated local setup**,
not committed portable configuration. Create/validate a new private synthetic cluster
using the existing guarded recovery tooling and supply those local records before
using that wrapper or browser harness. Normal CI verification does not need this
machine-local locator. Browser harness output directories must be created locally;
run it only with the same test/null-dotenv/identity guards and stop its owned services.

Required pinned builder fixtures and MIT notices are intentionally retained here:
two K1 weapon inputs, 17 K2 inputs (including the reused MH sheet), their input
manifest and license notices. K3 migration and normal tests read those paths.
Raw local test runs, failed stages, duplicate stores, reviewer probes and browser
control/state are historical review artifacts, omitted from the source selection.
They remain available locally; no formatter/hash guard is relaxed to hide them.
