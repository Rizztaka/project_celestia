# Section 3 — Production and deployment infrastructure

## Runtime changes

`TRUST_PROXY` defaults to false and accepts true, a nonnegative integer hop count,
or Express trust names/CIDRs separated by commas. Admission hashes the normalized
Express client IP, falling back to the socket address. Use exact trusted ingress
CIDRs where network paths have different lengths. Only use `true` if the ingress
overwrites incoming forwarded headers and the API cannot be reached directly.

`GET /api/v1/health` and `/api/v1/health/live` return liveness, uptime and a UTC
timestamp without querying dependencies. `/api/v1/health/ready` executes `SELECT 1`
and pings configured Redis. Readiness returns 503 for dependency failure or
shutdown and 200 otherwise. Probes disable HTTP caching. Database readiness waits
at most two seconds, coalescing overlapping database probes so stalled polls do
not accumulate queries. Redis commands have a one-second deadline.

Without `REDIS_URL`, request admission uses the existing bounded in-memory stores.
With Redis, atomic Lua scripts use server time and bounded sorted sets to share
token budgets across replicas. Login, registration, import and account data have
separate namespaces. Concurrent work also acquires shared leases alongside local
caps, with common auth permits shared by login, registration and account data.
Leases renew every ten seconds, expire after thirty seconds on worker loss, and
release after work settles. As with any expiring lease, an extended Redis outage
or event-loop pause can expire a permit before old work completes. Local caps
remain active throughout.

Development/test falls back to memory on Redis connection/command failure. A
configured production deployment rejects new admission during a Redis outage;
readiness also fails. Redis is created lazily, has no offline command queue, and
is explicitly disconnected during shutdown. Instances must use the same Redis
database and admission policy; deploy unrelated environments with separate Redis
databases. Changing rate policies may retain old bucket debt until it expires.

SIGTERM/SIGINT mark readiness as draining, stop accepting HTTP connections, wait
for requests and close Prisma, its PostgreSQL pool, and Redis. Duplicate signals
do not start duplicate cleanup. Cleanup attempts every dependency even if one
fails. A ten-second deadline closes remaining connections and exits with failure.

## Container operation

Both Dockerfiles build from the repository root and install the frozen pnpm
lockfile. The API generates Prisma, builds shared contracts/API, deploys production
dependencies, preserves the generated Prisma runtime and runs as `node`. The web
image serves its production bundle through nginx with SPA fallback and an API
reverse proxy. `VITE_API_URL` defaults to `/api/v1` at build time; override it with
`--build-arg VITE_API_URL=https://api.example.com/api/v1` for separate hosting.

Copy `.env.deploy.example` to `.env`, replace the placeholders and configure public
HTTPS origins. Supply optional email/OAuth credentials documented in
`apps/api/.env.example` when those features are needed. Passwords interpolated into
database URLs must be URL encoded. The production overlay requires explicit
database password and public origins. Compose includes persistent PostgreSQL 15
and Redis 7, dependency healthchecks, a one-shot migration service, API readiness,
and web startup after API readiness. PostgreSQL retains major version 15 so the
existing development volume does not require an implicit major-version upgrade.

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile .
```

Compose exposes only the web container on loopback port 8080 in production. Put
TLS termination in front of it and configure nginx's real-IP module to trust only
that ingress's exact addresses before forwarding `$remote_addr` to the API. The
shipped nginx configuration treats the direct peer as the client and overwrites
incoming `X-Forwarded-For`. An additional proxy requires this explicit real-IP
configuration to retain the original client address. The API trusts exactly one
hop (nginx) in this topology. HTTPS is required for production refresh cookies.
The base Compose file also exposes PostgreSQL only on loopback for local tools;
the production overlay removes that port. Compose's `!reset` requires a current
Docker Compose v2. The 15-second stop grace period exceeds the API deadline.
Apply migrations once per release before admitting API traffic; the Compose
migration job handles that ordering. Back up existing databases before deploying
schema changes. External platforms should run the equivalent migration release
job and configure their readiness path explicitly.

## CI and verification

CI retains PostgreSQL 18 and the complete guarded `pnpm run verify` command.
An isolated Redis 7 service also runs a separate live smoke check for shared
budgets/concurrency across two clients and actual database/Redis readiness. The
smoke check requires the disposable database guard and loopback Redis database 15,
uses unique keys, and removes only its own keys. The baseline verifier keeps
Redis unconfigured so its deterministic local-policy tests remain unchanged.
Additional stages run monorepo lint, workspace typechecks, both builds and an
explicit web build. API/web Docker builds use Buildx with separate GitHub cache
scopes. The web and shared-contract packages now have explicit typecheck scripts;
all three packages participate in lint, with zero warnings permitted.

The original verifier, its test discovery, integrity checks and minimum assertion
counts remain unchanged. New tests cover forwarded-IP trust resolution, health
success/failure/timeouts, Redis fallback/fail-closed behavior, shared admission
namespaces, renewable concurrency leases and shutdown ordering/timeouts.

Local validation results and machine limitations are recorded in
`validation-results.json`. The complete guarded run passed **1,200 tests in 71
files**, including 171 PostgreSQL integration cases, with zero failures or skips.
All 66 pre-existing test files and the original verifier were preserved. Monorepo
lint, types and builds passed. A pruned production package passed actual process
liveness/readiness checks for healthy, database-down and Redis-down scenarios,
plus clean signal-driven shutdown. Lua simulation passed 24 assertions, and the
checked-in CI smoke script also passed against a TCP Redis simulation using
ioredis, Express and the actual disposable PostgreSQL database. This simulation
does not establish live Redis 7 or container success.

Docker/WSL are unavailable on this host, so actual
Linux image builds and nginx/Redis container startup require the added CI checks
or a Docker-enabled host. No remote deployment or CI success is claimed.

## Implementation references

- [ioredis configuration and lifecycle](https://github.com/redis/ioredis)
- [Redis atomic rate-limiting guidance](https://redis.io/docs/latest/develop/use-cases/rate-limiter/)
- [pnpm deploy](https://pnpm.io/11.x/cli/deploy)
