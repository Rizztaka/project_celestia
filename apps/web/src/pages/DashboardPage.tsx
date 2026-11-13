import type { MeResponse } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { AccountSyncCard } from '../components/dashboard/AccountSyncCard';
import { CompanionSummaryGrid } from '../components/dashboard/CompanionSummaryGrid';
import { NextActionSummaryCard } from '../components/dashboard/NextActionSummaryCard';
import DashboardWelcome from '../components/DashboardWelcome';
import TodayPlan from '../components/TodayPlan';
import { captureSession, isCurrentSession } from '../lib/account-session';
import { ApiError, fetchApi } from '../lib/api';
import { useCompanionSummary } from '../lib/use-companion-summary';
import { useAuthStore } from '../stores/auth.store';

export default function DashboardPage() {
  const logout = useAuthStore((state) => state.logout);
  const [session] = useState(captureSession);
  const { summary, refetch, isFetching } = useCompanionSummary();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: ({ signal }) => fetchApi<MeResponse>('/auth/me', { signal }, session),
    retry: false,
  });
  useEffect(() => {
    if (isCurrentSession(session) && me.error instanceof ApiError && me.error.status === 401)
      logout();
  }, [me.error, logout, session]);
  return (
    <div className="min-h-screen text-zinc-300">
      <main id="companion-content" tabIndex={-1} className="today-page space-y-6">
        <DashboardWelcome />
        <AccountSyncCard
          summary={summary}
          onRefresh={() => void refetch()}
          isRefreshing={isFetching}
        />
        {summary && (
          <div className="space-y-4">
            <NextActionSummaryCard
              summary={summary}
              onRefresh={() => void refetch()}
              isRefreshing={isFetching}
            />
            <CompanionSummaryGrid summary={summary} />
          </div>
        )}
        {me.error && (
          <p role="alert">
            Account details could not refresh. Your last confirmed panels remain available.
          </p>
        )}
        <details
          aria-label="Start at your own pace"
          className="glass-panel space-y-3 rounded-xl p-4 text-sm"
        >
          <summary className="cursor-pointer font-semibold text-white">Getting started</summary>
          <p>
            No import needed: select your game server for reset tracking, choose any optional
            routines, and record what you did. Goals and imports are optional.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="button-secondary" to="/workspace#routine-settings">
              Choose server
            </Link>
            <Link className="button-secondary" to="/workspace#plan-choices">
              Choose routines
            </Link>
            <Link className="button-secondary" to="/planner?tab=farming&newType=CHARACTER_TALENT">
              Create a manual goal
            </Link>
            <Link className="button-secondary" to="/endgame">
              Endgame Center
            </Link>
          </div>
        </details>
        <TodayPlan />
      </main>
    </div>
  );
}
