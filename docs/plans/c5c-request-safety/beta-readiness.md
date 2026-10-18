# C5c readiness checkpoint — 2026-10-12

Local bounded request safeguards are implemented. They cover auth/import parsing,
admission, expensive-work concurrency, resource validation, safe rejection and
data preservation. This is suitable for independent C5c implementation review;
it is not production abuse certification, distributed/provider protection or beta
approval. Historical C5a/C5b evidence remains intact.

| Gate                          | C5c evidence / remaining requirement                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application abuse controls    | Deterministic policy/unit/composed HTTP, actual PostgreSQL preservation and local browser rejection/retry evidence. Independent review remains appropriate.                                                             |
| Deployed ingress/proxy        | Direct socket identity only, trust proxy false. Identify actual topology, bounded trust/allowlist, spoof testing, ingress limits/timeouts and shared NAT behavior before deployment.                                    |
| Multiple instances / restarts | Counters are per process and reset on restart. Distributed enforcement and provider/WAF configuration remain unimplemented/unobserved.                                                                                  |
| Operator and account data     | Name accountable operator/support; separately scope recovery, export, deletion and token revocation procedures.                                                                                                         |
| Production recovery           | C5b synthetic rehearsal remains available and exercised. Backup provider/location, access/revocation, encryption, retention, cadence, monitoring, RPO/RTO and a representative isolated production restore remain open. |
| Actual CI / origins           | Local full verification and exact-origin regressions only. Observe exact-SHA remote CI, configured deployed frontend/API origins and deployed auth/preflight/denial behavior after separate authorization.              |
| Accessibility                 | Actual 200%/400% zoom, rendered reduced motion and assistive technology assessment remain open. C5c functional browser checks do not close them.                                                                        |
| Source upkeep                 | Accountable data maintainer/cadence and disable/rollback procedure remain open; unavailable farming routes remain unavailable.                                                                                          |
| Voluntary beta                | No invitations, participants or human feedback. Resolve prerequisites and seek separate authorization.                                                                                                                  |
| C6/C7                         | Still gated on useful real-use evidence and a separate product decision. No expansion started.                                                                                                                          |
