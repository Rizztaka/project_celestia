# HoYoLAB connection release and acceptance

This implementation is a website plus a Chromium desktop connector. It follows
the publicly documented Luminary sign-in pattern; it does not reproduce
Luminary's private backend. The connector is an unpacked development release,
not a browser-store publication. No AI provider is used.

## Release order

1. Review the migration and code. Apply the reviewed incremental SQL from
   `20261023000000_hoyolab_connection` before starting the new API. The live
   project uses Supabase migration history and has no `_prisma_migrations` table
   (checked 2026-10-23). Follow that existing production migration workflow;
   do not run an unbaselined Prisma deployment against the populated database.
   Local disposable databases continue to use the tested Prisma migration chain.
   The migration preserves existing inventory and makes unknown source fields
   nullable. The credential table has RLS enabled and no browser policies;
   `PUBLIC`, `anon` and `authenticated` have no access.
2. Configure `HOYOLAB_SESSION_KEY` on the API server: a fresh cryptographically
   random 32-byte key encoded as canonical base64, independent of `JWT_SECRET`.
   Keep it in the hosting secret store. Never put it in a Vite variable, browser
   bundle, screenshot, commit or log. Missing configuration disables linking and
   refresh; disconnect remains available for an already-stored connection.
   Changing the key requires players to reconnect.
3. Deploy the API and frontend together. Build the downloadable connector with
   `node tooling/build-hoyolab-connector.mjs` after changing its sources. The
   checked-in download contains exactly the seven files named by that builder.
   Its only trusted website origin is `https://projectcelestia.vercel.app`, path
   `/connect`. Preview/local origins require a separately reviewed development
   package; never widen the production package to all sites.
4. Verify readiness, unauthenticated rejection and configured connection status.
   Then complete the owner acceptance below using a real HoYoLAB session.

## Owner acceptance still required

Use Chrome or Edge on desktop. Download and unzip the connector from Account,
open Extensions, enable Developer mode and Load unpacked. Reload Celestia. Sign
in on HoYoLAB's own page, return to Celestia Account, choose Ready to connect,
then open the extension and click Connect HoYoLAB. Celestia never asks for a
HoYoLAB password or pasted cookie.

Confirm the offered UID/server belongs to you. Choose the role if needed and
refresh. Compare character count, Traveler form, three displayed talent levels,
constellations, weapon refinement and equipped artifact stats against the game
and Battle Chronicle. In particular, live validation must confirm the three
active skills' ordering for the current upstream response. Unsupported or
incomplete shapes fail without replacing saved builds.

Check the displayed refresh time, daily-note availability and one background
refresh after about 15 minutes while the API remains running. HoYoLAB can lag
behind in-game changes. Complete verification only on HoYoLAB if requested;
Celestia does not automate challenges. Disconnect and confirm subsequent refresh
is unavailable, the encrypted session is removed, and builds remain viewable.

The actual installed-extension handoff, live HoYoLAB response and hosted
background refresh have **not** been established by synthetic tests. Do not
report those as passed until this checklist is executed.

## Data and failure behavior

Only global HoYoLAB roles on Asia, America, Europe and TW/HK/MO are supported.
Sync obtains owned characters, equipped weapons/artifacts and optional daily
notes. It cannot obtain a full bag, material quantities, item locks, complete
roll histories or acquisition dates. Unknown caps/locks stay null. Displayed
talents are marked as HoYoLAB displayed levels; bonuses are not subtracted.
Unknown catalog/stat IDs remain opaque rather than being silently dropped.

Refresh writes one complete snapshot transaction after all roster batches pass.
Character, weapon and artifact writes are batched rather than issued per item.
The regression fixture covers 250 characters and 1,250 equipped artifacts,
bounded query counts, stable identities and foreign-ownership conflict rollback.
Partial responses, upstream failure, expiration and verification preserve saved
builds. Notes failure alone does not invalidate a complete roster. Lease and
generation checks prevent concurrent refreshes or a late refresh from surviving
disconnect, account rotation or deletion. Existing character focus/goals remain.
Stale forms are archived and historical inventory is detached, not deleted.
Normal equipment reads filter to gear assigned to active characters in the
same account. Old file-import APIs remain as compatibility/internal test paths;
the normal website file-import page is removed and its old URL redirects.

Automatic refresh uses the existing API process, with a one-minute scheduler,
15-minute due time, five-owner bounded batches, shared database leases and a
one-minute manual cooldown. Hosting sleep or process downtime delays it; there
is no claim of instant live data. Disconnect and user deletion remove stored
credentials. Account exports deliberately exclude the credential model.

## Reproduce local verification

Use only a disposable loopback PostgreSQL database named `celestia_test_*`.
Explicitly set matching `DATABASE_URL` and `CELESTIA_TEST_DATABASE_URL`,
`DOTENV_CONFIG_PATH=NUL` on Windows (or `/dev/null` on Unix), and `NODE_ENV=test`.
Run `pnpm verify`. Its complete test discovery includes the HoYoLAB integration
and HTTP suites as required PostgreSQL evidence. It runs files serially because
existing recovery/admission fixtures deliberately share fixed synthetic IDs.
Do not point this verification command at development or production accounts.

The optional browser fixture is `apps/api/tooling/hoyolab-browser-fixture.mjs`.
It guards the disposable database and replaces only HoYoLAB's external responses
with synthetic protocol fixtures. The actual controllers, authenticated routes,
repository, mapping, encryption and frontend are used. It runs API port 45450;
set `CORS_ALLOWED_ORIGINS=http://127.0.0.1:45451`, and start Vite on 45451 with
`VITE_API_URL=http://127.0.0.1:45450/api/v1`. Test login is the fixture-only
`hoyolab-browser@test.invalid` / `Celestia-hoyo-only!`. No real account is used.

## Source evidence

[Selected immutable URLs and hashes](evidence/selected-sources.json) describe
the community client models, request routes and signature algorithm consulted.
[REA summary](evidence/rea-summary.json) records the static exporter analysis;
its guessed defaults and talent-boost subtraction were not adopted. Full raw
research captures were moved to the local temporary archive
`celestia-hoyolab-research-20261023` to keep third-party source and a 3 MB graph
out of the product. No Luminary access restriction was bypassed.
