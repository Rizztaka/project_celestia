# Actual synthetic browser acceptance — 2026-10-14

Local built web at loopback port 45449, API at 45448, explicit owned review fixture
at 55448. New `account-data-browser.mjs` uses the unchanged C5b ownership, private
ACL, lease, resource, process and cleanup guards. Historical C5c helper is unchanged.
Only synthetic owners A/B/empty were used. Browser actions used the in-app browser;
the harness controlled a rate clock and post-repository response gates, not the UI.
Production policy values and bcrypt remained enabled. Raw export stays outside Git.

| Journey                | Actual result                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong export password  | Safe error, signed in, empty password; no export                                                                                             |
| Error focus            | Initial timing bug found; fixed to focus after pending state ends, then retested successfully                                                |
| Cancel export/deletion | Clears form and restores focus to the corresponding opener; no deletion                                                                      |
| Deletion 429           | 60-second guidance; phrase retained, password cleared, no automatic replay; focus restored to password                                       |
| Retry                  | Controlled clock advanced; explicit re-entry produced a real download                                                                        |
| Actual file            | Browser saved `celestia-account-v1.json`, 10,648 bytes; parsed privately and exact canonical comparison against all twenty allowlists passed |
| Honest success wording | Says download started and cannot confirm disk save                                                                                           |
| Pending export A → B   | Real export completed behind response gate; sign out A/sign in B, release; no old success or download; B profile remains active              |
| Pending delete A → B   | Real A deletion committed behind gate; sign out A/sign in B, release; B stayed signed in without old deletion success                        |
| Deliberate B deletion  | Current password plus fixed phrase; confirmed signed-out result with backup/download limitation                                              |
| No-import owner        | Manual setup remained available; deliberate deletion succeeded without a Genshin/NIKKE account                                               |
| Narrow screen          | 320 × 800 viewport; measured document width 305, no horizontal overflow; long confirmation and submit button wrap                            |
| Keyboard               | Password receives focus; Tab reaches confirmation; cancellation/error restores appropriate focus                                             |
| Cleanup                | Created tab closed, viewport reset, owned services/resources removed, normal web build restored                                              |

The downloaded file was copied into the already private harness directory, its
current-user-only ACL checked, and the exact synthetic download-folder copy removed.
No export rows or credentials appear in committed-intended evidence. Safe per-table
counts/hashes and measured export are in [browser-results.json](browser-results.json).
Snapshots stayed at 46 application rows across wrong password/cancellation/429;
after the large import and A deletion there were 14 B/empty rows, then 1 empty-owner
row after B deletion, then 0 application rows. All thirteen migration receipts stayed.
Database tests separately compare all remaining rows exactly, including orphan
detection, and provide stronger other-owner evidence than browser row counts alone.

The download event observation during the owner-switch flow was bounded; the
unmount abort and final B UI were directly observed. Deterministic client tests
separately deliver late successful responses and verify zero download/logout.
After both held responses and cleanup, a filename-scoped check found zero
`celestia-account-v1*.json` files in Downloads (the original was privately retained),
providing an additional check that no late export download appeared.
This does not claim that a browser can recall an already saved file.

Screenshots: [narrow form](browser-narrow.jpg), [B after delayed A delete](browser-owner-switch.jpg),
[confirmed signed-out result](browser-deleted.jpg). Screenshots contain only synthetic
fixture profile values, never passwords or export payloads.

Human screen-reader use, actual OS/browser 200%/400% zoom and rendered reduced-motion
assessment were not performed. DOM labels, focus and viewport evidence do not close
those accessibility gates. No remote load, deployment or real-user test occurred.
