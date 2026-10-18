# Visual overhaul, Theater cast planning, and wish simulator

Implementation began on 2026-10-18; final local verification completed on 2026-10-19. This walkthrough describes local implementation and verification; it is not a production deployment receipt.

## Visual presentation

- Shared `ArtworkFrame` and `cdn-resolver.ts` serve character, weapon, artifact, material, and boss artwork. Enka is attempted first, official miHoYo BBS second, and the verified Yatta mirror third. Each visible stalled request advances after eight seconds. Styled initials and rarity gradients remain visible during loading and after total failure.
- Gold, purple, blue, green, and neutral item frames use source-backed rarity. Character portraits have small glowing element badges, rarity stars, and optional constellation badges. Weapon cards show their category and optional recorded refinement.
- Artifact icons use the actual set and slot: goblet 1, plume 2, circlet 3, flower 4, sands 5. They appear in equipment, inventory, and artifact intelligence breakdowns.
- Material thumbnails appear in goal deficiencies, Today demand totals, farming estimates, domain cards, and boss drops. Unknown source rarity remains unknown.
- Domain cards retain the existing server-calendar filters and add individual regional photographs, status pills, region labels, and material thumbnails. Photographs depict regions, not verified individual entrances. Credits are available under Schedule source.
- Weekly boss cards have portraits and drop thumbnails. A read-only boss atlas makes all 14 weekly and 48 world boss references browsable without reactivating the disabled legacy routine provider.
- The roster, endgame pickers, intelligence cards, and simulator results reuse the same portrait components. Historical Natlan banner cards include verified character splash artwork.

## Artwork provenance

`apps/api/tooling/build-visual-assets.mjs` builds inert artwork metadata from the progression source cache and genshin-db image indexes. Source revision: `49a6544a6c6ae36089cb42fa591fc46f01de8bcf`. SHA-256 hashes of all six source image indexes are recorded in `visual-assets.json`.

The manifest contains 124 character splash entries, 253 weapon entries, 508 materials, 63 artifact sets, 62 bosses, and 48 domain families. These are artwork records, not a new claim about the number of currently released characters. The existing character/weapon portrait mappings remain authoritative for their aliases and Traveler forms.

Seen: exact source filenames, source rarity, artifact slots, and item IDs. One source image alias is retained: Winter Icelea (item 101268) uses `UI_ItemIcon_101266`. Unknown: original game capture date, unsupported image coverage, and exact domain-entrance photography. No asset filename is inferred from an English boss name; for example, The Knave uses source filename `UI_MonsterIcon_Nihil`.

