# Section 1 reference review — 2026-10-18

## Existing Celestia inputs

No new game dataset was scraped. `character-materials.json` contains 16 local
character entries, including placeholder material keys and incomplete canonical
references. Its costs are accepted as **owner-provided local data**, as directed,
with fingerprints and full schema/range checks. This does not establish new
primary verification or invent game item IDs. The narrower historical Hu Tao
1–6 primary claim retains precedence within that range.

The existing pinned `progression-catalog.json` remains the runtime's preferred
source for its 122 characters and 252 weapons. Local-only targets use the local
evidence fallback. `domain-schedule.json` is now regenerated offline from the
existing pinned domain records, replacing stale domain/material joins without
fetching another dataset. Its 48 families agree with the browser's existing
generated catalog; the progression generator now writes both views together.

## Seelie

The supplied [repository](https://github.com/dvaji/seelie) returned 404. The
[public homepage](https://seelie.me) exposed the shipped asset
`/assets/index-ea3a88ce.js`; it was downloaded only for inert analysis into a
temporary directory, never executed or incorporated into Celestia.

- Bundle: 1,197,903 bytes, SHA-256
  `f49a54761b34a9bbcf26b3714f9d826d12fda19d0f8c50dd55b13e63adb62552`.
- REA 6.5.0 ran under isolated Node 24.11.0 with
  `analyze-javascript-application`, `--source-path seelie-index.js`,
  `--analysis-timeout-ms 30000`, `--format json` and the default integrity policy.
- Final evidence:
  `C:/Users/inuzu/AppData/Local/Temp/celestia-section1-reference-dZ9rE5-rea-analysis.json`;
  SHA-256 `f3da80b04c03e3ade9b125cff5e49abcc0800cee2d1c373ccdd2fec81e62fa00`.
- No integrity contradictions; one selected source, zero unselected files.
  The initial run included its empty redirected output in the inventory; the
  final run kept output outside the artifact directory.
- **Seen in shipped source:** the crafting hierarchy computes whole surplus
  lower tiers after reserving their own demand, then propagates craftable stock
  upward at three items per tier. The expression is near character offset
  1,182,749 in this exact bundle. This supports Celestia's reservation rule and
  compact goal/material/day flow.
- **Unknown:** runtime execution and dynamically loaded dependencies. Static
  analysis does not establish live behavior or superiority over another tool.

## Paimon.moe

Inspected commit `105d0ebd1d551de96668b805d88c2c9a0590177a` directly from
the public repository, without executing its code. The requested `reset.js`
and `domains.json` paths were absent at that revision; the actual files are
[server.js](https://github.com/MadeBaruna/paimon-moe/blob/105d0ebd1d551de96668b805d88c2c9a0590177a/src/stores/server.js)
and [domain.js](https://github.com/MadeBaruna/paimon-moe/blob/105d0ebd1d551de96668b805d88c2c9a0590177a/src/data/domain.js).

**Seen:** server offsets Asia +8, America −5, Europe +1; times before 04:00
belong to the preceding game day. Celestia already implements these fixed
offsets, plus TW/HK/MO +8, without host timezone/DST dependence. No Paimon
domain dataset was imported.

## Genshin Optimizer

Inspected commit `cbee3af79d465735736cfbfbeaa6a9f89bea46dd`:
[GOOD schema](https://github.com/frzyc/genshin-optimizer/blob/cbee3af79d465735736cfbfbeaa6a9f89bea46dd/libs/gi/good/src/schemas/good-format.ts)
and [character schema](https://github.com/frzyc/genshin-optimizer/blob/cbee3af79d465735736cfbfbeaa6a9f89bea46dd/libs/gi/schema/src/character/schema.ts).

**Seen:** typed optional GOOD collections, character ascension 0–6, and talent
slots `auto`, `skill`, `burst`, bounded/clamped against character progression.
Celestia retains its existing GOOD importer and maps declared goals to base
talent levels 1–10. Imported effective talent levels and declared upgrade ranges
remain distinct; importing never advances a goal. No Optimizer source/data was
copied into the implementation.
