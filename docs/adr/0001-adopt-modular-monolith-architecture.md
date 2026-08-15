# **ADR 0001: Adopt Modular Monolith Architecture and Core Technology Stack (Milestone 1A)**

**Status:** Accepted

**Date:** 2026-07-30

**Project Architect:** Rizztaka

**Project Owner:** Rizztaka

\---

## **Context**

Project Celestia requires a robust, scalable, and easily maintainable foundation for a multi-month development lifecycle. The system necessitates a clear separation of concerns between the user interface and the backend API, while maintaining high code quality, developer velocity, and strict type safety across the entire codebase. We need to establish the core architectural patterns and tooling before product implementation begins.

\---

## **Decision**

We have elected to establish a Modular Monolith architecture utilizing the following core technology stack:

- **pnpm Workspaces \& Turborepo:** To manage the repository as a monorepo. pnpm provides efficient, strict dependency management via a virtual store, while Turborepo offers aggressive caching and optimized task execution pipelines.

- **Modular Monolith Architecture:** To keep deployment straightforward while strictly enforcing domain boundaries (e.g., core, platform, games) via logical directory structures, preventing tightly coupled code.

- **React + Vite (Frontend):** To deliver a fast, modern single-page application (SPA). Vite replaces legacy bundlers (like Webpack/CRA) for significantly faster Hot Module Replacement (HMR) and optimized builds.

- **Express 5 (Backend):** To handle API routing. Express 5 natively supports Promise-based route handlers, eliminating the need for external try/catch wrapper utilities for asynchronous errors.

- **TypeScript (Strict Mode):** Applied universally across the monorepo to catch errors at compile-time, enforce interface contracts, and improve long-term maintainability.

- **API Versioning (/api/v1):** To future-proof the backend. All routes are strictly versioned from day one to allow for future breaking changes without disrupting existing clients.

- **Zod (Environment Validation):** To enforce runtime schema validation on configuration variables. The application will fail-fast at startup if required environment variables are missing or incorrectly typed.

- **Pino (Logging):** To replace standard console.log. Pino provides high-performance, asynchronous, structured JSON logging suitable for production monitoring, with pino-pretty configured for local development readability.

\---

## **Alternatives Considered**

- **Polyrepo Setup (Separate Repos):** Rejected due to the friction of sharing types and configurations between the frontend and backend.

- **Next.js / Fullstack Frameworks:** Rejected in favor of a decoupled React frontend and Express backend to ensure clear architectural separation and granular control over the API tier.

- **Unversioned API Routing:** Rejected as it creates severe technical debt when the API contract inevitably needs to evolve.

- **Standard Console Logging:** Rejected because it blocks the Node.js event loop and lacks structured querying capabilities for production environments.

- **NestJS:** Rejected because the project prioritizes learning, flexibility, and lower initial complexity. Express provides a smaller abstraction layer while allowing the architecture to remain framework-agnostic.

\---

## **Consequences**

### **Positive**

- **Developer Velocity:** Turborepo caching and Vite HMR will dramatically reduce build and compile times.

- **Safety \& Reliability:** Strict TypeScript and Zod environment validation drastically reduce the surface area for runtime crashes.

- **Consistency:** A single repository enforces unified formatting, linting, and testing standards across all domains.

### **Negative**

- **Complexity:** Introduces initial configuration overhead for workspace routing and TypeScript path aliases.

- **Learning Curve:** Requires developers to understand monorepo boundaries and Turborepo task pipelines instead of running standard npm scripts directly.

\---

## **Future Considerations**

- **Shared Packages:** As the codebase grows, we will extract shared types, validation schemas, and UI components into dedicated workspace packages (e.g., packages/types, packages/ui).

- **Database Integration:** An ORM and database driver will be introduced in subsequent phases and must align with the established TypeScript and modularity standards.

- **Testing Pipelines:** The current Vitest configuration is set to pass without tests; strict coverage thresholds will be enforced as feature implementation begins.

\---

## **Architectural Principles**

- Feature-first organization.
- Domain isolation.
- Shared types across frontend and backend.
- Pure business logic separated from HTTP.
- Build for maintainability over premature optimization.
