# Project Celestia web app

React, TypeScript, and Vite frontend for the Genshin companion.

Start with the [documentation index](../../docs/README.md), [vision](../../docs/PROJECT_VISION.md), and [roadmap](../../docs/ROADMAP.md). The [companion specification](../../docs/features/FEATURE_GENSHIN_COMPANION.md) describes planned product changes; it does not imply they are already implemented.

## Existing application

The current router includes login/register, dashboard, profile, import, roster, inventory, planner, intelligence, endgame, simulator, and NIKKE roster pages. The roadmap reuses these foundations and narrows future development to the Genshin companion. No page or API was removed by the documentation update.

TanStack Query owns server data. Zustand/local state owns client state. Follow the shared architecture and ownership requirements.

## Local scripts

From the repository root, after the documented workspace setup:

- `pnpm --filter @celestia/web dev`
- `pnpm --filter @celestia/web lint`
- `pnpm --filter @celestia/web build`

See [Development Guide](../../docs/DEVELOPMENT_GUIDE.md) for project standards. API lint coverage is a separate [open milestone](../../docs/plans/3a-backend-lint/implementation_plan.md); do not assume a successful root lint currently covers the backend.

Implementation sessions are Wednesday and Sunday. Deployment is a separate reviewed action.

## Deterministic build insights (2026-10-22)

Character pages use the read-only Build insights API and optional hypothetical
equipment comparisons. No model key or provider is required. Full descriptions
remain available; executable rule coverage is disclosed separately.
