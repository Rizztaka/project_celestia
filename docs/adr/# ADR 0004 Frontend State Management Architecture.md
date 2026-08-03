# **ADR 0004: Frontend State Management Architecture (Milestone 1C)**

**Status:** Accepted

**Date:** 2026-08-03

**Project Architect:** Rizztaka

**Project Owner:** Rizztaka

---

## **Context**

Project Celestia is transitioning from a developmental test frontend to a fully routed Single Page Application (SPA). The application needs robust state management to handle authentication tokens, user profile caching, and complex data fetching for future game modules. A clear architectural separation between local client state (UI state, auth tokens) and remote server state (database data, API responses) is required to prevent data synchronization issues and unnecessary complexity.

---

## **Decision**

We have elected to use a specialized combination of libraries for frontend routing and state management:

* **React Router:** For declarative routing and route guarding (e.g., `ProtectedRoute` for authenticated views).
* **TanStack Query:** Exclusively for managing **server state**. It handles data fetching, caching, background synchronization, and loading/error states.
* **Zustand:** Exclusively for managing **client state**. Specifically, it persists the stateless JWT token (via `localStorage`) and the `isAuthenticated` flag.

### **Strict Architectural Constraint**
**Server state must never be duplicated inside Zustand.** 
When the user's profile is needed, it must be fetched via TanStack Query (e.g., `GET /auth/me`), not stored globally in Zustand after login. Zustand is only responsible for the token required to authenticate those network requests.

---

## **Alternatives Considered**

* **Redux / Redux Toolkit:** Rejected. While powerful, Redux introduces significant boilerplate and often encourages developers to dump both server and client state into a single global store, violating the separation of concerns we aim to enforce.
* **React Context + `useReducer`:** Rejected for server state management due to lack of built-in caching, retry logic, and performance issues (unnecessary re-renders when context values change).
* **SWR:** Considered alongside TanStack Query. Rejected in favor of TanStack Query because `ARCHITECTURE.md` explicitly standardizes on TanStack Query, which generally offers a more robust mutation API and DevTools ecosystem.
* **HTTPOnly Cookies (for Auth):** Rejected for Phase 1. While more secure against XSS, cookies require backend session management or complex CSRF protections. As established in ADR 0002, the authentication system is entirely stateless. Storing the JWT in `localStorage` aligns with this stateless architecture for an SPA.

---

## **Consequences**

### **Positive**

* **Clear Boundaries:** Developers always know where state belongs. If it comes from the API, it goes in TanStack Query. If it's local UI state or the auth token, it goes in Zustand.
* **Performance:** TanStack Query reduces unnecessary network requests through aggressive but configurable caching, while keeping the UI snappy.
* **Simplicity:** Zustand requires minimal boilerplate compared to Redux, making the `auth.store.ts` implementation lightweight and readable.

### **Negative**

* **Learning Curve:** Developers must understand the conceptual difference between client state and server state, and must know how to use two different state management libraries side-by-side.
* **Token Security:** Storing the JWT in `localStorage` exposes it to potential XSS attacks, requiring strict vigilance against rendering unsanitized user input in the React application.

---

## **Future Considerations**

* **Refresh Tokens:** If token expiration becomes a UX issue, the architecture will need to be updated to support short-lived access tokens and secure, HTTPOnly refresh tokens (as noted in ADR 0002).
* **UI Component State:** As the application grows, complex components (like filters or planners) will leverage Zustand for local state rather than prop-drilling, adhering to the rule that server data remains in TanStack Query.
