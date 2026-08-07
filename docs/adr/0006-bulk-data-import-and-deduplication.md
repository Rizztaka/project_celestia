# ADR 0006: Bulk Data Import and Deduplication Strategy (Milestone 2B)

Status: Accepted
Date: 2026-08-07
Project Architect: Rizztaka
Project Owner: Rizztaka

---

## Context

Project Celestia requires users to import their Genshin Impact account data (characters, weapons, artifacts) using the community-standard GOOD (Genshin Open Object Description) format. This import process involves parsing a large JSON payload (potentially containing 60+ characters, 200+ weapons, and 1500+ artifacts) and syncing it with the PostgreSQL database.

We needed to decide on two major architectural concerns:
1. **Deduplication Strategy:** How to handle subsequent imports when a user updates their account data.
2. **Database Operations:** How to interact with the database to ensure atomicity, prevent partial imports on failure, and maintain performance.

---

## Decision

We have made two key architectural decisions regarding the GOOD format importer:

### 1. Upsert for Characters, Replace for Weapons & Artifacts
* **Characters (Upsert):** Characters have a stable, natural identifier (e.g., `HuTao`, `raiden_shogun`). A user can never own two identical characters. Therefore, we use an **Upsert** strategy: if the character exists in the database, update its progression values (level, talents, constellations); if it doesn't, create it. Characters missing from the payload are left untouched, as they represent a scanner omission rather than actual data loss in the game.
* **Weapons & Artifacts (Replace):** The GOOD format does not provide stable IDs for weapons or artifacts, and users frequently own duplicate items (e.g., two identical 3-star weapons) and routinely discard old artifacts. Due to the lack of stable IDs, we use a **Replace** strategy: every import fully deletes all existing weapons and artifacts for that account, and re-inserts the entire set from the new payload.

### 2. Interactive Prisma Transactions Bypassing CRUD Services
The `GenshinImportService` interacts directly with Prisma using an **interactive transaction** (`prisma.$transaction(async (tx) => { ... })`) instead of reusing the individual domain CRUD services (e.g., `GenshinCharacterService.addCharacter()`).

* **Why not reuse CRUD services?** The CRUD services from Milestone 2A are designed for single-record, user-initiated operations and enforce rules like throwing a `ConflictError` on duplicate character insertion. Reusing them would break the upsert requirement and result in N+1 query performance issues.
* **Why interactive transactions?** We need to chain operations (e.g., resolving character IDs to establish weapon/artifact equipment relationships) which is not possible in Prisma's batch transaction mode. The interactive transaction guarantees complete atomicity: if any step fails (e.g., invalid data, constraint violation), the entire import rolls back, leaving the database pristine without partial data.

---

## Consequences

### Positive
* **Atomicity:** Partial data imports are impossible. A failed import safely rolls back.
* **Data Integrity:** The replace strategy for artifacts and weapons perfectly mirrors the user's current game state without complex diffing algorithms that would fail without stable IDs.
* **Performance:** Direct transaction usage avoids the overhead and N+1 queries associated with looping over single-record CRUD services.

### Negative
* **Service Duplication (Minor):** The importer service contains its own Prisma insertion logic, slightly duplicating the data schema knowledge present in the individual CRUD services. This is an accepted trade-off for bulk operational performance and atomicity.
* **Destructive Updates:** The replace strategy means any theoretical metadata we might attach to an artifact in the future (e.g., user notes) would be lost on re-import. If such features are requested in Phase 6, we will need to revisit this strategy and potentially implement a custom hashing algorithm to generate stable IDs from artifact stats.
