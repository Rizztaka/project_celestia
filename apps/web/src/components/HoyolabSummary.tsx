import { Link } from 'react-router-dom';

import { useHoyolabStatus } from '../lib/hoyolab';

export function HoyolabSummary({ compact = false }: { compact?: boolean }) {
  const status = useHoyolabStatus();
  const s = status.data,
    n = s?.notes;
  if (!s?.connected || !s.syncedAt)
    return (
      <section className="glass-panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          <h2 className="font-semibold text-white">Bring your account into focus</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {status.isError
              ? 'Connection status is unavailable. Your saved builds remain accessible.'
              : 'Connect HoYoLAB to refresh your characters and equipped builds.'}
          </p>
        </div>
        <Link className="button-secondary" to="/connect">
          Connect HoYoLAB →
        </Link>
      </section>
    );
  return (
    <section className="glass-panel mb-6 rounded-2xl p-5" aria-label="HoYoLAB snapshot">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          HoYoLAB · Updated {new Date(s.syncedAt).toLocaleString()}
        </p>
        <Link className="text-sm text-indigo-200" to="/connect">
          {s.state === 'ready' ? 'Manage connection →' : 'Check connection →'}
        </Link>
      </div>
      {status.isError && (
        <p role="status" className="mt-3 text-sm text-amber-200">
          Connection status could not refresh. Showing the previous snapshot.
        </p>
      )}
      {!compact && n && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="eyebrow">RESIN</p>
            <p className="mt-2 text-2xl text-white">
              {n.resin.current}
              <span className="text-sm text-zinc-400"> / {n.resin.max}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {n.resin.current >= n.resin.max
                ? 'Spend resin to resume recovery.'
                : `Full in ${Math.ceil(n.resin.fullInSeconds / 3600)}h at this snapshot.`}
            </p>
            <Link className="text-sm text-indigo-200" to="/planner?tab=farming">
              Choose a farming goal →
            </Link>
          </div>
          <div>
            <p className="eyebrow">COMMISSIONS</p>
            <p className="mt-2 text-2xl text-white">
              {n.commissions.completed} / {n.commissions.total}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {n.commissions.rewardClaimed
                ? 'Daily reward claimed.'
                : n.commissions.completed >= n.commissions.total
                  ? 'Claim your daily reward in game.'
                  : 'Finish commissions or claim Encounter Points in game.'}
            </p>
          </div>
          <div>
            <p className="eyebrow">EXPEDITIONS</p>
            <p className="mt-2 text-2xl text-white">{n.expeditions.finished} ready</p>
            <p className="mt-1 text-sm text-zinc-400">
              {n.expeditions.finished
                ? 'Collect and resend them in game.'
                : `${n.expeditions.total} recorded expeditions. Check again after refresh.`}
            </p>
          </div>
        </div>
      )}
      {!compact && !n && (
        <p className="mt-3 text-sm text-zinc-400">
          Daily notes are unavailable from HoYoLAB. Your equipped builds are saved.
        </p>
      )}
    </section>
  );
}
