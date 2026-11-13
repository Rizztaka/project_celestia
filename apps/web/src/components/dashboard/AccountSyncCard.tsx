import type { CompanionSummaryResponse, ImportStatus } from '@celestia/api-contracts';
import { useState } from 'react';

export function AccountSyncCard({
  summary,
  importStatus,
  uid,
  onRefresh,
  isRefreshing = false,
}: {
  summary?: CompanionSummaryResponse | null;
  importStatus?: ImportStatus | null;
  uid?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const isShowcase = Boolean(uid) || summary?.isPartialAccount;
  const sourceLabel = isShowcase ? 'Enka.Network Showcase' : 'Verified Account Store';
  const scopeLabel = isShowcase
    ? 'Public Showcase (Only displayed characters observed)'
    : 'Complete Account Inventory (GOOD export)';

  const observedCharacterCount = summary?.readyBuildsSummary?.totalAssessed ?? 0;
  const activeTeamCount = summary?.teamSuggestion ? 1 : 0;

  return (
    <section
      aria-label="Account synchronization and freshness"
      className="glass-panel relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-lg"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs font-semibold text-zinc-200">
            {sourceLabel}
          </span>
          <span className="text-xs text-zinc-400">
            {isShowcase ? 'UID: ' + (uid ?? 'Showcase') : 'Private Database'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Verified Pinned 5.3 Schedule
          </span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="self-start rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50 sm:self-auto"
          >
            {isRefreshing ? 'Refreshing data…' : '↻ Refresh Showcase'}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Observed Roster
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {observedCharacterCount > 0 ? `${observedCharacterCount} units` : 'Showcase loaded'}
          </p>
          <p className="text-[11px] text-zinc-400">
            {isShowcase ? 'Only showcased active builds' : 'Full roster verified'}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Simulated Teams
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {activeTeamCount > 0 ? '1 ranked team' : 'Ready to evaluate'}
          </p>
          <p className="text-[11px] text-zinc-400">WASM 20s rotation DPS</p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Data Scope
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-200" title={scopeLabel}>
            {isShowcase ? 'Partial Showcase' : 'Full Account'}
          </p>
          <p className="text-[11px] text-zinc-400">
            {isShowcase ? 'Unshowcased = unknown' : 'Full bag verified'}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Freshness Status
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-400">Current</p>
          <p className="text-[11px] text-zinc-400">Live cache window</p>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-800/80 pt-3">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs font-medium text-zinc-400 hover:text-zinc-200"
        >
          {showTechnicalDetails
            ? '▲ Hide Technical Diagnostics'
            : '▼ Inspect Raw Provenance & Data Boundaries'}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 space-y-2 rounded-xl bg-zinc-900/70 p-4 text-xs text-zinc-400">
            <p className="font-semibold text-zinc-300">Data Boundaries & Provenance Ledger</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Source:</strong>{' '}
                {isShowcase ? 'Enka.Network public API snapshot' : 'Imported account context'}
              </li>
              <li>
                <strong>Game Version Scope:</strong> Pinned to Version 5.3 verified schedules and
                drop rates.
              </li>
              <li>
                <strong>Inventory Policy:</strong> Missing bag items are treated as{' '}
                <code>inventoryStatus: unknown</code>, avoiding false assumption of 0 materials.
              </li>
              {importStatus?.sections && importStatus.sections.length > 0 && (
                <li>
                  <strong>Recorded Sections:</strong>{' '}
                  {importStatus.sections
                    .map((s) => `${s.section} (${s.entryCount ?? 0} items)`)
                    .join(', ')}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
