# Section 2 — Account security

Implemented the account-security directive in the existing platform auth module. Section 1 game-data and multi-server behavior remain covered by the full regression suite.

## Sessions and recovery

- Access JWTs expire after 15 minutes and identify a persisted session. Every protected request checks the owner and session in PostgreSQL, so revocation takes effect immediately. Existing JWTs without a session require a fresh sign-in after deployment.
- Refresh tokens contain 40 random bytes. Only SHA-256 hashes are stored. Rotation extends the session for 30 days and retains prior token hashes for replay detection. Reusing a rotated token commits revocation of all that owner's sessions. Owner locks serialize refresh, reset and session revocation; concurrent rotation has one winner and then revokes the owner's sessions as requested.
- Browser refresh credentials use an HttpOnly, SameSite=Lax cookie scoped to `/api/v1/auth`, Secure in production. Cookie refresh requires an allowed Origin. Native clients can supply a refresh token in the body. Browser JSON omits refresh credentials; short-lived access tokens continue using the existing persisted auth store.
- The browser serializes refresh within a page and across supporting tabs through Web Locks. It retries once only for an authentication failure raised before a route handler. Token rotation preserves account caches and drafts; account switches invalidate them. Browsers without Web Locks cannot coordinate across tabs, so simultaneous refresh can invoke the deliberate strict reuse policy.
- Session lists contain safe device metadata, the current-device marker, creation time and last refresh time. Protected GETs remain read-only; the UI labels the timestamp “Last refreshed.” Creation caps active sessions at 100 by revoking the oldest devices.
- Reset links contain 32 random bytes, expire in 15 minutes, and are hashed, single-use and invalidated on reissue. Reset hashes the new password with bcrypt cost 12 and revokes all sessions in the same transaction. Passwords are limited to bcrypt's 72-byte input boundary.
- Recovery returns the same message for existing and absent accounts, generates entropy on both paths, suppresses lookup/delivery details and applies a 4.5-second response floor around bounded mail delivery. This floor does not promise identical timing during database outages or exceptional latency.
- Email verification uses a separate hashed, single-use, 24-hour token and an explicit confirmation button. Reset and verification tokens cannot substitute for each other. Token query parameters are removed from the page URL after capture.

## OAuth and delivery configuration

Arctic 3.7 supplies provider URLs, state, S256 PKCE and token parsing. The adapter uses bounded HTTP calls for token exchange and user info because this Arctic version's exchange API does not accept an AbortSignal. Signed, provider-bound state cookies expire in ten minutes. Callback issuer values, when supplied, must match the selected provider. Callback redirects contain no credentials; the frontend restores the HttpOnly cookie session.

Only verified provider emails can create/link accounts. Automatic email matching also requires the existing password account's email to be verified. Owners with unverified local email sign in with their password and explicitly connect a provider in their profile. Explicit linking is bound to the initiating user's still-active session. OAuth accounts use an inaccessible random placeholder password hash and can use password recovery to establish a password.

Apply migration `20261018100000_account_security_sessions` before starting the updated API. Configure the variables documented in `apps/api/.env.example`:

- `WEB_ORIGIN`, `API_ORIGIN`, and the exact allowed browser origin in `CORS_ALLOWED_ORIGINS`. Production origins must use HTTPS. Deploy frontend and API on the same site for SameSite=Lax refresh cookies.
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`, with callback `${API_ORIGIN}/api/v1/auth/oauth/discord/callback`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, with callback `${API_ORIGIN}/api/v1/auth/oauth/google/callback`.
- `RESEND_API_KEY` and a verified `MAIL_FROM` sender for production email. Missing credentials log links only in development/test. Production failures do not log bearer links and are reported through generic operational logs.

Unconfigured social providers are disabled visibly. No real credentials or external OAuth/email requests were used during verification. Live provider consent and email delivery require deployment configuration and provider-side testing. Arctic's upstream site reports deprecation in July 2026; it remains isolated behind the adapter to simplify replacement.

## Data lifecycle and validation

The migration adds sessions, rotated-token history, OAuth accounts, password-reset tokens, verification tokens and `User.emailVerifiedAt`. Auth credential tables are explicitly excluded from portable account exports and cascade on account deletion. The exact recovery inventory now includes all 25 application tables and 15 migrations. The read-only restore probe verifies seeded credentials/session reads without invoking login, which now writes sessions. Its zero-budget farming invariant permits informational cards on open domain days while requiring zero allocated claims and resin.

Expired session and token rows remain until an operator-defined retention cleanup or account deletion; no background scheduler was introduced. Retain replay history for retained sessions if strict old-token detection is required.

Validation evidence is recorded in `validation-results.json`. Browser review used a separate loopback-only synthetic API and the actual Vite frontend at a 319-pixel viewport. It checked generic recovery success, reset confirmation fields and query-token removal, unavailable-provider buttons, active-device labels and removal of other devices while preserving the current session. Database integration tests exercise the actual repositories and HTTP routes; browser screenshots are presentation evidence only.

## Reference review

- [Arctic](https://arctic.pilcrowonpaper.com/) and installed `arctic@3.7.0` source: provider constructors, PKCE and token parsing; upstream deprecation status.
- [Lucia](https://lucia-auth.com/): current session-authentication guidance and its library retirement notice; no Lucia runtime dependency added.
- [Supabase Auth](https://github.com/supabase/auth): refresh-token rotation architecture reference; no Supabase service integration.
- [Cal.com Prisma schema](https://github.com/calcom/cal.com/blob/main/packages/prisma/schema.prisma): account/session relation reference.
- [Discord OAuth2](https://docs.discord.com/developers/topics/oauth2) and [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server): fixed token/user-info endpoints, authorization code and verified identity handling.
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email): bounded plaintext mail adapter.
