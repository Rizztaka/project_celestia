# **Project Celestia Decisions Log**

**Document Version:** 1.0

**Status:** Living Document

**Last Updated:** July 2026

\---

## **Purpose**

This document records significant architectural, technical, and product decisions made throughout the development of Project Celestia.

Every major decision should include:

- The decision itself.
- The reasoning behind it.
- Alternatives that were considered.
- The final outcome.

The purpose of this log is to preserve context for future development and prevent repeating the same discussions.

\---

## **Decision Template**

### **Decision ID**

DEC-XXX

\---

### **Title**

Short descriptive title.

\---

### **Date**

YYYY-MM-DD

\---

### **Status**

- Proposed
- Accepted
- Superseded
- Rejected
- Deprecated

\---

### **Context**

Why was this decision necessary?

What problem were we solving?

\---

### **Decision**

What was chosen?

\---

### **Alternatives Considered**

List the main alternatives and why they were not selected.

\---

### **Consequences**

#### **Positive**

Benefits of the decision.

#### **Negative**

Trade-offs or limitations.

\---

### **Future Review**

When should this decision be revisited?

\---

## **Decision History**

\---

### **DEC-001 — Monorepo Architecture**

**Date:** July 2026

**Status:** Accepted

#### **Context**

Project Celestia is expected to grow into a multi-application platform with shared code across the frontend, backend, and future games.

#### **Decision**

Use a Monorepo managed with pnpm Workspaces and Turborepo.

#### **Alternatives Considered**

- Polyrepo
- Separate repositories for frontend and backend

#### **Reasoning**

A monorepo simplifies shared types, shared UI components, common utilities, and future game expansion while reducing duplication.

#### **Consequences**

##### **Positive**

- Shared codebase
- Easier refactoring
- Better developer experience

##### **Negative**

- Requires discipline when managing dependencies

\---

### **DEC-002 — Modular Monolith**

**Date:** July 2026

**Status:** Accepted

#### **Context**

The project requires modularity but does not yet justify the operational complexity of microservices.

#### **Decision**

Adopt a Modular Monolith architecture.

#### **Alternatives Considered**

- Microservices
- Traditional layered MVC

#### **Reasoning**

A modular monolith provides strong separation of concerns while remaining simple to develop, debug, and deploy.

#### **Future Review**

Reconsider only if scaling or deployment requirements make independent services beneficial.

\---

### **DEC-003 — Platform and Game Separation**

**Date:** July 2026

**Status:** Accepted

#### **Decision**

Separate platform services from game-specific domains.

#### **Platform**

- Authentication
- Users
- Settings
- Shared services

#### **Games**

- Genshin
- NIKKE
- Future titles

#### **Reasoning**

Allows future games to be added without affecting existing implementations.

\---

### **DEC-004 — Technology Stack**

**Date:** July 2026

**Status:** Accepted

#### **Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS

#### **Backend**

- Node.js
- Express
- TypeScript

#### **Database**

- PostgreSQL
- Prisma ORM

#### **Reasoning**

Balances developer productivity, scalability, and maintainability while keeping the technology stack approachable.

\---

### **DEC-005 — Intelligence Core**

**Date:** July 2026

**Status:** Accepted

#### **Decision**

Use an Intelligence Core instead of a generic "Theorycraft" module.

#### **Reasoning**

Project Celestia goes beyond damage calculations by providing planning, recommendations, analysis, and explanations.

The name reflects the broader scope of the platform.

\---

### **DEC-006 — AI Collaboration**

**Date:** July 2026

**Status:** Accepted

#### **Decision**

AI assistants are development partners, not decision makers.

#### **Reasoning**

Architectural decisions remain under human review.

AI should explain trade-offs, generate implementations, and assist with documentation, but should not define the project's direction independently.

\---

### **DEC-007 — Documentation First**

**Date:** July 2026

**Status:** Accepted

#### **Decision**

Establish documentation before large-scale implementation.

#### **Reasoning**

Clear documentation creates a shared understanding of the project's vision, architecture, standards, and workflow, reducing inconsistencies during development.

\---

### **DEC-008 — Feature-Driven Development**

**Date:** July 2026

**Status:** Accepted

#### **Decision**

Every major feature must have a written specification before implementation.

#### **Reasoning**

Feature specifications reduce ambiguity, improve implementation quality, simplify testing, and make future maintenance easier.

\---

## **How to Use This Document**

Whenever a significant architectural or product decision is made:

1\. Create a new decision entry.

2\. Assign the next available Decision ID.

3\. Record the reasoning.

4\. Document alternatives.

5\. Mark the decision status.

6\. Update related documentation if necessary.

Avoid silently changing important architectural choices.

\---

## **Guiding Principle**

Good decisions are documented.

Great decisions are documented with their reasoning.

Future contributors should be able to understand why a decision was made, not just what was decided.
