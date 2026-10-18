# Hosting repair, 18 October 2026

Targets: GitHub `Rizztaka/project_celestia`, Render workspace `project_celestia`
(`tea-da5hpfrtqb8s73ah6kd0`), service `celestia-api`
(`srv-da5huirbc2fs7394qa1g`), Supabase project `rlmixustzumxvchzofur`, and
Vercel `crazy-rizz/project_celestia`.

The database was paused. The latest API build failed to connect to it, leaving
September's API behind the newer frontend. After resuming the database, a retry
also failed because the new API required production origins that were absent.

## Applied configuration

Render build command (repository root):

```sh
pnpm install --frozen-lockfile && pnpm --filter @celestia/api exec prisma generate && pnpm --filter @celestia/api-contracts build && pnpm --filter @celestia/api build
```

Start command remains `node apps/api/dist/index.js`. Health check is now
`/api/v1/health/ready`. The build no longer mutates the production schema or uses
`prisma db push --accept-data-loss`.

Non-secret Render variables:

```dotenv
WEB_ORIGIN=https://projectcelestia.vercel.app
API_ORIGIN=https://projectcelestia.vercel.app
CORS_ALLOWED_ORIGINS=https://projectcelestia.vercel.app
TRUST_PROXY=loopback
```

Only local ingress is trusted, rather than every forwarded address. Session
device records now use Express's resolved client address through that policy,
matching the existing rate limiter. Existing session records are unchanged.
Reassess the policy if hosting topology changes; see
[Express proxy guidance](https://expressjs.com/en/guide/behind-proxies/).

Vercel's `VITE_API_URL` is now Config with value `/api/v1` in Production and
Preview. `apps/web/vercel.json` proxies `/api/*` to the existing Render service
before applying the SPA fallback. This keeps refresh cookies on the frontend's
site and retains their Secure, HttpOnly, SameSite=Lax flags. Production's exact
origin is allowed; arbitrary preview origins are not. Any future preview needs
its own reviewed origin and backend/data configuration.

## Database repairs

The old deployment used `db push`, not Prisma migration history. Once it had
created the current 25 application tables, all were protected using
[`2026-10-18-restrict-data-api.sql`](2026-10-18-restrict-data-api.sql), applied as
Supabase migration `restrict_application_tables_to_backend`. Public, `anon`, and
`authenticated` table privileges were revoked; the existing backend `postgres`
role retains access. Default privileges also prevent new postgres-created
tables from automatically granting those API roles access.

All 16 missing CHECK constraints were restored from the repository's migration
definitions, including the four supported Genshin servers, using
[`2026-10-18-restore-checks.sql`](2026-10-18-restore-checks.sql), applied as
Supabase migration `restore_application_check_constraints`. Verification found
25 RLS-protected tables, zero tables accessible to the two public API roles,
16 validated CHECK constraints, and zero unvalidated checks. No application
rows were rewritten or deleted by either repair.

Security advisors now report only informational notices that backend-only
tables have no public RLS policies. That is intentional: application users
authenticate through Express, not Supabase Auth.

Future schema releases must use reviewed migrations. Do not run all historical
Prisma migrations against this existing database: `_prisma_migrations` was
absent. First reconcile and baseline the existing schema, or apply reviewed
incremental changes through the recorded Supabase migration workflow. Include
RLS and explicit privileges for every new table.

## Verification

- GitHub CI run [39117741486](https://github.com/Rizztaka/project_celestia/actions/runs/39117741486)
  passed for the proxy/database-repair commit, including full verification,
  lint, types, builds, Redis/readiness smoke, and both container builds.
- Both direct Render and frontend-proxied readiness returned HTTP 200 with
  database `up`. Protected unauthenticated requests returned 401 and `no-store`.
- The production origin was accepted; an unrelated Vercel origin returned 403.
- A temporary verification account exercised browser registration, profile
  loading, reload, a persisted Europe-server choice, and sign-out. HTTP checks
  separately exercised login, token rotation, profile access, logout, and a
  rejected refresh after logout. Cookie flags and path were checked without
  retaining credentials.
- The session-address correction has 17 passing local HTTP/ingress regressions,
  plus API lint and typecheck. Observe the exact final GitHub commit's CI and
  both hosting deployments after every source change.

## Remaining service setup

Render remains on its free instance, which can sleep after inactivity. Supabase
is on a plan that can pause inactive projects. No paid upgrades were purchased.
The repository's real production backup/restore and retention process still
requires operator evidence; this repair does not establish disaster recovery.

Email delivery and Discord/Google OAuth credentials were not configured on the
Render service. Password-based registration/login works. Email recovery,
verification delivery, and social sign-in need their provider credentials and
verified configuration before being treated as available features.
