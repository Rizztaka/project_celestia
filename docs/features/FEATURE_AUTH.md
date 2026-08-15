# Feature Specification: Authentication

**Feature ID:** FEAT-001  
**Priority:** P0  
**Status:** Complete  
**Phase:** 1B / 1C — Core Platform  
**Last Updated:** 2026-08-03

---

## Feature Name

Platform Authentication (Register + Login)

---

## Objective

Provide secure user registration and JWT-based login so that all future
protected features (account import, recommendations, planning) can verify
the identity of the requesting user.

Without authentication, the platform has no way to associate data with a
specific player's account.

---

## Target Users

All users of Project Celestia — authentication is required before any
personalized feature can function.

---

## User Stories

- As a new user, I want to create an account with email, username, and password
  so that I can access my personalized data.
- As a returning user, I want to log in with my email and password
  so that I receive a token I can use to access protected endpoints.
- As an authenticated user, I want the frontend to restore my session from a
  stored token so that I do not have to log in again after every page reload.
- As a developer, I want auth failures to return clear, consistent HTTP status
  codes so that the frontend can handle them correctly.

---

## Functional Requirements

- `POST /api/v1/auth/register` — create a new account
- `POST /api/v1/auth/login` — authenticate and receive a JWT access token
- `GET /api/v1/auth/me` — return the current user's safe profile (requires JWT)
- Passwords are hashed with bcryptjs (cost factor 12) before storage
- JWT tokens are signed with HS256 using a secret from environment config
- Tokens expire after 7 days (configurable via `JWT_EXPIRY` env var)
- Duplicate email returns 409 Conflict
- Duplicate username returns 409 Conflict
- Wrong email or password returns 401 Unauthorized (same message for both — prevents email enumeration)
- The password hash is never included in any API response

---

## Non-Functional Requirements

- Registration response time: < 500ms (bcrypt cost factor limits this)
- Login response time: < 500ms
- JWT verification in middleware must be synchronous (< 1ms overhead per request)
- Error messages must not expose whether an email exists in the system

---

## Inputs

**Register:** `{ email: string, username: string, password: string }`  
**Login:** `{ email: string, password: string }`

---

## Outputs

Both endpoints return the standard success envelope:

```json
{
  "success": true,
  "data": {
    "user": { "id", "email", "username", "createdAt", "updatedAt" },
    "token": "<JWT>"
  },
  "message": "Registration successful" | "Login successful"
}
```

---

## API Endpoints

| Method | Path                  | Auth Required | Description                        |
| ------ | --------------------- | ------------- | ---------------------------------- |
| POST   | /api/v1/auth/register | No            | Create new account                 |
| POST   | /api/v1/auth/login    | No            | Authenticate user                  |
| GET    | /api/v1/auth/me       | Yes (Bearer)  | Return current user's safe profile |

---

## Backend Requirements

- `auth.schema.ts` and `me.schema.ts` in `api-contracts` — Zod schemas shared with frontend
- `AuthRepository` — `findByEmail()` for login lookup
- `AuthService` — `register()`, `login()`, `generateToken()`, `stripPassword()`
- `AuthController` — thin HTTP adapter, validates input, delegates to service; `me()` handler delegates to `UserService.getUserById()`
- `requireAuth` middleware in `core/middleware/` — verifies JWT on protected routes
- Cross-module: `AuthService` calls `UserService.createUser()` for registration
  (avoids duplicating uniqueness rules); `AuthController.me()` calls `UserService.getUserById()`

---

## Database Impact

No schema changes required for Phase 1B. The existing `User` model
(`id`, `email`, `username`, `password`, `createdAt`, `updatedAt`) is sufficient
for stateless JWT authentication.

Future considerations: `refreshTokenHash`, `lastLoginAt`, `failedLoginAttempts`
can be added in a later phase if refresh token rotation or rate limiting is needed.

---

## Security Considerations

- Passwords: bcrypt with cost factor 12 (never stored as plain text)
- Tokens: signed with `JWT_SECRET` (minimum 32 chars enforced at startup)
- Email enumeration: login always returns "Invalid email or password." regardless of cause
- Token expiry: 7 days default, configurable
- No refresh tokens in Phase 1B — stateless JWT only
- `requireAuth` middleware must be explicitly applied per route — no global auth

---

## Testing Strategy

- **Unit tests** for `AuthService` and `UserService` (bcrypt and JWT mocked)
- **Manual tests** via HTTP client (Postman / curl) against the running API
- **Integration tests** deferred to a later phase when a test database is configured

---

## Acceptance Criteria

The feature is complete when:

- [x] `POST /api/v1/auth/register` creates a user and returns a JWT
- [x] `POST /api/v1/auth/login` verifies credentials and returns a JWT
- [x] `GET /api/v1/auth/me` returns current user profile when token is valid
- [x] Duplicate email/username returns 409 Conflict
- [x] Invalid credentials return 401 Unauthorized
- [x] Password is never present in any response
- [x] `requireAuth` middleware correctly rejects requests without a valid token
- [x] All auth business logic is unit tested
- [x] TypeScript reports zero errors

---

## Future Improvements

- Refresh token rotation (Phase 2+)
- Rate limiting on login endpoint (Phase 2+)
- `lastLoginAt` tracking (Phase 2+)
- Email verification flow (Phase 3+)
- OAuth provider support (Phase 6+)
