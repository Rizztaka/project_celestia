import type { YieldProjection } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';

import { captureSession } from '../lib/account-session';
import { fetchFarmingIntelligence } from '../lib/api';
import { materialCatalogEntry } from '../lib/catalog';
import DomainSchedule from './DomainSchedule';

const input = 'mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 p-2 text-sm text-white';
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const tiers = ['I', 'II', 'III', 'IV'];
function projectionText(result: YieldProjection) {
  switch (result.state) {
    case 'unknown_stock':
      return 'No estimate is available for this stock scenario.';
    case 'difficulty_required':
      return 'Select a domain difficulty.';
    case 'limit':
      return 'This demand is outside the bounded estimate model.';
    case 'covered':
      return 'Recorded stock and upward crafting cover this domain family.';
    case 'estimated':
      return `About ${result.planningRuns!.toLocaleString()} reward sets · ${result.resin!.toLocaleString()} Original Resin`;
  }
}
export default function FarmingPanel() {
  const id = useId();
  const [session] = useState(captureSession);
  const [talentTier, setTalentTier] = useState('');
  const [weaponTier, setWeaponTier] = useState('');
  const options = { talentTier, weaponTier, includeRoute: 'false', maxStops: '12' };
  const query = useQuery({
    queryKey: ['companion', 'farming', session.generation, options],
    queryFn: ({ signal }) => fetchFarmingIntelligence(options, signal, session),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === session.generation ? previous : undefined,
    retry: false,
  });
  const result = query.data?.recommendation;
  const refreshFarming = query.refetch;
  useEffect(() => {
    if (!result?.validUntil) return;
    const delay = Date.parse(result.validUntil) - Date.parse(result.serverNow);
    if (!Number.isFinite(delay)) return;
    const timer = setTimeout(
      () => void refreshFarming(),
      Math.min(Math.max(0, delay) + 50, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [result?.serverNow, result?.validUntil, refreshFarming]);
  return (
    <section
      id="farming-planning"
      aria-labelledby={`${id}-heading`}
      aria-busy={query.isFetching}
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6"
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold text-white">
        Domain farming days
      </h2>
      {query.isPending && (
        <p role="status" className="mt-4 text-sm text-zinc-400">
          Loading farming advice…
        </p>
      )}
      {query.isFetching && !query.isPending && (
        <p role="status" className="mt-3 text-xs text-zinc-400">
          Updating farming advice. The previous result remains visible until the new choices are
          ready.
        </p>
      )}
      {query.isError && (
        <div role="alert" className="mt-4 text-sm text-amber-200">
          <p>{query.error.message}</p>
          <button type="button" onClick={() => void query.refetch()} className="mt-2 underline">
            Refresh farming advice
          </button>
        </div>
      )}
      <DomainSchedule
        serverId={result?.serverId ?? null}
        weekday={result?.serverWeekday ?? null}
        goalDomainKeys={result?.estimates.map((estimate) => estimate.domain.domainKey)}
      />
      <details className="mt-5 border-t border-white/10 pt-4">
        <summary className="cursor-pointer text-sm text-zinc-300">
          Optional resin estimates &amp; pacing
        </summary>
        <p className="mt-2 text-xs text-zinc-400">
          Choose a goal and a difficulty; inventory entry is optional. Recorded stock and craftable
          surplus reduce these mean-drop estimates. Rewards can vary.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['talent', 'Talent domain difficulty', talentTier, setTalentTier],
              ['weapon', 'Weapon domain difficulty', weaponTier, setWeaponTier],
            ] as const
          ).map(([kind, label, value, setValue]) => (
            <label key={kind} htmlFor={`${id}-${kind}`} className="text-sm text-zinc-300">
              {label}
              <select
                id={`${id}-${kind}`}
                className={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">Choose the tier you can clear</option>
                {tiers.map((tier, i) => (
                  <option key={tier} value={i + 1}>
                    Tier {tier}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {result && (
          <>
            {!result.estimates.length ? (
              <p className="mt-4 text-sm text-zinc-400">
                Add a talent or weapon ascension goal to estimate domain farming. You can browse
                drop days above.
              </p>
            ) : (
              <>
                <p className="mt-4 font-medium text-white">
                  Modeled domain work: {result.estimatedResin.toLocaleString()} Original Resin
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {result.unestimatedFamilies
                    ? `${result.unestimatedFamilies} domain families still need difficulty information. `
                    : ''}
                  Totals cover the modeled subset; bosses, Mora, EXP and gathering are separate.
                </p>
                <ul className="mt-3 divide-y divide-white/10">
                  {result.estimates.map((estimate) => (
                    <li key={estimate.domain.domainKey} className="py-3 text-sm">
                      <p className="font-medium text-zinc-200">{estimate.domain.name}</p>
                      <p className="mt-1 text-zinc-400">{projectionText(estimate.projection)}</p>
                      {!!estimate.unrecordedStockKeys?.length && (
                        <p className="mt-1 text-xs text-zinc-400">
                          Goal-first estimate: unrecorded stock receives no credit.
                        </p>
                      )}
                      <details className="mt-2 text-xs text-zinc-400">
                        <summary className="cursor-pointer">
                          Compare difficulty and mean rewards
                        </summary>
                        <ul className="mt-2 space-y-2">
                          {estimate.comparisons.map((c) => (
                            <li
                              key={c.difficulty}
                              className={
                                estimate.difficulty === c.difficulty ? 'text-indigo-200' : ''
                              }
                            >
                              Tier {tiers[c.difficulty - 1]}: {projectionText(c.projection)}
                            </li>
                          ))}
                        </ul>
                        {estimate.projection.meanDrops && (
                          <p className="mt-2">
                            Mean reward scenario:{' '}
                            {estimate.materialKeys
                              .map(
                                (key, i) =>
                                  `${estimate.projection.meanDrops![i]!.toFixed(1)} ${materialCatalogEntry(key)?.name ?? key}`,
                              )
                              .join(' · ')}
                            . Upward crafting may supply higher tiers.
                          </p>
                        )}
                      </details>
                    </li>
                  ))}
                </ul>
                <details className="mt-3 text-sm text-zinc-300">
                  <summary className="cursor-pointer">Calendar pacing</summary>
                  <p className="mt-2 text-xs text-zinc-400">
                    Starts next server reset, sharing {result.dailyResinBudget ?? 'an unset'} resin
                    per day across open domains.
                  </p>
                  {result.schedule.calendarDays !== null ? (
                    <p className="mt-2">
                      About {result.schedule.calendarDays} calendar days for the modeled subset.
                    </p>
                  ) : (
                    <p className="mt-2">
                      {result.schedule.state === 'exceeds_horizon'
                        ? 'Demand exceeds the ten-year planning horizon.'
                        : 'Select a server, a daily budget of at least 20 resin, and difficulty with known required stock to calculate pacing.'}
                    </p>
                  )}
                  <Link to="/#plan-choices" className="mt-2 inline-block text-indigo-200 underline">
                    Set daily budget on Today
                  </Link>
                  {result.schedule.days.some((day) => day.resin > 0) && (
                    <ol className="mt-3 space-y-2 text-xs text-zinc-400">
                      {result.schedule.days
                        .filter((day) => day.resin > 0)
                        .map((day) => (
                          <li key={day.offset}>
                            Day {day.offset} ({dayNames[day.weekday]}): {day.resin} resin ·{' '}
                            {day.allocations
                              .map(
                                (a) =>
                                  `${result.estimates.find((e) => e.domain.domainKey === a.domainKey)?.domain.name ?? a.domainKey}: ${a.runs} reward sets`,
                              )
                              .join(' · ')}
                          </li>
                        ))}
                    </ol>
                  )}
                </details>
              </>
            )}
            <details className="mt-5 border-t border-white/10 pt-3 text-xs text-zinc-400">
              <summary className="cursor-pointer">Assumptions &amp; sources</summary>
              <ul className="mt-2 list-inside list-disc space-y-2">
                {query.data!.explanations.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-3">
                <a
                  href={`${result.sources.yields.repository}/blob/${result.sources.yields.commit}/src/data/dropRates.js`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-200 underline"
                >
                  Paimon.moe mean drops
                </a>
              </p>
            </details>
          </>
        )}
      </details>
    </section>
  );
}
