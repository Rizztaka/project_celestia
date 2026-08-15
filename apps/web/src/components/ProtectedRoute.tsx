/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Reads the token from the Zustand auth store. If no token exists,
 * redirects to /login. If a token exists, renders the child route.
 *
 * Note: token presence does not guarantee validity — the server will
 * reject expired tokens with a 401, which the API client converts to
 * an ApiError. Pages should handle that case and call logout() from
 * the auth store to clear stale state.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../stores/auth.store';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
