# Project Celestia web app

React, TypeScript, and Vite frontend for the Genshin companion.

Start with the [documentation index](../../docs/README.md), [vision](../../docs/PROJECT_VISION.md), and [roadmap](../../docs/ROADMAP.md). The [companion specification](../../docs/features/FEATURE_GENSHIN_COMPANION.md) describes planned product changes; it does not imply they are already implemented.

## Existing application

The current interface includes sign-in and recovery, Today, settings/profile, import, characters, inventory, planner, Build lab and endgame records. The legacy simulator address redirects to Wish Savings. Existing backend interfaces and the legacy NIKKE route remain compatible; separate retirement work is outside this UI change.

TanStack Query owns server data. Zustand/local state owns client state. Follow the shared architecture and ownership requirements.

## Local scripts

From the repository root, after the documented workspace setup:

- `pnpm --filter @celestia/web dev`
- `pnpm --filter @celestia/web lint`
- `pnpm --filter @celestia/web build`

See [Development Guide](../../docs/DEVELOPMENT_GUIDE.md) for project standards. API lint coverage is a separate [open milestone](../../docs/plans/3a-backend-lint/implementation_plan.md); do not assume a successful root lint currently covers the backend.

Implementation sessions are Wednesday and Sunday. Deployment is a separate reviewed action.

# Current character advice direction (2026-10-22)

The generative advisor has been removed. Character pages use the deterministic
Build insights API and hypothetical equipment comparisons. No model key or
provider is required. Full character descriptions remain available; executable
rule coverage is disclosed separately from source descriptions. Earlier model
acceptance documents are historical and must not be resumed.

## Current interface

The shared Celestia system uses a desktop sidebar and accessible mobile navigation.
Character pages have Build & equipment, Talents & constellations and Equipment
archive tabs. All 129 canonical references are available from the collection.
Build lab replaces the old ranking dashboard. The retired simulator URL redirects
to Planner → Wish Savings. Unconfigured sign-in providers are hidden.

UI verification and synthetic preview instructions: [premium UI walkthrough](../../docs/plans/premium-ui/walkthrough.md).
