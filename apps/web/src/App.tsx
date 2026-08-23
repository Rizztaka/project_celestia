/**
 * App.tsx — Application root
 *
 * Responsibilities:
 *   1. Provide TanStack QueryClient to the component tree
 *   2. Define the React Router route hierarchy
 *   3. Enforce authentication via ProtectedRoute
 *
 * Route structure:
 *   /login       — public, LoginPage
 *   /register    — public, RegisterPage
 *   /            — protected, DashboardPage
 *   /profile     — protected, ProfilePage
 *   /import      — protected, ImportPage
 *   /roster      — protected, RosterPage   ← Milestone 2D
 *   /inventory   — protected, InventoryPage ← Milestone 2E
 *
 * State management split (per ARCHITECTURE.md):
 *   - Zustand (auth.store.ts)  → token, isAuthenticated (client state)
 *   - TanStack Query           → server data (profile, future game data)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy loaded page components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EndgamePage = lazy(() => import('./pages/EndgamePage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const IntelligencePage = lazy(() => import('./pages/IntelligencePage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const RosterPage = lazy(() => import('./pages/RosterPage'));
const SimulatorsPage = lazy(() => import('./pages/SimulatorsPage'));
const NikkeRosterPage = lazy(() => import('./pages/nikke/NikkeRosterPage').then(m => ({ default: m.NikkeRosterPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-zinc-950"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" /></div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/roster" element={<RosterPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/intelligence" element={<IntelligencePage />} />
              <Route path="/endgame" element={<EndgamePage />} />
              <Route path="/simulators" element={<SimulatorsPage />} />
              <Route path="/nikke/roster" element={<NikkeRosterPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
