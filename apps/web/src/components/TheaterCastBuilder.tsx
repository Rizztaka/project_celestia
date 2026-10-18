import { type TheaterCastRequest, theaterElements } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useId, useState } from 'react';

import { captureSession } from '../lib/account-session';
import { previewTheaterCast, type RosterCharacter } from '../lib/api';
import { artworkDisplayName } from '../lib/artwork';
import { GenshinAvatar } from './GenshinAvatar';

const field = 'mt-1 w-full rounded-lg border border-white/20 bg-zinc-900 p-2 text-sm text-white';
export default function TheaterCastBuilder({ roster }: { roster: RosterCharacter[] }) {
  const id = useId();
  const [session] = useState(captureSession);
  const [rules, setRules] = useState<TheaterCastRequest>({
    difficulty: 'VISIONARY',
    elements: ['Pyro', 'Hydro', 'Electro'],
    openingKeys: [],
    guestKeys: [],
    selectedKeys: [],
  });
  const query = useQuery({
    queryKey: [
      'theater-cast-preview',
      session.generation,
      rules,
      roster.map((c) => [c.characterKey, c.level]),
    ],
    queryFn: ({ signal }) => previewTheaterCast(rules, signal, session),
    enabled: rules.elements.length === 3,
    retry: false,
  });
  const result = query.data?.result;
  function toggle(key: string) {
    setRules((previous) => ({
      ...previous,
      selectedKeys: previous.selectedKeys.includes(key)
        ? previous.selectedKeys.filter((item) => item !== key)
        : previous.selectedKeys.length < 26
          ? [...previous.selectedKeys, key]
          : previous.selectedKeys,
    }));
  }
  return (
    <section
      aria-labelledby={`${id}-title`}
      className="overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-950/70 via-zinc-950 to-indigo-950/50 p-4 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
        Imaginarium Theater · Cast workshop
      </p>
      <h2 id={`${id}-title`} className="mt-2 text-2xl font-bold text-white">
        Build your principal cast
      </h2>
      <p className="mt-2 text-sm text-zinc-300">
        Planning preset · Level 70+ · Easy 10 / Normal 14 / Hard 18 / Visionary 22. Enter the
        elements and exceptions shown in your in-game season.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-zinc-300">
          Difficulty
          <select
            className={field}
            value={rules.difficulty}
            onChange={(e) =>
              setRules({ ...rules, difficulty: e.target.value as TheaterCastRequest['difficulty'] })
            }
          >
            {['EASY', 'NORMAL', 'HARD', 'VISIONARY'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-zinc-300">
          Traveler's recorded element
          <select
            className={field}
            value={rules.travelerElement ?? ''}
            onChange={(e) =>
              setRules({
                ...rules,
                travelerElement: e.target.value
                  ? (e.target.value as NonNullable<TheaterCastRequest['travelerElement']>)
                  : undefined,
              })
            }
          >
            <option value="">Unknown — do not assume</option>
            {theaterElements.map((element) => (
              <option key={element}>{element}</option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm text-zinc-300">Season elements (choose exactly three)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {theaterElements.map((element) => (
            <label
              key={element}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${rules.elements.includes(element) ? 'border-violet-400/60 bg-violet-500/20 text-white' : 'border-white/10 text-zinc-400'}`}
            >
              <input
                type="checkbox"
                checked={rules.elements.includes(element)}
                disabled={!rules.elements.includes(element) && rules.elements.length === 3}
                onChange={() =>
                  setRules({
                    ...rules,
                    elements: rules.elements.includes(element)
                      ? rules.elements.filter((e) => e !== element)
                      : [...rules.elements, element],
                  })
                }
              />
              {element}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(['openingKeys', 'guestKeys'] as const).map((key) => (
          <label key={key} className="text-sm text-zinc-300">
            {key === 'openingKeys'
              ? 'Opening Cast (up to six owned characters)'
              : 'Special Guests (up to eight owned characters)'}
            <select
              multiple
              className={`${field} h-28`}
              value={rules[key]}
              onChange={(e) =>
                setRules({
                  ...rules,
                  [key]: [...e.target.selectedOptions]
                    .map((o) => o.value)
                    .slice(0, key === 'openingKeys' ? 6 : 8),
                })
              }
            >
              {roster.map((c) => (
                <option key={c.characterKey} value={c.characterKey}>
                  {artworkDisplayName(c.characterKey)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        Multiple selection: Ctrl/Cmd + click on desktop. Trials and borrowed characters are not
        assumed owned.
      </p>
      {rules.elements.length !== 3 ? (
        <p role="status" className="mt-4 text-amber-200">
          Choose three elements to evaluate your cast.
        </p>
      ) : (
        TheaterResults()
      )}
    </section>
  );
  function TheaterResults() {
    return (
      <>
        {query.isPending && (
          <p role="status" className="mt-4 text-zinc-300">
            Checking cast…
          </p>
        )}
        {query.isError && (
          <div role="alert" className="mt-4 text-amber-200">
            {query.error.message}
            <button className="ml-3 underline" onClick={() => void query.refetch()}>
              Retry
            </button>
          </div>
        )}
        {result && (
          <>
            <div
              role="status"
              className={`mt-5 rounded-xl border p-4 ${result.ready ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}
            >
              <strong>
                {result.selectedKeys.length} / {result.required} selected
              </strong>{' '}
              · {result.qualifiedCount} qualify ·{' '}
              {result.ready
                ? 'Cast ready for this preset'
                : `${Math.max(0, result.required - result.selectedKeys.length)} more needed`}
            </div>
            <button
              type="button"
              className="mt-3 text-sm text-violet-200 underline"
              onClick={() =>
                setRules({
                  ...rules,
                  selectedKeys: result.candidates
                    .filter((c) => c.eligible)
                    .slice(0, 26)
                    .map((c) => c.characterKey),
                })
              }
            >
              Select qualified cast
            </button>
            <button
              type="button"
              className="ml-4 mt-3 text-sm text-zinc-300 underline"
              onClick={() => setRules({ ...rules, selectedKeys: [] })}
            >
              Clear selection
            </button>
            {!result.candidates.length && (
              <p className="mt-4 text-sm text-zinc-300">
                Import your roster to evaluate owned characters.
              </p>
            )}
            <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {result.candidates.map((c) => (
                <button
                  type="button"
                  key={c.characterKey}
                  disabled={!c.eligible && !rules.selectedKeys.includes(c.characterKey)}
                  aria-pressed={rules.selectedKeys.includes(c.characterKey)}
                  onClick={() => toggle(c.characterKey)}
                  className={`flex min-w-0 items-center gap-2 rounded-xl border p-2 text-left ${rules.selectedKeys.includes(c.characterKey) ? 'border-violet-300 bg-violet-500/20' : 'border-white/10 bg-black/15'} disabled:opacity-50`}
                >
                  <GenshinAvatar characterKey={c.characterKey} />
                  <span className="min-w-0">
                    <span className="block break-words text-xs font-semibold text-white">
                      {artworkDisplayName(c.characterKey)}
                    </span>
                    <span className="block text-[10px] text-zinc-300">
                      Lv. {c.level} · {c.element ?? 'Unknown'}
                    </span>
                    <span
                      className={`block text-[10px] ${c.eligible ? 'text-violet-200' : 'text-amber-200'}`}
                    >
                      {!c.eligible
                        ? c.reasons.includes('level')
                          ? 'Requires level 70'
                          : c.reasons.includes('unknown_element')
                            ? 'Element unknown'
                            : 'Element excluded'
                        : c.badge === 'opening'
                          ? 'Opening Cast'
                          : c.badge === 'guest'
                            ? 'Special Guest'
                            : 'Qualified'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <details className="mt-4 text-xs text-zinc-400">
              <summary className="cursor-pointer">Rules and assumptions</summary>
              <ul className="mt-2 list-inside list-disc space-y-2">
                {query.data?.explanations.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <a
                href="https://wiki.hoyolab.com/m/genshin/entry/5832?lang=en-us"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-violet-200 underline"
              >
                Official Theater reference
              </a>
            </details>
          </>
        )}
      </>
    );
  }
}
