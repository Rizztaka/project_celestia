# Authentication Architecture

**Last updated:** 2026-10-18 — Section 2 account security.

Authentication now uses persisted, revocable sessions: 15-minute HS256 access JWTs and 30-day rotating refresh tokens. The [implementation walkthrough](../plans/section2-auth/walkthrough.md) records configuration, concurrency behavior, rollout requirements, reference review and validation limits.

## Endpoints

All paths below are relative to `/api/v1/auth` and return `Cache-Control: no-store`.

| Method | Path                        | Authentication               | Behavior                                                                        |
| ------ | --------------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| POST   | `/register`                 | Public                       | Hash password with bcrypt cost 12, create user/session, send verification email |
| POST   | `/login`                    | Public                       | Check password and create session                                               |
| GET    | `/me`                       | Bearer                       | Return safe owner profile, including email verification status                  |
| POST   | `/refresh`                  | Refresh credential           | Rotate refresh token and issue access JWT                                       |
| POST   | `/logout`                   | Bearer                       | Revoke current session and clear refresh cookie                                 |
| POST   | `/logout-all`               | Bearer                       | Revoke all owner sessions and clear refresh cookie                              |
| POST   | `/logout-others`            | Bearer                       | Revoke other owner sessions                                                     |
| GET    | `/sessions`                 | Bearer                       | List active owner sessions, safe metadata and current-device marker             |
| POST   | `/forgot-password`          | Public                       | Request a 15-minute reset link with generic response                            |
| POST   | `/reset-password`           | Single-use token             | Set password and revoke all owner sessions atomically                           |
| POST   | `/verification-email`       | Bearer                       | Reissue verification email if needed                                            |
| POST   | `/verify-email`             | Single-use token             | Confirm email ownership                                                         |
| GET    | `/oauth/providers`          | Public                       | Report which social providers are configured                                    |
| GET    | `/oauth/:provider`          | Public                       | Start Discord/Google OAuth with signed state and S256 PKCE                      |
| POST   | `/oauth/:provider/link`     | Bearer                       | Start explicit provider linking bound to the current session                    |
| GET    | `/oauth/:provider/callback` | State cookie + provider code | Confirm provider identity, create session, redirect to frontend                 |

`GET /api/v1/users/:id` remains self-only; a foreign or nonexistent profile returns the same 404. The legacy public `POST /api/v1/users` remains unavailable.

## Tokens and browser behavior

Access JWTs carry `sub`, `sid`, `kind: access` and a 15-minute expiry. Middleware restricts verification to HS256, validates nonempty subject/session identifiers and checks both owner existence and the persisted session on every protected request. Revoked, expired or foreign sessions fail immediately. There is no positive authentication cache. Old sessionless JWTs require a new login after rollout.

Refresh tokens contain 40 random bytes, encoded as hex; only SHA-256 hashes enter PostgreSQL. Rotation retains prior hashes. Reusing an old token revokes every session for that owner, including when concurrent requests attempt to rotate the same token. Transactions lock the user to serialize session creation, rotation, revocation and password reset. A login based on a stale password hash cannot create a session after a reset.

Browser refresh uses the `celestia_refresh` HttpOnly, SameSite=Lax cookie, scoped to `/api/v1/auth` and Secure in production. A whitelisted Origin is required for cookie refresh. Native clients can supply `{ refreshToken }` without an Origin. Responses to browser requests omit refresh tokens from JSON; native responses include them. Frontend callbacks carry no tokens in URLs. Frontend and API must share the same site for the production SameSite cookie policy.

The frontend stores short-lived access tokens through its existing auth store. Refresh is single-flight within the page and serialized between supporting tabs using Web Locks. It retries once only for `AUTH_SESSION_INVALID`, which is emitted before a protected handler runs; application password failures and stream bodies are not replayed. Token rotation preserves account caches, while explicit account changes invalidate them. Protected GETs do not update session activity, so the session UI reports **Last refreshed** rather than last activity.

## Passwords, email and OAuth

New passwords use bcrypt cost 12 and a maximum of 72 UTF-8 bytes. Login uses a dummy bcrypt comparison for unknown emails and returns the same credential error. Password hashes never appear in user responses or exports.

Reset tokens contain 32 random bytes, expire in 15 minutes, are stored only as hashes and can be consumed once. Issuing another invalidates previous links. Successful reset updates the password, consumes tokens and revokes all sessions atomically. Forgot-password returns the same success message for absent/existing accounts, suppresses delivery details, and has a 4.5-second response floor around mail delivery bounded to four seconds. Exceptional database latency can exceed this floor.

Verification uses a separate single-use token table with 24-hour expiry. Confirmation requires an explicit POST; opening a link does not consume it. Reset and verification pages remove token query parameters after capture and set a no-referrer policy.

The mail adapter logs links in development/test when credentials are absent. Production requires Resend credentials and a verified sender; delivery failures do not log secret links. See `apps/api/.env.example` for settings.

Discord/Google starts use ten-minute signed provider-bound state cookies and S256 PKCE. Supplied callback issuers are checked. Fixed provider token and user-info requests have five-second deadlines. Verified provider identities may create users; automatic email linking requires the existing local email to be verified too. Unverified local accounts must sign in and explicitly connect the provider in their profile. Explicit linking checks the initiating session is still active. The Arctic adapter isolates the requested library, whose upstream now reports deprecation.

## Persistence and verification

Migration `20261018100000_account_security_sessions` adds five security tables and `User.emailVerifiedAt`. Session history, provider links and email tokens cascade on user deletion and are explicitly excluded from portable account exports. An operator must define expired-row retention; no cleanup scheduler is included. Active sessions are capped at 100, with the oldest revoked on further sign-ins.

The standard `pnpm run verify` gate includes backend/frontend lint, types, builds, migration/schema comparison, full tests, formatting and diff checks. Section 2 adds actual PostgreSQL integration coverage for rotation/replay/concurrency, immediate revocation, recovery/verification, OAuth state and identity linking, cookie policy, credential isolation and cascades. External OAuth/email calls are mocked. See the walkthrough's validation evidence for the final run and deployment-only checks.
