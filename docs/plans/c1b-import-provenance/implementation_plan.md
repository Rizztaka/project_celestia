# C1b: import provenance and account continuity

Date: 2026-09-26. Local implementation only; C1a already verified separately.

Add one latest-import record per account/section: importedAt, caller-supplied source label, and count of supplied entries. Characters record merge scope; inventories record replacement scope. Do not store raw exports or fabricate a source-observation time. Existing accounts get no synthetic records: absent metadata means unknown. Metadata advances only inside the successful import transaction, only for selected sections. Goals remain user-owned and independent of replacement equipment IDs.

Prepare an additive migration without backfill; apply it only to the disposable local test database. Add an authenticated read-only status endpoint and shared response type. Show freshness on the import, roster, and equipment pages. Preserve metadata for untouched sections and invalidate status after import. Clear TanStack Query state on authentication changes so another account cannot receive cached inventory.

Verify unknown existing accounts, zero-count versus unknown, per-section timestamp preservation, failed writes, goal continuity, access control, read-only status, and account changes including in-flight queries. Run migrations/tests against isolated PostgreSQL and complete lint/types/build. No deployment or production migration.
