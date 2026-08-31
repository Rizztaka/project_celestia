/**
 * SimulatorsPage — Gacha Pull Simulator (Milestone 6A)
 *
 * Lets users simulate pulls on active Snezhnaya banners without
 * spending real primogems. Tracks pity state in local component state
 * (Zustand is for UI preferences only — pity is session-ephemeral).
 *
 * Architecture:
 *   - fetchBanners  → GET /simulators/banners       (TanStack Query)
 *   - simulatePulls → POST /simulators/simulate-pulls (direct mutation, no cache)
 *   - Pity state   → useState (ephemeral, resets on page reload)
 */

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { type Banner, fetchBanners, type PullResultItem, simulatePulls } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function formatName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

function getDaysLeft(endDate: string): string {
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Ended';
  if (diff === 1) return '1 day left';
  return `${diff} days left`;
}

// -------------------------------------------------------
// Rarity colours and labels
// -------------------------------------------------------

const RARITY_META: Record<
  PullResultItem['type'],
  {
    bg: string;
    border: string;
    text: string;
    glow: string;
    shimmer: string;
    label: string;
    stars: number;
  }
> = {
  '5_STAR': {
    bg: 'bg-amber-500/20',
    border: 'border-amber-400/60',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_24px_rgba(251,191,36,0.4)]',
    shimmer: 'from-amber-400/0 via-amber-300/30 to-amber-400/0',
    label: '5★',
    stars: 5,
  },
  '4_STAR': {
    bg: 'bg-violet-500/20',
    border: 'border-violet-400/60',
    text: 'text-violet-300',
    glow: 'shadow-[0_0_18px_rgba(167,139,250,0.35)]',
    shimmer: 'from-violet-400/0 via-violet-300/20 to-violet-400/0',
    label: '4★',
    stars: 4,
  },
  '3_STAR': {
    bg: 'bg-blue-500/10',
    border: 'border-blue-400/30',
    text: 'text-blue-400',
    glow: '',
    shimmer: 'from-blue-400/0 via-blue-300/10 to-blue-400/0',
    label: '3★',
    stars: 3,
  },
};

// -------------------------------------------------------
// PullCard — single result in the tray
// -------------------------------------------------------

function PullCard({ item, index }: { item: PullResultItem; index: number }) {
  const meta = RARITY_META[item.type];
  const name = formatName(item.itemKey);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const isSpecial = item.type !== '3_STAR';

  return (
    <div
      className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-500 ${meta.bg} ${meta.border} ${meta.glow}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Shimmer sweep on 4/5-star */}
      {isSpecial && (
        <div
          className={`pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_0.8s_ease-out_forwards] rounded-xl bg-gradient-to-r ${meta.shimmer}`}
          style={{ animationDelay: `${index * 60}ms` }}
        />
      )}

      {/* Featured badge */}
      {item.isFeatured && item.type !== '3_STAR' && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/40 bg-zinc-950 px-2 py-px text-[9px] font-bold uppercase tracking-widest text-amber-400">
          Featured
        </span>
      )}

      {/* Avatar */}
      <div
        className={`font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${meta.bg} ${meta.border} ${meta.text}`}
      >
        {initials}
      </div>

      {/* Name */}
      <p className={`w-full truncate text-[11px] font-semibold ${meta.text}`}>{name}</p>

      {/* Star rating */}
      <p className="text-[10px] font-bold tracking-widest text-zinc-600">{meta.label}</p>
    </div>
  );
}

// -------------------------------------------------------
// PullHistory — full log beneath the simulator
// -------------------------------------------------------

function PullHistoryRow({ item, pullNumber }: { item: PullResultItem; pullNumber: number }) {
  const meta = RARITY_META[item.type];
  const name = formatName(item.itemKey);

  if (item.type === '3_STAR') return null; // hide 3-stars from history

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${meta.bg} ${meta.border} ${meta.glow}`}
    >
      <span className={`font-display shrink-0 text-xs font-bold ${meta.text}`}>#{pullNumber}</span>
      <div
        className={`font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold ${meta.bg} ${meta.border} ${meta.text}`}
      >
        {name
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${meta.text}`}>{name}</p>
        {item.isFeatured && <p className="text-[10px] text-amber-500">Featured</p>}
      </div>
      <span className={`shrink-0 text-xs font-bold ${meta.text}`}>{meta.label}</span>
    </div>
  );
}

