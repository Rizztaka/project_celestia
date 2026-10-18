# C1a: safe account imports

Date: 2026-09-26. Local implementation authorized; no push or deployment.

## Contract and scope

Introduce version 1 of the import request envelope with the original GOOD payload and explicit selected sections. Preview validates data and assignments, returns existing/incoming/result counts, and issues a ten-minute signed token bound to the user, normalized request, and current inventory snapshot. Commit requires that token and explicit confirmation of each selected empty replacement section. Legacy raw GOOD requests receive an actionable 400 instead of bypassing preview. Update the web client in the same milestone; cached old clients fail safely.

Absent or unselected sections remain untouched. Selected characters merge; selected weapons, artifacts, and materials replace their respective inventories. Empty characters never delete the roster. Material zero quantities are omitted from storage and count as an empty replacement if no positive quantities remain. Retain the current GOOD field ranges/key handling and talent interpretation; do not claim live game-mechanics verification.

Reject duplicate characters, duplicate weapon locations, duplicate artifact slots per character, and unresolved equipment locations before writing. Resolve against both existing account-owned characters and selected incoming characters. Unknown game keys remain accepted as opaque identifiers; they are not a verified catalog.

## Persistence and concurrency

Move database access into an importer repository. Read a consistent snapshot for preview. Commit in one serializable transaction: lock the authenticated user's existing platform row (covering first account creation), read/compare the snapshot, initialize account if needed, apply selected sections, and advance account updatedAt monotonically. Existing inventory rows and updatedAt are included in the fingerprint. This rejects replay/stale previews without a schema migration; updatedAt is a concurrency marker, not an import provenance timestamp.

Concurrent import serialization failures return 409 and require a new preview; do not silently retry destructive operations. Account creation and all inventory writes roll back together. Snapshot comparison is conservative: any account/inventory edit invalidates preview. Do not log payloads or tokens. Preview performs no writes. No new optimizer, historical inventory matching, migration, production writes, or new hosting.

## Validation

Add schema/service/token and actual HTTP routing tests. Exercise absent/unselected/empty/full sections, owned existing locations, collisions, preview tampering/expiry/user binding, stale state/replay, legacy callers, and authentication. Validate rollback and simultaneous commits with Prisma against an isolated local PostgreSQL-compatible test database, recording any environment limitations. Update the import UI with preview, section selection, clearing confirmation, safe retry, and invalidation of affected cached views. Check UI through the available browser, lint, types, and build. Preserve unrelated local files and the Turbo test log.
