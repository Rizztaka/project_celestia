# Authentication Architecture

**Last Updated:** September 2026
**Milestone:** Platform Account Security

---

## Overview

Project Celestia uses JWT-based authentication with bcrypt password hashing.
This document describes the current authentication architecture, security
invariants, and the changes made during the **Platform Account Security**
milestone.

---

## Endpoints

| Method | Path                    | Auth Required | Description                                |
| ------ | ----------------------- | ------------- | ------------------------------------------ |
| `POST` | `/api/v1/auth/register` | No            | Create a new account                       |
| `POST` | `/api/v1/auth/login`    | No            | Authenticate and receive a JWT             |
| `GET`  | `/api/v1/auth/me`       | Yes           | Return the authenticated user's profile    |
| `GET`  | `/api/v1/users/:id`     | Yes           | Return own profile only (self-only access) |

> [!IMPORTANT]
> The legacy public `POST /api/v1/users` route **has been removed**.
> The canonical registration endpoint is `POST /api/v1/auth/register`.

---

## Registration Flow

```
Client → POST /auth/register
           ↓
       AuthController.register
           ↓
       AuthService.register
           ↓
       bcrypt.hash(plainPassword, 12)   ← hashing happens here, exactly once
           ↓
       UserService.createUser({ email, username, passwordHash })
           ↓
       uniqueness checks (email, username) → ConflictError if violated
           ↓
       UserRepository.create(...)
           ↓ maps: passwordHash → password column
       prisma.user.create(...)
           ↓
       JWT signed with HS256
           ↓
       { user: SafeUser, token } returned (no password field)
```

### Internal Creation Contract

`UserService.createUser` accepts `CreateUserWithHashInput`:

```typescript
interface CreateUserWithHashInput {
  email: string;
  username: string;
  passwordHash: string; // MUST be a pre-computed bcrypt hash — never plain text
}
```

The field is named `passwordHash` (not `password`) to communicate at the call
site that the value is expected to be a pre-computed bcrypt hash. The name is a
convention that makes the intent unambiguous during code review; it does not
prevent a caller from passing a plain-text string at runtime. The enforcement
relies on AuthService being the sole caller of `UserService.createUser`.
The mapping from `passwordHash` to the database's `password` column happens
exclusively inside `UserRepository.create`.

Only `AuthService.register` is permitted to call `UserService.createUser` —
it is the only component that owns the hashing responsibility.

---

## Self-Only Profile Access

`GET /api/v1/users/:id` is protected by `requireAuth` and enforces self-only
access via `UserService.getOwnProfile(requesterId, targetId)`:

```typescript
async getOwnProfile(requesterId: string, targetId: string): Promise<SafeUser> {
  if (requesterId !== targetId) {
    throw new NotFoundError('User not found.');
  }
  return this.getUserById(targetId);
}
```

**Key security properties:**

- The ownership check happens **before any database lookup** — the target
  profile is never fetched when the requesters differ.
- Both "profile exists but belongs to another user" and "profile does not
  exist" return the same `404 NOT_FOUND` response — this prevents ID
  enumeration.
- `GET /api/v1/auth/me` is unaffected and continues to derive identity
  exclusively from the authenticated token, not from a URL parameter.

---

## JWT Requirements

Tokens are signed with **HS256** and verified with the following constraints:

| Claim | Requirement                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------- |
| `alg` | Must be `HS256`. Tokens signed with other algorithms (RS256, HS384, `none`, etc.) are rejected. |
| `sub` | Must be a non-empty, non-whitespace string.                                                     |
| `exp` | Standard expiry enforced by `jsonwebtoken`.                                                     |

**Invalid token scenarios** (all return `401 Unauthorized`):

- Missing `Authorization` header
- Non-`Bearer` scheme
- Expired token
- Invalid signature (wrong secret)
- Disallowed algorithm (e.g., HS384)
- Missing `sub` claim
- `sub` is empty string or whitespace
- `sub` is a number, null, or non-string type
- Completely malformed token string

