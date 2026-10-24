# Verified live-site baseline

Inspected: 2026-10-24, approximately 19:17 IST.
Status: read-only live UI, Vercel deployment metadata, and GitHub source inspection. No application changes or deployment.

## Source of truth

- User-selected site: https://projectcelestia.vercel.app/u/860507835
- Repository: https://github.com/Rizztaka/project_celestia
- Branch: master
- Deployed and remote master commit at inspection: e8f6a95c319a8621c0524ff2947550c644a2d1b3
- Commit: Add daily talent and weapon domains to Today
- Vercel deployment: dpl_BzNfYVw1eU5b5MuKghcSzPmhomQ7
- Deployment hostname: projectcelestia-rl9t8m7h8-crazy-rizz.vercel.app
- Production alias: projectcelestia.vercel.app
- Vercel project: project_celestia
- Frontend framework: Vite
- apps/web/vercel.json forwards /api/* to https://celestia-api-pmoc.onrender.com/api/* and rewrites frontend routes to index.html.

Vercel metadata establishes the frontend source commit. It does not independently establish the Render backend's deployed commit. Browser observations establish the tested UI/data behavior. The GitHub parser describes that commit's implementation; report the distinction if later backend work is needed.

The local directory was on codex/contextual-guide-knowledge with HEAD be25f56 and extensive changes. It is not the implementation baseline. Earlier conclusions drawn only from that directory are superseded by this document.

## Observed live journeys

### Today

URL: /u/860507835

- Desktop navigation: Today, Characters, Public profile.
- Public showcase connected; no sign-in required.
- UID switcher, profile link, nickname and UID remain visible in the existing shell.
- Today has available talent/weapon domains, farming server/day controls, and observed-character matches.
- No Teams navigation entry was visible.

### Characters

URL: /u/860507835/roster

- Search plus element, weapon-type and rarity filters.
- Refresh Showcase and upstream cooldown status.
- Text explicitly states that refresh adds/updates builds and retains previously seen characters in this browser.
- This is not a complete private roster.
- The inspected browser showed 12 observed characters: Sucrose, Furina, Xilonen, Iansan, Varesa, Escoffier, Skirk, Dahlia, Ineffa, Lauma, Nefer and Columbina.
- That list is an observation, not a permanent invariant or proof of all characters owned.

### Character detail

Inspected URL: /u/860507835/character/10000089%3A8901

- Furina public build, C0, level 90, ascension 6.
- Key numeric combat statistics, weapon/refinement, classified talent base levels, artifact main stats/substats, and all-combat-stat disclosure.
- Inspected example showed Fleuve Cendre Ferryman R5, four Golden Troupe pieces and an off-set sands.
- One set label fell back to Set 1774578891; some artifact names fell back to Equipment <id>.
- A name fallback must not become an inferred set identity or a bad-build verdict.
- No analyzer panel was visible. This page is a public-build presentation, not the local authenticated Build insights experience.
- Existing dark charcoal/gold layout and character portrait should be retained.

## Source verified at the pinned commit

Read through the connected GitHub tool, with an explicit immutable ref:

- apps/web/src/App.tsx
- apps/web/src/components/UidWorkspace.tsx
- apps/web/src/components/CharacterBuildDetail.tsx
- apps/web/src/pages/PublicShowcasePage.tsx
- apps/web/src/pages/UidEquipmentPage.tsx
- apps/web/src/lib/uid-workspace.ts
- apps/web/src/lib/observed-roster.ts
- apps/web/src/lib/use-observed-roster.ts
- apps/web/src/lib/use-showcase.ts
- packages/api-contracts/src/genshin/showcase.ts
- apps/api/src/games/genshin/showcase/showcase.parser.ts
- apps/api/src/games/genshin/showcase/showcase.routes.ts
- apps/web/vercel.json
- tooling/showcase-dev.mjs
- apps/api/tooling/showcase-server.mjs
- Relevant UID-workspace test scaffold, architecture rules, and handoff excerpts.

Source links use this base:
https://github.com/Rizztaka/project_celestia/tree/e8f6a95c319a8621c0524ff2947550c644a2d1b3

## Important source semantics

- Public routes are nested under /u/:uid. Character IDs use avatarId:skillDepotId keys, encoded in URLs; the key is not the old name-based characterKey.
- Public routes do not use the authenticated WorkspaceApp/provider or prove UID ownership.
- Public lookup route is GET /api/v1/games/genshin/showcase/:uid.
- Public observations persist in IndexedDB celestia-public-roster-v1, characters store, keyed by [uid, character.key].
- A successful fresh/cached result can be merged into the roster. Stale/unavailable responses must not acquire a fresh observation time.
- Different retained members can have different observation times. A team assembled from them is not a simultaneous in-game snapshot.
- ShowcaseCharacter carries numeric stats, explicit mainStat, weapon/artifact item IDs, metadata availability and talent base/bonus separation.
- Combat percentage values use ratios; equipment percentage values use percentage points. The parser formats these differently. Never compare the raw values as if they had the same units.
- Current equipment contract carries setName, but not a stable set identifier. Safe rules need verified numeric item-to-set mapping or a compatible additive metadata field; fuzzy name matching is insufficient.
- A missing equipment array, unknown metadata and fallback labels remain distinct from confirmed absent/invalid equipment.
- Full private roster, unequipped bag, material stock, live combat state and exact rotations are unavailable.
- Legacy authenticated routes and engines remain in the Git tree; existence does not make them the active public product.

## Implementation environment

Use a clean checkout/worktree of the pinned source. Do not reset the messy checkout or carry its uncommitted code into the implementation.

At implementation start, recheck production metadata and master. If the alias moved, record the new commit and inspect the relevant delta before proceeding. Do not silently mix several baselines.

The committed launcher tooling/showcase-dev.mjs supplies an isolated public-viewer development environment, prints one URL, and avoids real database credentials. Verify its current script before use and run one controlled server pair with strict ports. Localhost is for verification; the above production URL remains the product reference.
