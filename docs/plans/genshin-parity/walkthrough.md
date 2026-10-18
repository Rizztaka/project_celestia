# Genshin catalog modernization — 2026-10-18

Implemented source-backed catalog/reference regeneration and inventory-optional
macro planning. Coverage is complete for the supported records of the pinned
snapshot; this is not an unconditional claim of live-game 100% parity.

## Delivered

| Generated coverage                                        | Count |
| --------------------------------------------------------- | ----: |
| Character goal targets, including 7 Traveler forms        |   129 |
| Distinct source character identities with ascension costs |   122 |
| Descriptive character profiles and element/weapon entries |   131 |
| Characters with ordinary base talent costs                |   120 |
| Usable weapons, including 1–5-star records                |   252 |
| Talent/weapon domain families                             |    48 |
| Progression materials                                     |   508 |
| Artifact sets                                             |    63 |
| Weekly enemy reward records                               |    14 |
| World-boss enemy reward records                           |    48 |
| Explicit recipe-backed 3:1 crafting families              |   107 |

The requested Natlan characters and four artifact sets are included. Weekly
boss placeholders and incorrect drop joins were replaced with real reward IDs.
Weapon types live alongside biographies in `character-profiles.json` and in the
generated `character-weapon-types.json`; `character-elements.json` keeps its
string-map format for existing consumers. Verified display aliases are resolved
separately, and Traveler forms do not inflate the roster denominator.

The sync tool now discovers folders from one pinned commit, verifies Git tree
and blob identities, and uses commit-specific cache files. The generator verifies
cached SHA-256/data equality, regenerates both clients and all references, and
updates farming family joins without discarding historical routes or yields.
The original pin was already upstream's latest commit; retaining that real pin
was deliberate.

The material bridge retains all five actionable anchors. Only actual progression,
scheduled-domain and boss-reward materials enter the runtime catalog; unrelated
recipes, wood, dyes and forage are excluded. Mora, gems, crowns and enemy drops
remain because real upgrade costs require them.

Planner and Today show goal-first requirements without an inventory entry.
`planningDelta` subtracts recorded stock and craftable surplus while `delta`
continues to mark missing observations unknown. Farming estimates plan the full
unrecorded requirement after a player chooses difficulty, with explicit stock
assumptions. Crafting reserves all lower-tier demand, spends stock once, rounds
down at every 3:1 tier, and never downgrades items. No import or goal is changed.
Calculations and explanations remain separated.

Existing subjective character rankings and stat weights remain labeled editorial
opinions. Full roster biographies do not manufacture new meta rankings. Conditional
artifact set effects are catalog metadata rather than unconditional score buffs.

## Reproduction

From the repository root, substitute an explicit private source-cache directory:

```powershell
node apps/api/tooling/sync-progression-catalog.mjs <cache-directory>
node apps/api/tooling/build-progression-catalog.mjs <cache-directory>
```

The sync command optionally accepts a reviewed full commit SHA as its third
argument. Never change the default pin without reviewing the source differences.
Offline generation includes the domain schedule and a fingerprint-checked farming
family refresh. A full coordinate/yield rebuild is also supported:

```powershell
node apps/api/tooling/build-farming-data.mjs <farming-cache> <source-cache>/source-data.json
```

Catalog content fingerprint:
`1b6ee33f1d1946fe312daf8083b7bdac7c13a84ae209ab20a37d27de4df86e81`.
Serialized catalog SHA-256:
`a58715f82d8a19d5c1cf885fa8abde3ae32248f19084a145065cd54bcf7f6ec7`.

## Verification

Final command results are recorded in [validation-results.json](validation-results.json).
The new checks cover Natlan costs, cross-client target parity, full descriptive
coverage, all five material categories, Fontaine/Natlan rotations, real weekly
boss drops, requested artifact effects, invalid crafting joins, empty-inventory
planning, partial stock/crafting credit, unchanged observations and rendered
goal-first material rows. Existing primary Hu Tao totals remain passing.

Ten generated files were byte-identical on an offline regeneration. The full
farming rebuild also passed after correcting an audited raw-byte checksum; all
historical route coordinates, teleports and yield arrays remained identical.

## Remaining evidence limits

- 129 targets include Traveler forms; there are not 129 independently verified
  collectible identities in this source snapshot.
- Manekin/Manekina have metadata but no cost quantities upstream. Three temporary
  Prized Isshin Blade variants are deliberately excluded.
- Traveler per-slot talent exceptions remain unavailable. No generic table was
  applied to every slot.
- Two later weekly source records have unknown entrance/region metadata. All
  requested Fontaine and Natlan boss joins are present.
- The retired weekly-defeat endpoint remains disabled; current routine reward
  claims keep their existing accounting flow.
- Historical map/yield limits remain. No new boss run estimate or player world
  level is invented. No live-browser acceptance or database-gated integration
  execution is claimed by the default test run.

See [sources.md](sources.md) for pinned URLs, counts, the raw-coordinate checksum
correction, editorial assumptions and the distinction between seen and unknown
evidence. Historical `character-materials.json` and Section 1 evidence are intact.
No dependency, Prisma schema or migration change was needed.
