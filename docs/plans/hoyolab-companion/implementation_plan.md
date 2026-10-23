# HoYoLAB connection and concise guidance

Owner selected website + browser connector. Implement automatic refresh, equipped
gear only, removal of the file-import flow and short, useful next actions.

Verified: Luminary documents native iOS/Android HoYoLAB sign-in and encrypted
session cookies; its web version is planned. Its private implementation remains
unknown. HoYoLAB Battle Chronicle covers equipped gear, not complete inventory or
materials. Refreshes can lag; show timestamps and preserve last-good snapshots.

## Work

1. Isolated worktree from released master. Preserve original checkout and data.
2. Game-owned schemas/controller/service/repository. Required independent server
   encryption key; owner-bound AES-GCM credentials; no password collection/logging.
3. Explicit-action browser connector transfers allowlisted HoYoLAB cookies only
   from its Connect button to the active trusted Celestia Connect page. No external
   web message can request cookies. HoYoLAB sign-in stays on HoYoLAB itself.
4. Server verifies owned UID/server, validates complete snapshots, updates equipped
   assignments atomically, and retains prior data on partial/failed fetches.
   Batch database writes keep a full roster within a bounded number of round trips;
   stable character identities preserve goals and foreign gear cannot be overwritten.
5. Versioned connection/status/refresh/disconnect API and bounded automatic refresh.
   Disconnect/account deletion revoke credentials. No daily check-in/game writes.
6. Replace Import entry points with Connect; equipped-only equipment view. Keep
   historical inventory stored, while removing unequipped items from normal UI.
7. Lead pages with up to three useful actions: what, one reason, destination.
   Collapse diagnostics; retain source descriptions. No invented role benchmarks.

## Verification

Protocol fixtures, mapping/unknown boundaries, encryption, cross-owner/session
isolation, snapshot atomicity, disconnect races, connector origin and explicit-user
intent. Relevant regressions, lint/types/build, synthetic desktop/mobile browser.
Actual HoYoLAB acceptance requires owner sign-in through the connector. No live
production changes until implementation is reviewable and validated.
