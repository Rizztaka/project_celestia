import { type AuthUser, useAuthStore } from '../stores/auth.store';
import { assertCurrentSession, captureSession } from './account-session';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
let refreshing: Promise<string> | null = null;
export function accessSessionId(token: string | null): string | null {
  try {
    return (
      JSON.parse(atob(token!.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))).sid ?? null
    );
  } catch {
    return null;
  }
}
async function withRefreshLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request('celestia-refresh', operation);
  return operation();
}
export function refreshAccessToken(): Promise<string> {
  if (refreshing) return refreshing;
  const session = captureSession();
  const expected = accessSessionId(session.token);
  refreshing = withRefreshLock(async () => {
    assertCurrentSession(session);
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    const result = await response.json();
    assertCurrentSession(session);
    if (!response.ok || !result.success) throw new Error('Your session ended. Sign in again.');
    const token: string = result.data.token;
    if (expected && accessSessionId(token) !== expected)
      throw new Error('The signed-in account changed. Sign in again.');
    useAuthStore.getState().rotate(token);
    return token;
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}
/** Explicit cookie session restoration, used after OAuth and on a fresh browser load. */
export async function restoreCookieSession() {
  const session = captureSession();
  const token = await refreshAccessToken();
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json();
  assertCurrentSession(session);
  if (!response.ok || !result.success) throw new Error('Sign in again to continue.');
  useAuthStore.getState().login(token, result.data as AuthUser);
}
