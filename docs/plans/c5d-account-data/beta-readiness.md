# C5d readiness checkpoint — 2026-10-14

Local self-service current-password export/deletion and deleted-subject denial are
implemented for review. This closes the bounded application feature gap, not the
production account-data policy or C5 beta exit gates.

| Gate                              | Evidence and remaining work                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application account data          | Twenty-table exact exports, atomic cascades, rollback, cross-owner rejection, races, old-token denial and browser acceptance; independent review remains appropriate             |
| Unsupported legacy accounts       | Row/text/output limits and compressed-field rejection documented; no larger-account operator procedure or working support channel                                                |
| Operator accountability           | Name accountable operator/support; establish authorization and audit procedures separately                                                                                       |
| Backup/erasure                    | Provider, location, access, encryption, retention, erasure policy, cadence, monitoring and RPO/RTO remain open; old restore can reintroduce identity/data and old-token validity |
| Production recovery               | Repeated synthetic dump/restore works; isolated representative production restore and deletion reconciliation/revocation procedure remain separate                               |
| Lost-account and wider revocation | No password reset, email recovery, universal session revocation or token allowlist; lost-password export/deletion has no new workaround                                          |
| Ingress/proxy                     | Direct socket identity, trust proxy false; actual topology/trust/allowlist, NAT impact, ingress timeouts and spoof verification remain open                                      |
| Multi-instance abuse controls     | Per-process counters reset on restart; no distributed/provider/WAF certification                                                                                                 |
| CI and deployed origins           | Local preserved verifier only; exact-SHA remote CI and deployed frontend/API origin/auth/preflight checks unobserved                                                             |
| Accessibility                     | Functional labels/focus and 320px browser checks passed; human assistive technology, 200%/400% zoom and reduced motion remain open                                               |
| Source upkeep                     | Accountable maintainer, cadence and disable/rollback procedure remain open; unavailable farming sources remain unavailable                                                       |
| Voluntary beta                    | No invitations, participants or useful human feedback; requires prerequisites and separate authorization                                                                         |
| C6/C7                             | No expansion; useful real-use evidence and separate product decision still required                                                                                              |

No compliance, universal erasure, production readiness or supported export restore
claim follows from these local tests. All work remains uncommitted/unpushed.
