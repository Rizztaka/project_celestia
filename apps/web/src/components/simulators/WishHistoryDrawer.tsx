import type { WishResultItem } from '@celestia/api-contracts';
import { useState } from 'react';

import { artworkDisplayName } from '../../lib/artwork';
import type { WishSandboxStats } from '../../lib/wish-sandbox-session';

export function WishHistoryDrawer({
  stats,
  recentPulls,
  onClearHistory,
  isOpen,
  onClose,
}: {
  stats: WishSandboxStats;
  recentPulls: WishResultItem[];
  onClearHistory: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'all' | '5star' | '4star'>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const filteredPulls = recentPulls.filter((item) => {
    if (activeTab === '5star') return item.type === '5_STAR';
    if (activeTab === '4star') return item.type === '4_STAR';
    return true;
  });

  const rate5 = stats.totalPulls
    ? ((stats.total5Stars / stats.totalPulls) * 100).toFixed(2)
    : '0.00';
  const rate4 = stats.totalPulls
    ? ((stats.total4Stars / stats.totalPulls) * 100).toFixed(2)
    : '0.00';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Wish sandbox roll history and statistics"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Wish Sandbox History</h2>
            <p className="text-xs text-zinc-400">
              Retains up to 200 recent pulls and lifetime pull totals
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close history modal"
          >
            ✕
          </button>
        </div>

        {/* Stats summary banner */}
        <div className="my-4 grid grid-cols-4 gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-center">
          <div>
            <p className="text-[11px] uppercase text-zinc-400">Total Pulls</p>
            <p className="text-lg font-bold text-white">{stats.totalPulls}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-amber-400">5★ Rate</p>
            <p className="text-lg font-bold text-amber-300">
              {stats.total5Stars}{' '}
              <span className="text-xs font-normal text-amber-400/80">({rate5}%)</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-purple-400">4★ Rate</p>
            <p className="text-lg font-bold text-purple-300">
              {stats.total4Stars}{' '}
              <span className="text-xs font-normal text-purple-400/80">({rate4}%)</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-blue-400">3★ Total</p>
            <p className="text-lg font-bold text-blue-300">{stats.total3Stars}</p>
          </div>
        </div>

        {/* 5-Star pull timeline */}
        {stats.records5Star.length > 0 && (
          <div className="mb-4 space-y-1.5 rounded-xl border border-amber-500/20 bg-amber-950/15 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              5★ Pull History (Relative Pity)
            </p>
            <div className="flex flex-wrap gap-2">
              {stats.records5Star.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-zinc-900/90 px-2.5 py-1 text-xs text-amber-200"
                >
                  <span className="font-medium text-white">
                    {artworkDisplayName(record.itemKey)}
                  </span>
                  <span className="py-0.2 rounded bg-amber-500/20 px-1 text-[10px] text-amber-300">
                    {record.pity} pulls
                  </span>
                  {record.isFeatured && (
                    <span className="text-[10px] font-semibold text-emerald-400">Featured</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-zinc-800 font-semibold text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Recent ({recentPulls.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('5star')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === '5star'
                ? 'bg-amber-500/20 font-semibold text-amber-300'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            5★ Pulls ({recentPulls.filter((p) => p.type === '5_STAR').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('4star')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === '4star'
                ? 'bg-purple-500/20 font-semibold text-purple-300'
                : 'text-zinc-400 hover:text-purple-300'
            }`}
          >
            4★ Pulls ({recentPulls.filter((p) => p.type === '4_STAR').length})
          </button>
        </div>

        {/* Scrollable list */}
        <div className="my-2 max-h-72 flex-1 overflow-y-auto pr-1">
          {filteredPulls.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No pulls recorded in this filter yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filteredPulls.map((pull, idx) => (
                <div
                  key={`${pull.id}-${idx}`}
                  className="flex items-center justify-between py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-semibold ${
                        pull.type === '5_STAR'
                          ? 'text-amber-400'
                          : pull.type === '4_STAR'
                            ? 'text-purple-400'
                            : 'text-blue-400'
                      }`}
                    >
                      {pull.type === '5_STAR' ? '5★' : pull.type === '4_STAR' ? '4★' : '3★'}
                    </span>
                    <span className="font-medium text-white">
                      {artworkDisplayName(pull.itemKey)}
                    </span>
                    {pull.isFeatured && (
                      <span className="py-0.2 rounded bg-amber-500/20 px-1 text-[10px] font-semibold text-amber-300">
                        Featured
                      </span>
                    )}
                  </div>
                  <span className="capitalize text-zinc-500">{pull.itemKind}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-300">Reset all history and statistics?</span>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setConfirmClear(false);
                }}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="button-secondary px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={stats.totalPulls === 0}
              className="text-xs text-zinc-500 hover:text-rose-400 disabled:opacity-40"
            >
              Clear roll history
            </button>
          )}

          <button type="button" onClick={onClose} className="button-secondary text-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