// -------------------------------------------------------
// Pity tracker display
// -------------------------------------------------------

function PityBar({
  label,
  current,
  max,
  color,
}: {
  label: string;
  current: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((current / max) * 100, 100);
  const isSoftPity = label === '5★' && current >= 74;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {label} Pity
        </span>
        <span
          className={`font-display text-sm font-bold ${isSoftPity ? 'text-amber-400' : 'text-white'}`}
        >
          {current} / {max}
          {isSoftPity && (
            <span className="ml-1.5 text-[10px] font-semibold text-amber-500">Soft Pity!</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color} ${isSoftPity ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Stats panel
// -------------------------------------------------------

interface PullStats {
  total: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  featuredFiveStars: number;
}

function StatsPanel({ stats }: { stats: PullStats }) {
  const fiveStarRate = stats.total > 0 ? ((stats.fiveStars / stats.total) * 100).toFixed(1) : '0.0';
  const fourStarRate = stats.total > 0 ? ((stats.fourStars / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: 'Total Pulls', value: stats.total, color: 'text-white' },
        {
          label: '5★ Pulled',
          value: `${stats.fiveStars} (${fiveStarRate}%)`,
          color: 'text-amber-400',
        },
        {
          label: '4★ Pulled',
          value: `${stats.fourStars} (${fourStarRate}%)`,
          color: 'text-violet-400',
        },
        { label: 'Featured 5★', value: stats.featuredFiveStars, color: 'text-amber-300' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="glass-panel flex flex-col gap-1 rounded-xl border border-white/5 p-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            {stat.label}
          </p>
          <p className={`font-display text-xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------
// Banner selector card
// -------------------------------------------------------

function BannerCard({
  banner,
  selected,
  onSelect,
}: {
  banner: Banner;
  selected: boolean;
  onSelect: () => void;
}) {
  const featuredName = formatName(banner.fiveStarKey);
  const daysLeft = getDaysLeft(banner.endDate);
  const isExpired = daysLeft === 'Ended';

  return (
    <button
      onClick={onSelect}
      disabled={isExpired}
      className={`glass-panel hover-lift relative w-full cursor-pointer rounded-2xl border p-5 text-left transition-all duration-300 ${
        selected
          ? 'border-accent-500/60 shadow-[0_0_24px_rgba(99,102,241,0.2)]'
          : 'border-white/5 hover:border-white/15'
      } ${isExpired ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {/* Selected indicator */}
      {selected && (
        <span className="bg-accent-500 absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full">
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}

      {/* Top row: name + days left */}
      <div className="mb-3 flex items-start justify-between gap-2 pr-6">
        <div>
          <p className="font-display text-base font-bold text-white">{banner.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">Limited Character Event Wish</p>
        </div>
      </div>

      {/* 5-star highlight */}
      <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
        <div className="font-display flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15 text-xs font-bold text-amber-400">
          {featuredName
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold text-amber-300">{featuredName}</p>
          <p className="text-[10px] text-amber-600">5★ Featured</p>
        </div>
      </div>

      {/* 4-stars */}
      <div className="flex flex-wrap gap-1.5">
        {banner.fourStarKeys.map((key) => (
          <span
            key={key}
            className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400"
          >
            {formatName(key)}
          </span>
        ))}
      </div>

      {/* Days left */}
      <div className="mt-3 flex items-center gap-1.5">
        <svg
          className="h-3 w-3 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span
          className={`text-[11px] font-semibold ${isExpired ? 'text-red-500' : 'text-zinc-500'}`}
        >
          {daysLeft}
        </span>
      </div>
    </button>
  );
}

// -------------------------------------------------------
// Skeleton
// -------------------------------------------------------

function BannerSkeleton() {
  return (
    <div className="glass-panel animate-pulse rounded-2xl border border-white/5 p-5">
      <div className="mb-3 h-5 w-3/4 rounded-lg bg-white/5" />
      <div className="mb-3 h-14 rounded-xl bg-white/5" />
      <div className="flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-white/5" />
        <div className="h-5 w-16 rounded-full bg-white/5" />
        <div className="h-5 w-16 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Nav
// -------------------------------------------------------

function Nav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between border-b-0 border-white/10 px-6 py-4">
      <Link
        to="/"
        className="font-display text-gradient text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
      >
        Project Celestia
      </Link>
      <div className="flex items-center gap-6">
        <Link
          to="/intelligence"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Intelligence
        </Link>
        <Link
          to="/endgame"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Endgame
        </Link>
        <button
          onClick={onLogout}
          className="hover:text-danger-400 text-sm font-medium text-zinc-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

// -------------------------------------------------------
// Main Page
// -------------------------------------------------------

interface PityState {
  pity5: number;
  pity4: number;
  guaranteed5: boolean;
  guaranteed4: boolean;
}

export default function SimulatorsPage() {
  const logout = useAuthStore((s) => s.logout);

  // Banner data
  const { data: banners, isLoading: bannersLoading } = useQuery({
    queryKey: ['simulators', 'banners'],
    queryFn: fetchBanners,
    staleTime: Infinity,
  });

  // UI state
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Pity per banner (keyed by bannerId)
  const [pityMap, setPityMap] = useState<Record<string, PityState>>({});

  // All historical pull results (all sessions, all banners this page load)
  const [pullHistory, setPullHistory] = useState<
    (PullResultItem & { pullNumber: number; bannerId: string })[]
  >([]);
  const totalPullCounter = useRef(0);

  // Latest batch (the 1 or 10 just pulled)
  const [latestBatch, setLatestBatch] = useState<PullResultItem[]>([]);
  const [latestBatchKey, setLatestBatchKey] = useState(0);

  // Aggregate stats per selected banner
  const [statsMap, setStatsMap] = useState<Record<string, PullStats>>({});

  // Auto-select first banner once loaded
  useEffect(() => {
    if (banners && banners.length > 0 && !selectedBannerId) {
      setSelectedBannerId(banners[0].bannerId);
    }
  }, [banners, selectedBannerId]);

  const selectedBanner = banners?.find((b) => b.bannerId === selectedBannerId) ?? null;
  const currentPity = selectedBannerId
    ? (pityMap[selectedBannerId] ?? { pity5: 0, pity4: 0, guaranteed5: false, guaranteed4: false })
    : null;
  const currentStats = selectedBannerId
    ? (statsMap[selectedBannerId] ?? {
        total: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        featuredFiveStars: 0,
      })
    : null;

  async function handlePull(count: 1 | 10) {
    if (!selectedBannerId || !currentPity || isSimulating) return;
    setIsSimulating(true);

    try {
      const result = await simulatePulls({
        bannerId: selectedBannerId,
        count,
        currentPity5: currentPity.pity5,
        currentPity4: currentPity.pity4,
        guaranteed5: currentPity.guaranteed5,
        guaranteed4: currentPity.guaranteed4,
      });

      // Update pity
      setPityMap((prev) => ({
        ...prev,
        [selectedBannerId]: {
          pity5: result.endPity5,
          pity4: result.endPity4,
          guaranteed5: result.endGuaranteed5,
          guaranteed4: result.endGuaranteed4,
        },
      }));

      // Update stats
      setStatsMap((prev) => {
        const old = prev[selectedBannerId] ?? {
          total: 0,
          fiveStars: 0,
          fourStars: 0,
          threeStars: 0,
          featuredFiveStars: 0,
        };
        return {
          ...prev,
          [selectedBannerId]: {
            total: old.total + result.pulls.length,
            fiveStars: old.fiveStars + result.pulls.filter((p) => p.type === '5_STAR').length,
            fourStars: old.fourStars + result.pulls.filter((p) => p.type === '4_STAR').length,
            threeStars: old.threeStars + result.pulls.filter((p) => p.type === '3_STAR').length,
            featuredFiveStars:
              old.featuredFiveStars +
              result.pulls.filter((p) => p.type === '5_STAR' && p.isFeatured).length,
          },
        };
      });

      // Append to history with pull numbers
      const numbered = result.pulls.map((p) => {
        totalPullCounter.current += 1;
        return { ...p, pullNumber: totalPullCounter.current, bannerId: selectedBannerId };
      });
      setPullHistory((prev) => [...numbered, ...prev]);

      // Show latest batch
      setLatestBatch(result.pulls);
      setLatestBatchKey((k) => k + 1);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  }

  function handleReset() {
    if (!selectedBannerId) return;
    setPityMap((prev) => ({
      ...prev,
      [selectedBannerId]: { pity5: 0, pity4: 0, guaranteed5: false, guaranteed4: false },
    }));
    setStatsMap((prev) => ({
      ...prev,
      [selectedBannerId]: {
        total: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        featuredFiveStars: 0,
      },
    }));
    setPullHistory((prev) => prev.filter((p) => p.bannerId !== selectedBannerId));
  }

  const notableHistory = pullHistory.filter(
    (p) => p.bannerId === selectedBannerId && p.type !== '3_STAR',
  );

  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      <main className="animate-fade-in relative z-10 mx-auto max-w-5xl px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Pull <span className="text-gradient">Simulator</span>
          </h1>
          <p className="mt-2 text-base text-zinc-400">
            Test your luck on the current Snezhnaya banners. Pity resets when you leave the page.
          </p>
        </div>

        {/* Banner selection */}
        <section className="mb-8">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
            Select Banner
          </h2>
          {bannersLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BannerSkeleton />
              <BannerSkeleton />
            </div>
          ) : banners && banners.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {banners.map((b) => (
                <BannerCard
                  key={b.bannerId}
                  banner={b}
                  selected={selectedBannerId === b.bannerId}
                  onSelect={() => setSelectedBannerId(b.bannerId)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel flex items-center justify-center rounded-2xl border border-white/5 py-12">
              <p className="text-sm text-zinc-500">No active banners found.</p>
            </div>
          )}
        </section>

        {selectedBanner && currentPity && (
          <>
            {/* Pity state */}
            <section className="glass-panel mb-6 rounded-2xl border border-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Pity Tracker — {selectedBanner.name}
                </h2>
                <div className="flex items-center gap-3">
                  {currentPity.guaranteed5 && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                      5★ Guaranteed
                    </span>
                  )}
                  {currentPity.guaranteed4 && (
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                      4★ Guaranteed
                    </span>
                  )}
                  <button
                    onClick={handleReset}
                    className="text-[11px] font-semibold text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <PityBar
                  label="5★"
                  current={currentPity.pity5}
                  max={90}
                  color="bg-gradient-to-r from-amber-500 to-yellow-400"
                />
                <PityBar
                  label="4★"
                  current={currentPity.pity4}
                  max={10}
                  color="bg-gradient-to-r from-violet-500 to-indigo-400"
                />
              </div>
            </section>

            {/* Pull buttons */}
            <section className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                id="btn-pull-1"
                onClick={() => handlePull(1)}
                disabled={isSimulating}
                className="from-accent-500 font-display shadow-accent-500/25 hover:shadow-accent-500/40 group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  {isSimulating ? 'Wishing…' : 'Wish ×1'}
                </span>
              </button>

              <button
                id="btn-pull-10"
                onClick={() => handlePull(10)}
                disabled={isSimulating}
                className="font-display group relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 px-8 py-4 text-base font-bold text-amber-300 shadow-lg shadow-amber-500/10 transition-all duration-300 hover:scale-[1.02] hover:border-amber-400/50 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {isSimulating ? 'Wishing…' : 'Wish ×10'}
                </span>
              </button>
            </section>

            {/* Latest batch result tray */}
            {latestBatch.length > 0 && (
              <section key={latestBatchKey} className="animate-fade-in mb-6">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Latest Pull
                </h2>
                <div
                  className={`grid gap-2 ${latestBatch.length === 1 ? 'mx-auto max-w-[120px] grid-cols-1' : 'grid-cols-5 sm:grid-cols-10'}`}
                >
                  {latestBatch.map((item, i) => (
                    <PullCard key={item.id} item={item} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Stats */}
            {currentStats && currentStats.total > 0 && (
              <section className="animate-fade-in mb-6">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Session Statistics
                </h2>
                <StatsPanel stats={currentStats} />
              </section>
            )}

            {/* Notable history (4★ and 5★ only) */}
            {notableHistory.length > 0 && (
              <section className="animate-fade-in">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Notable Pulls (4★ &amp; 5★)
                </h2>
                <div className="flex flex-col gap-2">
                  {notableHistory.slice(0, 20).map((item) => (
                    <PullHistoryRow
                      key={`${item.id}-${item.pullNumber}`}
                      item={item}
                      pullNumber={item.pullNumber}
                    />
                  ))}
                  {notableHistory.length > 20 && (
                    <p className="text-center text-xs text-zinc-600">
                      Showing most recent 20 of {notableHistory.length} notable pulls.
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Ambient gradient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="bg-accent-500/5 absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>
    </div>
  );
}
