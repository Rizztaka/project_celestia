import type { WishBanner, WishResultItem } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { fetchSandboxCatalog, simulateSandboxPulls } from '../../lib/api';
import { artworkDisplayName } from '../../lib/artwork';
import {
  applyWishResultToSession,
  buildSandboxPullRequest,
  clearWishSandboxSession,
  getActivePityForBanner,
  loadWishSandboxSession,
  resetSandboxSession,
  saveWishSandboxSession,
  setBannerScenario,
  setPathTarget,
  updatePityOverrides,
  type WishSandboxSession,
} from '../../lib/wish-sandbox-session';
import { PageHeader, UiIcon } from '../Ui';
import { WishHistoryDrawer } from './WishHistoryDrawer';
import { WishItemCard } from './WishItemCard';

export function WishSandboxView({ uid }: { uid?: string }) {
  const [session, setSession] = useState<WishSandboxSession>(() => loadWishSandboxSession());
  const [lastPulls, setLastPulls] = useState<WishResultItem[]>([]);
  const [isPulling, setIsPulling] = useState(false);
  const [pullError, setPullError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sync session changes to storage
  useEffect(() => {
    saveWishSandboxSession(session);
  }, [session]);

  const catalogQuery = useQuery({
    queryKey: ['genshin', 'simulators', 'sandbox', 'catalog'],
    queryFn: ({ signal }) => fetchSandboxCatalog(signal),
    staleTime: 1000 * 60 * 15,
  });

  const banners = catalogQuery.data?.banners ?? [];
  const currentBanner: WishBanner | undefined =
    banners.find((b) => b.bannerId === session.currentScenarioId) ?? banners[0];

  const activePity = currentBanner ? getActivePityForBanner(session, currentBanner) : null;

  async function handlePull(count: 1 | 10) {
    if (!currentBanner || isPulling) return;
    setIsPulling(true);
    setPullError(null);

    try {
      const payload = buildSandboxPullRequest(session, currentBanner, count);
      const result = await simulateSandboxPulls(payload);

      setLastPulls(result.pulls);
      setSession((prev) => applyWishResultToSession(prev, currentBanner, result));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wish simulation request failed.';
      setPullError(message);
    } finally {
      setIsPulling(false);
    }
  }

  function handleReset() {
    clearWishSandboxSession();
    const fresh = resetSandboxSession(currentBanner?.bannerId);
    setSession(fresh);
    setLastPulls([]);
    setPullError(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={uid ? `UID ${uid} · FICTIONAL SIMULATOR` : 'GENSHIN FICTIONAL SIMULATOR'}
        title="Wish Sandbox"
        description="A completely separate, fictional wish simulator using historical versioned scenarios. Experiment with pity, guarantees, and Fate Points without modifying your real account or savings."
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="button-secondary text-xs"
            >
              <UiIcon name="insights" /> Roll History ({session.stats.totalPulls})
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Reset Sandbox
            </button>
          </div>
        }
      />

      {/* Disclaimers & Notices */}
      {catalogQuery.data?.notices && (
        <details className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-400">
          <summary className="cursor-pointer font-semibold text-zinc-300 hover:text-white">
            Model Disclaimers & Simulation Assumptions
          </summary>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {catalogQuery.data.notices.map((notice, i) => (
              <li key={i}>{notice}</li>
            ))}
          </ul>
        </details>
      )}

      {catalogQuery.isPending && (
        <p role="status" className="p-8 text-center text-zinc-400">
          Loading scenario catalog…
        </p>
      )}

      {catalogQuery.isError && (
        <div role="alert" className="glass-panel rounded-xl p-6 text-center text-sm text-rose-300">
          <p>Failed to load simulator catalog.</p>
          <button
            type="button"
            onClick={() => void catalogQuery.refetch()}
            className="button-secondary mt-3"
          >
            Retry
          </button>
        </div>
      )}

      {currentBanner && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Scenario & Pity Configuration */}
          <div className="space-y-4 lg:col-span-1">
            {/* Scenario Picker */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <label
                htmlFor="scenario-select"
                className="mb-2 block text-xs font-semibold uppercase text-zinc-300"
              >
                Choose Scenario
              </label>
              <select
                id="scenario-select"
                value={currentBanner.bannerId}
                onChange={(e) => {
                  const target = banners.find((b) => b.bannerId === e.target.value);
                  if (target) setSession((prev) => setBannerScenario(prev, target));
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                {banners.map((b) => (
                  <option key={b.bannerId} value={b.bannerId}>
                    {b.name} ({b.type})
                  </option>
                ))}
              </select>

              <div className="mt-3 text-xs text-zinc-400">
                <p>
                  <span className="font-medium text-white">Featured 5★:</span>{' '}
                  {currentBanner.fiveStarKeys.map(artworkDisplayName).join(', ')}
                </p>
                <p className="mt-0.5">
                  <span className="font-medium text-white">Featured 4★:</span>{' '}
                  {currentBanner.fourStarKeys.map(artworkDisplayName).join(', ')}
                </p>
                <p className="mt-0.5">
                  <span className="font-medium text-white">Hard Pity:</span>{' '}
                  {currentBanner.hardPity} pulls
                </p>
              </div>
            </div>

            {/* Path Target Selection (for Weapon & Chronicled) */}
            {currentBanner.fatePointCap > 0 && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-amber-300">
                    Epitomized Path
                  </span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-200">
                    {activePity?.fatePoints ?? 0} / {currentBanner.fatePointCap} Fate Point
                  </span>
                </div>
                <label htmlFor="path-target-select" className="mt-2 block text-xs text-zinc-400">
                  Select target 5★ item:
                </label>
                <select
                  id="path-target-select"
                  value={session.pathTargetKey || currentBanner.fiveStarKey}
                  onChange={(e) =>
                    setSession((prev) => setPathTarget(prev, currentBanner, e.target.value))
                  }
                  className="mt-1 w-full rounded-lg border border-amber-500/40 bg-zinc-900 px-3 py-1.5 text-sm text-amber-200"
                >
                  {currentBanner.fiveStarKeys.map((key) => (
                    <option key={key} value={key}>
                      {artworkDisplayName(key)}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-zinc-400">
                  Fate Points reset when target path or scenario is changed.
                </p>
              </div>
            )}

            {/* Pity Counters & Override Panel */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold uppercase text-zinc-300">Pity State</span>
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {showConfig ? 'Hide Config' : 'Edit Starting State'}
                </button>
              </div>

              {activePity && (
                <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-zinc-950 p-2.5">
                    <p className="text-[10px] uppercase text-amber-400">5★ Pity</p>
                    <p className="text-base font-bold text-white">
                      {activePity.pity5} / {currentBanner.hardPity}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {activePity.guaranteed5 ? 'Guaranteed 50/50' : '50/50 Active'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-950 p-2.5">
                    <p className="text-[10px] uppercase text-purple-400">4★ Pity</p>
                    <p className="text-base font-bold text-white">{activePity.pity4} / 10</p>
                    <p className="text-[11px] text-zinc-400">
                      {activePity.guaranteed4 ? 'Guaranteed 4★' : 'Standard 4★'}
                    </p>
                  </div>
                </div>
              )}

              {/* Editable starting overrides */}
              {showConfig && activePity && (
                <div className="mt-4 space-y-3 border-t border-zinc-800 pt-3 text-xs">
                  <div>
                    <label htmlFor="pity5-input" className="block text-zinc-400">
                      5★ Pity Counter (0 - {currentBanner.hardPity - 1}):
                    </label>
                    <input
                      id="pity5-input"
                      type="number"
                      min={0}
                      max={currentBanner.hardPity - 1}
                      value={activePity.pity5}
                      onChange={(e) =>
                        setSession((prev) =>
                          updatePityOverrides(prev, currentBanner, {
                            pity5: parseInt(e.target.value, 10) || 0,
                          }),
                        )
                      }
                      className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="pity4-input" className="block text-zinc-400">
                      4★ Pity Counter (0 - 10):
                    </label>
                    <input
                      id="pity4-input"
                      type="number"
                      min={0}
                      max={10}
                      value={activePity.pity4}
                      onChange={(e) =>
                        setSession((prev) =>
                          updatePityOverrides(prev, currentBanner, {
                            pity4: parseInt(e.target.value, 10) || 0,
                          }),
                        )
                      }
                      className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-white"
                    />
                  </div>

                  {currentBanner.type !== 'CHRONICLED' && (
                    <label className="flex items-center gap-2 text-zinc-300">
                      <input
                        type="checkbox"
                        checked={activePity.guaranteed5}
                        onChange={(e) =>
                          setSession((prev) =>
                            updatePityOverrides(prev, currentBanner, {
                              guaranteed5: e.target.checked,
                            }),
                          )
                        }
                      />
                      Next 5★ is Guaranteed Featured
                    </label>
                  )}

                  {currentBanner.fatePointCap > 0 && (
                    <div>
                      <label htmlFor="fate-select" className="block text-zinc-400">
                        Fate Points (0 or 1):
                      </label>
                      <select
                        id="fate-select"
                        value={activePity.fatePoints ?? 0}
                        onChange={(e) =>
                          setSession((prev) =>
                            updatePityOverrides(prev, currentBanner, {
                              fatePoints: (parseInt(e.target.value, 10) || 0) as 0 | 1,
                            }),
                          )
                        }
                        className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-white"
                      >
                        <option value={0}>0 Fate Points</option>
                        <option value={1}>1 Fate Point (Guaranteed Target)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pull Trigger Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handlePull(1)}
                disabled={isPulling}
                className="button-secondary flex-1 py-3 text-center font-semibold text-white disabled:opacity-50"
              >
                {isPulling ? 'Simulating…' : 'Wish x1'}
              </button>
              <button
                type="button"
                onClick={() => void handlePull(10)}
                disabled={isPulling}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center font-bold text-zinc-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
              >
                {isPulling ? 'Simulating…' : 'Wish x10'}
              </button>
            </div>

            {pullError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300"
              >
                {pullError}
              </p>
            )}
          </div>

          {/* Right Column: Pull Results Gallery */}
          <div className="space-y-4 lg:col-span-2">
            <div className="min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-semibold text-white">Simulation Results</h3>
                <span className="text-xs text-zinc-400">
                  {lastPulls.length > 0
                    ? `Showing latest ${lastPulls.length} pull${lastPulls.length > 1 ? 's' : ''}`
                    : 'Awaiting first wish…'}
                </span>
              </div>

              {lastPulls.length === 0 ? (
                <div className="flex h-80 flex-col items-center justify-center text-center text-zinc-500">
                  <p className="mb-3 text-4xl">✦</p>
                  <p className="text-sm font-medium text-zinc-400">Ready to pull.</p>
                  <p className="mt-1 max-w-sm text-xs text-zinc-500">
                    Press Wish x1 or Wish x10 to test banner drops and pity state transitions.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {lastPulls.map((item) => (
                    <WishItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Drawer Modal */}
      <WishHistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        stats={session.stats}
        recentPulls={session.recentPulls}
        onClearHistory={handleReset}
      />
    </div>
  );
}
