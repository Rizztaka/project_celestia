# Genshin import API

Local C1a implementation, 2026-09-26. Not yet deployed.

Both routes require the normal bearer access token. Ownership always comes from that token.

## Preview

`POST /api/v1/games/genshin/import/preview`

```json
{
  "requestVersion": 1,
  "payload": { "format": "GOOD", "version": 2, "materials": { "Mora": 200 } },
  "sections": ["materials"]
}
```

The normal success envelope contains `previewToken`, `expiresAt`, `sections`, and `clearSections`. Each section reports its action (`preserve`, `merge`, `replace`, or `clear`), current entry count, incoming entry count (`null` when absent), and resulting entry count. Material counts mean distinct positive-quantity entries, not their sum. Characters merge, including characters absent from the export. Equipment and materials replace only when selected. Missing sections cannot be selected.

Preview performs no writes. An equipment location must resolve to an existing owned character or a character in the selected incoming roster. Duplicate characters, duplicate weapon locations, and multiple artifacts claiming one character slot are rejected. Empty equipment locations remain unequipped. Unrecognized catalog keys are still stored as opaque strings; schema acceptance does not certify game-data accuracy.

## Commit

`POST /api/v1/games/genshin/import`

Send the same envelope with `previewToken` and `confirmClear` (an array, empty when no selected replacement is empty). Every empty selected weapon/artifact/material section must appear in `confirmClear`. A materials map containing only zero quantities is also a clear. Empty characters merge without deleting the roster.

The token expires after ten minutes and is bound to the authenticated owner, normalized request, and complete account/inventory snapshot. Account or inventory changes require a new preview. Two simultaneous commits cannot both apply one preview. No automatic destructive retry occurs. A successful import advances account `updatedAt` monotonically to invalidate even empty replays; this field is not source-observation or import-provenance metadata.

Success returns the four `*Imported` counts and the selected `sections`. A 409 means preview again, including after an uncertain network outcome. A 400 means correct the request/assignments/confirmations. Missing or invalid authentication returns 401. Failed imports roll back account creation and all inventory writes.

## Compatibility and limits

Raw GOOD bodies sent directly to the old commit route now receive 400 with instructions to preview first. Backend and updated frontend must be released together; cached old clients fail safely and need a refresh. No deployed endpoint has been changed during this local work.

GOOD version remains any positive integer under the existing structural validation; it is not a claim that every export-version extension is supported. Characters/weapons remain level 1–90 and ascension 0–6, talents 1–15 stored as provided, artifact level 0–20/rarity 1–5/five slots, and material quantities 0–2147483647. Unknown extension fields are stripped by the current schema. No fuzzy equipment identity, optimizer, automatic game sync, or import history is included. Replacement equipment receives new IDs; durable goals must not depend on them.

## Import status and provenance (C1b)

`GET /api/v1/games/genshin/import/status` returns the authenticated owner's four section statuses without writing. Each includes `status` (`unknown` or `imported`), nullable `importedAt`, nullable exporter-supplied `source`, nullable `entryCount`, and `scope` (`merged_entries` for characters, `replacement_section` otherwise). Unknown is not zero. Import receipt time is not game observation time. Only successful selected sections advance; untouched sections retain their prior metadata. Existing records are not backfilled. The additive provenance migration must run before the new API starts.

## Intent continuity (C3b)

C3b preserves focus membership/revisions and every goal field through partial, empty, replacement and failed imports. Goals retain character/weapon type keys across regenerated equipment IDs and weapon swaps. Import and intent transactions serialize on the owner row. Imports do not auto-complete, retarget or advance declared starting values. Successful web commits invalidate both companion and Genshin views; originating-session checks prevent delayed callbacks from writing into a newly signed-in owner's cache or form.

## Transaction test setup

Create a disposable PostgreSQL database on loopback whose name starts `celestia_test_`, apply the repository migrations with an explicitly local `DATABASE_URL`, and set `CELESTIA_TEST_DATABASE_URL` to that database before running the API Vitest suite. Tests reject non-loopback hosts and other database names, never fall back to `DATABASE_URL`, and clean up only their own generated users. Without the dedicated variable, the integration suite is explicitly skipped. The CI workflow provisions its own PostgreSQL service and runs the integration file separately after migrations.
