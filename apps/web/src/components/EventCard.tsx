import type { GenshinEvent, EventRewardTier } from '../lib/api';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function formatTimeRemaining(hours: number): string {
  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours}h`;
  return '< 1h';
}

function urgencyColor(hours: number): string {
  if (hours <= 24) return 'text-red-400';
  if (hours <= 72) return 'text-amber-400';
  return 'text-zinc-400';
}

// -------------------------------------------------------
// Sub-components
// -------------------------------------------------------

interface TierRowProps {
  tier: EventRewardTier;
  isActive: boolean;
  isPending: boolean;
  onToggle: (tierId: string, claimed: boolean) => void;
}

function TierRow({ tier, isActive, isPending, onToggle }: TierRowProps) {
  const isClaimed = tier.claimed;

  return (
    <label
      className={`group flex cursor-pointer items-center gap-3 py-2.5 transition-opacity ${
        isClaimed ? 'opacity-50' : ''
      } ${!isActive ? 'cursor-default' : ''}`}
    >
      <input
        type="checkbox"
        checked={isClaimed}
        disabled={!isActive || isPending}
        onChange={(e) => onToggle(tier.tierId, e.target.checked)}
        className="accent-accent-500 h-4 w-4 cursor-pointer rounded border-white/20 bg-white/5 disabled:cursor-default"
      />

      <span
        className={`flex-1 text-sm transition-all ${
          isClaimed ? 'text-zinc-600 line-through' : 'text-zinc-200'
        }`}
      >
        {tier.label}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        {tier.primogems > 0 && (
          <span
            className={`text-xs font-semibold tabular-nums ${
              isClaimed ? 'text-zinc-600' : 'text-amber-400'
            }`}
          >
            {tier.primogems}✦
          </span>
        )}
        {tier.other.map((item) => (
          <span
            key={item}
            className={`rounded border px-1.5 py-0.5 text-[10px] ${
              isClaimed ? 'border-white/5 text-zinc-700' : 'border-white/10 text-zinc-400'
            }`}
          >
            {item.replace(/([A-Z])/g, ' $1').trim()}
          </span>
        ))}
      </div>
    </label>
  );
}

// -------------------------------------------------------
// EventCard
// -------------------------------------------------------

interface EventCardProps {
  event: GenshinEvent;
  pendingTiers: Set<string>;
  onToggle: (eventKey: string, tierId: string, claimed: boolean) => void;
}

export default function EventCard({ event, pendingTiers, onToggle }: EventCardProps) {
  const unclaimedPrimogems = event.totalPrimogems - event.claimedPrimogems;
  const progressPct =
    event.totalPrimogems > 0 ? (event.claimedPrimogems / event.totalPrimogems) * 100 : 100;

  const timeColor = urgencyColor(event.hoursRemaining);
  const timeDisplay = formatTimeRemaining(event.hoursRemaining);

  return (
    <div className="glass-panel flex flex-col gap-0 overflow-hidden rounded-2xl p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold leading-tight text-white">{event.name}</h3>
            {event.isUpcoming && (
              <span className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Upcoming
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">{event.description}</p>
        </div>

        <div className="shrink-0 text-right">
          {event.isActive && (
            <p className={`text-xs font-semibold ${timeColor}`}>{timeDisplay} left</p>
          )}
          {event.isUpcoming && (
            <p className="text-xs text-zinc-500">
              Starts{' '}
              {new Date(event.startUtc).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
          {event.wikiUrl && (
            <a
              href={event.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-400 mt-0.5 inline-block text-[10px] text-zinc-600 transition-colors"
            >
              Wiki ↗
            </a>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {event.totalPrimogems > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-zinc-600">Primogems</span>
            <span
              className={`font-semibold tabular-nums ${progressPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {event.claimedPrimogems} / {event.totalPrimogems}✦
              {unclaimedPrimogems > 0 && (
                <span className="ml-1 font-normal text-zinc-500">
                  ({unclaimedPrimogems} unclaimed)
                </span>
              )}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progressPct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mb-1 w-full border-t border-white/5" />

      {/* Tier list */}
      <div className="divide-y divide-white/5">
        {event.rewardTiers.map((tier) => (
          <TierRow
            key={tier.tierId}
            tier={tier}
            isActive={event.isActive}
            isPending={pendingTiers.has(`${event.key}|${tier.tierId}`)}
            onToggle={(tierId, claimed) => onToggle(event.key, tierId, claimed)}
          />
        ))}
      </div>

      {/* All claimed banner */}
      {event.isActive && event.rewardTiers.every((t) => t.claimed) && (
        <p className="animate-fade-in mt-3 text-center text-xs font-semibold text-emerald-400">
          ✓ All rewards collected for this event!
        </p>
      )}
    </div>
  );
}
