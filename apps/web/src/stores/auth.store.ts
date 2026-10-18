/**
 * auth.store.ts — Zustand store for authentication state
 *
 * Responsibility: client-side auth state only.
 *   - The JWT token (persisted to localStorage)
 *   - The current user's basic profile (id, email, username)
 *   - login() / logout() actions
 *
 * Per ARCHITECTURE.md:
 *   - Zustand handles client/UI state
 *   - TanStack Query handles server state (data fetching, caching)
 *   - Server state (full user profile) must NOT be duplicated inside this store
 *
 * The user object stored here is the minimal shape received on login/register.
 * The full profile is fetched on demand by TanStack Query via GET /auth/me.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// AuthUser mirrors the SafeUser shape from the API (Omit<User, "password">)
// but is defined locally so the frontend has no runtime dependency on the
// server-side Prisma types. Dates arrive as ISO strings over JSON.
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  emailVerifiedAt?: string | null;
}

interface AuthState {
  sessionEpoch: number;
  tokenRotation: number;
  rotate: (token: string) => void;
  /** The JWT access token. Null when not authenticated. */
  token: string | null;
  /** Minimal user info stored on login. Used for immediate UI feedback. */
  user: AuthUser | null;
  /** True when a valid token exists in state. */
  isAuthenticated: boolean;
  /** Store the token and user after a successful login or registration. */
  login: (token: string, user: AuthUser) => void;
  /** Clear all auth state. Also clears the localStorage entry. */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      sessionEpoch: 0,
      tokenRotation: 0,
      rotate: (token) => set((state) => ({ token, tokenRotation: state.tokenRotation + 1 })),
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        set((state) => ({
          token,
          user,
          isAuthenticated: true,
          sessionEpoch: state.sessionEpoch + 1,
        }));
      },

      logout: () => {
        set((state) => ({
          token: null,
          user: null,
          isAuthenticated: false,
          sessionEpoch: state.sessionEpoch + 1,
        }));
      },
    }),
    {
      name: 'celestia_auth', // localStorage key
      // Persist both token and isAuthenticated so that page reloads
      // correctly restore the authenticated session.
      // User profile data is NOT persisted — it is re-fetched fresh
      // from GET /auth/me on each session, keeping the cache up to date.
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
