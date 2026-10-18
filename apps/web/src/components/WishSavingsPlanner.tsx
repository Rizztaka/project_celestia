import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchEvents } from '../lib/api';
import { artworkDisplayName, characterMetadata, weaponMetadata } from '../lib/artwork';
import { calculateSavings, dateAfter, localDate } from '../lib/wish-savings.calculator';
import { savingsVerdict } from '../lib/wish-savings.explainer';
import { GenshinAvatar } from './GenshinAvatar';
import { GenshinWeaponIcon } from './GenshinWeaponIcon';

const field = 'w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-white';
export default function WishSavingsPlanner() {
  const [today] = useState(() => localDate());
  const [date, setDate] = useState(() => dateAfter(today, 42));
  const [type, setType] = useState<'character' | 'weapon'>('character');
  const [target, setTarget] = useState('Mavuika');
  const [primogems, setPrimogems] = useState(0);
  const [fates, setFates] = useState(0);
  const [pity, setPity] = useState(0);
  const [guaranteed, setGuaranteed] = useState(false);
  const [commissions, setCommissions] = useState(true);
  const [welkin, setWelkin] = useState(false);
  const [battlePass, setBattlePass] = useState(false);
  const [abyss, setAbyss] = useState(0);
  const [events, setEvents] = useState(true);
  const eventQuery = useQuery({
    queryKey: ['companion', 'events'],
    queryFn: ({ signal }) => fetchEvents(signal),
    retry: false,
  });
  const activeEvents =
    !eventQuery.error && eventQuery.data?.availability.available
      ? eventQuery.data.events.filter((event) => event.isActive)
      : [];
  const eventPrimogems = events
    ? activeEvents.reduce(
        (sum, event) =>
          sum +
          event.rewardTiers.reduce(
            (amount, tier) => amount + (tier.claimed ? 0 : tier.primogems),
            0,
          ),
        0,
      )
    : 0;
  const result = calculateSavings({
    today,
    targetDate: date,
    primogems,
    fates,
    pity,
    guaranteed,
    targetType: type,
    commissions,
    welkin,
    battlePass,
    abyss,
    eventPrimogems,
  });
  const targets = Object.entries(type === 'character' ? characterMetadata : weaponMetadata)
    .filter(([, entry]) => entry.rarity === 5)
    .sort((a, b) => a[1].name.localeCompare(b[1].name));
  const numeric = (value: string, max = 10_000_000) =>
    Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
  return (
    <section
      className="companion-info-card space-y-6 rounded-2xl p-5"
      aria-label="Wish savings planner"
    >
      <header>
        <h2 className="text-xl font-semibold text-white">Wish Savings</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Plan a target budget from tomorrow through your chosen date. Today’s remaining income is
          excluded.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          Target type
          <select
            aria-label="Target type"
            className={field}
            value={type}
            onChange={(event) => {
              const next = event.target.value as typeof type;
              setType(next);
              setTarget(next === 'character' ? 'Mavuika' : 'StaffOfHoma');
              setPity(0);
              setGuaranteed(false);
            }}
          >
            <option value="character">Character event wish</option>
            <option value="weapon">Weapon event wish</option>
          </select>
        </label>
        <label>
          Target
          <select
            aria-label="Target"
            className={field}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            {targets.map(([key, entry]) => (
              <option key={key} value={key}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        {type === 'character' ? (
          <GenshinAvatar characterKey={target} size="lg" />
        ) : (
          <GenshinWeaponIcon weaponKey={target} size="lg" />
        )}
        <span className="font-semibold text-white">{artworkDisplayName(target)}</span>
      </div>
      <label className="block">
        Target banner date
        <input
          className={field}
          type="date"
          min={today}
          max={dateAfter(today, 3660)}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {[
          [20, 'In 20 days'],
          [42, 'Next patch (~42 days)'],
          [90, 'In 3 months (~90 days)'],
        ].map(([days, label]) => (
          <button
            type="button"
            key={days}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm"
            onClick={() => setDate(dateAfter(today, Number(days)))}
          >
            {label}
          </button>
        ))}
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-3 font-semibold text-white">Current inventory</legend>
        <label>
          Primogems
          <input
            type="number"
            min="0"
            max="10000000"
            className={field}
            value={primogems}
            onChange={(event) => setPrimogems(numeric(event.target.value))}
          />
        </label>
        <label>
          Intertwined Fates
          <input
            type="number"
            min="0"
            max="10000000"
            className={field}
            value={fates}
            onChange={(event) => setFates(numeric(event.target.value))}
          />
        </label>
        <label>
          Current 5★ pity
          <input
            type="number"
            min="0"
            max={type === 'character' ? 89 : 79}
            className={field}
            value={pity}
            onChange={(event) =>
              setPity(numeric(event.target.value, type === 'character' ? 89 : 79))
            }
          />
        </label>
        <label className="sm:col-span-3">
          <input
            type="checkbox"
            checked={guaranteed}
            onChange={(event) => setGuaranteed(event.target.checked)}
          />{' '}
          {type === 'character'
            ? 'Next 5★ is guaranteed featured (lost previous 50/50)'
            : 'Next 5★ is guaranteed one of the two featured weapons'}
        </label>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-3 font-semibold text-white">Income assumptions</legend>
        {[
          [commissions, setCommissions, 'Daily commissions · 60 Primogems/day'],
          [welkin, setWelkin, 'Welkin Moon · 90 Primogems/day (exclude purchase crystals)'],
          [battlePass, setBattlePass, 'Gnostic Hymn · 680 Primogems + 4 Fates per full 40 days'],
          [events, setEvents, 'Include unclaimed active event rewards'],
        ].map(([checked, setter, label]) => (
          <label key={String(label)} className="block">
            <input
              type="checkbox"
              checked={Boolean(checked)}
              onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)}
            />{' '}
            {String(label)}
          </label>
        ))}
        <label className="block">
          Spiral Abyss Primogems per modeled reset
          <select
            aria-label="Spiral Abyss Primogems per modeled reset"
            className={field}
            value={abyss}
            onChange={(event) => setAbyss(Number(event.target.value))}
          >
            <option value="0">0 · exclude</option>
            <option value="400">400 · partial clear</option>
            <option value="800">800 · full clear</option>
          </select>
        </label>
        <p className="text-sm text-zinc-400">
          Scenario: Abyss resets on the 1st and 16th. Battle Pass starts a new 40-day cycle today;
          only full cycles count. Welkin and Battle Pass assume continuous coverage and all rewards
          claimed. Dates are planning assumptions, not a live game schedule.
        </p>
      </fieldset>
      {eventQuery.isPending && <p role="status">Loading event rewards…</p>}
      {(eventQuery.error || (eventQuery.data && !eventQuery.data.availability.available)) && (
        <p className="text-amber-200">
          Current event rewards unavailable; excluded from this estimate.{' '}
          <button type="button" className="underline" onClick={() => void eventQuery.refetch()}>
            Retry events
          </button>
        </p>
      )}
      {activeEvents.length > 0 && (
        <div>
          <h3 className="font-semibold text-white">Event deadlines</h3>
          <ul className="mt-2 space-y-2">
            {activeEvents.map((event) => (
              <li key={event.key}>
                {event.name} · {Math.max(0, event.totalPrimogems - event.claimedPrimogems)}✦
                unclaimed · ends {new Date(event.endUtc).toLocaleString()}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-zinc-400">
            Collect included rewards before each event deadline and your target date.
          </p>
        </div>
      )}
      {!result ? (
        <p role="alert" className="text-amber-200">
          Choose a valid date from today up to ten years ahead.
        </p>
      ) : (
        <div
          aria-live="polite"
          className="space-y-3 rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4"
        >
          <h3 className="text-lg font-semibold text-white">{savingsVerdict(result)}</h3>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Days remaining', result.days],
              ['Primogems earned', result.earned],
              ['Total Primogems', result.primogems],
              ['Total Intertwined Fates', result.fates],
              ['Projected pulls', result.pulls],
              ['Primogems after conversion', result.leftoverPrimogems],
              ['Pulls to hard pity', result.hardNeeded],
              ['Pulls for guaranteed target', result.featuredNeeded],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-zinc-400">{label}</dt>
                <dd className="text-xl font-semibold text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            Estimated chance of {artworkDisplayName(target)}:{' '}
            {(result.probability * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-zinc-400">
            Income: commissions {result.commissions}✦ + Welkin {result.welkin}✦ + Abyss{' '}
            {result.abyss}✦ ({result.resets} resets) + Battle Pass {result.battlePass}✦ + events{' '}
            {eventPrimogems}✦.
          </p>
          <p className="text-sm text-zinc-400">
            {type === 'character'
              ? 'Character model: 0.6% base rate, approximate soft pity from pull 74, hard pity 90; simplified 50/50 then featured guarantee. No Capturing Radiance bonus is modeled.'
              : 'Weapon model: selected Epitomized Path with zero current Fate Points; 0.7% base rate, approximate soft pity from pull 63, hard pity 80. A missed target guarantees the next 5★ within this banner only. Fate Points do not carry across banners.'}{' '}
            Soft pity raises probability; it never guarantees a drop. Switching targets does not
            transfer pity between wish types.
          </p>
        </div>
      )}
    </section>
  );
}
