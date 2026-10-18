# Actual synthetic browser checks — 2026-10-17

Agent technical observations, not human acceptance or a repeated owner walkthrough.
Used the unchanged guarded `account-data-browser.mjs` harness with the explicit
C5c review fixture. No ordinary database or real account was used.

## Final corrected build

Private run `C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-D6zxFo`.
Signed in as `c5b-a@test.invalid`, saved a synthetic daily ceiling of 40 and opened
the new farming shortcut from Today. The seeded active Hu Tao normal 3→6 goal
requires 19 Guide to Diligence; recorded quantity 1 leaves a deficit of 18. The
legacy malformed goal stayed visibly preserved and excluded from cost totals.

- Difficulty started unselected; no player level was inferred.
- Selecting Tier IV displayed about seven 20-resin reward sets, 140 resin.
- The comparison showed Tier I 22 sets/440 resin, Tier II 10/200, Tier III 7/140
  and Tier IV 7/140. Mean material amounts and upward crafting were disclosed.
- Calendar pacing displayed eight days for this modeled subset from the next
  reset: Sunday 40, Tuesday 40, Friday 40 and the following Sunday 20 resin. The
  budget is shared and no random-loot finish guarantee was shown.
- The default Whopperflower route had twelve actual source stops. Choosing five
  retained focus on the route-size select and returned five numbered stops, about
  881 planar map units from the initial Mt. Aocang teleport.
- Choosing the Wangshu Inn teleport retained focus on that select and recomputed
  the five-stop route to about 1,158 map units. The numbered list exposed the
  teleport and source points `47-3087`, `47-3066`, `47-2988`, `47-2316`, `47-2308`.
- The diagram, material, stop limit, teleport and source limitations were visible.
  The official map link was present; no map coordinates or data were uploaded to
  a third party. No live spawn/terrain/duration claim appeared.
- Read-only DOM dimensions measured client width 1265 and scroll width 1265: no
  document horizontal overflow at the tested width. No 320px, actual menu zoom,
  OS reduced-motion or reader claim is made for this new panel.

Final JPEG screenshots in private `celestia-farming-8JXUDN`:
`farming-review.jpg` shows the estimate/control overview with the diagram partly
below the viewport; `farming-route-review.jpg` shows the full five-stop diagram,
selected teleport and source limitations. This is viewport scrolling, not a
capture-width mismatch. The route image SHA-256 is
`CFB5561289AAF7BF9D7E172AE50F8DB60BAFF2EE70316ACAD0313B5C4CDB2088`.

The owned tab was closed and final IAB tab inventory was empty. No native window,
browser zoom or OS motion setting changed. The viewport capability was inspected
but no override was applied. Harness cleanup is linked from `cleanup.json`.

## Earlier observations and correction

- `celestia-recovery-qTuXrf` reached READY but stdin closed before interaction;
  the harness exited cleanly. It supplies no browser-use evidence.
- `celestia-recovery-1llL9c` established the original difficulty/pacing output and
  real route. An exact-label Playwright lookup did not match; fresh accessibility
  state and the actual native select worked. The synthetic token expired across
  the user's pause/resume; the UI displayed its error and the agent signed in
  again. No unknown-outcome write was blindly repeated.
- `celestia-recovery-Sikliq` confirmed five-stop and teleport calculations, but
  demonstrated controls being recreated during a query-key change and focus
  returning to the page. Native selection verification consequently reported a
  failure even though a fresh state showed the new result. This was treated as a
  real focus defect, not dismissed as an automation error.
- The correction retains previous data only within the same session generation,
  keeps controls mounted, marks the panel busy and announces that the previous
  result remains visible while updating. The final D6zxFo run verified selection
  changes without that error and observed focus on each intended select.

All earlier harnesses reported owned resources removed, owned process stopped,
ordinary web build restored and browser ports closed. Full recovery/verification
was rerun after the focus correction; see `validation-results.json`.
