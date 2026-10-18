# C3a implementation plan

Prepared before application edits, 2026-10-02. Extend existing characters/import/account modules and React/TanStack Query patterns. No new game, engine or persistence.

## C2b gate

Inspect saved HoYoLAB identity and all 15 talent responses against the projection, all consumed costs including Mora, exact ranges/fields, dependency hashes, joins, exclusions, nullable stock, placeholder guards and provider consumers. Record findings and fixes in C2b implementation_review.md. Missing candidate/route sources are valid unavailable states. Preserve C2a routines and clock.

## Read and state contract

Add GET /games/genshin/characters/:characterKey/equipment, resolving the account from bearer user identity. One parameterized SELECT joins the owned character and uses owned correlated weapon/artifact/section queries. One statement has one PostgreSQL snapshot, avoiding progression/equipment/receipt mixtures during imports and transaction control queries on GET. Missing account, character and another owner's character all return identical 404. Reject empty, overlong or control-character keys; URL-encode opaque natural keys. Equipment UUIDs are absent from navigation.

Equipment assignment and provenance are orthogonal. A saved owned piece is recorded_assigned even with legacy unknown provenance. Without a piece: imported section -> unrecorded (no assignment in stored data); missing section receipt -> unknown. An inconsistent relation -> unknown with a safe reason and no foreign item fields. Explicit empty section replacement remains unrecorded, never confirmed unequipped. No known-empty game state exists. Malformed legacy substats remain unavailable without crashing or fabricating values.

Expose stored character progression/talents, weapon key/level/ascension/refinement/lock, and flower/plume/sands/goblet/circlet records with set/rarity/level/main-stat key/substats/lock. Main-stat amount is null because persistence has none. No talent convention inference, observation/default inference, scores, set bonuses or advice eligibility. Include relevant section receipts in the same read. Character section receipt is a merge receipt, not per-character observation; weapon/artifact receipts are replacement receipts, not full-scan evidence.

## UI and compatibility

Add /roster/:characterKey within existing protected routes. Roster links use encoded natural keys; correct unconditional equipped-absence wording. Render all slots, stored progression, provenance, recorded set counts, readable key/image fallbacks, loading/retry, 404, no-import and partial-data states. Preserve roster/inventory and legacy Intelligence endpoints/callers. Detail query lives under ['genshin'] so existing successful-import invalidation refreshes it; failed imports preserve cached data. Use AbortSignal and existing token-scoped QueryClient clear/remount for delayed responses.

## Validation

Use only explicit disposable loopback celestia_test_* PostgreSQL and disable dotenv. Verify ownership including deliberately inconsistent legacy cross-account relations; full/partial/empty/legacy reads; all slots, unknown keys and absent amount; no account creation; SELECT-only queries; omitted-section preservation, replacement UUID changes and goals; failed imports; concurrent snapshot reads. Extend actual web cache/renderer tests in API tooling without adding dependencies. Run direct full Vitest (never Turbo), lint, types/builds, touched-file formatting, eight hash checks and browser desktop/mobile flows with synthetic users. Record fresh counts and limitations; stop fixture processes afterward.
