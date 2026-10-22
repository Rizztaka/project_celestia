import { SERVER_POLICIES, type SupportedServerId } from '@celestia/api-contracts';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';

import { domainSchedule, materialCatalogEntry } from '../lib/catalog';
import { visualAssets } from '../lib/cdn-resolver';
import { regionalScenery } from '../lib/regional-scenery';
import { GenshinMaterialIcon } from './GenshinMaterialIcon';
import { RegionalScenery } from './RegionalScenery';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const control = 'mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 p-2 text-sm text-white';

export default function DomainSchedule({
  serverId,
  weekday,
  goalDomainKeys,
  initialDay = 'week',
  initialOnlyGoals = true,
}: {
  serverId: SupportedServerId | null;
  weekday: number | null;
  goalDomainKeys: string[] | undefined;
  initialDay?: 'week' | 'today';
  initialOnlyGoals?: boolean;
}) {
  const id = useId();
  const [day, setDay] = useState<string>(
    initialDay === 'today' && weekday === null ? 'week' : initialDay,
  );
  const [search, setSearch] = useState('');
  const [onlyGoals, setOnlyGoals] = useState(initialOnlyGoals);
  const hasGoals = !!goalDomainKeys?.length;
  const selectedDay = day === 'today' ? weekday : day === 'week' ? null : Number(day);
  const matches = domainSchedule.filter((domain) => {
    if (onlyGoals && hasGoals && !goalDomainKeys!.includes(domain.domainKey)) return false;
    if (day === 'today' && weekday === null) return false;
    if (selectedDay !== null && !domain.days.includes(selectedDay)) return false;
    const text = [
      domain.name,
      domain.location,
      ...domain.dropKeys.map((key) => materialCatalogEntry(key)?.name ?? key),
    ]
      .join(' ')
      .toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });
  return (
    <div>
      <p className="mt-2 text-sm text-zinc-400">
        Talent books and weapon ascension materials, by drop day. Schedules do not require recorded
        stock or a difficulty selection.
      </p>
      <p className="mt-2 text-sm text-indigo-200">
        {serverId !== null && weekday !== null
          ? `${SERVER_POLICIES[serverId].label} · ${days[weekday]} game day · changes at 04:00 server time`
          : 'Choose your server on Today to see what is open now. You can still browse every weekday.'}
      </p>
      {serverId === null && (
        <Link to="/" className="mt-2 inline-block text-sm text-indigo-200 underline">
          Choose server on Today
        </Link>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${id}-day`} className="text-sm text-zinc-300">
          Show drops for
          <select
            id={`${id}-day`}
            className={control}
            value={day}
            onChange={(event) => setDay(event.target.value)}
          >
            <option value="week">Whole week</option>
            <option value="today" disabled={weekday === null}>
              Today{weekday !== null ? ` (${days[weekday]})` : ''}
            </option>
            {days.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-search`} className="text-sm text-zinc-300">
          Find a material or domain
          <input
            id={`${id}-search`}
            className={control}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="e.g. Diligence"
          />
        </label>
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={onlyGoals && hasGoals}
          disabled={!hasGoals}
          onChange={(event) => setOnlyGoals(event.target.checked)}
        />
        Only domains for my active goals
      </label>
      {!hasGoals && (
        <p className="mt-2 text-xs text-zinc-400">
          {goalDomainKeys === undefined
            ? 'Goal matches are loading or unavailable; browsing the catalog.'
            : 'No supported talent or weapon domain goals yet; browsing the catalog.'}
        </p>
      )}
      <p role="status" className="mt-3 text-xs text-zinc-400">
        {matches.length} material {matches.length === 1 ? 'family' : 'families'}
        {onlyGoals && hasGoals ? ' for your goals' : ''}
      </p>
      {!matches.length && (
        <p className="mt-3 text-sm text-zinc-300">
          No matches for these filters. Choose Whole week or clear the search to see other drop
          days.
        </p>
      )}
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {matches.map((domain) => {
          const open = weekday !== null && domain.days.includes(weekday);
          const next =
            weekday === null
              ? null
              : domain.days.reduce(
                  (best, value) => {
                    const offset = (value - weekday + 7) % 7;
                    return offset < best.offset ? { day: value, offset } : best;
                  },
                  { day: 0, offset: 8 },
                );
          return (
            <li
              key={domain.domainKey}
              className="overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/70 text-sm shadow-lg"
            >
              <RegionalScenery
                region={visualAssets.domains[domain.domainKey]?.region ?? 'Teyvat'}
              />
              <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {domain.dropKeys.map((key) => (
                    <GenshinMaterialIcon key={key} itemKey={key} />
                  ))}
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${open ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}
                  >
                    {weekday === null ? 'Choose server' : open ? 'Open today' : 'Closed today'}
                  </span>
                </div>
                <p className="font-medium text-white">
                  {domain.dropKeys.map((key) => materialCatalogEntry(key)?.name ?? key).join(' · ')}
                </p>
                <p className="mt-2 text-zinc-400">{domain.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{domain.location}</p>
                <p className="mt-2 text-zinc-200">
                  {domain.days.map((value) => days[value]).join(' · ')}
                </p>
                {next && (
                  <p className={`mt-2 text-xs ${open ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {open
                      ? 'Open today'
                      : `Next open: ${days[next.day]}${next.offset === 1 ? ' (next game day)' : ` (in ${next.offset} game days)`}`}
                  </p>
                )}
                {goalDomainKeys?.includes(domain.domainKey) && (
                  <p className="mt-2 text-xs text-indigo-200">For your goals</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-zinc-400">
        On Sunday, select the material family in the domain. For enemy drops and local specialties,
        use the in-game material navigation.
      </p>
      <details className="mt-3 text-xs text-zinc-400">
        <summary className="cursor-pointer">Schedule source</summary>
        <p className="mt-2">
          Domain cards show regional scenery; individual entrances are not verified. Community
          catalog:{' '}
          <a
            className="text-indigo-200 underline"
            href="https://github.com/theBowja/genshin-db/tree/49a6544a6c6ae36089cb42fa591fc46f01de8bcf"
            target="_blank"
            rel="noreferrer"
          >
            genshin-db (MIT)
          </a>
          . This is a pinned snapshot; the original game capture date is unknown.
        </p>
        <ul className="mt-2 space-y-1">
          {Object.entries(regionalScenery).map(([region, photograph]) => (
            <li key={region}>
              <a
                href={photograph.source}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-200 underline"
              >
                {region} photograph
              </a>{' '}
              · {photograph.credit}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
