# Recorded character equipment

Implemented locally in C3a, 2026-10-03. C3b adds [focus and durable goals](focus-goals.md), validated locally 2026-10-04. The equipment read contract remains unchanged.

C4 acceptance correction, 2026-10-06: JSON section receipts now carry an explicit UTC timezone when selected from timestamp-without-time-zone storage. This prevents non-UTC API hosts from shifting the recorded import time. The [C4 regression and browser evidence](../plans/c4-today-weekly-plan/walkthrough.md) verify exact character/weapon/artifact receipt timestamps alongside Materials; no saved timestamp or ownership/equipment semantics changed.

`GET /api/v1/games/genshin/characters/:characterKey/equipment` requires bearer authentication. The server resolves the account from the token user, then the owned character by its natural key. Clients URL-encode the key. Keys are opaque strings of 1–200 characters without control characters; invalid keys return 400. Missing account, missing character and another owner's character all return the same 404, `Character not found.` Unauthenticated requests return 401.

The version-1 [shared contract](../../packages/api-contracts/src/genshin/character-equipment.ts) contains:

- `character`: natural key, stored level/ascension/constellation, stored normal/skill/burst talents and `talentBasis: stored_convention_unknown`. Persistence does not identify default-origin values or establish base versus constellation-adjusted talents.
- `weapon`: assignment state and, when present, stored key, level, ascension, refinement and lock flag.
- `artifacts`: all five named slots, each with an assignment state. Assigned pieces include set/slot keys, rarity, level, main-stat key, supported substats and lock flag. Main-stat amounts are absent from storage, so `mainStatValue` is always null. Unsupported legacy substat JSON returns null; a valid empty substat array remains empty. Raw numeric values, including zero, retain their stored meaning without inferred units.
- `unrecognizedSlots`: owned assigned legacy pieces with unsupported slot keys. They do not replace any of the five named slots.
- `provenance`: independent characters/weapons/artifacts section receipts with `status`, import time, source label, supplied entry count and merge/replacement scope. These are section receipts, not item observation timestamps or complete-scan evidence.
- `artifactRelationsConsistent`: false when a foreign legacy artifact relation points at the character. Only owned pieces are returned.

| Assignment state                        | Meaning                                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `recorded_assigned`                     | An owned piece is assigned in storage; its section receipt may still be unknown.                                                       |
| `unrecorded` / `no_recorded_assignment` | The section has an import receipt, but no piece is assigned in the recorded data. Explicit empty replacement also produces this state. |
| `unknown` / `provenance_unknown`        | No assignment and no section receipt.                                                                                                  |
| `unknown` / `inconsistent_relation`     | A relation cannot safely resolve to owned equipment. No foreign item fields or IDs are exposed.                                        |

None of these states proves an empty in-game slot. Explicit empty-slot observations cannot be represented by current persistence. A receipt's entry count does not establish a complete game scan. Character imports merge entries; a newer receipt does not date every retained character. Omitted weapon/artifact sections preserve their records and receipts independently.

The repository uses one parameterized PostgreSQL SELECT, including owned relation and receipt subqueries. This provides one MVCC snapshot during an import and performs no account creation, freshness update, normalization, lock or transaction-control query. Internal database IDs are excluded from the response and durable navigation uses `/roster/:characterKey`.

The web query uses `['genshin', 'character-equipment', characterKey]` and passes its abort signal to the API client. Existing successful-import invalidation of `['genshin']` includes detail views. Failed preview/commit does not invalidate good data. Failed refresh keeps previously loaded records with an explicit error label; session changes clear and remount the account query client, isolating delayed responses. A 404 consults read-only import status to distinguish no recorded import from an absent character.

Existing roster, inventory and equipment API shapes remain compatible. C3b goal writes use a new strict versioned contract; see the compatibility section in the focus/goal API. The touched roster suppresses foreign legacy weapon relations and describes absence as unrecorded. This endpoint never calls top-five Artifact Intelligence, AES, ROI, set-effect or quality-score services. No C3a migration was added; C3b has its own additive intent migration.

C3b detail links use character natural keys and capture the currently selected weapon type key in the goal form. Later equipment swaps do not retarget that intent. Stored character ascension can appear beside a declared target; raw talent and individual weapon-copy comparisons remain unknown. Imported progression never changes lifecycle or the declared starting range. Focus and goals are separate reads from the coherent equipment/receipt snapshot, not a combined historical observation.
