---
name: scaffold-domain-feature
description: Use this skill to correctly scaffold a new domain feature (e.g., a new game module or companion feature) according to Project Celestia's strict Modular Monolith architecture.
---

# Scaffold Domain Feature

When instructed to add a new feature or domain, you must strictly follow this procedure to ensure it complies with Project Celestia's architecture:

## 1. Create the Directory Structure
All features must be self-contained. Under the appropriate parent folder (`apps/api/src/games/<game>` or `apps/api/src/platform/<domain>`), create the following files:
- `<feature>.controller.ts`
- `<feature>.service.ts`
- `<feature>.repository.ts`
- `<feature>.routes.ts`
- `<feature>.schema.ts` (for Zod validation)

## 2. Enforce the Controller/Service/Repository Pattern
- **Controller**: Write the Express route handler here. It MUST ONLY validate the incoming request using the Zod schema, pass the data to the Service, and return the response. Do NOT put business logic here.
- **Service**: Write the core business logic and calculations here. 
- **Repository**: Write all Prisma database queries here. The Service must call the Repository, not Prisma directly.

## 3. Register the Route
Open the parent domain's main router (e.g., `genshin.routes.ts` or `app.ts`) and mount the new `<feature>.routes.ts` file.

## 4. Frontend Counterpart (If applicable)
If creating the frontend UI for this feature in `apps/web`:
- Create the server state hooks using **TanStack Query** (e.g., `useQuery`, `useMutation`).
- Create small, reusable components in `apps/web/src/components`.
- Do NOT put API fetching logic directly inside the React components. Use the TanStack Query hooks.
- Do NOT use Zustand for data fetched from the API. Only use Zustand if the feature requires local, temporary UI state (like a selected filter or active tab).

## 5. Review Against Architecture
Before completing the task, double-check that the new feature does not import code from other isolated domains (e.g., a Honkai module cannot import from the Genshin module).
