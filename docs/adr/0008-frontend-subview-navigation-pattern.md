# ADR 0008: Frontend Subview Navigation Pattern

**Status:** Accepted  
**Date:** 2026-08-10  
**Context:**  
As the application grows, several pages require multiple sub-views of related data. For example, the Inventory page needs to display both Weapons and Artifacts. We need a consistent pattern for determining when to use URL-based routing (React Router) versus local component state (React `useState`) for switching between these sub-views.

**Decision:**  
We will use **React local state for tabs** to handle subview navigation when the data sets are tightly coupled to the same domain entity and there is no compelling use case for deep-linking directly to a specific sub-view.

We will use **URL routing (sub-routes)** when a subview represents a distinct workflow step, requires deep-linking (e.g., sharing a URL to a specific configuration), or when the subviews are entirely different domain contexts.

**Rationale:**  
1. **Performance & UX:** Firing parallel data-fetching queries on mount (e.g., `useQuery` for weapons and artifacts simultaneously) allows tab switching via local state to be instantaneous. URL routing introduces unnecessary component unmounting/remounting cycles.
2. **Reduced Boilerplate:** Avoiding nested `<Routes>` and `<Outlet>` components keeps the React tree flatter and easier to reason about for simple toggle views.
3. **Appropriate URL Semantics:** `/inventory` is a cohesive domain concept. Forcing `/inventory/weapons` and `/inventory/artifacts` fragments the URL space without providing meaningful deep-linking value to the user in this specific context.

**Consequences:**  
- **Positive:** Snappier user interfaces with zero-latency tab switching; simpler component structures.
- **Negative:** Users cannot bookmark a specific tab directly (e.g., loading `/inventory` will always default to the primary tab, which is Weapons). This is an acceptable trade-off for inventory browsing, but must be re-evaluated for features where deep-linking is critical.
