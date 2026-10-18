# C1b provenance and cache isolation handoff

Implementation: 2026-09-26. Handoff finalized 2026-09-27. Local, uncommitted, unpushed; no production changes.

## Behavior

Added one latest successful import record per account/section with receipt timestamp, optional exporter-provided source label, and supplied entry count. Only selected sections advance inside the same import transaction. Missing metadata stays unknown; an imported empty section is explicitly known as zero supplied entries. Character scope is merged entries and does not certify freshness of older retained characters. No game observation date or full import history is inferred.

`GET /api/v1/games/genshin/import/status` requires authentication, reads only the authenticated owner's metadata, and performs no writes. The shared response contract supports freshness panels on import, roster, and inventory pages. Import success invalidates those views. Existing goals remain tied to user/static keys and survive equipment-ID replacement.

Each authentication session now owns a separate TanStack Query client. Token changes clear the previous cache and remount the provider, preventing late query responses or mutation rollback callbacks from leaking data into a later session. Existing retry policy is preserved. Headless cache regressions live in API `tooling/account-cache.test.js` and import the actual web module; no separate frontend test-runner dependency was introduced.

## Migration and release

`20260926173000_add_import_section_provenance` adds an enum and a table with an account foreign key and unique account/section index. There is no backfill: inventing timestamps for existing inventory would misrepresent freshness. Applied only to the isolated loopback PostgreSQL test database. Prisma migrate diff against that database reported **no difference** from the schema. Regenerated the local Prisma client.

Before any later authorized release, apply the additive migration before starting the new API, deploy the compatible frontend, and account for cached old clients receiving the C1a preview-required 400. A rollback to old importer code would stop maintaining provenance and restore the unsafe old import behavior; review rollback deliberately. No production migration, push, hosting action, or deployment is authorized by this handoff.

## Validation

- Final full suite with integration enabled: **346 passed / 26 files**, including **16 native PostgreSQL integration tests**, **28 importer service tests**, **10 importer HTTP tests**, **five account-cache tests**, and the existing **22 security HTTP tests**.
- Integration covers actual rollback, simultaneous first/existing-account imports, missing-section preservation, unknown legacy provenance, selected-section metadata updates, zero versus unknown, and goal continuity. Snapshot equality after a failed import includes provenance rows.
- Uncached root lint: API and web passed. Uncached root build: API contracts, API, and web passed; these builds compile all application TypeScript.
- Browser checked legacy unknown provenance, an actual material import updating only that section's source/date, preserved character/weapon data, and sign-out returning to login. Late-response and session-switch behavior is covered by executable cache regressions; a second-account browser login was not part of the final manual check.
- All changed source/configuration files were formatted. Repository-wide formatting still flags only the pre-existing unrelated `apps/api/src/core/ai/openrouter.ts`; it was not changed to manufacture a green check. CI has not run for the unpushed work.
- The pg 8 driver emits a deprecation notice about overlapping client queries during Prisma transaction reads. Tests pass on pinned dependencies; this deserves attention before a future pg 9 upgrade.

Unrelated `.env.example`, environment configuration, OpenRouter source, and Turbo test-log hashes remain unchanged. Existing OpenAI dependency changes were preserved in the manifest and lockfile. See [current handoff](../CURRENT_HANDOFF.md) before further work.

## Local test environment

Validation used a fresh PostgreSQL 18.4 cluster under the OS temporary directory, exclusively on `127.0.0.1:55439`, database `celestia_test_import`. Native binaries were found under `D:/PostgreSQL/bin`; the existing installed PostgreSQL service/data directory was not modified. Test connection strings were explicitly supplied, never read from the real API `.env`. The local API and Vite used ports 4017 and 5179 for browser checks. By the September 27 handoff, the temporary processes had already ended; loopback connection checks confirmed no listeners on all three ports.

For reruns, provision a disposable loopback `celestia_test_*` database and apply migrations using an explicit local `DATABASE_URL`. Set `CELESTIA_TEST_DATABASE_URL` when running API Vitest directly. Integration tests reject remote hosts/unrecognized database names and otherwise skip when that dedicated variable is absent. The updated CI provisions its own PostgreSQL service and invokes integration separately.