Missing or malformed `Authorization` headers produce a distinct message from
token-level failures (expired, bad signature, disallowed algorithm, invalid
`sub`). Both categories return `401 Unauthorized`, but the response body
message differs. The middleware does not distinguish between individual
token-level failure reasons to avoid leaking which specific check failed.

---

## Password Security

- Algorithm: **bcrypt** (via `bcryptjs`)
- Cost factor: **12** (configurable; raise to 13–14 on dedicated hardware)
- Passwords are **never returned** in any API response
- The `SafeUser` type (`Omit<User, 'password'>`) is used for all outbound data
- Passwords are **never logged**

---

## Removed: Legacy Registration Route

**What was removed:** `POST /api/v1/users` (public route in `user.routes.ts`)

**Why it was a vulnerability:** The route accepted a raw password in the
request body, passed it through `UserController.createUser` →
`UserService.createUser` → `UserRepository.create` without any hashing.
Accounts created via this route stored plain-text passwords in the database.

**Frontend impact:** None. The audited frontend (`apps/web`) used
`POST /api/v1/auth/register` exclusively. No callers were found in the audited
frontend (`apps/web`).

**Verification:** Regression test "Regression: POST /api/v1/users is unavailable"
confirms the route returns 404 and does not call the persistence layer.

---

## Regression Test Evidence

The regression tests in
[`src/platform/security.http.test.ts`](../../apps/api/src/platform/security.http.test.ts)
prove the following behaviors using real Express routing, real bcrypt, and
real JWT signing/verification (only Prisma is mocked):

| #   | Test                                | Verified Behavior                           |
| --- | ----------------------------------- | ------------------------------------------- |
| 1   | POST /users unavailable             | Returns 404, no DB call                     |
| 2   | Registration stores a hash          | Captured DB write passes `bcrypt.compare`   |
| 3   | bcrypt.compare succeeds             | Real hash/verify cycle, no mocked bcrypt    |
| 4   | No password in responses            | register, login, profile all clean          |
| 5   | Login against registration hash     | Real bcrypt round-trip                      |
| 6   | Invalid tokens → 401                | Missing, expired, bad sig, bad sub variants |
| 7   | HS384 rejected                      | Real HS384-signed token returns 401         |
| 8   | User A reads own profile            | 200 with correct user                       |
| 9   | User A cannot read User B           | 404                                         |
| 10  | Nonexistent foreign ID = same 404   | Same error code                             |
| 11  | No DB lookup for foreign profile    | findUnique not called                       |
| 12  | /auth/me returns authenticated user | Identity from token, not URL                |
| 13  | Duplicate email/username → 409      | CONFLICT error code                         |

---

## Known Limitations

### Backend Lint Coverage Gap

`apps/api/package.json` has no `lint` script. Consequently, `pnpm run lint`
(via `turbo run lint`) only lints `@celestia/web`. Backend files are not
linted as part of the standard CI pipeline.

**Pre-existing lint errors** (present before this milestone, not introduced
by it):

| File                    | Rule                                | Description                                  |
| ----------------------- | ----------------------------------- | -------------------------------------------- |
| `auth.middleware.ts:18` | `@typescript-eslint/no-namespace`   | Express global augmentation uses `namespace` |
| `auth.service.ts:119`   | `@typescript-eslint/no-unused-vars` | `_password` destructure pattern              |
| `user.service.ts:102`   | `@typescript-eslint/no-unused-vars` | `_password` destructure pattern              |

Adding a `lint` script to `apps/api/package.json` and fixing these
pre-existing errors is tracked separately as a follow-up task.

---

## Module Dependency Rules

```
AuthController
    → AuthService        (auth concern: hashing, token signing)
    → UserService        (user concern: profile retrieval via public interface)

AuthService
    → UserService        (createUser, using CreateUserWithHashInput)
    → AuthRepository     (findByEmail for login)

UserService
    → UserRepository     (all user DB operations)

AuthService  ← does NOT import → UserRepository (direct)
UserService  ← does NOT import → AuthService or AuthRepository
```

This prevents circular dependencies and keeps hashing concerns in the auth
domain, uniqueness concerns in the user domain, and persistence in repositories.
