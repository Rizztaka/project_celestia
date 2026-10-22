import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { CdnArtwork } from '../components/CdnArtwork';
import { GenshinAvatar } from '../components/GenshinAvatar';
import { GenshinWeaponIcon } from '../components/GenshinWeaponIcon';
import { type Banner, fetchBanners, type PullResultItem, simulatePulls } from '../lib/api';
import { artworkDisplayName } from '../lib/artwork';
import { visualAssets } from '../lib/cdn-resolver';

interface PityState {
  pity5: number;
  pity4: number;
  guaranteed5: boolean;
  guaranteed4: boolean;
  fatePoints: 0 | 1;
  pathTargetKey?: string;
}
interface PullStats {
  total: number;
  five: number;
  four: number;
  featured: number;
}
const emptyStats: PullStats = { total: 0, five: 0, four: 0, featured: 0 };
function initialPity(banner: Banner): PityState {
  return {
    pity5: 0,
    pity4: 0,
    guaranteed5: false,
    guaranteed4: false,
    fatePoints: 0,
    ...(banner.fatePointCap ? { pathTargetKey: banner.fiveStarKey } : {}),
  };
}
function WishIcon({
  itemKey,
  weapon,
  size = 'md',
}: {
  itemKey: string;
  weapon: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  return weapon ? (
    <GenshinWeaponIcon weaponKey={itemKey} size={size} />
  ) : (
    <GenshinAvatar characterKey={itemKey} size={size} />
  );
}
function BannerCard({
  banner,
  selected,
  disabled,
  onSelect,
}: {
  banner: Banner;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border text-left shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 ${selected ? 'border-amber-300/80 ring-1 ring-amber-300/40' : 'border-white/15 hover:border-amber-300/40'}`}
    >
      <div
        className={`relative flex min-h-40 items-center justify-between gap-3 overflow-hidden bg-gradient-to-br p-5 ${banner.type === 'WEAPON' ? 'from-indigo-800 via-violet-950 to-zinc-950' : banner.type === 'CHRONICLED' ? 'from-teal-700 via-emerald-950 to-zinc-950' : 'from-amber-700 via-rose-950 to-zinc-950'}`}
      >
        {banner.type === 'CHARACTER' && visualAssets.characters[banner.fiveStarKey]?.file && (
          <div aria-hidden="true" className="absolute inset-0 opacity-70">
            <CdnArtwork
              key={banner.fiveStarKey}
              file={visualAssets.characters[banner.fiveStarKey]!.file!}
              kind="character"
              alt=""
              className="object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/35 to-transparent" />
          </div>
        )}
        <div className="relative z-10 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">
            {banner.type === 'CHARACTER'
              ? 'Character Event Wish'
              : banner.type === 'WEAPON'
                ? 'Weapon Event Wish'
                : `${banner.region} Chronicled Wish`}
          </p>
          <h3 className="mt-2 text-lg font-bold leading-snug text-white">{banner.name}</h3>
          <p className="mt-2 text-xs text-zinc-200">
            {selected ? '✓ Selected scenario' : 'Explore this wish'}
          </p>
        </div>
        <div className="flex shrink-0 -space-x-3">
          {banner.fiveStarKeys.slice(0, 2).map((key) => (
            <div key={key} className="rotate-3 shadow-xl transition group-hover:rotate-0">
              <WishIcon itemKey={key} weapon={banner.type === 'WEAPON'} size="lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-zinc-950/80 p-4">
        <div className="flex flex-wrap gap-2">
          {(banner.fourStarKeys.length ? banner.fourStarKeys : banner.fiveStarKeys).map((key) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] text-zinc-200">
              <WishIcon itemKey={key} weapon={banner.type === 'WEAPON'} size="sm" />
              <span>{artworkDisplayName(key)}</span>
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-zinc-400">
          Historical · {banner.startDate} — {banner.endDate}
        </p>
      </div>
    </button>
  );
}
function PityBar({ label, value, maximum }: { label: string; value: number; maximum: number }) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm text-zinc-200">
        <span>{label} pity</span>
        <strong>
          {value} / {maximum}
        </strong>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-300 transition-all"
          style={{ width: `${Math.min(100, (value / maximum) * 100)}%` }}
        />
      </div>
    </div>
  );
}
function PullCard({ item, index }: { item: PullResultItem; index: number }) {
  return (
    <div
      className={`motion-safe:animate-fade-in relative flex min-w-0 flex-col items-center gap-2 overflow-hidden rounded-xl border p-2 text-center ${item.type === '5_STAR' ? 'border-amber-300/70 bg-amber-500/15 shadow-[0_0_24px_rgba(251,191,36,0.2)]' : item.type === '4_STAR' ? 'border-purple-400/60 bg-purple-500/10' : 'border-sky-500/25 bg-sky-500/5'}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <WishIcon itemKey={item.itemKey} weapon={item.itemKind === 'weapon'} size="lg" />
      <p className="w-full break-words text-xs font-semibold text-zinc-100">
        {artworkDisplayName(item.itemKey)}
      </p>
      <span
        className={`text-[10px] ${item.type === '5_STAR' ? 'text-amber-200' : 'text-purple-200'}`}
      >
        {item.type[0]}★{item.isFeatured ? ' · Featured' : ''}
      </span>
    </div>
  );
}
export default function SimulatorsPage() {
  const bannersQuery = useQuery({
    queryKey: ['simulators', 'banners'],
    queryFn: fetchBanners,
    staleTime: Infinity,
  });
  const mutation = useMutation({ mutationFn: simulatePulls });
  const lock = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pityMap, setPityMap] = useState<Record<string, PityState>>({});
  const [statsMap, setStatsMap] = useState<Record<string, PullStats>>({});
  const [history, setHistory] = useState<(PullResultItem & { bannerId: string })[]>([]);
  const [batch, setBatch] = useState<{ bannerId: string; items: PullResultItem[] } | null>(null);
  const banner =
    bannersQuery.data?.find((b) => b.bannerId === selectedId) ?? bannersQuery.data?.[0];
  const pity = banner ? (pityMap[banner.bannerId] ?? initialPity(banner)) : null;
  const stats = banner ? (statsMap[banner.bannerId] ?? emptyStats) : emptyStats;
  async function pull(count: 1 | 10) {
    if (!banner || !pity || lock.current) return;
    lock.current = true;
    const bannerId = banner.bannerId;
    try {
      const result = await mutation.mutateAsync({
        bannerId,
        count,
        currentPity5: pity.pity5,
        currentPity4: pity.pity4,
        guaranteed5: pity.guaranteed5,
        guaranteed4: pity.guaranteed4,
        fatePoints: pity.fatePoints,
        ...(pity.pathTargetKey ? { pathTargetKey: pity.pathTargetKey } : {}),
      });
      setPityMap((previous) => ({
        ...previous,
        [bannerId]: {
          pity5: result.endPity5,
          pity4: result.endPity4,
          guaranteed5: result.endGuaranteed5,
          guaranteed4: result.endGuaranteed4,
          fatePoints: result.endFatePoints,
          pathTargetKey: pity.pathTargetKey,
        },
      }));
      setStatsMap((previous) => {
        const old = previous[bannerId] ?? emptyStats;
        return {
          ...previous,
          [bannerId]: {
            total: old.total + result.pulls.length,
            five: old.five + result.pulls.filter((p) => p.type === '5_STAR').length,
            four: old.four + result.pulls.filter((p) => p.type === '4_STAR').length,
            featured:
              old.featured + result.pulls.filter((p) => p.type === '5_STAR' && p.isFeatured).length,
          },
        };
      });
      setHistory((previous) =>
        [
          ...result.pulls.filter((p) => p.type !== '3_STAR').map((p) => ({ ...p, bannerId })),
          ...previous,
        ].slice(0, 1000),
      );
      setBatch({ bannerId, items: result.pulls });
    } catch {
      /* TanStack Query exposes the error below; preserve the previous state. */
    } finally {
      lock.current = false;
    }
  }
  function reset() {
    if (!banner || lock.current) return;
    setPityMap((previous) => ({ ...previous, [banner.bannerId]: initialPity(banner) }));
    setStatsMap((previous) => ({ ...previous, [banner.bannerId]: emptyStats }));
    setHistory((previous) => previous.filter((p) => p.bannerId !== banner.bannerId));
    setBatch(null);
    mutation.reset();
  }
  return (
    <main
      id="companion-content"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-8 text-zinc-300 sm:px-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
        Wish workshop
      </p>
      <h1 className="mt-2 text-3xl font-bold text-white">Pull Simulator</h1>
      <p className="mt-3 max-w-3xl text-sm text-zinc-400">
        Explore historical Natlan wishes and a Mondstadt Chronicled character pool. Fictional
        results use an approximate soft-pity model and a basic character 50/50 without Capturing
        Radiance. Each scenario has independent session pity; leaving this page resets it.
      </p>
      <section aria-label="Select banner" className="mt-6 grid gap-4 md:grid-cols-2">
        {bannersQuery.isPending && <p role="status">Loading wish scenarios…</p>}
        {bannersQuery.isError && (
          <div role="alert">
            {bannersQuery.error.message}
            <button className="ml-3 underline" onClick={() => void bannersQuery.refetch()}>
              Retry
            </button>
          </div>
        )}
        {bannersQuery.data?.map((b) => (
          <BannerCard
            key={b.bannerId}
            banner={b}
            selected={b.bannerId === banner?.bannerId}
            disabled={mutation.isPending}
            onSelect={() => {
              setSelectedId(b.bannerId);
              mutation.reset();
            }}
          />
        ))}
      </section>
      {banner && pity && (
        <>
          <section
            aria-label="Pity tracker"
            className="mt-8 rounded-2xl border border-white/15 bg-zinc-950/70 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">{banner.name}</h2>
              <button
                type="button"
                disabled={mutation.isPending}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-50"
                onClick={reset}
              >
                Reset scenario
              </button>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <PityBar label="5★" value={pity.pity5} maximum={banner.hardPity} />
              <PityBar label="4★" value={pity.pity4} maximum={banner.type === 'WEAPON' ? 9 : 10} />
            </div>
            {!!banner.fatePointCap && (
              <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-500/5 p-4">
                <label className="text-sm text-amber-100">
                  {banner.type === 'WEAPON'
                    ? 'Epitomized Path · 5.0+ rules'
                    : 'Chronicled Path · Mondstadt characters'}
                  <select
                    aria-label="Path target"
                    disabled={mutation.isPending}
                    className="mt-2 w-full rounded-lg border border-white/20 bg-zinc-900 p-2 text-sm text-white"
                    value={pity.pathTargetKey}
                    onChange={(e) =>
                      setPityMap((previous) => ({
                        ...previous,
                        [banner.bannerId]: {
                          ...pity,
                          pathTargetKey: e.target.value,
                          fatePoints: 0,
                        },
                      }))
                    }
                  >
                    {banner.fiveStarKeys.map((key) => (
                      <option key={key} value={key}>
                        {visualAssets.weapons[key]?.name ?? artworkDisplayName(key)}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-sm text-amber-200">
                  Fate Points: {pity.fatePoints} / 1
                  {pity.fatePoints === 1 ? ' · Next 5★ guarantees your selected target' : ''}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Changing your target clears Fate Points and retains pity. This simulator keeps
                  scenarios separate.
                </p>
              </div>
            )}
            {banner.type !== 'CHRONICLED' && (
              <p className="mt-3 text-xs text-zinc-300">
                Next 5★:{' '}
                {pity.guaranteed5
                  ? 'featured guarantee'
                  : banner.type === 'WEAPON'
                    ? '75% featured pool'
                    : '50/50 baseline'}{' '}
                · Next 4★: {pity.guaranteed4 ? 'featured guarantee' : 'normal odds'}
              </p>
            )}
            <a
              href={banner.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs text-indigo-200 underline"
            >
              Historical wish source
            </a>
          </section>
          <div className="my-6 flex gap-3">
            {([1, 10] as const).map((count) => (
              <button
                type="button"
                id={`btn-pull-${count}`}
                key={count}
                disabled={mutation.isPending}
                onClick={() => void pull(count)}
                className={`flex-1 rounded-xl border py-4 text-lg font-bold transition disabled:opacity-50 ${count === 10 ? 'border-amber-300/50 bg-gradient-to-r from-amber-600 to-orange-800 text-white shadow-lg shadow-amber-600/10' : 'border-violet-400/40 bg-violet-500/15 text-violet-100'}`}
              >
                {mutation.isPending ? 'Wishing…' : `Wish ×${count}`}
              </button>
            ))}
          </div>
          {mutation.isError && (
            <p
              role="alert"
              className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200"
            >
              {mutation.error.message} Your pity was preserved; try again.
            </p>
          )}
          {batch?.bannerId === banner.bannerId && (
            <section aria-label="Latest pull" aria-live="polite">
              <h2 className="mb-3 text-lg font-semibold text-white">
                {batch.items.some((p) => p.type === '5_STAR')
                  ? '✦ A golden wish!'
                  : 'Your latest wish'}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {batch.items.map((item, index) => (
                  <PullCard key={item.id} item={item} index={index} />
                ))}
              </div>
            </section>
          )}
          <dl className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Total wishes', stats.total],
              ['5★ obtained', stats.five],
              ['4★ obtained', stats.four],
              ['Featured 5★', stats.featured],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="text-xs text-zinc-400">{label}</dt>
                <dd className="mt-1 text-2xl font-bold text-amber-100">{value}</dd>
              </div>
            ))}
          </dl>
          <details className="rounded-xl border border-white/10 p-4">
            <summary className="cursor-pointer text-sm text-zinc-300">
              Notable pulls · latest 20
            </summary>
            <div className="mt-3 space-y-2">
              {history
                .filter((p) => p.bannerId === banner.bannerId)
                .slice(0, 20)
                .map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                    <WishIcon itemKey={p.itemKey} weapon={p.itemKind === 'weapon'} size="sm" />
                    <span className="text-sm">
                      {artworkDisplayName(p.itemKey)} · {p.type[0]}★
                      {p.isFeatured ? ' · Featured' : ''}
                    </span>
                  </div>
                ))}
            </div>
          </details>
        </>
      )}
    </main>
  );
}
