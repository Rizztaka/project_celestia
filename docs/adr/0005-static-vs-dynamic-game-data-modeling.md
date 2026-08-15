# **# ADR 0005: Static vs Dynamic Game Data Modeling**

**Status:** Accepted

**Date:** 2026-08-05

**Project Architect:** Rizztaka

**Project Owner:** Rizztaka

\---

## **Context**

When designing the database schema for a user's Genshin Impact roster (characters, weapons, artifacts), we had to decide how to represent the static game data (e.g., character base stats, weapon types, artifact set bonuses) alongside the dynamic user data (e.g., a player's character level, constellation, artifact sub-stats).

Genshin Impact is a live-service game. Every 6 weeks, a new patch introduces new characters, weapons, and artifact sets. If we modeled static game data within the relational database (e.g., a `GameCharacter` table with a foreign key from `UserCharacter`), every game patch would require a database migration or a database seeding script to insert the new entities.

Furthermore, we need to anticipate future requirements:

1\. **Multi-Account Support:** Eventually (Phase 6), a user may want to link multiple Genshin Impact UIDs (e.g., one for the NA server, one for the EU server).

2\. **Performance:** Artifacts can have up to 4 sub-stats. Creating a relational junction table for artifact sub-stats would add significant join overhead when querying a user's entire inventory (which can contain up to 1500 artifacts).

\---

## **Decision**

We have made three key architectural decisions for game data modeling:

### 1\. Static Game Data is NOT stored in the Database

The PostgreSQL database will **only** store dynamic, user-owned instances of game entities.

Static game data will be stored as version-controlled JSON files within the application codebase.

Instead of foreign keys to database tables, the database models will use **String Keys** (e.g., `characterKey: "hutao"`) that reference the static JSON files.

- **Why:** When the game updates, we simply update the JSON files and deploy. No database migrations, no seeding, no risk of database drift. The database remains completely decoupled from the game's patch cycle.

### 2\. Artifact Sub-stats are stored as JSON

We will store artifact sub-stats in a `Json` column on the `GenshinArtifact` model, rather than creating a separate `ArtifactSubStat` junction table.

- **Why:** The primary use case for the database is storage and retrieval of the user's roster. Filtering and analyzing artifacts (e.g., "find all artifacts with Crit Rate > 10%") will be performed in memory by the Intelligence Core (Phase 4). Storing them as JSON avoids expensive `JOIN` operations when loading the inventory. If profiling in Phase 4 reveals this is a bottleneck, we will migrate to a junction table at that time.

### 3\. `GenshinAccount` acts as the Ownership Root

Instead of linking characters, weapons, and artifacts directly to the platform `User`, they are linked to a `GenshinAccount` entity, which in turn belongs to the `User`.

- **Why:** In Phase 2, we enforce a strict 1:1 relationship between `User` and `GenshinAccount` via a unique constraint. However, this structure future-proofs the application for Phase 6 (Advanced Systems). Supporting multi-account will only require dropping the `@unique` constraint on `GenshinAccount.userId`. No structural changes to the characters, weapons, or artifacts tables will be necessary.

\---

## **Consequences**

- **Positive:** Zero database migrations required when Genshin Impact updates.
- **Positive:** Multi-account support is architecturally prepared.
- **Positive:** Database queries for user inventories remain shallow (few joins).
- **Negative:** We cannot rely on the database for referential integrity of game data (e.g., we cannot prevent inserting a character with a misspelled `characterKey` at the database level).
- **Mitigation:** Referential integrity must be enforced at the application boundary (Zod schemas and validation logic during import).
