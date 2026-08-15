import type { HydratedWeeklyBoss } from '../lib/api';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function formatDropKey(key: string): string {
  // Convert GOOD-format PascalCase to Title Case with spaces
  return key.replace(/([A-Z])/g, ' $1').trim();
}

// -------------------------------------------------------
// WeeklyBossCard
// -------------------------------------------------------

interface WeeklyBossCardProps {
  boss: HydratedWeeklyBoss;
  isPending: boolean;
  onToggle: (bossKey: string, defeated: boolean) => void;
}

export default function WeeklyBossCard({ boss, isPending, onToggle }: WeeklyBossCardProps) {
  const { key, name, location, domainName, dropKeys, wikiUrl, defeated } = boss;

  return (
    <div
      className={`glass-panel flex flex-col gap-4 rounded-2xl p-5 transition-all duration-300 ${
        defeated ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Defeated badge */}
          {defeated && (
            <span className="mb-1.5 inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              ✓ Defeated
            </span>
          )}

          <h3
            className={`text-base font-bold leading-tight transition-colors ${
              defeated ? 'text-zinc-500' : 'text-white'
            }`}
          >
            {name}
          </h3>

          <p className="mt-0.5 text-xs leading-snug text-zinc-600">
            {domainName} · {location}
          </p>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => onToggle(key, !defeated)}
          className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
            defeated
              ? 'hover:bg-danger-950/20 hover:border-danger-500/30 hover:text-danger-400 border-white/10 bg-white/5 text-zinc-500'
              : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isPending ? '…' : defeated ? 'Undo' : 'Mark Defeated'}
        </button>
      </div>

      {/* Drop materials */}
      {dropKeys.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dropKeys.map((dk) => (
            <span
              key={dk}
              className="rounded border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[10px] text-zinc-600"
            >
              {formatDropKey(dk)}
            </span>
          ))}
        </div>
      )}

      {/* Wiki link */}
      {wikiUrl && (
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent-400 -mt-1 self-start text-[10px] text-zinc-700 transition-colors"
        >
          Wiki ↗
        </a>
      )}
    </div>
  );
}
