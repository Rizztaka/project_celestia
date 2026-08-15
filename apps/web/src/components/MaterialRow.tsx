import {
  categoriseMaterial,
  CATEGORY_COLORS,
  type MaterialCategory,
  materialDisplayName,
} from '../lib/static';

interface MaterialRowProps {
  itemKey: string;
  needed: number;
  inventory: number;
  delta: number;
}

export default function MaterialRow({ itemKey, needed, inventory, delta }: MaterialRowProps) {
  const category = categoriseMaterial(itemKey);
  const displayName = materialDisplayName(itemKey);
  const colorClass = CATEGORY_COLORS[category as MaterialCategory];
  const fillPct = needed > 0 ? Math.min((inventory / needed) * 100, 100) : 100;
  const isMet = delta === 0;

  return (
    <div
      className={`flex items-center gap-3 border-b border-white/5 py-3 transition-opacity last:border-0 ${
        isMet ? 'opacity-40' : ''
      }`}
    >
      {/* Category badge */}
      <span
        className={`shrink-0 whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}
      >
        {category}
      </span>

      {/* Name + progress bar */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-200">{displayName}</p>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isMet ? 'bg-emerald-400' : 'bg-accent-500'
            }`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Counts */}
      <div className="shrink-0 text-right tabular-nums">
        <p className="font-mono text-sm">
          <span className="text-zinc-400">{inventory}</span>
          <span className="mx-1 text-zinc-600">/</span>
          <span className="font-semibold text-white">{needed}</span>
        </p>
        {!isMet && <p className="mt-0.5 text-xs font-semibold text-red-400">−{delta}</p>}
        {isMet && <p className="mt-0.5 text-xs font-semibold text-emerald-400">✓</p>}
      </div>
    </div>
  );
}
