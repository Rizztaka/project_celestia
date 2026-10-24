# Deployment audit — 24 October 2026

Read-only checks used the connected GitHub, Vercel, Render and Supabase plugins. The owner explicitly selected Render workspace `project_celestia`. No production settings, schema, data, policies, services or deployments were changed.

| Platform | Observed state                                                                                                                                                                                                                                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub   | Public repository `Rizztaka/project_celestia`, default branch `master`, commit `00cf0423987bcb2b2a75a8e35b517e330707af1e`. Its push CI run completed successfully. This is evidence for the existing deployed commit, not the new local P1 commit.                                                                                                    |
| Vercel   | `project_celestia` has a READY production deployment of the same master commit. The verified public domain is `projectcelestia.vercel.app`. Anonymous root and deep SPA route requests return HTTP 200. These checks confirm delivery of the frontend shell, not the new P1 interaction flow.                                                         |
| Render   | `celestia-api` is live on the same master commit. Direct and Vercel-proxied `/api/v1/health/ready` return HTTP 200 with database up and Redis disabled. A scoped log query returned zero error entries over the last 24 hours after one temporary log-service failure.                                                                                |
| Supabase | `project_celestia` reports ACTIVE_HEALTHY. All 25 public tables have RLS enabled. Security advisories are informational (25 tables with RLS but no policies); performance advisories are informational (3 foreign keys without covering indexes and 5 unused indexes). No warning/error severity finding was returned. No application rows were read. |

The frontend/API production deployments still precede P1. A request to the invalid-UID showcase endpoint returns 404 from the old backend, confirming that the new endpoint is not live; no real UID lookup was used in production. The initial direct Render readiness request timed out at 45 seconds; subsequent direct and proxied readiness requests succeeded. The service is on the free plan, so this audit does not establish consistently low startup latency or an uptime guarantee.

The Supabase table-policy observations are consistent with a server-managed Prisma database that exposes no anonymous table policies. Adding broad policies to silence those informational findings would change access semantics and is unnecessary for the public Enka adapter. The browser's observed roster uses IndexedDB and requires no Supabase migration. The optional index findings warrant workload-specific review, not removal or production changes during this check.

A local production configuration defect was fixed: public showcase requests now default to `/api/v1`, allowing the existing Vercel rewrite to reach Render, instead of requesting localhost on a visitor's computer. The rewrite lives in `apps/web/vercel.json`. Vercel uses Node 24.x; repository CI uses Node 22. No live Enka smoke or visual production P1 test is claimed because P1 has not been released.

## Evidence links

- [Current production site](https://projectcelestia.vercel.app)
- [Successful deployed-commit CI](https://github.com/Rizztaka/project_celestia/actions/runs/39831951907)
- [Vercel production deployment](https://vercel.com/crazy-rizz/project_celestia/GEdnwUFkjc4xE1yYG6Kcs3xyTcb3)
- [Render service](https://dashboard.render.com/web/srv-da5huirbc2fs7394qa1g)
- [Supabase project](https://supabase.com/dashboard/project/rlmixustzumxvchzofur)
- [Supabase RLS informational diagnostic](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)

The owner's earlier instruction prohibits push, merge and deployment without explicit authorization. The current request authorizes implementation, commits and deployment checks. Release remains pending that authorization, followed by CI and a production UID-first smoke check.
