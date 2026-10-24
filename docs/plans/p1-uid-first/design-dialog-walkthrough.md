# Build sheet and shared UID connection dialog

Implemented in `codex/p1-enka-showcase` at `C:\Users\inuzu\.codex\worktrees\p1-enka-showcase\project-celestia`. The user clarified that Add connects the UID's entire public showcase; individual character selection is not part of this flow.

## Build page

- One character hero with a larger existing portrait, sourced element accent, UID and progression badges. The character name appears in one main heading.
- A prominent key-stat grid; all reported combat properties remain available under a secondary disclosure.
- Separate weapon and named talent panels. Talents show their type, base level and known bonus; combined levels are displayed only where the bonus is reported.
- Five consistently styled artifact slots with main stat emphasis and quieter substats. Missing slots say Not reported. Artifact set labels show observed piece counts without inventing set-bonus activation or build ratings.
- No top-right Switch UID, refresh button, countdown or inline View build control on the build page. The sidebar UID action remains available.

The showcase contract now includes nullable character element and explicit artifact main stat, both with null defaults for older responses. Elements come from the same pinned Enka avatar metadata. Main stats come only from `flat.reliquaryMainstat`; a missing main stat never promotes a substat. Existing equipment statistics remain unchanged.

## First visit and UID switching

- First-time visitors see Celestia's normal sidebar, Today hero and shortcuts with Add UID. Features requiring showcase data lead to the same UID popup. No registration or sign-in flow is introduced.
- Returning visitors resume their last successfully connected UID. Existing authenticated workspace routes remain intact.
- Sidebar Switch UID opens the shared native dialog. Search validates and looks up the UID, then shows nickname, server, Adventure Rank and the current publicly showcased characters. Add UID explicitly connects the whole previewed profile and returns to Today.
- Search alone never navigates or saves a UID. Cancellation, Escape, network errors, invalid or mismatched responses and rate limits preserve the active UID. Input changes invalidate the preview, and in-flight submissions are deduplicated.
- Existing cache/TTL/backoff handling is reused. Cached previews do not cause upstream refreshes; rate-limited results keep Add disabled. Empty/hidden showcases are explained and may connect the public profile without fabricated characters.
- The native modal sets initial focus to the UID input and restores focus on cancellation. The mobile drawer closes before the UID modal opens. The dialog is loaded on demand.

## Verification

Evidence: `design-dialog-test-results.json` and `design-dialog-quality-results.json`.

The targeted showcase, HTTP, rendered client, UID workspace, legacy journey and importer suites pass, along with eight React DOM interaction tests using synthetic provider responses. The interaction tests exercise the real App router, first visit, preview/Add boundary, returning users, cancellation and focus, mobile-menu handoff, legacy links, empty data, validation, network/rate-limit failures, concurrent submissions, closing in flight and mismatched snapshots. jsdom is a development-only test dependency compatible with this workspace's runtime. Browser-owned dialog methods are stubbed in those tests; they are not a visual browser check.

Contracts, API and web builds include TypeScript. Web lint, scoped API/tooling lint, contract lint, formatting and original-checkout preservation pass. Original preservation covers all 3,481 recorded files, HEAD, branch and index. The localhost launcher was restarted with the updated backend/metadata.

Desktop/mobile layouts use responsive CSS, but visual browser verification remains pending because of the previously documented Chrome extension automation block. No new browser screenshot, native focus-trap check or pixel-layout verification is claimed. The local app is ready for personal review; P1 remains unfinalized.

## Launch and personal review

The app is running at http://127.0.0.1:45751/. To launch again in PowerShell:

```powershell
Set-Location 'C:\Users\inuzu\.codex\worktrees\p1-enka-showcase\project-celestia'
pnpm install --frozen-lockfile
pnpm showcase:dev
```

1. Reload a character build. Check the hero, key stats, weapon, talent labels and artifact main/substats. Confirm the main content has no Switch UID or refresh controls.
2. Use the bottom-left Switch UID. Search a different UID; the existing page should stay connected while the preview is shown. Cancel once, then search again and choose Add UID.
3. Open the site in a private window to review first use without altering your existing browser preference. Check Today, Add UID, preview and Add, then refresh to confirm resume.
4. Check a narrow mobile viewport, the navigation drawer, keyboard focus, Escape and the modal's scrolling behavior.
5. Confirm Public Profile still offers Refresh Showcase with its TTL countdown. Hidden/empty data and service errors must remain explicit.

Nothing was deployed, pushed, merged or removed from the original checkout. Existing historical/database data was not modified.
