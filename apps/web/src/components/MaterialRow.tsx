import { materialCatalogEntry } from '../lib/catalog';
import { materialDisplayName } from '../lib/static';

interface MaterialRowProps {
  itemKey: string;
  needed: number;
  inventory: number | null;
  delta: number | null;
  planningDelta?: number;
}

export default function MaterialRow({
  itemKey,
  needed,
  inventory,
  delta,
  planningDelta,
}: MaterialRowProps) {
  const entry = materialCatalogEntry(itemKey);
  const displayName = entry?.name ?? materialDisplayName(itemKey);
  const fillPct = needed > 0 ? Math.min(((inventory ?? 0) / needed) * 100, 100) : 100;
  const isMet = delta === 0;

  return (
    <div
      className={`flex items-center gap-3 border-b border-white/5 py-3 transition-opacity last:border-0 ${
        isMet ? 'opacity-40' : ''
      }`}
    >
      {/* Name + progress bar */}
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-zinc-200">{displayName}</p>
        {entry && (entry.domain || entry.sources.length > 0) && (
          <details className="mt-1 text-xs text-zinc-400">
            <summary className="cursor-pointer">Where to find</summary>
            {entry.domain ? (
              <p className="mt-2">
                {entry.domain.location} ·{' '}
                {entry.domain.days
                  .map((day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day])
                  .join(' / ')}{' '}
                · {entry.domain.resinPerClaim} Original Resin per reward set.
              </p>
            ) : (
              <>
                <p className="mt-2">{entry.sources.join(' · ')}</p>
                <a
                  className="mt-2 inline-block text-indigo-200 underline"
                  href="https://act.hoyolab.com/ys/app/interactive-map/index.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open official interactive map
                </a>
              </>
            )}
          </details>
        )}
        {inventory !== null && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isMet ? 'bg-emerald-400' : 'bg-accent-500'
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Counts */}
      <div className="shrink-0 text-right tabular-nums">
        <p className="font-mono text-sm">
          <span className="text-zinc-400">{inventory?.toLocaleString() ?? 'Unknown'}</span>
          <span className="mx-1 text-zinc-600">/</span>
          <span className="font-semibold text-white">{needed.toLocaleString()}</span>
        </p>
        {delta !== null && !isMet && (
          <p className="mt-0.5 text-xs font-semibold text-amber-200">
            Need {delta.toLocaleString()}
          </p>
        )}
        {delta === null && (
          <p className="mt-0.5 text-xs text-amber-300">
            Plan {(planningDelta ?? needed).toLocaleString()} · no unrecorded stock credited
          </p>
        )}
        {isMet && <p className="mt-0.5 text-xs font-semibold text-emerald-400">✓</p>}
      </div>
    </div>
  );
}
