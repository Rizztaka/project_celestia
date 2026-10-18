# Genshin parity source review — 2026-10-18

## Seen: upstream revision and normalization

The GitHub `main` commit was resolved on 2026-10-18 to
[`49a6544a6c6ae36089cb42fa591fc46f01de8bcf`](https://github.com/theBowja/genshin-db/tree/49a6544a6c6ae36089cb42fa591fc46f01de8bcf),
dated 2026-09-21, with message `7.1 assemble`. This is the same revision the
previous catalog used. Its README advertises 7.1; this review does not independently
establish release eligibility or live in-game availability for every source record.
There was no newer source commit to substitute, and no invented character was added
to satisfy a requested count.

The nonrecursive commit tree was traversed through `src/data/English`. Every
selected folder tree was recomputed as a Git SHA-1 tree object; every downloaded
file was checked against its parent tree's Git blob ID. Files are cached inside a
commit-specific directory. Offline generation independently checks raw SHA-256
hashes and equality between cached JSON and the collected source records. No
downloaded code is imported or executed. The MIT notice is retained in
`docs/third-party/genshin-db-LICENSE.txt`.

| Selected source folder | JSON records |
| ---------------------- | -----------: |
| characters             |          124 |
| talents                |          127 |
| weapons                |          255 |
| materials              |          921 |
| domains                |          284 |
| enemies                |          347 |
| artifacts              |           63 |
| crafts                 |          295 |

The normalized catalog fingerprints 1,549 consumed source files. Character
biographies, element/weapon types, rarity, birthdays, affiliations, constellations
and voice actors come directly from character records. The optional second
`dvaJi/genshin-data` source was unnecessary and was not ingested.

## Seen: coverage and exclusions

- 122 source character identities have complete supported ascension costs.
  Adding seven explicitly named Traveler forms gives **129 goal targets**, not
  129 distinct collectible characters. Forms reuse Aether's ascension table and
  are identified by the separately sourced Traveler talent records. Roster
  completion deduplicates the denominator by game ID.
- All 124 original character records plus the seven Traveler forms have
  descriptive profiles and element/weapon metadata: **131 reference entries**.
  Manekin/Manekina metadata is included, but their ascension costs are excluded
  because the upstream quantities are missing.
- 120 ordinary characters have complete shared base-talent tables, levels 1–10.
  Aether, Lumine and the seven Traveler forms have no guessed talent tables.
  The source's generic Traveler table does not resolve every slot's exceptions.
- 252 weapons remain after excluding three identically named temporary
  `Prized Isshin Blade` quest variants. One- and two-star weapons retain their
  actual four-phase ascension limits.
- All 48 scheduled material families are normalized, including Fontaine,
  Natlan and later source regions. Every tier joins the same domain and days.
- 63 artifact sets include sourced one-/two-/four-piece text where present.
  `_sets` in `artifact-stat-weights.json` keeps these conditional effects separate
  from the existing character-specific numerical weight profiles.
- 14 weekly enemy reward records and 48 world-boss enemy reward records are
  joined by real material IDs. The latter are enemy records, not a claim of 48
  distinct encounters; paired enemies can share a reward pool. No reward mean
  is inferred from an enemy preview.
- 107 directional crafting families come from explicit single-input, 3:1
  recipes. Consecutive item-ID and name heuristics were removed from runtime
  conversion discovery. Dream Solvent conversion is not treated as 3:1 crafting.

The five actionable anchors are explicit material categories: 72 talent books,
96 weapon materials, 42 weekly drops, 48 world-boss drops and 60 local
specialties. Another 190 materials support actual progression costs (Mora,
gems, enemy drops and crowns). Food, wood, dyes and unrelated forage are not
bulk-imported. Material source strings containing upstream placeholder crafting
amounts are omitted from display.

The existing `character-materials.json` and
[Section 1 historical evidence](../section1-game-data/sources.md) were preserved.
New community coverage does not promote itself to primary evidence or supersede
the historical primary Hu Tao level 1–6 claim.

## Reviewed entrance joins and unknown metadata

Boss reward IDs and names come from the pinned enemy records. Those records
do not contain entrance/region fields, so the generator has an explicit reviewed
entrance map rather than fuzzy name matching. Existing valid boss keys remain
stable, including the old `Shoukumonegate` key for the Narwhal. Fictional
`Beisht`, `Chlothar` and `BabyLizard` placeholders were removed.

The map uses Confront Stormterror, Wolf of the North Challenge, Enter the Golden
House, Beneath the Dragon-Queller, Narukami Island: Tenshukaku, End of the Oneiric
Euthymia, Joururi Workshop and The Realm of Beginnings for the older encounters.
Fontaine/Natlan/newer joins were checked against the following references:

- [HoYoWiki: Shadow of Another World / All-Devouring Narwhal](https://wiki.hoyolab.com/pc/genshin/entry/5786?lang=id-id).
- [Scattered Ruins / The Knave](https://genshin-impact.fandom.com/wiki/Scattered_Ruins).
- [Stone Stele Records / Lord of Eroded Primal Fire](https://kayco.app/genshin/weekly-boss-materials/eroded-horn).
- [Unresolved Chess Game / The Game Before the Gate](https://www.hoyodex.com/wiki/genshin-impact/the-game-before-the-gate).

The additional source records `The Doctor` and `Il Dottore` have distinct reward
IDs. Their entrances/regions were not independently established; the reference
keeps these fields explicitly unknown. Their names are not merged on inference.

The retired legacy weekly-defeat endpoint remains unavailable. The current
routine's manual aggregate reward-claim accounting remains the active flow;
refreshing reference data does not reactivate the old endpoint's Asia-only clock
and read-time persistence behavior.

## Assumptions and subjective fields

The five existing build-ranking profiles are retained as **legacy editorial
opinions**, labeled `legacy_editorial`. Every other descriptive profile has
`recommendationBasis: unavailable`. A biography is not evidence for a meta tier,
talent priority or artifact stat weighting. The character recommendation service
therefore continues to explain generic fallback scoring for unranked characters.

Goal-first planning credits only recorded stock. Unrecorded stock contributes
nothing to a planning scenario, while the observed `inventory` and nullable
`delta` fields retain their original unknown semantics. `planningDelta` reports
the requirement after known stock and crafting credit; no inventory or goal is
written. Mean-yield scenarios still require an explicitly selected domain tier.
There is no invented world-boss run/resin estimate or assumed player world level.

## Historical farming snapshot and checksum correction

Coordinates and mean yields retain the existing pinned sources and coverage
limits. All 6,176 coordinate points, 48 routes, 247 teleport anchors and yield
arrays were compared before/after regeneration and are unchanged.

The full farming generator initially rejected the coordinate download. Inspection
established that its old checksum represented **LF-normalized text**, whereas
the pinned repository stores mixed line endings. The raw 2,461,601 bytes were
independently checked against Git blob
`e7ee0a29c6ce399d12e7399fb29d15416c1063d9` at canvas-genshin-maps revision
`2154df87e9e4ac8a0733c7603120603cc1d489b6`.

- Raw SHA-256: `46065214cad4f791585fce2db1a37683f3d04fb27315f7cb556bf208fa2a309f`.
- LF-normalized SHA-256: `cd70c18e9d237e09892bd8a98bcbe181b6c2744283deb77423c31691f32c8095`.
- Paimon.moe yield file remains raw SHA-256
  `0c28845d0adea8ccdf1a8b620c9743c8b201209f0d705c70ffd072df97e57626`,
  independently matched to Git blob `1796bca36d7878ed7ee7df177924701c90bfe4df`.

The generator now checks the verified raw coordinate checksum. No integrity
check was disabled. Ordinary progression regeneration can also refresh domain
families offline while first verifying the existing farming content fingerprint.
Historical coordinates still cover only Mondstadt through early Sumeru; mean
yields have no newly established capture patch or confidence bounds.
