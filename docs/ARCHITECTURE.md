# **Project Celestia Architecture**

**Document Version:** 1.0

**Status:** Active

**Last Updated:** July 2026

\---

## **Purpose**

This document defines the technical architecture of Project Celestia.

Its purpose is to ensure that every feature is implemented consistently, remains maintainable over time, and supports future expansion without requiring major architectural redesigns.

Whenever implementation decisions conflict, this document takes precedence unless a newer architectural decision has been formally accepted.

\---

## **Architectural Philosophy**

Project Celestia is designed as a Modular Monolith.

The application is deployed as a single system while internally being divided into isolated modules with clearly defined responsibilities.

This approach provides:

- Faster development
- Easier debugging
- Simpler deployment
- Strong module boundaries
- Future migration to microservices if ever required

Microservices are not part of Version 1.

\---

## **Core Architecture**

User

│

▼

Frontend (React + Vite)

│

▼

REST API (Express)

│

▼

Platform Services

│

├── Authentication

├── Users

├── Settings

│

▼

Game Modules

│

└── Genshin

&#x20; │

&#x20; ├── Importer

&#x20; ├── Characters

&#x20; ├── Weapons

&#x20; ├── Artifacts

&#x20; ├── Teams

&#x20; ├── Materials

&#x20; ├── Planner

&#x20; ├── Endgame

&#x20; ├── Knowledge

&#x20; └── Intelligence

&#x20; │

&#x20; ▼

&#x20; Recommendation Engines

&#x20; │

&#x20; ▼

Database + Game Data

\---

## **Technology Stack**

### **Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand

\---

### **Backend**

- Node.js
- Express
- TypeScript
- Prisma ORM

\---

### **Database**

- PostgreSQL

\---

### **Monorepo**

- pnpm Workspaces
- Turborepo

\---

### **Quality**

- ESLint
- Prettier
- Husky
- lint-staged

\---

### **Testing**

- Vitest
- Playwright

\---

## **Monorepo Structure**

project-celestia/

apps/

&#x20; web/

&#x20; api/

packages/

&#x20; ui-kit/

&#x20; api-contracts/

&#x20; types/

&#x20; config/

docs/

infra/

Every package should have a single responsibility.

Shared logic belongs inside packages instead of being duplicated.

\---

## **Platform Layer**

Platform modules are game-independent.

Examples include:

- Authentication
- User accounts
- User settings
- Notifications
- Global preferences

Platform modules must never contain game-specific logic.

\---

## **Game Layer**

Each supported game owns its own isolated domain.

Example:

games/

genshin/

nikke/

future-games/

Each game manages:

- Characters
- Equipment
- Inventory
- Teams
- Planning
- Progression
- Endgame
- Knowledge
- Intelligence

No game may directly depend on another game's internal implementation.

\---

## **Intelligence Core**

The Intelligence Core is responsible for transforming raw player data into useful recommendations.

It consists of specialized modules.

- Team Intelligence
- Character Intelligence
- Artifact Intelligence
- Planner Intelligence
- Pull Intelligence
- Endgame Intelligence
- Knowledge Intelligence
- AI Interface

The Intelligence Core must always explain the reasoning behind every recommendation.

Pure calculations should remain deterministic whenever possible.

AI should enhance explanations rather than replace reliable calculations.

\---

## **Data Sources**

Project Celestia manages two categories of data.

### **Static Game Data**

Examples:

- Characters
- Weapons
- Artifact sets
- Enemies
- Materials
- Domains

Static data should be version-controlled and updated when new game versions release.

\---

### **Dynamic User Data**

Examples:

- Imported accounts
- Builds
- Inventory
- Progress
- Preferences
- Planner state

Dynamic data belongs in PostgreSQL.

Game data and user data must remain separate.

\---

## **State Management**

Frontend responsibilities are clearly separated.

### **TanStack Query**

Responsible for:

- Server state
- API communication
- Data synchronization
- Caching

\---

### **Zustand**

Responsible for:

- UI state
- Theme
- Dialogs
- Filters
- Selected items
- Temporary local state

Server state should generally belong to TanStack Query; client/UI state should generally belong to Zustand/local state. Server state must never be duplicated inside Zustand.

\---

## **Backend Design Principles**

Every backend feature should follow Domain-Driven Design.

Each feature owns:

- Controller
- Service
- Repository
- Validation
- Tests

Business logic must never exist inside controllers.

Heavy calculations should remain isolated from HTTP concerns.

\---

## **Module Communication**

Modules communicate only through public interfaces.

Direct access to another module's internal implementation is forbidden.

Future tooling should enforce these boundaries automatically.

\---

## **Scalability Strategy**

Project Celestia intentionally avoids premature optimization.

Future upgrades may include:

- Redis caching
- Worker queues
- Background jobs
- WebSockets
- Microservice extraction

These should only be introduced when profiling demonstrates a measurable need. Do not introduce Redis/BullMQ/microservices/Kubernetes/etc. merely to appear enterprise-level. Heavy computation should only receive worker/queue infrastructure when measurements justify it.

\---

## **Security Principles**

Every API must:

- Validate input.
- Authenticate users where required.
- Authorize protected actions.
- Return consistent error responses.

Security should never be treated as an optional feature.

\---

## **Future Expansion**

The architecture is designed so that new games can be added without modifying existing game modules.

Future examples include:

- NIKKE
- Honkai: Star Rail
- Wuthering Waves

Each new game should integrate through the same architectural principles while remaining isolated from other games.

\---

## **Guiding Principles**

Every architectural decision should prioritize:

- Simplicity
- Maintainability
- Scalability
- Modularity
- Explainability
- Performance
- Developer Experience
- Correctness before optimization
- Accuracy before feature quantity
- Honest incompleteness over false precision
- One Sunday represents one coherent milestone

\---

## **Glossary**

**Monorepo —** A single repository containing multiple related applications and shared packages.

**Modular Monolith —** A single deployable application organized into isolated modules with well-defined boundaries.

**Domain-Driven Design (DDD) —** Organizing software around business domains instead of technical layers.

**Platform Layer —** Shared services used across all supported games.

**Game Layer —** Independent modules that contain game-specific functionality.

**Intelligence Core —** The collection of systems responsible for analyzing data, generating recommendations, and explaining results.

**Static Game Data —** Version-controlled game information that changes only when the game itself updates.

**Dynamic User Data —** Player-specific information that changes as the user plays and interacts with the platform.
