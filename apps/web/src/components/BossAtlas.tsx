import { useState } from 'react';

import { visualAssets } from '../lib/cdn-resolver';
import { materialDisplayName } from '../lib/static';
import { GenshinBossIcon } from './GenshinBossIcon';
import { GenshinMaterialIcon } from './GenshinMaterialIcon';
export default function BossAtlas() {
  const [kind, setKind] = useState('weekly');
  const [search, setSearch] = useState('');
  const bosses = Object.entries(visualAssets.bosses).filter(
    ([, boss]) =>
      boss.kind === kind &&
      [boss.name, ...boss.dropKeys.map(materialDisplayName)]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <details className="mt-5 rounded-xl border border-rose-400/20 bg-rose-950/10 p-4">
      <summary className="cursor-pointer font-semibold text-rose-100">
        Boss atlas · Weekly and world boss drops
      </summary>
      <p className="mt-3 text-xs text-zinc-400">
        Reference catalog; check your in-game unlocks and remaining weekly reward claims.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-300">
          Boss type
          <select
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 p-2 text-sm text-white"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="weekly">Weekly bosses</option>
            <option value="world">World bosses</option>
          </select>
        </label>
        <label className="text-xs text-zinc-300">
          Find boss or material
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 p-2 text-sm text-white"
          />
        </label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {bosses.map(([key, boss]) => (
          <article key={key} className="rounded-xl border border-white/10 bg-zinc-950/60 p-4">
            <div className="flex items-center gap-3">
              <GenshinBossIcon bossKey={key} />
              <div>
                <h3 className="font-semibold text-white">{boss.name}</h3>
                <p className="text-xs text-rose-200">
                  {boss.kind === 'weekly' ? 'Weekly challenge' : 'World boss'}
                  {boss.location ? ` · ${boss.location}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {boss.dropKeys.map((drop) => (
                <span
                  key={drop}
                  className="flex items-center gap-2 rounded-lg border border-white/10 p-1 text-[10px] text-zinc-200"
                >
                  <GenshinMaterialIcon itemKey={drop} size="sm" />
                  {materialDisplayName(drop)}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
      {!bosses.length && <p className="mt-3 text-sm text-zinc-400">No matching bosses.</p>}
    </details>
  );
}
