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

import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import CompanionLayout from './components/CompanionLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { bindAccountCache, createAccountQueryClient } from './lib/account-cache';
import { useAuthStore } from './stores/auth.store';

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
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const PasswordRecoveryPage = lazy(() => import('./pages/PasswordRecoveryPage'));
const OAuthCallbackPage = lazy(() => import('./pages/OAuthCallbackPage'));
const RosterPage = lazy(() => import('./pages/RosterPage'));
const CharacterDetailPage = lazy(() => import('./pages/CharacterDetailPage'));
const SimulatorsPage = lazy(() => import('./pages/SimulatorsPage'));
const NikkeRosterPage = lazy(() =>
  import('./pages/nikke/NikkeRosterPage').then((m) => ({ default: m.NikkeRosterPage })),
);

function AccountQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createAccountQueryClient);
  useEffect(() => {
    const unsubscribe = bindAccountCache(client);
    return () => {
      unsubscribe();
      client.clear();
    };
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

import React from 'react';

import { restoreCookieSession } from './lib/auth-client';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
          <h1 className="mb-4 text-3xl font-bold text-red-500">Fatal App Crash</h1>
          <p className="mb-6 text-zinc-400">Something caused the app to crash entirely.</p>
          <pre className="max-w-3xl overflow-auto rounded-lg bg-zinc-900 p-4 text-left text-sm text-red-300">
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-500"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const epoch = useAuthStore((state) => state.sessionEpoch);
  const [ready, setReady] = useState(() => !!useAuthStore.getState().token);
  const restoring = useRef(false);
  useEffect(() => {
    if (useAuthStore.getState().token || restoring.current) return;
    restoring.current = true;
    void restoreCookieSession()
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);
  if (!ready)
    return (
      <p role="status" className="p-6 text-zinc-300">
        Restoring your session…
      </p>
    );
  return (
    <ErrorBoundary>
      <AccountQueryProvider key={epoch}>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="flex h-screen w-screen items-center justify-center bg-zinc-950">
                <p role="status" className="text-zinc-300">
                  Loading page…
                </p>
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<PasswordRecoveryPage mode="verify" />} />
              <Route path="/auth/callback" element={<OAuthCallbackPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<CompanionLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/roster" element={<RosterPage />} />
                  <Route path="/roster/:characterKey" element={<CharacterDetailPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/planner" element={<PlannerPage />} />
                  <Route path="/intelligence" element={<IntelligencePage />} />
                  <Route path="/endgame" element={<EndgamePage />} />
                  <Route path="/simulators" element={<SimulatorsPage />} />
                  <Route path="/nikke/roster" element={<NikkeRosterPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AccountQueryProvider>
    </ErrorBoundary>
  );
}

export default App;
