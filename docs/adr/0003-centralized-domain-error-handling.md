# **# ADR 0003: Centralized Domain Error Handling (Milestone 1B)**

**Status:** Accepted

**Date:** 2026-08-02

**Project Architect:** Lead Engineer

**Project Owner:** Rizztaka

\---

## **Context**

In an Express.js application, it is common for developers to place `try/catch` blocks inside controllers and manually send HTTP status codes (e.g., `res.status(404).send(...)`) based on business logic failures. This violates Domain-Driven Design (DDD) by forcing the domain services to understand HTTP, or forcing controllers to understand complex business rules. We needed a uniform, scalable way to handle errors that keeps our controllers thin and our domain services pure.

Additionally, this ADR groups the decision to adapt to the Prisma 7 schema requirements, as both decisions revolve around how the application layer safely interfaces with its infrastructure and external boundaries.

\---

## **Decision**

- **Centralized `AppError` Hierarchy:** We implemented a custom `AppError` base class, extended by specific semantic errors (`NotFoundError`, `ConflictError`, `UnauthorizedError`, etc.). These errors encapsulate an HTTP status code and a predictable internal error string (e.g., `"CONFLICT"`).

- **Global Express Error Handler:** All routing is intercepted by a single global middleware handler. Domain services simply `throw new ConflictError("Email taken")`. The global handler catches this, unwraps the semantic status code (409), and formats a consistent JSON response.

- **Zod Error Interception:** The global handler also specifically traps `ZodError` exceptions thrown during request validation, automatically converting them into standardized HTTP 400 Bad Request responses.

- **Prisma 7 Connection Strategy:** We permanently removed the `url` field from `schema.prisma`. To comply with Prisma 7's breaking changes, database connections are exclusively managed via the `prisma.config.ts` adapter layer, keeping the schema strictly focused on data modeling.

(**Note:** These decisions are combined into one ADR because they collectively represent the boundaries of how our core application code handles external I/O: rejecting bad HTTP requests, failing gracefully on business logic violations, and safely connecting to the database.)

\---

## **Alternatives Considered**

- **Controller-Level Error Handling:** Rejected. Checking return values (e.g., `if (!user) return res.status(404)`) inside every controller leads to massive code duplication and inconsistent API responses.

- **Services Returning Error Tuples (e.g., `\[error, data]`):** Rejected. While popular in Go, using tuples in TypeScript often clutters the business logic. Throwing semantic exceptions allows for cleaner "happy path" code.

- **Retaining Prisma 6 `url` configuration:** Rejected. Downgrading the ORM to maintain legacy configuration patterns introduces immediate technical debt.

\---

## **Consequences**

### **Positive**

- **Thin Controllers:** Controllers only contain three steps: validate input, call service, return success. They never handle business failures.

- **Pure Domain Logic:** Services do not import Express types or know what an HTTP 404 is. They only know about domain concepts like "Not Found".

- **API Consistency:** Every single error emitted by the application adheres to the exact same `{ success: false, error: { code, message } }` JSON shape.

### **Negative**

- **Traceability:** Because errors are caught globally, a poorly written `AppError` message without stack context can occasionally make it slightly harder to trace exactly which service threw the error during local debugging.

\---

## **Future Considerations**

- **Error Telemetry Integration:** The global error handler currently logs unhandled 500 errors to Pino. In later phases, this specific catch block will be the ideal, singular place to inject error-tracking telemetry (e.g., Sentry or Datadog) without modifying any application code.
