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
import { BrowserRouter, Navigate,Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import EndgamePage from './pages/EndgamePage';
import ImportPage from './pages/ImportPage';
import IntelligencePage from './pages/IntelligencePage';
import InventoryPage from './pages/InventoryPage';
import LoginPage from './pages/LoginPage';
import PlannerPage from './pages/PlannerPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import RosterPage from './pages/RosterPage';
import SimulatorsPage from './pages/SimulatorsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx errors — auth failures, not found, etc. are
      // not going to succeed on retry
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
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — ProtectedRoute redirects to /login if not authenticated */}
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
          </Route>

          {/* Catch-all — redirect unknown paths to dashboard (or login if not authed) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
