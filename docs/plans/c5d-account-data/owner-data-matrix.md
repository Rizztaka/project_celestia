# Ownership, export and deletion matrix

All columns exported explicitly, except users.password (secret, deliberately omitted).
Scalar PostgreSQL text retains original values without live projections. All listed
tables use per-table sentinel, aggregate rows/text/output bounds; singleton tables
have stricter row caps. Deletion is one transaction; no catalog rows are deleted.

| Table                    | Ownership path                              | Export content                                            | Deletion disposition                                                                 |
| ------------------------ | ------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| users                    | JWT subject = id                            | id/email/username/createdAt/updatedAt                     | Last explicit delete; password never exported                                        |
| genshin_accounts         | userId                                      | Account metadata including null UID                       | User cascade                                                                         |
| genshin_characters       | accountId → genshin_accounts                | Roster, raw talents, equippedWeaponId                     | Account cascade; lock before cross-owner equipment check                             |
| genshin_weapons          | accountId → genshin_accounts                | Every weapon copy, flags                                  | Account cascade; reject foreign assigned character                                   |
| genshin_artifacts        | accountId → genshin_accounts                | Stats JSON text, assignment, flags                        | Account cascade; reject foreign equipped character                                   |
| genshin_materials        | accountId → genshin_accounts                | Stock including legacy values                             | Account cascade                                                                      |
| genshin_import_sections  | accountId → genshin_accounts                | Independent section receipts, source, exact time/count    | Account cascade                                                                      |
| genshin_character_focus  | accountId + characterKey → character        | True/false membership and revisions                       | Character composite cascade                                                          |
| upgrade_goals            | userId                                      | All lifecycle/history/predecessor/request/revision fields | Lock, reject cross-owner predecessor links; clear own predecessors, delete own goals |
| genshin_routine_state    | userId                                      | Raw periods, unknown/null, manual checkpoint              | User cascade                                                                         |
| genshin_plan_preferences | userId                                      | Stored choices/revision                                   | User cascade                                                                         |
| genshin_plan_dismissals  | userId; composite goal owner FK             | Source/scope/period/goal/routine/revision                 | Goal/user cascade                                                                    |
| daily_companion          | userId                                      | Frozen legacy records, exact timestamps                   | User cascade                                                                         |
| weekly_boss_state        | userId                                      | Frozen legacy boss JSON and periods                       | User cascade                                                                         |
| event_progress           | userId                                      | All retained event/tier flags                             | User cascade                                                                         |
| spiral_abyss_runs        | accountId → genshin_accounts                | Every cycle/chamber/team JSON                             | Account cascade                                                                      |
| imaginarium_theater_runs | accountId → genshin_accounts                | Every season/cast JSON                                    | Account cascade                                                                      |
| NikkeAccount             | userId                                      | Retained account metadata                                 | User cascade                                                                         |
| NikkeCharacter           | accountId → NikkeAccount                    | All retained progression fields                           | Account cascade                                                                      |
| NikkeEquipment           | characterId → NikkeCharacter → NikkeAccount | All retained equipment fields                             | Character cascade                                                                    |

_prisma_migrations is deployment metadata, excluded from export/deletion and compared
unchanged in PostgreSQL tests. All thirteen migration files remain immutable.
PostgreSQL catalogs/constraints/types/indexes and version-controlled static catalogs
are not personal account rows; preserve and compare metadata separately.

## Protected routes and concurrent writers

/auth/me; /users/:id; all /companion plan/advice, routine, legacy daily/resin/checklist/
weekly-bosses, goals/materials/today, events routes; Genshin import/status/preview,
characters/focus/equipment, weapons/artifacts, all eight intelligence endpoints,
simulators/banners and simulate-pulls, endgame abyss/theater; all NIKKE account/roster
routes. Every existing requireAuth becomes signature + uncached existence check.
Public register/login, health and permitted preflight retain their contracts.

Imports lock users first; goal/routine/plan/focus writes also serialize by user.
Event tier upserts reference users. NIKKE account creation references users;
character creation references owned account. Endgame upserts reference owned Genshin
account. Existing legacy daily/weekly write routes delegate to routine transactions.
FK key-share locks serialize their insert/update with parent deletion, and cascade
or FK rejection prevents survivors. User creation exists only in registration and
gets a fresh UUID. No protected route creates a platform identity.

Equipment FK owner equality and goal predecessor owner equality are application
invariants rather than database constraints. Both directions must be checked before
deletion to prevent SET NULL changes to another owner's row. Lock referenced owned
rows before checking, then reject inconsistent relationships intact. Focus and plan
dismissals already have compound ownership constraints. No weakening or migration.
