# ADR 0007: API Route Aggregation and Validation Boundaries

Status: Accepted
Date: 2026-08-07
Project Architect: Rizztaka
Project Owner: Rizztaka

---

## Context

During the implementation of Milestone 2C (Genshin Roster HTTP API), we needed to establish conventions for two recurring problems as the API scales:

1. **Route Organization:** How to structure Express routers as a domain (like `games/genshin`) grows to encompass many sub-domains (importer, characters, weapons, artifacts).
2. **Validation Boundaries:** Where input validation (Zod schema parsing) should occur when an HTTP controller receives a payload and delegates it to a domain service.

---

## Decision

### 1. Route Aggregation (Parent Routers)
We will use an **Aggregated Parent Router** approach for all major domains.
* Each sub-domain (e.g., `importer`, `characters`) must define its own `*.routes.ts` file (e.g., `importer.routes.ts`).
* The root of the domain must have a parent router (e.g., `genshin.routes.ts`) that imports and mounts these sub-domain routers.
* The application entry point (`app.ts`) only mounts the parent routers.

**Why:** This strictly enforces the "Modular Monolith" architecture defined in ADR 0001. Stuffing all routes for a domain into a single file would lead to massive, unmaintainable files and blurred boundaries between sub-domains.

### 2. Service-Level Validation (Double Serialization Trade-off)
Input validation (Zod) for complex payloads must occur inside the **Domain Service**, not the HTTP Controller.

In cases where the service expects a raw string (to maintain self-containment), the controller will re-serialize the already-parsed Express `req.body` into a string (`JSON.stringify(req.body)`) and pass it to the service. The service will then `JSON.parse` and Zod-validate it.

**Why:** 
* **Self-Contained Services:** The domain service must guarantee its own invariants regardless of the caller (HTTP controller, CLI tool, unit test, message queue).
* **Thin Controllers:** Controllers remain strictly as HTTP boundaries (req/res translation) with zero business or validation logic.
* **Trade-off:** We accept the minor performance penalty of double JSON parsing (Express parse -> stringify -> Service parse) for complex endpoints like bulk imports. For high-frequency, low-latency endpoints, this pattern may be revisited on a case-by-case basis.

---

## Consequences

### Positive
* **Scalability:** New domains and sub-domains can be added without modifying massive centralized route files.
* **Reusability:** Domain services are completely decoupled from HTTP concerns and can be invoked from any entry point safely.
* **Maintainability:** Controllers are practically boilerplate, reducing the chance of bugs at the HTTP layer.

### Negative
* **Performance:** The double JSON serialization introduces a slight CPU overhead. This is deemed negligible for current use cases (like account imports) but requires monitoring if applied to hot paths.
