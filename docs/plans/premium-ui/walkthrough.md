# Premium Celestia UI — 2026-10-22

Implemented directly at the owner's request. The application now uses a shared
charcoal, ivory and muted-gold design with a persistent desktop sidebar, compact
mobile header, native modal navigation, shared typography, focus states and reduced
motion. Actual character artwork has readable offline fallbacks. Authentication,
password recovery, Today, collection, character detail, planner, inventory, import,
Build lab, settings and endgame share the visual system.

## Product changes

Today has a clearer entrance and functional shortcuts. Character collection uses
portrait cards, URL-backed search, focus filtering and a separately disclosed
reference archive. The archive includes all **129 pinned profile entries**, without
implying ownership. Its generated public index is built from verified catalog
bytes, not the larger artwork alias list. The audit found 18 artwork aliases without
matching canonical profile routes; those no longer create dead archive links.
Existing imported opaque keys and their escaped record links remain supported.

Character pages separate **Build & equipment**, **Talents & constellations** and
**Equipment archive** through keyboard-accessible URL-backed tabs. Conditions,
complete descriptions, unknown states, bright/dark progression and source access
remain available. C0 entries stay dark and still open their full descriptions.
Mechanical calculations and account data are unchanged. Hypothetical comparisons
remain read-only. Goals/provenance are available through focused disclosures.

The old heuristic score/ranking dashboard is replaced by **Build lab**, which
points into actual per-character checks and explains their current limits. The
random pull simulator page is retired; `/simulators` redirects to the functional
wish savings planner. The duplicate public KQM reader and unused fetch helpers,
starter CSS and unused icon sheet are removed. Unconfigured OAuth providers are
hidden; configured providers still work. The old route's browser regression now
checks the redirect. Source acquisition/history and compatible backend endpoints
are retained. No account records or pinned knowledge are deleted.

## Verification

- **155 tests across 16 files**, zero failures/skips. Includes real client/cache
  cancellation and account switching, goal/plan persistence, saved teams, savings
  calculations, import HTTP/service/limit checks, profile presentation, all 129
  archive destinations, configured-provider presentation and deterministic insights.
- API and web production builds, web types, full web lint, changed API tooling
  lint and scoped whitespace pass. Formatting is applied to changed authored text;
  source captures and generated SVG/catalog bytes retain their intended forms.
- Actual app in the browser: sign in, gallery/search, character tabs, C0 locked
  description, hypothetical Gilded comparison, Build lab, invalid import validation,
  inventory, endgame and the legacy simulator redirect to savings. The app retains
  entered invalid JSON and never submits it.
- **390px** mobile layout and modal navigation verified; Escape closes the drawer
  and restores focus to Menu. **320px** loaded collection reports zero horizontal
  overflow, zero clipped controls and zero header overflow. A mobile header scroll
  issue was fixed during this check. Desktop sign-out remains reachable on shorter
  viewports. The no-server schedule now starts with the week rather than an empty
  Today filter. Canonical source metadata fixes Kuki/Traveler alias presentation.
- Browser acceptance uses synthetic in-memory HTTP data. Profile, equipment and
  insight handlers call production services against pinned sources; auth, inventory
  and plan responses are fixtures. No live database/account acceptance is claimed.
  The initial material fixture lacked `stockBasis`; it was corrected before savings
  was accepted. Transient Vite CSS errors occurred during formatter writes; final
  production builds succeeded and fresh-page acceptance is recorded separately.

See `tests.json`, `validation.json` and the screenshots in this folder.

## Preservation and review

Nine exact original source/draft snapshots are retained under `before/`, with
hashes in `before.json` and a byte-preserving Git attribute. All profile catalog
bytes and unrelated dirty work are preserved. No new dependency, AI provider,
account write, schema migration, push or deployment was introduced by this
UI milestone. The owner subsequently authorized a scoped local commit; see
[final commit review](commit-review.md) for the independent **157-test** check. The earlier NIKKE/account-data edits remain separate working changes.

Regenerate the small character index after a reviewed profile snapshot update:
`node apps/api/tooling/build-ui-character-index.mjs`.

The local visual fixture is `pnpm --filter @celestia/api exec tsx --tsconfig
tsconfig.json ../../docs/plans/premium-ui/preview.mts` (ports 45471/45472). It binds
only to localhost and never opens a database connection. It is a review preview,
not the production API. All fixture mutations affect memory only.
