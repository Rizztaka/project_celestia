# Browser-entry and metadata follow-up — 2026-10-24

The owner's screenshot is localhost:5173. Process command lines confirm that port serves the original dirty checkout at D:/Genshin Personal/project-celestia; ports 45750/45751 serve this isolated P1 worktree. The screenshot's generic error boundary alone cannot identify the underlying exception. The original profile page rendered during read-only inspection; a separate home-page probe did not yield a usable exception trace. No original source file, process, account or database was changed by this fix.

Use [the public viewer](http://127.0.0.1:45751/showcase). No registration or sign-in is required. The launcher now sets VITE_SHOWCASE_ONLY=true: its root and stale login/registration URLs route to My Showcase, and the workspace link is hidden. Normal configured Celestia development keeps its workspace routes.

The first acquisition used the legacy [characters table](https://github.com/EnkaNetwork/API-docs/blob/master/store/characters.json). At the same pinned revision, it ends at 10000124 for ordinary playable IDs. Current [Genshin avatars](https://github.com/EnkaNetwork/API-docs/blob/master/store/gi/avatars.json) and [localizations](https://github.com/EnkaNetwork/API-docs/blob/master/store/gi/locs.json) identify 10000125 as **Columbina**. This was an integration coverage gap, not missing account progression.

Acquisition now projects the current avatar identity/portrait/talent metadata and merges current/legacy English maps, preserving compatibility with equipment hashes in existing responses. Modern /ui/name.png paths and costume names are normalized without accepting arbitrary image origins. Provenance records every upstream hash. No damage-calculation/base-stat metadata is used to invent observed account values.

Verification: **100 tests passed**, 0 failed/pending, including new Columbina, modern icon/costume, and isolated launcher-link regressions. API/web builds and lint passed. The compiled API resolves Columbina with metadataAvailable=true and a portrait. Chrome navigation from the isolated root and /register reached /showcase with “Public viewer · no sign-in.” The screenshot is [showcase-entry-corrected.png](showcase-entry-corrected.png). The owner's actual character values still need their own comparison with the game.

Reload the corrected viewer and select Refresh Showcase to replace an old browser response with the updated mapping. The server was restarted to activate the metadata. The original 5173 app was left running and unchanged by this task.
