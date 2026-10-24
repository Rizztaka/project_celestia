import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';

import CompanionLayout from './components/CompanionLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import UidDialogProvider from './components/UidDialogProvider';
import { bindAccountCache, createAccountQueryClient } from './lib/account-cache';
import { useAuthStore } from './stores/auth.store';

// Lazy loaded page components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ShowcasePage = lazy(() => import('./pages/ShowcasePage'));
const GuestWorkspace = lazy(() =>
  import('./components/UidWorkspace').then((module) => ({ default: module.GuestWorkspace })),
);
const PublicShowcasePage = lazy(() => import('./pages/PublicShowcasePage'));
const UidWorkspace = lazy(() => import('./components/UidWorkspace'));
const UidDashboardPage = lazy(() => import('./pages/UidDashboardPage'));
const UidRosterPage = lazy(() => import('./pages/UidRosterPage'));
const UidEquipmentPage = lazy(() => import('./pages/UidEquipmentPage'));
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
const NikkeRosterPage = lazy(() =>
  import('./pages/nikke/NikkeRosterPage').then((m) => ({ default: m.NikkeRosterPage })),
);

function ShowcaseAlias() {
  const { search } = useLocation();
  return <Navigate to={`/${search}`} replace />;
}

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
          <h1 className="mb-4 text-3xl font-medium text-white">Let's find our way back.</h1>
          <p className="mb-6 max-w-md text-zinc-400">
            This page couldn't finish loading. Reload to try again. Your saved account data stays on
            the server.
          </p>
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

function WorkspaceApp() {
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
    <AccountQueryProvider key={epoch}>
      <Outlet />
    </AccountQueryProvider>
  );
}

export default function App() {
  const [client] = useState(() => new QueryClient());
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <BrowserRouter>
          <UidDialogProvider>
            <Suspense
              fallback={
                <p role="status" className="p-6 text-zinc-300">
                  Loading showcase…
                </p>
              }
            >
              <Routes>
                <Route path="/" element={<GuestWorkspace />}>
                  <Route index element={<ShowcasePage />} />
                </Route>
                <Route path="/showcase" element={<ShowcaseAlias />} />
                <Route path="/u/:uid" element={<UidWorkspace />}>
                  <Route index element={<UidDashboardPage />} />
                  <Route path="roster" element={<UidRosterPage />} />
                  <Route path="inventory" element={<UidEquipmentPage />} />
                  <Route path="showcase" element={<PublicShowcasePage />} />
                  <Route path="character/:id" element={<PublicShowcasePage />} />
                </Route>
                <Route element={<WorkspaceApp />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<PasswordRecoveryPage mode="verify" />} />
                  <Route path="/auth/callback" element={<OAuthCallbackPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<CompanionLayout />}>
                      <Route path="/workspace" element={<DashboardPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/import" element={<ImportPage />} />
                      <Route path="/roster" element={<RosterPage />} />
                      <Route path="/roster/:characterKey" element={<CharacterDetailPage />} />
                      <Route path="/characters/:characterKey" element={<CharacterDetailPage />} />
                      <Route path="/inventory" element={<InventoryPage />} />
                      <Route path="/planner" element={<PlannerPage />} />
                      <Route path="/intelligence" element={<IntelligencePage />} />
                      <Route path="/endgame" element={<EndgamePage />} />
                      <Route path="/nikke/roster" element={<NikkeRosterPage />} />
                      <Route
                        path="/simulators"
                        element={<Navigate to="/planner?tab=savings" replace />}
                      />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </UidDialogProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