Source indexes: [pinned genshin-db image directory](https://github.com/theBowja/genshin-db/tree/49a6544a6c6ae36089cb42fa591fc46f01de8bcf/src/data/image). Artwork remains hosted by its owners; no remote code was executed.

To regenerate, supply the progression cache containing `source-data.json`, and a directory containing `celestia-visual-{characters,weapons,materials,artifacts,enemies,domains}.json` downloaded from that pinned image directory:

```powershell
node apps/api/tooling/build-visual-assets.mjs <progression-cache> <image-index-directory>
```

## Theater cast planning

The pure calculator is `games/genshin/endgame/theater-rules.calculator.ts`, with separate explanations in `theater-rules.explainer.ts`. Shared Zod contracts validate the request before account reads. The authenticated preview service reads the account and roster through Genshin repositories and performs no writes.

The requested planning preset enforces level 70+, exactly three distinct elements, and cast cutoffs Easy 10, Normal 14, Hard 18, Visionary 22. Opening Cast and Special Guests bypass element restrictions while retaining the level cutoff. Duplicate character identities, including Traveler forms, cannot inflate the count. Adaptive Traveler elements require an explicit choice; unknown elements are not guessed.

The Endgame Theater tab includes difficulty and element controls, opening/guest selectors, qualified character cards, exclusion reasons, manual selection, select-qualified, and readiness counts. At 320px, cards use a single readable column. Existing Theater records now accept up to 26 cast members instead of 12. Existing Abyss floors 9–12 and star logging remain available.

These are explicitly labeled planning presets, not an automatically verified current season. Unowned opening trials and borrowed characters are not assumed. Published [official Theater reference](https://wiki.hoyolab.com/m/genshin/entry/5832?lang=en-us) rules differ by difficulty and version; the user's requested cutoffs are retained rather than silently presented as live rules. There is no current-cycle or live-season ingestion in this change.

## Wish simulator and pull intelligence

Replaced invented test/future banner records with six historical scenarios:

| Scenario                   | Promotional pool                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Mavuika, v5.3              | Kachina, Bennett, Diona                                                                                                       |
| Citlali, v5.3              | Kachina, Bennett, Diona                                                                                                       |
| Xilonen, v5.1              | Dori, Candace, Collei                                                                                                         |
| Chasca, v5.2               | Ororon, Sucrose, Barbara                                                                                                      |
| Epitome Invocation, v5.3   | A Thousand Blazing Suns / Starcaller's Watch; Lithic Blade, Sacrificial Sword, Favonius Lance, Favonius Codex, The Stringless |
| Mondstadt Chronicled, v4.5 | Diluc, Jean, Mona, Albedo, Eula, Klee character targets                                                                       |

Sources: [v5.3 official notice](https://genshin.hoyoverse.com/en/news/detail/127690), [Xilonen wish notice](https://www.hoyolab.com/article/34054804), [Chasca official wiki](https://wiki.hoyolab.com/m/genshin/entry/7080?lang=en-us), [v5.3 weapon pool](https://wiki.hoyolab.com/pc/genshin/entry/7365), [HoYoverse v4.5 explanation on PlayStation Blog](https://blog.playstation.com/?p=389828), and [official 5.0 Fate Point change](https://genshin.hoyoverse.com/m/en/news/detail/125274).

`wish-rules.calculator.ts` accepts an explicit random stream so state transitions are reproducible in tests. It separates character hard pity 90, weapon hard pity 80, promotional guarantees, independent 4-star pity, and selected-target Fate Points. One weapon or Chronicled Fate Point guarantees the selected target at the next 5-star. Changing the target clears Fate Points and retains pity. The UI holds independent scenario state and provides 1x/10x controls, visual results, a golden-pull celebration, statistics, notable history, error recovery, and reset.

The controller bounds each request to 1–100 integer pulls, validates state and target selection, and returns the standard API envelope. Unexpected errors are delegated to the application handler without exposing internals. Pull intelligence excludes historical/expired scenarios and weapon wishes from character recommendations.

The UI discloses approximate soft pity, basic character 50/50 without Capturing Radiance, and independent scenario pity. The Chronicled scenario models the regional character target pool; it does not implement Chronicled weapon targets. This is a simulator library, not today's active wish schedule or an account prediction.

## Verification

- `pnpm test`: **1,130 passed, 171 skipped, zero failures** (81 files: 72 passed, 9 database-gated).
- `pnpm run build`: **passed**, including contracts, API, and web production builds.
- `pnpm run lint`: **passed**, zero warnings allowed.
- Final small icon fallback adjustment: ten focused artwork tests passed after the full test run.
- `git diff --check`: **passed**.
- Production browser checks: **passed** at 320px and 1280px, with eight no-horizontal-scroll checks, weapon path guarantees and target reset, independent Chronicled pity, 1x/10x pulls, failed-request recovery, Theater readiness and opening/guest badges, level exclusions, domains, and boss atlas.
- CDN checks: **passed** for official fallback, third-party mirror fallback, total failure, stalled primary timeout, and live character artwork. Synthetic 1px PNGs verify fallback behavior, not artwork fidelity. Live network checks also loaded character splash, regional scenery, and The Knave portrait.
- No browser page errors. Browser APIs were intercepted with synthetic account data; no backend or production account writes occurred.

The 171 database integration tests require an explicit disposable loopback PostgreSQL database. Neither Docker nor PostgreSQL tools are available locally, so these tests were skipped by their existing guard. The successful local test command must not be described as a fully executed database integration suite.

The first overlapping build attempt hit a Windows output-file lock; verification was rerun sequentially. Initial controller compatibility failures were resolved by testing the standardized error envelope and strict input contract. No unrelated timeout was increased.

Reproduce browser checks after building:

```powershell
pnpm --filter @celestia/api exec tsx tooling/visual-overhaul-browser-check.mjs <absolute-playwright-package> <evidence-directory>
```

Local evidence directory: `C:/Users/inuzu/.gemini/antigravity/brain/0b5394f7-f958-4e62-b071-5cfcba642644/visual-evidence`. Full test, build, and lint logs are copied alongside the active walkthrough. The browser evidence JSON distinguishes synthetic responses from live CDN observations.
