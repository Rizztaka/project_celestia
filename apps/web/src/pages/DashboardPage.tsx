import type { MeResponse } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import TodayPlan from '../components/TodayPlan';
import { CelestiaMark, PageHeader, UiIcon } from '../components/Ui';
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
          description="A clear view of what matters. A little room for what comes next."
          actions={
            <Link className="button-secondary" to="/planner">
              <UiIcon name="planner" /> Open planner
            </Link>
          }
        />
        <section className="today-hero" aria-label="Your journey">
          <div className="today-hero-content">
            <p className="eyebrow">LESS BUSYWORK. MORE TEYVAT.</p>
            <h2>
              Every great build
              <br />
              begins with a next step.
            </h2>
            <p>
              Make progress on your terms. Keep your characters, daily routine and longer plans in
              one considered space.
            </p>
            <a className="button-primary" href="#session-recording">
              Record my session <UiIcon name="arrow" />
            </a>
          </div>
          <div className="hero-orbits" aria-hidden="true">
            <CelestiaMark />
          </div>
        </section>
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
          <Link className="shortcut-card" to="/import">
            <UiIcon name="import" />
            <span>
              <strong>Bring your builds along</strong>
              <small>Review & import a GOOD export</small>
            </span>
            <UiIcon name="arrow" />
          </Link>
        </div>
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
            <Link className="button-secondary" to="/#routine-settings">
              Choose server
            </Link>
            <Link className="button-secondary" to="/#plan-choices">
              Choose routines
            </Link>
            <Link className="button-secondary" to="/planner?tab=farming&newType=CHARACTER_TALENT">
              Create a manual goal
            </Link>
          </div>
        </details>
        <TodayPlan />
      </main>
    </div>
  );
}
