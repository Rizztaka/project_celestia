import type { MeResponse } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { HoyolabSummary } from '../components/HoyolabSummary';
import TodayPlan from '../components/TodayPlan';
import { PageHeader, UiIcon } from '../components/Ui';
import { captureSession, isCurrentSession } from '../lib/account-session';
import { ApiError, fetchApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

export default function DashboardPage() {
  const logout = useAuthStore((state) => state.logout);
  const [session] = useState(captureSession);
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
      <main id="companion-content" tabIndex={-1} className="today-page">
        <PageHeader
          eyebrow="YOUR PERSONAL COMPANION"
          title="Today, at your pace."
          description="Check your account, choose a goal, and take the next step."
          actions={
            <Link className="button-secondary" to="/planner">
              <UiIcon name="planner" /> Open planner
            </Link>
          }
        />
        <HoyolabSummary />
        <div className="today-shortcuts">
          <Link className="shortcut-card" to="/roster">
            <UiIcon name="characters" />
            <span>
              <strong>Your characters</strong>
              <small>Builds, talents & progression</small>
            </span>
            <UiIcon name="arrow" />
          </Link>
          <Link className="shortcut-card" to="/planner?tab=farming">
            <UiIcon name="planner" />
            <span>
              <strong>Make a little progress</strong>
              <small>Your goals, in your order</small>
            </span>
            <UiIcon name="arrow" />
          </Link>
          <Link className="shortcut-card" to="/connect">
            <UiIcon name="import" />
            <span>
              <strong>Connect your account</strong>
              <small>HoYoLAB connection & refresh</small>
            </span>
            <UiIcon name="arrow" />
          </Link>
        </div>
        {me.error && (
          <p role="alert">
            Account details could not refresh. Your last confirmed panels remain available.
          </p>
        )}
        <TodayPlan />
      </main>
    </div>
  );
}
