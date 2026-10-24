# Public character filters

Characters now has labeled Element, Weapon type and Character rarity (4★/5★) selectors next to the existing name/ID search. Filters combine, show a result count, persist in the URL on reload and offer Clear filters. Clearing removes only the search/filter parameters. The controls wrap on narrow screens.

Filtering uses the current UID's public snapshot locally. It makes no additional lookup requests and does not expand the public showcase into a private roster. Unknown character metadata stays visible under All; a specific filter requires a known matching value.

Character weapon type and rarity are projected from the existing integrity-checked character references into the pinned metadata, including Traveler fallback identity. Nullable contract defaults preserve compatibility with older responses. These fields are independent of equipped weapon rarity or availability. Existing element mapping and gear data remain unchanged.

Verification: **146 targeted tests pass** (`character-filters-test-results.json`). Coverage includes combined filters, name/ID search, unknown metadata, empty results, metadata without equipped gear, actual select/input interactions, local filtering without extra requests, Clear filters preserving other URL values and a reload retaining the selection. Columbina mapping and previous UID-dialog, refresh, journey and importer regressions also pass.

Contracts, API and web builds with TypeScript, web lint, scoped API/tooling lint and contract lint pass. Formatting and original-checkout preservation pass. The local launcher was restarted on API 45750 / frontend 45751 for the new metadata. Browser visual verification remains pending under the previously documented extension automation block; responsive CSS and DOM interactions are not claimed as pixel verification.

Reload http://127.0.0.1:45751/ and open Characters. Try an element, weapon and rarity together, add a search, then clear the filters. An empty result means no current showcased character matches those selections.

All work remains in the isolated `codex/p1-enka-showcase` worktree. No deployment, push, merge, historical-data changes or P1 finalization.
