# HoYoLAB companion implementation

Implemented locally on 2026-10-23 in the managed `hoyolab-companion` worktree,
based on released `master` commit `00cf042`. The original dirty checkout is
preserved. Work is on branch `codex/hoyolab-companion`. Hosted feature deployment,
production migration, real HoYoLAB cookie collection and installed-extension
acceptance remain pending. See [live deployment check](deployment-check.md).

## Result

The website now has an Account connection page, a downloadable Chromium
connector, authenticated connection/selection/refresh/disconnect routes and a
bounded refresh scheduler. The backend verifies owned UID/server roles, stores
an owner-bound AES-GCM encrypted session, and commits only complete roster and
equipped-gear snapshots. Failed or partial refreshes preserve the last build.
Batch writes keep the database round-trip count bounded for a full roster;
250-character / 1,250-artifact repeated refreshes retain stable identities and
foreign-account gear conflicts roll back every build change.
Disconnect fences pending work and removes the encrypted session; account
deletion cascades it. Account downloads exclude all connection credentials.

Unknown ascension/lock values remain null. Actual artifact main-stat values and
HoYoLAB-displayed talent levels are retained. Canonical game IDs join the pinned
reference catalog; unknown IDs and stats remain explicit. Existing legacy scores
requiring base talents/known caps do not misinterpret these new source values.
The selected game server initializes reset tracking without replacing an
explicit manual choice. HoYoLAB notes remain distinct from manual reminders.

Normal navigation replaces Import with Connect HoYoLAB; the file-import page is
removed and `/import` redirects to `/connect`. Equipment shows only gear assigned
to active characters in the same account, with actual stats and character links.
Historical inventory remains recoverable in storage. Today leads with the
account snapshot and chosen goals. Manual reminders, weekly tracking, farming
diagnostics and detailed build analysis are collapsed. Character pages lead with
recorded progression and at most three user-prioritized goals; complete source
descriptions remain accessible. The duplicate legacy Build lab entry is removed.
No AI provider or generated build advice was added.

## Local browser acceptance

Used the guarded synthetic browser fixture on a disposable PostgreSQL database,
API port 45450 and Vite port 45451. Only external HoYoLAB responses were replaced;
the actual frontend, controllers, authenticated API, encryption, mapping and
database writes were exercised.

- Refresh now completed through the UI and updated the successful-refresh time.
- Equipment displayed one equipped weapon and one equipped artifact. A separate
  unequipped fixture remained stored and did not appear in the list.
- Weapon and artifact links opened Albedo. The character showed C2, displayed
  talents 6/9/8, an unspecified ascension cap, and actual artifact HP/substats.
- Mobile navigation opened Equipment; the artifact layout at a 390px viewport
  had a 375px content width and 375px scroll width, with no horizontal overflow.
  The temporary viewport override was reset.
- Disconnect removed connection controls. A direct database check confirmed the
  encrypted session was null and the saved character count remained one. The
  roster still opened normally afterwards.
- Visiting `/import` redirected to `/connect`. The connector download returned
  bytes with the same SHA-256 as the built artifact. No extension was installed.

Screenshots: [equipped gear](equipment-preview.png),
[character next steps](character-preview.png),
[mobile equipment](mobile-equipment-preview.png),
[connection setup](connection-preview.png). All depict synthetic data.

## Automated verification

The final guarded `pnpm verify` completed with exit code 0 on 2026-10-23:
**1,634 tests across 100 files, zero failures or skips**, including **138 required
real PostgreSQL integration cases**. It passed disposable migrations, Prisma
validation and zero schema drift, contracts/API/web types and builds, API/web
lint, full repository formatting, immutable-evidence checks and `git diff --check`.
No production database or secrets were used. Remote CI has not been observed.

[Recorded verification result](evidence/verification.json) contains the complete
successful step list and required integration-suite counts. The original run
output is in local temporary evidence directory `celestia-verification-KxeP3D`.

Coverage includes 250-character / 1,250-artifact repeated snapshots with bounded
query counts; 41-character provider batching and later-batch truncation;
foreign-equipment conflict rollback; allowlisted credentials and explicit consent;
revoked sessions; encryption tampering and cross-owner isolation; unknown source
stats/caps; optional notes; concurrent refreshes; disconnect/connection/deletion
races; UID mismatch and first-sync/account-selection races; RLS; automatic due
times; equipped-only reads; and credential-free status/export responses.
Connector tests verify trusted origin/path, minimal secure cookies, explicit
intent, expiry, one-use delivery, sender identity, and exact agreement between
audited source and the downloadable zip.

Earlier local attempts exposed fixed-ID fixture collisions under parallel test
files, retired-copy assertions and Windows fixture/cold-import timing limits.
The guarded gate runs files serially; only bounded test/hook timeouts changed,
without relaxing production limits. Test owners now clean up after each case.
The final gate also corrected Windows checkout line endings: unchanged ordinary
files were restored to exact released LF bytes, feature source retained its
edits, and immutable captures remained untouched. This worktree uses
`core.autocrlf=false`. The connector popup was formatted and its zip rebuilt.

## Remaining acceptance boundary

Live HoYoLAB acceptance is pending. The installed connector's real handoff,
current active-skill ordering, live account completeness and hosted automatic
refresh require the owner's own sign-in. Synthetic fixtures do not establish
those facts. The connector is an unpacked desktop release, not a browser-store
listing. Follow [release and owner acceptance](operations.md) before claiming the
integration is production-ready. Production needs the migration and independent
server encryption key before enabling connection.
